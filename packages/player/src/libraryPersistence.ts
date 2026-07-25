import Dexie, { type Table } from 'dexie';

export interface FoliaStoredTrack {
    id: string;
    path: string;
    title: string;
    artist?: string;
    album?: string;
    duration?: number;
    mimeType?: string;
    fileSize?: number;
}

interface FoliaStoredLibrary {
    namespace: string;
    version: 1;
    tracks: FoliaStoredTrack[];
    updatedAt: number;
}

export class FoliaPlayerLibraryDatabase extends Dexie {
    libraries!: Table<FoliaStoredLibrary, string>;

    constructor(name = 'FoliaPlayerHostDB') {
        super(name);
        this.version(1).stores({ libraries: 'namespace, updatedAt' });
    }
}

const libraryDatabase = new FoliaPlayerLibraryDatabase();

export async function loadFoliaStoredLibrary(
    namespace: string,
    database: FoliaPlayerLibraryDatabase = libraryDatabase,
): Promise<FoliaStoredTrack[] | null> {
    const entry = await database.libraries.get(normalizeNamespace(namespace));
    if (!entry || entry.version !== 1 || !Array.isArray(entry.tracks)) return null;
    return entry.tracks.filter(isStoredTrack);
}

export async function saveFoliaStoredLibrary(
    namespace: string,
    tracks: FoliaStoredTrack[],
    database: FoliaPlayerLibraryDatabase = libraryDatabase,
): Promise<void> {
    await database.libraries.put({
        namespace: normalizeNamespace(namespace),
        version: 1,
        tracks: tracks.filter(isStoredTrack),
        updatedAt: Date.now(),
    });
}

export async function deleteFoliaStoredLibrary(
    namespace: string,
    database: FoliaPlayerLibraryDatabase = libraryDatabase,
): Promise<void> {
    await database.libraries.delete(normalizeNamespace(namespace));
}

function normalizeNamespace(namespace: string): string {
    const normalized = namespace.trim().replace(/[^a-zA-Z0-9._-]+/g, '-');
    if (!normalized) throw new Error('Folia library namespace is required.');
    return normalized;
}

function isStoredTrack(value: unknown): value is FoliaStoredTrack {
    if (!value || typeof value !== 'object') return false;
    const track = value as Partial<FoliaStoredTrack>;
    return typeof track.id === 'string' && Boolean(track.id)
        && typeof track.path === 'string' && Boolean(track.path)
        && typeof track.title === 'string';
}
