import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { FolderOpen, Gauge, Library, ListMusic, Maximize2, RotateCw, Settings2, Shuffle, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProgressControl, TransportControls } from './controls';
import { useFoliaPlayer } from './PlayerProvider';
import { FoliaRemoteSurface } from './RemoteSurface';
import { VISUALIZER_REGISTRY, getVisualizerModeLabel } from '../../../src/components/visualizer/registry';
import {
    VISUALIZER_BACKGROUND_REGISTRY,
    getVisualizerBackgroundModeLabel,
    hasVisualizerBackgroundMode,
} from '../../../src/components/visualizer/backgrounds/registry';
import type { VisualizerMode } from '../../../src/types';
import type { FoliaTrack } from './types';

// packages/player/src/UnifiedPanel.tsx

export type FoliaPanelTab = 'now' | 'queue' | 'library' | 'settings';

export interface FoliaUnifiedPanelProps {
    className?: string;
    initialTab?: FoliaPanelTab;
    onOpenFullscreen?: () => void;
    extraSettings?: ReactNode;
}

export function FoliaUnifiedPanel({ className = '', initialTab = 'now', onOpenFullscreen, extraSettings }: FoliaUnifiedPanelProps) {
    const { t } = useTranslation('folia-player');
    const rootRef = useRef<HTMLDivElement>(null);
    const [tab, setTab] = useState<FoliaPanelTab>(initialTab);
    const [narrow, setNarrow] = useState(false);

    useEffect(() => {
        const root = rootRef.current;
        if (!root || typeof ResizeObserver === 'undefined') return;
        const update = (width: number, height: number) => {
            const next = width < 470 || height < 250;
            setNarrow((current) => current === next ? current : next);
        };
        update(root.clientWidth, root.clientHeight);
        const observer = new ResizeObserver(([entry]) => update(entry.contentRect.width, entry.contentRect.height));
        observer.observe(root);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={rootRef} className={`folia-panel ${className}`.trim()} data-folia-surface="unified">
            {narrow ? <FoliaRemoteSurface compact className="folia-panel__remote" /> : (
                <>
                    <nav className="folia-panel__tabs" aria-label={t('playerPackage.playerViews')}>
                        <PanelTab active={tab === 'now'} label={t('panel.cover')} onClick={() => setTab('now')}><Gauge /></PanelTab>
                        <PanelTab active={tab === 'queue'} label={t('queue.title')} onClick={() => setTab('queue')}><ListMusic /></PanelTab>
                        <PanelTab active={tab === 'library'} label={t('localMusic.title')} onClick={() => setTab('library')}><Library /></PanelTab>
                        <PanelTab active={tab === 'settings'} label={t('options.playback')} onClick={() => setTab('settings')}><Settings2 /></PanelTab>
                        {onOpenFullscreen ? (
                            <button type="button" className="folia-panel__fullscreen" onClick={onOpenFullscreen} title={t('commandPalette.commands.browser-fullscreen.title')} aria-label={t('commandPalette.commands.browser-fullscreen.title')}>
                                <Maximize2 />
                            </button>
                        ) : null}
                    </nav>
                    <div className="folia-panel__content">
                        {tab === 'now' ? <NowPlayingView /> : null}
                        {tab === 'queue' ? <QueueView /> : null}
                        {tab === 'library' ? <LibraryView /> : null}
                        {tab === 'settings' ? <SettingsView extraSettings={extraSettings} /> : null}
                    </div>
                </>
            )}
        </div>
    );
}

function PanelTab({ active, label, onClick, children }: { active: boolean; label: string; onClick(): void; children: ReactNode }) {
    return (
        <button type="button" className="folia-panel-tab" data-active={active} onClick={onClick} title={label} aria-label={label} aria-pressed={active}>
            {children}<span>{label}</span>
        </button>
    );
}

function NowPlayingView() {
    const { snapshot } = useFoliaPlayer();
    const track = snapshot.activeTrack;
    return (
        <div className="folia-now">
            <div className="folia-now__cover">
                {track?.coverUrl ? <img src={track.coverUrl} alt="" draggable={false} /> : <span>FOLIA</span>}
            </div>
            <div className="folia-now__details">
                <div className="folia-track-copy is-large">
                    <strong>{track?.title || 'Folia'}</strong>
                    <span>{track?.artist || track?.album || 'Local player'}</span>
                </div>
                <p className="folia-now__lyric">{snapshot.currentLyric || ' '}</p>
                <TransportControls />
                <ProgressControl />
            </div>
        </div>
    );
}

interface QueueRowProps {
    tracks: FoliaTrack[];
    activeIndex: number;
    onSelect(index: number): void;
    onRemove(index: number): void;
}

function QueueRow({ index, style, ariaAttributes, tracks, activeIndex, onSelect, onRemove }: RowComponentProps<QueueRowProps>) {
    const { t } = useTranslation('folia-player');
    const track = tracks[index];
    return (
        <div style={style} {...ariaAttributes} className="folia-queue-row" data-active={index === activeIndex}>
            <button type="button" className="folia-queue-row__track" onClick={() => onSelect(index)}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span><strong>{track?.title}</strong><small>{track?.artist || track?.album || track?.path}</small></span>
            </button>
            <button type="button" className="folia-icon-button" onClick={() => onRemove(index)} title={t('queue.remove')} aria-label={t('queue.remove')}><Trash2 /></button>
        </div>
    );
}

function QueueView() {
    const { t } = useTranslation('folia-player');
    const { actions, snapshot, tracks } = useFoliaPlayer();
    const rowProps = useMemo<QueueRowProps>(() => ({
        tracks,
        activeIndex: snapshot.activeIndex,
        onSelect: (index) => actions.selectTrack(index, true),
        onRemove: actions.removeTrack,
    }), [actions, snapshot.activeIndex, tracks]);
    return (
        <div className="folia-queue">
            <header><span>{t('queue.title')} · {tracks.length}</span><button type="button" className="folia-icon-button" onClick={actions.shuffle} title={t('queue.shuffle')} aria-label={t('queue.shuffle')}><Shuffle /></button></header>
            {tracks.length ? (
                <List rowCount={tracks.length} rowHeight={52} rowComponent={QueueRow} rowProps={rowProps} overscanCount={6} style={{ height: 286, width: '100%' }} />
            ) : <div className="folia-empty">{t('queue.empty')}</div>}
        </div>
    );
}

function LibraryView() {
    const { t } = useTranslation('folia-player');
    const { actions, libraryRoots, snapshot } = useFoliaPlayer();
    const [draft, setDraft] = useState('');
    return (
        <div className="folia-library">
            <header><strong>{t('localMusic.title')}</strong><span>{snapshot.activeTrack ? snapshot.activeTrack.title : ''}</span></header>
            <div className="folia-library__add">
                <input value={draft} onChange={(event) => setDraft(event.currentTarget.value)} placeholder={t('playerPackage.libraryFolderPath')} aria-label={t('playerPackage.libraryFolderPath')} />
                <button type="button" className="folia-icon-button" onClick={() => { void actions.addLibraryRoot(draft); setDraft(''); }} title={t('localMusic.importFolder')} aria-label={t('localMusic.importFolder')}><FolderOpen /></button>
                <button type="button" className="folia-icon-button" onClick={() => void actions.scanLibrary()} title={t('localMusic.reload')} aria-label={t('localMusic.reload')}><RotateCw /></button>
            </div>
            <div className="folia-library__roots">
                {libraryRoots.map((root) => <div key={root}><span title={root}>{root}</span><button type="button" className="folia-icon-button" onClick={() => actions.removeLibraryRoot(root)} title={t('common.delete')} aria-label={t('common.delete')}><Trash2 /></button></div>)}
            </div>
            {snapshot.error ? <p className="folia-error">{snapshot.error}</p> : null}
        </div>
    );
}

function SettingsView({ extraSettings }: { extraSettings?: ReactNode }) {
    const { t } = useTranslation('folia-player');
    const { actions, outputDevices, preferences } = useFoliaPlayer();
    return (
        <div className="folia-settings">
            <Setting label={t('playerPackage.volume')}>
                <input type="range" min={0} max={1} step={0.01} value={preferences.volume} onChange={(event) => actions.setPreferences({ volume: Number(event.currentTarget.value) })} />
            </Setting>
            <Setting label={t('playerPackage.loopMode')}>
                <select value={preferences.loopMode} onChange={(event) => actions.setPreferences({ loopMode: event.currentTarget.value as typeof preferences.loopMode })}>
                    <option value="off">{t('playerPackage.loopOff')}</option><option value="all">{t('playerPackage.loopAll')}</option><option value="one">{t('playerPackage.loopOne')}</option>
                </select>
            </Setting>
            <Setting label="ReplayGain">
                <select value={preferences.replayGainMode} onChange={(event) => actions.setPreferences({ replayGainMode: event.currentTarget.value as typeof preferences.replayGainMode })}>
                    <option value="off">{t('playerPackage.replayGainOff')}</option><option value="track">{t('playerPackage.replayGainTrack')}</option><option value="album">{t('playerPackage.replayGainAlbum')}</option>
                </select>
            </Setting>
            <Setting label={t('playerPackage.visualizerMode')}>
                <select value={preferences.visualizerMode} onChange={(event) => actions.setPreferences({ visualizerMode: event.currentTarget.value as VisualizerMode })}>
                    {VISUALIZER_REGISTRY.map(({ mode }) => <option key={mode} value={mode}>{getVisualizerModeLabel(mode, t)}</option>)}
                </select>
            </Setting>
            <Setting label={t('playerPackage.visualizerBackground')}>
                <select value={preferences.background.mode ?? 'latent'} onChange={(event) => {
                    const mode = event.currentTarget.value;
                    if (hasVisualizerBackgroundMode(mode)) actions.setPreferences({ background: { ...preferences.background, mode } });
                }}>
                    {VISUALIZER_BACKGROUND_REGISTRY.map(({ mode }) => <option key={mode} value={mode}>{getVisualizerBackgroundModeLabel(mode, t)}</option>)}
                </select>
            </Setting>
            <Setting label={t('playerPackage.outputDevice')}>
                <select value={preferences.outputDeviceId ?? ''} onFocus={() => void actions.refreshOutputDevices()} onChange={(event) => actions.setPreferences({ outputDeviceId: event.currentTarget.value || undefined })}>
                    <option value="">{t('playerPackage.outputDefault')}</option>{outputDevices.map((device) => <option key={device.id} value={device.id}>{device.label}</option>)}
                </select>
            </Setting>
            {extraSettings}
        </div>
    );
}

function Setting({ label, children }: { label: string; children: ReactNode }) {
    return <label className="folia-setting"><span>{label}</span>{children}</label>;
}
