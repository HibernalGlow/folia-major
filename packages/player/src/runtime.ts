import type { Line } from '../../../src/types';
import type { FoliaPlayerPreferences, FoliaResolvedTrack, FoliaTrack } from './types';

// packages/player/src/runtime.ts

export function mergeResolvedTrack(track: FoliaTrack, resolved?: FoliaResolvedTrack): FoliaTrack {
    if (!resolved) return track;
    return {
        ...track,
        ...resolved,
        id: track.id,
        src: track.src,
        path: track.path,
        mimeType: track.mimeType,
        fileSize: track.fileSize,
    };
}

export function currentLyricLine(lines: Line[], currentTime: number): Line | undefined {
    let low = 0;
    let high = lines.length - 1;
    let match: Line | undefined;
    while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        const candidate = lines[middle];
        if (!candidate || candidate.startTime > currentTime) {
            high = middle - 1;
        } else {
            match = candidate;
            low = middle + 1;
        }
    }
    return match && currentTime <= match.endTime + 0.35 ? match : undefined;
}

export function playbackVolume(track: FoliaTrack | null, preferences: FoliaPlayerPreferences): number {
    const gain = preferences.replayGainMode === 'track'
        ? track?.replayGainTrackDb
        : preferences.replayGainMode === 'album'
            ? track?.replayGainAlbumDb
            : undefined;
    const multiplier = gain === undefined ? 1 : Math.pow(10, gain / 20);
    return clamp(preferences.volume * multiplier, 0, 1);
}

export function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}
