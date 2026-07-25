import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import UpstreamUnifiedPanel, { type PanelTab } from '../../../src/components/UnifiedPanel';
import FloatingPlayerControls from '../../../src/components/FloatingPlayerControls';
import { buildThemeSourceModel } from '../../../src/hooks/themeControllerState';
import { PlayerState, type SongResult, type VisualizerMode } from '../../../src/types';
import type { FoliaLoopMode, FoliaTrack } from './types';
import { FoliaI18nScope } from './FoliaI18nScope';
import { useFoliaPlayer } from './PlayerProvider';

export type FoliaPanelTab = 'now' | 'queue' | 'library' | 'settings';

export interface FoliaUnifiedPanelProps {
    className?: string;
    initialTab?: FoliaPanelTab;
    onOpenFullscreen?: () => void;
    extraSettings?: ReactNode;
}

/**
 * The standard Folia player panel, rendered by the upstream component itself.
 * Xiranite deliberately only supplies a controlled playback and storage adapter.
 */
export function FoliaUnifiedPanel({ className = '', initialTab = 'now' }: FoliaUnifiedPanelProps) {
    const { actions, isDaylight, preferences, resolvedTheme, snapshot, tracks } = useFoliaPlayer();
    const [isOpen, setIsOpen] = useState(true);
    const [tab, setTab] = useState<PanelTab>(() => panelTabFor(initialTab));
    const queueScrollRef = useRef<HTMLDivElement>(null);
    const songs = useMemo(() => tracks.map((track, index) => toUpstreamSong(track, snapshot.duration, index)), [snapshot.duration, tracks]);
    const currentSong = songs[snapshot.activeIndex] ?? null;
    const playerState = snapshot.isPlaying ? PlayerState.PLAYING : currentSong ? PlayerState.PAUSED : PlayerState.IDLE;
    const themeSourceModel = useMemo(() => buildThemeSourceModel({
        bgMode: 'default',
        aiTheme: null,
        legacyTheme: null,
        customTheme: null,
        isDaylight,
        defaultTheme: resolvedTheme,
        daylightTheme: resolvedTheme,
        currentSongHasLocalAiTheme: false,
    }), [isDaylight, resolvedTheme]);
    const toggleLoop = useCallback(() => {
        actions.setPreferences({ loopMode: nextLoopMode(preferences.loopMode) });
    }, [actions, preferences.loopMode]);
    const setVolume = useCallback((volume: number) => {
        actions.setPreferences({ volume: Math.min(1, Math.max(0, volume)) });
    }, [actions]);
    const selectSong = useCallback((song: SongResult) => {
        const index = songs.findIndex((candidate) => candidate.id === song.id);
        if (index >= 0) actions.selectTrack(index, true);
    }, [actions, songs]);

    return (
        <div className={`folia-upstream-panel relative h-full min-h-0 w-full overflow-hidden ${className}`.trim()} data-folia-surface="unified">
            <FoliaI18nScope><UpstreamUnifiedPanel
                playback={{
                    isOpen,
                    currentTab: tab,
                    onTabChange: setTab,
                    onToggle: () => setIsOpen((current) => !current),
                    onNavigateHome: noop,
                    onNavigateHomeDirect: noop,
                    coverUrl: snapshot.activeTrack?.coverUrl ?? null,
                    currentSong,
                    onAlbumSelect: noop,
                    onSelectArtist: noop,
                    loopMode: preferences.loopMode,
                    onToggleLoop: toggleLoop,
                    onLike: noop,
                    isLiked: false,
                    onGenerateAITheme: noop,
                    isGeneratingTheme: false,
                    hasLyrics: Boolean(snapshot.activeTrack?.lyrics?.lines.length),
                    canGenerateAITheme: false,
                    theme: resolvedTheme,
                    onThemeChange: noop,
                    bgMode: 'default',
                    onBgModeChange: noop,
                    hasCustomTheme: false,
                    themeSourceModel,
                    onResetTheme: noop,
                    defaultTheme: resolvedTheme,
                    daylightTheme: resolvedTheme,
                    visualizerMode: preferences.visualizerMode,
                    onVisualizerModeChange: (visualizerMode: VisualizerMode) => actions.setPreferences({ visualizerMode }),
                    onMatchOnline: noop,
                    onUpdateLocalLyrics: noop,
                    onChangeLyricsSource: noop,
                    onlineLyricsState: null,
                    onImportOnlineLyrics: noop,
                    onChangeOnlineLyricsSource: noop,
                    onMatchOnlineLyrics: noop,
                    onClearOnlineLyricsState: noop,
                    lyricTimelineOffsetMs: 0,
                    onLyricTimelineOffsetChange: noop,
                    replayGainMode: preferences.replayGainMode,
                    onChangeReplayGainMode: (replayGainMode) => actions.setPreferences({ replayGainMode }),
                    isFmMode: false,
                    onFmTrash: noop,
                    onNextTrack: actions.next,
                    onPrevTrack: actions.previous,
                    playerState,
                    onTogglePlay: () => void actions.toggle(),
                    volume: preferences.volume,
                    isMuted: preferences.volume <= 0,
                    onVolumePreview: setVolume,
                    onVolumeChange: setVolume,
                    onToggleMute: () => setVolume(preferences.volume > 0 ? 0 : 0.8),
                    showOpenPanelCloseButton: false,
                    hideToggleButton: true,
                    playbackControlsDisabled: !currentSong,
                }}
                queue={{
                    playQueue: songs,
                    onPlaySong: selectSong,
                    queueScrollRef,
                    onShuffle: actions.shuffle,
                    onRemoveSong: actions.removeTrack,
                    onMoveSongToEnd: noop,
                    onMoveSongToNext: noop,
                }}
                library={{
                    localPlaylists: [],
                    onlinePlaylists: [],
                    onSaveCurrentQueueAsPlaylist: async () => undefined,
                    onAddCurrentSongToLocalPlaylist: async () => undefined,
                    onCreateCurrentLocalPlaylist: async () => undefined,
                    onAddCurrentSongToOnlinePlaylist: async () => undefined,
                    onAddCurrentSongToNavidromePlaylist: async () => undefined,
                    onCreateCurrentNavidromePlaylist: async () => undefined,
                    onOpenCurrentLocalAlbum: noop,
                    onOpenCurrentLocalArtist: noop,
                    onOpenCurrentNavidromeAlbum: noop,
                    onOpenCurrentNavidromeArtist: noop,
                    onCopySongInfoSuccess: noop,
                }}
                account={{
                    user: null,
                    onLogout: noop,
                    audioQuality: 'lossless',
                    onAudioQualityChange: noop,
                    cacheSize: '—',
                    onClearCache: noop,
                    onSyncData: noop,
                    isSyncing: false,
                    useCoverColorBg: false,
                    onToggleCoverColorBg: noop,
                    isDaylight,
                    onToggleDaylight: noop,
                }}
            /></FoliaI18nScope>
        </div>
    );
}

export interface FoliaBarSurfaceProps {
    className?: string;
    collapseDelayMs?: number;
    onOpenPanel?: () => void;
    onOpenFloating?: () => void;
    onOpenFullscreen?: () => void;
}

/** The upstream floating control bar projected into Xiranite's bottom dock. */
export function FoliaBarSurface({ className = '' }: FoliaBarSurfaceProps) {
    const { actions, isDaylight, motion, resolvedTheme, snapshot, preferences } = useFoliaPlayer();
    const track = snapshot.activeTrack;
    const playerState = snapshot.isPlaying ? PlayerState.PLAYING : track ? PlayerState.PAUSED : PlayerState.IDLE;

    return (
        <div className={`folia-upstream-bar relative h-full min-h-0 w-full ${className}`.trim()} data-folia-surface="bar">
            <FoliaI18nScope><FloatingPlayerControls
                currentSong={track ? { name: track.title } : null}
                playerState={playerState}
                currentTime={motion.currentTime}
                lyricCurrentTime={motion.currentTime}
                duration={snapshot.duration}
                loopMode={preferences.loopMode}
                currentView="player"
                audioSrc={track?.src ?? null}
                canTogglePlay={Boolean(track)}
                lyrics={track?.lyrics ?? null}
                onSeek={actions.seek}
                onTogglePlay={() => void actions.toggle()}
                onToggleLoop={() => actions.setPreferences({ loopMode: nextLoopMode(preferences.loopMode) })}
                onNavigateToPlayer={noop}
                primaryColor={resolvedTheme.primaryColor}
                secondaryColor={resolvedTheme.secondaryColor}
                theme={resolvedTheme}
                isDaylight={isDaylight}
                controlsDisabled={!track}
            /></FoliaI18nScope>
        </div>
    );
}

function panelTabFor(tab: FoliaPanelTab): PanelTab {
    switch (tab) {
        case 'queue': return 'queue';
        case 'library': return 'local';
        case 'settings': return 'controls';
        default: return 'cover';
    }
}

function nextLoopMode(mode: FoliaLoopMode): FoliaLoopMode {
    return mode === 'off' ? 'all' : mode === 'all' ? 'one' : 'off';
}

function toUpstreamSong(track: FoliaTrack, fallbackDuration: number, index: number): SongResult {
    const id = track.id || `folia-${index}`;
    return {
        id,
        name: track.title,
        artists: track.artist ? [{ id: `${id}:artist`, name: track.artist }] : [],
        album: { id: `${id}:album`, name: track.album ?? '' },
        durationMs: Math.round((track.duration ?? fallbackDuration ?? 0) * 1000),
        sourceRef: { kind: 'local', mediaId: id },
        isLocal: true,
        localRef: { songId: id },
    } as SongResult;
}

function noop() {}
