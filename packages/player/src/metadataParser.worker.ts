import { parseWebStream, type IAudioMetadata } from 'music-metadata';

import type { EmbeddedMetadataResult } from './metadata';

interface ParsedLyricLine {
    text?: string;
    timestamp?: number;
}

interface ParsedLyricTag {
    id?: string;
    value?: unknown;
    text?: string;
    language?: string;
    descriptor?: string;
    syncText?: ParsedLyricLine[];
    timeStampFormat?: number;
}

const remoteRequests = new Map<string, AbortController>();

self.onmessage = async (event: MessageEvent) => {
    const { type, url, filePath, includeCover, requestId } = event.data as {
        type: string;
        url?: string;
        filePath?: string;
        includeCover?: boolean;
        requestId: string;
    };

    if (type === 'cancel-metadata') {
        remoteRequests.get(requestId)?.abort();
        remoteRequests.delete(requestId);
        return;
    }
    if (type !== 'parse-metadata' || !url || !filePath) {
        self.postMessage({ type: 'error', message: 'Metadata request requires a URL and file path', requestId });
        return;
    }

    const controller = new AbortController();
    remoteRequests.set(requestId, controller);
    try {
        const data = await extractRemoteMetadata(url, filePath, Boolean(includeCover), controller.signal);
        if (!controller.signal.aborted) self.postMessage({ type: 'result', data, requestId });
    } catch (error) {
        if (!controller.signal.aborted) self.postMessage({ type: 'error', message: String(error), requestId });
    } finally {
        remoteRequests.delete(requestId);
    }
};

async function extractRemoteMetadata(
    url: string,
    filePath: string,
    includeCover: boolean,
    signal: AbortSignal,
): Promise<EmbeddedMetadataResult> {
    const response = await fetch(url, { cache: 'no-store', signal });
    if (!response.ok || !response.body) throw new Error(`Metadata source failed with HTTP ${response.status}`);
    try {
        const contentLength = Number(response.headers.get('content-length'));
        const parsed = await parseWebStream(response.body, {
            path: filePath,
            ...(Number.isFinite(contentLength) && contentLength > 0 ? { size: contentLength } : {}),
        }, includeCover ? { skipPostHeaders: true } : { skipCovers: true, skipPostHeaders: true });
        return extractParsedMetadata(parsed, includeCover);
    } finally {
        if (!signal.aborted) await response.body.cancel().catch(() => undefined);
    }
}

function extractParsedMetadata(parsed: IAudioMetadata, includeCover: boolean): EmbeddedMetadataResult {
    const lyrics = extractLyrics(parsed);
    const replayGainTrack = parsed.common.replaygain_track_gain;
    const replayGainAlbum = parsed.common.replaygain_album_gain;
    const picture = includeCover ? parsed.common.picture?.[0] : undefined;
    return {
        title: parsed.common.title,
        artist: parsed.common.artist,
        artists: parsed.common.artists,
        album: parsed.common.album,
        trackNumber: parsed.common.track.no ?? undefined,
        discNumber: parsed.common.disk.no ?? undefined,
        cover: picture ? pictureToBlob(picture.data, picture.format) : undefined,
        bitrate: parsed.format.bitrate,
        lyrics: lyrics.original,
        translationLyrics: lyrics.translation,
        replayGain: replayGainTrack?.dB ?? parsed.format.trackGain,
        replayGainTrackGain: replayGainTrack?.dB ?? parsed.format.trackGain,
        replayGainTrackPeak: parsed.common.replaygain_track_peak?.ratio ?? parsed.format.trackPeakLevel,
        replayGainAlbumGain: replayGainAlbum?.dB ?? parsed.format.albumGain,
        replayGainAlbumPeak: parsed.common.replaygain_album_peak?.ratio,
        duration: validDuration(parsed.format.duration),
    };
}

function pictureToBlob(source: Uint8Array, format: string): Blob {
    const bytes = new Uint8Array(source.byteLength);
    bytes.set(source);
    return new Blob([bytes], { type: format });
}

function extractLyrics(parsed: IAudioMetadata): { original?: string; translation?: string } {
    const candidates = (parsed.common.lyrics ?? []).flatMap((tag) => {
        const lyricTag = tag as ParsedLyricTag;
        const text = lyricText(lyricTag);
        return text ? [{ text, translation: isTranslation(lyricTag) }] : [];
    });
    const original = candidates.find((candidate) => !candidate.translation)?.text ?? candidates[0]?.text;
    const translation = candidates.find((candidate) => candidate.translation && candidate.text !== original)?.text;
    return { original, translation };
}

function lyricText(tag: ParsedLyricTag): string | undefined {
    const syncText = tag.syncText ?? (
        tag.value && typeof tag.value === 'object' ? (tag.value as ParsedLyricTag).syncText : undefined
    );
    if (syncText?.length && (!tag.timeStampFormat || tag.timeStampFormat === 2)) {
        const lines = syncText.flatMap((line) => {
            if (typeof line.timestamp !== 'number' || !line.text?.trim()) return [];
            return [`${formatLrcTimestamp(line.timestamp)}${line.text.trim()}`];
        });
        if (lines.length) return lines.join('\n');
    }
    const value = tag.value;
    const text = typeof value === 'string'
        ? value
        : value && typeof value === 'object' && typeof (value as ParsedLyricTag).text === 'string'
            ? (value as ParsedLyricTag).text
            : tag.text;
    return text?.trim() || undefined;
}

function isTranslation(tag: ParsedLyricTag): boolean {
    const marker = `${tag.language ?? ''} ${tag.descriptor ?? ''} ${tag.id ?? ''}`.toLowerCase();
    return /\b(?:chi|zho|translation|trans)\b/.test(marker);
}

function formatLrcTimestamp(timestampMs: number): string {
    const timestamp = Math.max(0, Math.floor(timestampMs));
    const minutes = Math.floor(timestamp / 60_000);
    const seconds = Math.floor((timestamp % 60_000) / 1_000);
    const centiseconds = Math.floor((timestamp % 1_000) / 10);
    return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}]`;
}

function validDuration(seconds: number | undefined): number {
    return typeof seconds === 'number' && Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds * 1_000) : 0;
}
