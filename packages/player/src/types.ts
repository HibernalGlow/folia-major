import type { MotionValue } from 'framer-motion';
import type { AudioBands, DualTheme, LyricData, Theme, VisualizerMode } from '../../../src/types';
import type { VisualizerBackgroundConfig } from '../../../src/components/visualizer/backgrounds/definition';
import type { VisualizerTuningBundle } from '../../../src/components/visualizer/tuningRegistry';

// packages/player/src/types.ts

export type FoliaLoopMode = 'off' | 'all' | 'one';
export type FoliaReplayGainMode = 'off' | 'track' | 'album';

export interface FoliaTrack {
    id: string;
    src: string;
    path?: string;
    title: string;
    artist?: string;
    album?: string;
    coverUrl?: string;
    duration?: number;
    mimeType?: string;
    fileSize?: number;
    lyrics?: LyricData | null;
    replayGainTrackDb?: number;
    replayGainAlbumDb?: number;
}

export interface FoliaResolvedTrack {
    title?: string;
    artist?: string;
    album?: string;
    coverUrl?: string;
    duration?: number;
    lyrics?: LyricData | null;
    replayGainTrackDb?: number;
    replayGainAlbumDb?: number;
    release?: () => void;
}

export interface FoliaOutputDevice {
    id: string;
    label: string;
}

export interface FoliaPlayerPreferences {
    volume: number;
    loopMode: FoliaLoopMode;
    replayGainMode: FoliaReplayGainMode;
    outputDeviceId?: string;
    visualizerMode: VisualizerMode;
    background: VisualizerBackgroundConfig;
    visualizerTunings?: VisualizerTuningBundle;
    lyricsFontScale?: number;
    subtitleFontScale?: number;
    showHarmonySubtitle?: boolean;
    showSubtitleTranslation?: boolean;
}

export interface FoliaPlayerHostAdapter {
    hydrateTrack?: (track: FoliaTrack, signal: AbortSignal) => Promise<FoliaResolvedTrack>;
    scanLibraryRoots?: (roots: string[], signal: AbortSignal) => Promise<FoliaTrack[]>;
    pickLibraryRoot?: () => Promise<string | null>;
}

export interface FoliaPlaybackSnapshot {
    activeTrack: FoliaTrack | null;
    activeIndex: number;
    currentTime: number;
    duration: number;
    isPlaying: boolean;
    isLoading: boolean;
    error: string | null;
    currentLyric: string;
    progress: number;
}

export interface FoliaPlayerActions {
    play(): Promise<void>;
    pause(): void;
    toggle(): Promise<void>;
    previous(): void;
    next(): void;
    seek(time: number): void;
    selectTrack(index: number, autoplay?: boolean): void;
    removeTrack(index: number): void;
    shuffle(): void;
    scanLibrary(): Promise<void>;
    addLibraryRoot(root?: string): Promise<void>;
    removeLibraryRoot(root: string): void;
    setPreferences(patch: Partial<FoliaPlayerPreferences>): void;
    refreshOutputDevices(): Promise<void>;
}

export interface FoliaMotionRuntime {
    currentTime: MotionValue<number>;
    audioPower: MotionValue<number>;
    audioBands: AudioBands;
}

export interface FoliaPlayerContextValue {
    audio: HTMLAudioElement | null;
    tracks: FoliaTrack[];
    libraryRoots: string[];
    preferences: FoliaPlayerPreferences;
    theme: DualTheme;
    resolvedTheme: Theme;
    isDaylight: boolean;
    outputDevices: FoliaOutputDevice[];
    snapshot: FoliaPlaybackSnapshot;
    actions: FoliaPlayerActions;
    motion: FoliaMotionRuntime;
}

export const DEFAULT_FOLIA_PLAYER_PREFERENCES: FoliaPlayerPreferences = {
    volume: 0.8,
    loopMode: 'all',
    replayGainMode: 'off',
    visualizerMode: 'classic',
    background: { mode: 'latent' },
    lyricsFontScale: 1,
    subtitleFontScale: 1,
    showHarmonySubtitle: true,
    showSubtitleTranslation: true,
};
