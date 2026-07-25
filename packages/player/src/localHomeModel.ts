import { buildLocalQueue } from '../../../src/services/playbackAdapters';
import type { LocalLibraryCatalogSnapshot } from '../../../src/hooks/useLocalLibraryCatalog';
import type {
    LocalLibraryAssignment,
    LocalLibraryEntity,
    LocalSong,
    UnifiedSong,
} from '../../../src/types';
import type { FoliaTrack } from './types';

// packages/player/src/localHomeModel.ts
// Converts controlled host tracks into Folia's native local-library view model.

export interface FoliaLocalHomeModel {
    localSongs: LocalSong[];
    localLibraryCatalog: LocalLibraryCatalogSnapshot;
    queue: UnifiedSong[];
    trackIndexBySongId: Map<string, number>;
}

const reloadHostCatalog = async () => undefined;

export function buildFoliaLocalHomeModel(tracks: FoliaTrack[]): FoliaLocalHomeModel {
    const entitiesByKey = new Map<string, LocalLibraryEntity>();
    const assignments: LocalLibraryAssignment[] = [];

    const localSongs = tracks.map((track, index): LocalSong => {
        const artistNames = track.artist?.trim() ? [track.artist.trim()] : [];
        const albumName = track.album?.trim() || undefined;
        const artistEntityIds = artistNames.map((name) => ensureEntity(entitiesByKey, 'artist', name).id);
        const albumEntityId = albumName
            ? ensureEntity(entitiesByKey, 'album', albumName).id
            : undefined;

        assignments.push({
            songId: track.id,
            artistEntityIds,
            artistOrigin: 'import',
            albumEntityId,
            albumOrigin: 'import',
            updatedAt: 0,
        });

        const { fileName, folderName } = splitTrackPath(track);
        return {
            id: track.id,
            fileName,
            filePath: track.path ?? track.src,
            duration: Math.max(0, Math.round((track.duration ?? 0) * 1000)),
            fileSize: Math.max(0, track.fileSize ?? 0),
            mimeType: track.mimeType ?? 'audio/*',
            addedAt: tracks.length - index,
            title: track.title,
            titleOrigin: 'import',
            importedMetadata: {
                title: track.title,
                titleSource: 'filename',
                artistNames,
                albumName,
            },
            folderName,
            matchedLyrics: track.lyrics ?? undefined,
            replayGainTrackGain: track.replayGainTrackDb,
            replayGainAlbumGain: track.replayGainAlbumDb,
            ...(track.coverUrl ? {
                // Folia's local model currently stores persistent string artwork in this
                // metadata slot. The host track remains the playback source of truth.
                useOnlineCover: true,
                onlineMetadata: {
                    source: 'netease' as const,
                    title: track.title,
                    artists: artistNames.map((name) => ({ name })),
                    album: albumName ? { name: albumName } : undefined,
                    coverUrl: track.coverUrl,
                    matchMode: 'legacy' as const,
                    matchedAt: 0,
                },
            } : {}),
        };
    });

    const localLibraryCatalog: LocalLibraryCatalogSnapshot = {
        entities: [...entitiesByKey.values()],
        assignments,
        ready: true,
        reload: reloadHostCatalog,
    };

    return {
        localSongs,
        localLibraryCatalog,
        queue: buildLocalQueue(localSongs, undefined, localLibraryCatalog),
        trackIndexBySongId: new Map(tracks.map((track, index) => [track.id, index])),
    };
}

function ensureEntity(
    entitiesByKey: Map<string, LocalLibraryEntity>,
    kind: LocalLibraryEntity['kind'],
    displayName: string,
): LocalLibraryEntity {
    const normalizedName = displayName.trim().toLocaleLowerCase();
    const key = `${kind}:${normalizedName}`;
    const existing = entitiesByKey.get(key);
    if (existing) return existing;

    const entity: LocalLibraryEntity = {
        id: `host-${kind}-${stableHash(key)}`,
        kind,
        displayName: displayName.trim(),
        aliases: [displayName.trim()],
        normalizedAliases: [normalizedName],
        createdAt: 0,
        updatedAt: 0,
    };
    entitiesByKey.set(key, entity);
    return entity;
}

function splitTrackPath(track: FoliaTrack): { fileName: string; folderName: string } {
    const normalizedPath = track.path?.replaceAll('\\', '/');
    const parts = normalizedPath?.split('/').filter(Boolean) ?? [];
    const fileName = parts.at(-1) || track.title;
    const folderName = parts.at(-2) || 'Local Library';
    return { fileName, folderName };
}

function stableHash(value: string): string {
    let hash = 0x811c9dc5;
    for (let index = 0; index < value.length; index += 1) {
        hash ^= value.charCodeAt(index);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(36);
}
