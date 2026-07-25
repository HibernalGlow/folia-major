export { FoliaPlayerProvider, useFoliaPlayer } from './PlayerProvider';
export { FoliaRemoteSurface, type FoliaRemoteSurfaceProps } from './RemoteSurface';
export { FoliaBarSurface, type FoliaBarSurfaceProps } from './BarSurface';
export { FoliaUnifiedPanel, type FoliaUnifiedPanelProps, type FoliaPanelTab } from './UnifiedPanel';
export { FoliaFullscreenSurface, type FoliaFullscreenSurfaceProps } from './FullscreenSurface';
export { FoliaPlayerSettingsSurface, type FoliaPlayerSettingsSurfaceProps } from './SettingsSurface';
export { buildFoliaDualTheme, DEFAULT_FOLIA_DUAL_THEME, type FoliaThemeTokens } from './theme';
export { DEFAULT_FOLIA_PLAYER_PREFERENCES } from './types';
export { foliaPlayerLocales } from './locales';
export {
    parseRemoteEmbeddedMetadataAsync,
    type EmbeddedMetadataResult,
} from './metadata';
export {
    loadFoliaStoredLibrary,
    saveFoliaStoredLibrary,
    deleteFoliaStoredLibrary,
    type FoliaStoredTrack,
} from './libraryPersistence';
export {
    parseLyricsByFormat,
    parseLRC,
    parseYRC,
    parseQRC,
    parseKRC,
    type LyricData,
    type LyricParseFormat,
} from './parser';
export type {
    FoliaLoopMode,
    FoliaMotionRuntime,
    FoliaOutputDevice,
    FoliaPlaybackSnapshot,
    FoliaPlayerActions,
    FoliaPlayerContextValue,
    FoliaPlayerHostAdapter,
    FoliaPlayerPreferences,
    FoliaReplayGainMode,
    FoliaResolvedTrack,
    FoliaTrack,
    FoliaVisualizerFrameRate,
} from './types';

// packages/player/src/index.ts
