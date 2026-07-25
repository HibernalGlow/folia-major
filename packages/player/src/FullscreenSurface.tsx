import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import FloatingPlayerControls from '../../../src/components/FloatingPlayerControls';
import VisualizerRenderer from '../../../src/components/visualizer/VisualizerRenderer';
import VisualizerShell from '../../../src/components/visualizer/VisualizerShell';
import { PlayerState } from '../../../src/types';
import { FoliaI18nScope } from './FoliaI18nScope';
import { FoliaLocalHomeSurface } from './LocalHomeSurface';
import { useFoliaPlayer } from './PlayerProvider';
import { FoliaUnifiedPanel } from './UpstreamSurfaces';
import { FoliaPlayerSettingsSurface } from './SettingsSurface';
import type { FoliaLoopMode, FoliaTrack } from './types';

// packages/player/src/FullscreenSurface.tsx
// Embeds Folia's original player/home composition around one controlled audio provider.

export interface FoliaFullscreenSurfaceProps {
    className?: string;
    showChrome?: boolean;
    brandLabel?: string;
}

type FoliaFullscreenView = 'home' | 'player';

export function FoliaFullscreenSurface({ className = '', showChrome = true, brandLabel = 'Folia' }: FoliaFullscreenSurfaceProps) {
    const { actions, isDaylight, motion, preferences, resolvedTheme, snapshot } = useFoliaPlayer();
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [currentView, setCurrentView] = useState<FoliaFullscreenView>('home');
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const track = snapshot.activeTrack;
    const lines = track?.lyrics?.lines ?? [];
    const playerState = snapshot.isPlaying
        ? PlayerState.PLAYING
        : track
            ? PlayerState.PAUSED
            : PlayerState.IDLE;
    const style = useMemo(() => ({
        '--bg-color': resolvedTheme.backgroundColor,
        '--text-primary': resolvedTheme.primaryColor,
        '--text-secondary': resolvedTheme.secondaryColor,
        '--text-accent': resolvedTheme.accentColor,
        '--folia-background': resolvedTheme.backgroundColor,
        '--folia-foreground': resolvedTheme.primaryColor,
        '--folia-accent': resolvedTheme.accentColor,
        '--folia-secondary': resolvedTheme.secondaryColor,
        '--folia-font': resolvedTheme.fontFamily ?? 'inherit',
    } as CSSProperties), [resolvedTheme]);

    useMotionValueEvent(motion.currentTime, 'change', (time) => {
        const next = findCurrentLineIndex(lines, time);
        setCurrentLineIndex((current) => current === next ? current : next);
    });

    useEffect(() => {
        setCurrentLineIndex(-1);
    }, [track?.id]);

    useEffect(() => {
        if (!track) setCurrentView('home');
    }, [track]);

    useEffect(() => {
        if (currentView !== 'player') setIsPanelOpen(false);
    }, [currentView]);

    const navigateToHome = useCallback(() => setCurrentView('home'), []);
    const navigateToPlayer = useCallback(() => setCurrentView('player'), []);
    const toggleLoop = useCallback(() => {
        actions.setPreferences({ loopMode: nextLoopMode(preferences.loopMode) });
    }, [actions, preferences.loopMode]);

    return (
        <section
            className={`folia-fullscreen ${className}`.trim()}
            style={style}
            data-folia-surface="fullscreen"
            data-folia-view={currentView}
            data-folia-active-track-id={track?.id ?? ''}
        >
            <FoliaI18nScope>
                <div
                    className="absolute inset-0 z-0"
                    style={{
                        pointerEvents: currentView === 'player' ? 'auto' : 'none',
                    }}
                    aria-hidden={currentView !== 'player'}
                    data-folia-visualizer-layer
                    data-folia-visualizer-text={currentView === 'player'}
                >
                    {track && lines.length > 0 ? (
                        <VisualizerRenderer
                            mode={preferences.visualizerMode}
                            currentTime={motion.currentTime}
                            currentLineIndex={currentLineIndex}
                            lines={lines}
                            theme={resolvedTheme}
                            subtitleTheme={resolvedTheme}
                            isDaylight={isDaylight}
                            audioPower={motion.audioPower}
                            audioBands={motion.audioBands}
                            songTitle={track.title}
                            songArtist={track.artist}
                            songAlbum={track.album}
                            coverUrl={track.coverUrl}
                            seed={track.id}
                            background={preferences.background}
                            lyricsFontScale={preferences.lyricsFontScale}
                            subtitleFontScale={preferences.subtitleFontScale}
                            showHarmonySubtitle={preferences.showHarmonySubtitle}
                            showSubtitleTranslation={preferences.showSubtitleTranslation}
                            showText={currentView === 'player'}
                            paused={!snapshot.isPlaying}
                            visualizerTunings={preferences.visualizerTunings}
                            onBack={currentView === 'player' ? navigateToHome : undefined}
                            alwaysShowBackButton={currentView === 'player'}
                            onLyricLineSeek={actions.seek}
                        />
                    ) : (
                        <VisualizerShell
                            theme={resolvedTheme}
                            audioPower={motion.audioPower}
                            audioBands={motion.audioBands}
                            sharedProps={{
                                coverUrl: track?.coverUrl,
                                isDaylight,
                                seed: track?.id,
                                background: preferences.background,
                                paused: !snapshot.isPlaying,
                                onBack: currentView === 'player' ? navigateToHome : undefined,
                                alwaysShowBackButton: currentView === 'player',
                            }}
                        >
                            {currentView === 'player' ? <FullscreenEmptyState track={track} error={snapshot.error} /> : null}
                        </VisualizerShell>
                    )}
                </div>

                <FoliaLocalHomeSurface
                    visible={currentView === 'home'}
                    onNavigateToPlayer={navigateToPlayer}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    brandLabel={brandLabel}
                />

                {showChrome && track ? (
                    <FloatingPlayerControls
                        currentSong={{ name: track.title }}
                        playerState={playerState}
                        currentTime={motion.currentTime}
                        lyricCurrentTime={motion.currentTime}
                        duration={snapshot.duration}
                        loopMode={preferences.loopMode}
                        currentView={currentView}
                        audioSrc={track.src}
                        canTogglePlay
                        lyrics={track.lyrics ?? null}
                        onSeek={actions.seek}
                        onTogglePlay={() => void actions.toggle()}
                        onToggleLoop={toggleLoop}
                        onNavigateToPlayer={navigateToPlayer}
                        primaryColor={resolvedTheme.primaryColor}
                        secondaryColor={resolvedTheme.secondaryColor}
                        theme={resolvedTheme}
                        isDaylight={isDaylight}
                        controlsDisabled={snapshot.isLoading}
                    />
                ) : null}

                {showChrome && track && currentView === 'player' ? (
                    <FoliaUnifiedPanel
                        presentation="overlay"
                        open={isPanelOpen}
                        onOpenChange={setIsPanelOpen}
                        onNavigateHome={navigateToHome}
                    />
                ) : null}
                <FoliaPlayerSettingsSurface open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            </FoliaI18nScope>
        </section>
    );
}

function FullscreenEmptyState({ track, error }: { track: FoliaTrack | null; error: string | null }) {
    const { t } = useTranslation();
    return (
        <div className="folia-fullscreen__empty">
            {track?.coverUrl ? <img src={track.coverUrl} alt="" /> : <span>FOLIA</span>}
            <strong>{track?.title || t('ui.noTrack')}</strong>
            <small>{error || track?.artist || t('playerPackage.localLyricsPlayer')}</small>
        </div>
    );
}

function nextLoopMode(mode: FoliaLoopMode): FoliaLoopMode {
    return mode === 'off' ? 'all' : mode === 'all' ? 'one' : mode === 'one' ? 'random' : 'off';
}

function findCurrentLineIndex(lines: Array<{ startTime: number }>, time: number): number {
    let low = 0;
    let high = lines.length - 1;
    let found = -1;
    while (low <= high) {
        const middle = Math.floor((low + high) / 2);
        if ((lines[middle]?.startTime ?? Number.POSITIVE_INFINITY) <= time) {
            found = middle;
            low = middle + 1;
        } else high = middle - 1;
    }
    return found;
}
