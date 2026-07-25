import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, Settings2, X } from 'lucide-react';
import { useMotionValueEvent } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import VisualizerRenderer from '../../../src/components/visualizer/VisualizerRenderer';
import { VISUALIZER_REGISTRY } from '../../../src/components/visualizer/registry';
import { ProgressControl, TransportControls } from './controls';
import { useFoliaPlayer } from './PlayerProvider';
import { FoliaVisualizerSettings } from './VisualizerSettings';

// packages/player/src/FullscreenSurface.tsx

export interface FoliaFullscreenSurfaceProps {
    className?: string;
    showChrome?: boolean;
}

export function FoliaFullscreenSurface({ className = '', showChrome = true }: FoliaFullscreenSurfaceProps) {
    const { t } = useTranslation('folia-player');
    const { actions, isDaylight, motion, preferences, resolvedTheme, snapshot } = useFoliaPlayer();
    const [currentLineIndex, setCurrentLineIndex] = useState(-1);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [chromeVisible, setChromeVisible] = useState(true);
    const hideTimerRef = useRef<number | null>(null);
    const track = snapshot.activeTrack;
    const lines = track?.lyrics?.lines ?? [];
    const style = useMemo(() => ({
        '--text-primary': resolvedTheme.primaryColor,
        '--text-secondary': resolvedTheme.secondaryColor,
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

    useEffect(() => () => {
        if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
    }, []);

    function revealChrome() {
        if (hideTimerRef.current !== null) window.clearTimeout(hideTimerRef.current);
        setChromeVisible(true);
        hideTimerRef.current = window.setTimeout(() => setChromeVisible(false), 1800);
    }

    function cycleMode(direction: -1 | 1) {
        const index = VISUALIZER_REGISTRY.findIndex((entry) => entry.mode === preferences.visualizerMode);
        const nextIndex = (index + direction + VISUALIZER_REGISTRY.length) % VISUALIZER_REGISTRY.length;
        actions.setPreferences({ visualizerMode: VISUALIZER_REGISTRY[nextIndex]?.mode ?? 'classic' });
    }

    return (
        <section className={`folia-fullscreen ${className}`.trim()} style={style} data-folia-surface="fullscreen" onPointerMove={revealChrome}>
            {track && lines.length ? (
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
                    paused={!snapshot.isPlaying}
                    visualizerTunings={preferences.visualizerTunings}
                    onLyricLineSeek={actions.seek}
                />
            ) : <FullscreenEmptyState />}

            {showChrome ? (
                <div className="folia-fullscreen__chrome" data-visible={chromeVisible || settingsOpen}>
                    <button type="button" className="folia-icon-button" onClick={() => cycleMode(-1)} title={t('remote.previous')} aria-label={t('remote.previous')}><ChevronLeft /></button>
                    <div className="folia-fullscreen__transport"><TransportControls compact /><ProgressControl showTimes={false} /></div>
                    <button type="button" className="folia-icon-button" onClick={() => cycleMode(1)} title={t('remote.next')} aria-label={t('remote.next')}><ChevronRight /></button>
                    <button type="button" className="folia-icon-button" onClick={() => setSettingsOpen(true)} title={t('options.visualizerMode')} aria-label={t('options.visualizerMode')}><Settings2 /></button>
                </div>
            ) : null}

            {settingsOpen ? (
                <aside className="folia-fullscreen__settings">
                    <header><strong>{t('options.visualizerMode')}</strong><button type="button" className="folia-icon-button" onClick={() => setSettingsOpen(false)} title={t('remote.close')} aria-label={t('remote.close')}><X /></button></header>
                    <FoliaVisualizerSettings />
                </aside>
            ) : null}
        </section>
    );
}

function FullscreenEmptyState() {
    const { t } = useTranslation('folia-player');
    const { snapshot } = useFoliaPlayer();
    return (
        <div className="folia-fullscreen__empty">
            {snapshot.activeTrack?.coverUrl ? <img src={snapshot.activeTrack.coverUrl} alt="" /> : <span>FOLIA</span>}
            <strong>{snapshot.activeTrack?.title || t('ui.noTrack')}</strong>
            <small>{snapshot.error || snapshot.activeTrack?.artist || t('playerPackage.localLyricsPlayer')}</small>
        </div>
    );
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
