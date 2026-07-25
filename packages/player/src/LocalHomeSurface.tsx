import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import Home from '../../../src/components/app/Home';
import SearchWorkspace from '../../../src/components/app/search/SearchWorkspace';
import type { HomeViewModel } from '../../../src/components/app/home/buildHomeModel';
import type { HomeLocalMusicState } from '../../../src/components/app/home/homeSurfaceTypes';
import type { LocalGridViewCollectionDescriptor } from '../../../src/components/app/home/gridViewCollectionAdapters';
import { useCollectionNavigationStore } from '../../../src/stores/useCollectionNavigationStore';
import { useSearchNavigationStore, type SearchSource } from '../../../src/stores/useSearchNavigationStore';
import { PlayerState, type LocalSong, type SongResult, type UnifiedSong } from '../../../src/types';
import { buildFoliaLocalHomeModel } from './localHomeModel';
import { useFoliaPlayer } from './PlayerProvider';

// packages/player/src/LocalHomeSurface.tsx
// Controlled adapter around Folia's original Home, GridMap, GridView, and search surfaces.

export interface FoliaLocalHomeSurfaceProps {
    visible: boolean;
    onNavigateToPlayer: () => void;
    onOpenSettings?: () => void;
    brandLabel?: string;
}

const INITIAL_LOCAL_MUSIC_STATE: HomeLocalMusicState = {
    activeRow: 0,
    selectedGroup: null,
    detailStack: [],
    detailOriginView: null,
    focusedFolderIndex: 0,
    focusedAlbumIndex: 0,
    focusedArtistIndex: 0,
    focusedPlaylistIndex: 0,
};

const LOCAL_SEARCH_SOURCES: SearchSource[] = ['local'];

export function FoliaLocalHomeSurface({ visible, onNavigateToPlayer, onOpenSettings, brandLabel }: FoliaLocalHomeSurfaceProps) {
    const { actions, isDaylight, resolvedTheme, snapshot, tracks } = useFoliaPlayer();
    const [localMusicState, setLocalMusicState] = useState<HomeLocalMusicState>(INITIAL_LOCAL_MUSIC_STATE);
    const localModel = useMemo(() => buildFoliaLocalHomeModel(tracks), [tracks]);
    const openRoot = useCollectionNavigationStore((state) => state.openRoot);
    const pushCollection = useCollectionNavigationStore((state) => state.push);
    const restoreCollection = useCollectionNavigationStore((state) => state.restore);
    const clearCollection = useCollectionNavigationStore((state) => state.clear);
    const submitSearch = useSearchNavigationStore((state) => state.submitSearch);
    const loadMoreSearchResults = useSearchNavigationStore((state) => state.loadMoreSearchResults);
    const hideSearchOverlay = useSearchNavigationStore((state) => state.hideSearchOverlay);

    const selectLocalSongId = useCallback((songId: string, autoplay = true) => {
        const trackIndex = localModel.trackIndexBySongId.get(songId);
        if (trackIndex !== undefined) actions.selectTrack(trackIndex, autoplay);
    }, [actions, localModel.trackIndexBySongId]);

    const playSong = useCallback((song: SongResult) => {
        const songId = (song as UnifiedSong).localRef?.songId;
        if (songId) selectLocalSongId(songId);
    }, [selectLocalSongId]);

    const playLocalSong = useCallback((song: LocalSong) => {
        selectLocalSongId(song.id);
    }, [selectLocalSongId]);

    const playAll = useCallback((songs: SongResult[]) => {
        const songId = (songs[0] as UnifiedSong | undefined)?.localRef?.songId;
        if (songId) selectLocalSongId(songId);
    }, [selectLocalSongId]);

    const currentTrack = useMemo(() => {
        const activeId = snapshot.activeTrack?.id;
        return activeId
            ? localModel.queue.find((song) => song.localRef?.songId === activeId) ?? null
            : null;
    }, [localModel.queue, snapshot.activeTrack?.id]);

    const searchDeps = useMemo(() => ({
        localSongs: localModel.localSongs,
        localLibraryCatalog: localModel.localLibraryCatalog,
        t: (_key: string, fallback = '') => fallback,
    }), [localModel.localLibraryCatalog, localModel.localSongs]);

    const submitLocalSearch = useCallback((source: SearchSource = 'local') => {
        void submitSearch({ sourceTab: source, deps: searchDeps, returnView: 'home' });
    }, [searchDeps, submitSearch]);

    const loadMoreLocalSearch = useCallback(() => {
        void loadMoreSearchResults({ deps: searchDeps });
    }, [loadMoreSearchResults, searchDeps]);

    const openEntityCollection = useCallback((
        kind: 'artist' | 'album',
        name: string,
        requestedEntityId?: string,
    ) => {
        const entity = requestedEntityId
            ? localModel.localLibraryCatalog.entities.find((candidate) => candidate.id === requestedEntityId)
            : localModel.localLibraryCatalog.entities.find((candidate) => (
                candidate.kind === kind && candidate.displayName === name
            ));
        if (!entity || entity.kind !== kind) return;

        const songIds = localModel.localLibraryCatalog.assignments.flatMap((assignment) => {
            const matches = kind === 'artist'
                ? assignment.artistEntityIds.includes(entity.id)
                : assignment.albumEntityId === entity.id;
            return matches ? [assignment.songId] : [];
        });
        const collection: LocalGridViewCollectionDescriptor = {
            source: 'local',
            id: entity.id,
            entityId: entity.id,
            name: entity.displayName,
            type: kind,
            songIds,
            trackCount: songIds.length,
        };
        openRoot(collection, 'search');
    }, [localModel.localLibraryCatalog, openRoot]);

    const backCollection = useCallback(() => {
        const snapshotState = useCollectionNavigationStore.getState().snapshot;
        if (!snapshotState || snapshotState.stack.length <= 1) {
            clearCollection();
            return;
        }
        restoreCollection({ ...snapshotState, stack: snapshotState.stack.slice(0, -1) });
    }, [clearCollection, restoreCollection]);

    const homeModel = useMemo<HomeViewModel>(() => ({
        surfaceProps: {
            onPlaySong: playSong,
            onBackToPlayer: onNavigateToPlayer,
            onRefreshUser: noop,
            user: null,
            playlists: [],
            cloudPlaylist: null,
            currentTrack,
            isPlaying: snapshot.isPlaying,
            onSelectPlaylist: noop,
            onSelectAlbum: noop,
            onSelectArtist: noop,
            onSelectLocalAlbum: (albumName) => openEntityCollection('album', albumName),
            onSelectLocalArtist: (artistName) => openEntityCollection('artist', artistName),
            localSongs: localModel.localSongs,
            localLibraryCatalog: localModel.localLibraryCatalog,
            localPlaylists: [],
            onRefreshLocalSongs: actions.scanLibrary,
            onImportLocalFolder: actions.addLibraryRoot,
            onRefreshLocalFolders: actions.scanLibrary,
            localSourceActions: { onRefresh: actions.scanLibrary },
            localOnly: true,
            brandLabel,
            onPlayLocalSong: playLocalSong,
            localMusicState,
            setLocalMusicState,
            onSearchCommitted: noop,
            onOpenSettings,
            theme: resolvedTheme,
            isDaylight,
            navidromeEnabled: false,
            onPlayAll: playAll,
        },
        onOpenCollection: (collection) => {
            openRoot(collection, 'home');
        },
        onPushCollection: (collection) => {
            pushCollection(collection);
        },
        onBackCollection: backCollection,
    }), [
        actions.addLibraryRoot,
        actions.scanLibrary,
        backCollection,
        brandLabel,
        currentTrack,
        isDaylight,
        localModel.localLibraryCatalog,
        localModel.localSongs,
        localMusicState,
        onNavigateToPlayer,
        onOpenSettings,
        openEntityCollection,
        openRoot,
        playAll,
        playLocalSong,
        playSong,
        pushCollection,
        resolvedTheme,
        snapshot.isPlaying,
    ]);

    const style = {
        display: visible ? undefined : 'none',
        visibility: visible ? 'visible' : 'hidden',
        pointerEvents: visible ? 'auto' : 'none',
    } as CSSProperties;

    return (
        <section
            className="absolute inset-0 z-10"
            style={style}
            aria-hidden={!visible}
            data-folia-surface="home"
            data-folia-home-visible={visible}
        >
            <Home model={homeModel} />
            <SearchWorkspace
                theme={resolvedTheme}
                isDaylight={isDaylight}
                onClose={hideSearchOverlay}
                onSubmitSearch={submitLocalSearch}
                onLoadMore={loadMoreLocalSearch}
                onPlayTrack={playSong}
                onAddTrackToQueue={playSong}
                onOpenArtist={(track, artistName, _artistId, entityId) => {
                    const fallbackEntityId = track.artists.find((artist) => artist.name === artistName)?.entityId;
                    openEntityCollection('artist', artistName, entityId ?? fallbackEntityId);
                }}
                onOpenAlbum={(track, albumName, _albumId, entityId) => {
                    openEntityCollection('album', albumName, entityId ?? track.album.entityId);
                }}
                sourcesOverride={LOCAL_SEARCH_SOURCES}
            />
        </section>
    );
}

function noop() {}
