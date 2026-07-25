export { FoliaPlayerProvider, useFoliaPlayer } from './PlayerProvider';
export { FoliaRemoteSurface, type FoliaRemoteSurfaceProps } from './RemoteSurface';
export { FoliaBarSurface, type FoliaBarSurfaceProps } from './BarSurface';
export { FoliaUnifiedPanel, type FoliaUnifiedPanelProps, type FoliaPanelTab } from './UnifiedPanel';
export { FoliaFullscreenSurface, type FoliaFullscreenSurfaceProps } from './FullscreenSurface';
export { buildFoliaDualTheme, DEFAULT_FOLIA_DUAL_THEME, type FoliaThemeTokens } from './theme';
export { DEFAULT_FOLIA_PLAYER_PREFERENCES } from './types';
export { foliaPlayerLocales } from './locales';
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
} from './types';

// packages/player/src/index.ts
