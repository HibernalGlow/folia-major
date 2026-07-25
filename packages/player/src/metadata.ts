export interface EmbeddedMetadataResult {
    title?: string;
    artist?: string;
    artists?: string[];
    album?: string;
    trackNumber?: number;
    discNumber?: number;
    cover?: Blob;
    bitrate?: number;
    lyrics?: string;
    translationLyrics?: string;
    replayGain?: number;
    replayGainTrackGain?: number;
    replayGainTrackPeak?: number;
    replayGainAlbumGain?: number;
    replayGainAlbumPeak?: number;
    duration?: number;
}

interface PendingRequest {
    resolve: (result: EmbeddedMetadataResult | null) => void;
    cleanup: () => void;
}

const REQUEST_TIMEOUT_MS = 30_000;
let metadataWorker: Worker | null = null;
let workerRequestId = 0;
const pendingRequests = new Map<string, PendingRequest>();

function initMetadataWorker(): Worker {
    if (metadataWorker) return metadataWorker;
    metadataWorker = new Worker(new URL('./metadataParser.worker.ts', import.meta.url), { type: 'module' });
    metadataWorker.onmessage = (event: MessageEvent) => {
        const { type, data, requestId, message } = event.data as {
            type: string;
            data?: EmbeddedMetadataResult;
            requestId: string;
            message?: string;
        };
        const pending = pendingRequests.get(requestId);
        if (!pending) return;
        pendingRequests.delete(requestId);
        pending.cleanup();
        if (type === 'result') pending.resolve(data ?? null);
        else {
            console.warn('[FoliaMetadataWorker] parsing error:', message);
            pending.resolve(null);
        }
    };
    metadataWorker.onerror = (event) => {
        console.warn('[FoliaMetadataWorker] worker error:', event.message);
        for (const pending of pendingRequests.values()) {
            pending.cleanup();
            pending.resolve(null);
        }
        pendingRequests.clear();
        metadataWorker?.terminate();
        metadataWorker = null;
    };
    return metadataWorker;
}

export function parseRemoteEmbeddedMetadataAsync(
    url: string,
    options: { filePath: string; includeCover?: boolean; signal?: AbortSignal },
): Promise<EmbeddedMetadataResult | null> {
    return new Promise((resolve) => {
        if (options.signal?.aborted) {
            resolve(null);
            return;
        }

        const worker = initMetadataWorker();
        const requestId = `remote_meta_${++workerRequestId}`;
        const settleCancelled = () => {
            const pending = pendingRequests.get(requestId);
            if (!pending) return;
            pendingRequests.delete(requestId);
            pending.cleanup();
            worker.postMessage({ type: 'cancel-metadata', requestId });
            resolve(null);
        };
        const timeout = window.setTimeout(settleCancelled, REQUEST_TIMEOUT_MS);
        const cleanup = () => {
            window.clearTimeout(timeout);
            options.signal?.removeEventListener('abort', settleCancelled);
        };
        pendingRequests.set(requestId, { resolve, cleanup });
        options.signal?.addEventListener('abort', settleCancelled, { once: true });
        worker.postMessage({
            type: 'parse-metadata',
            url,
            filePath: options.filePath,
            includeCover: options.includeCover,
            requestId,
        });
    });
}
