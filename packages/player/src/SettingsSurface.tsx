import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Database, FlaskConical, Languages, RefreshCw, SlidersHorizontal, Sparkles, Volume2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VISUALIZER_REGISTRY, getVisualizerModeLabel } from '../../../src/components/visualizer/registry';
import {
    VISUALIZER_BACKGROUND_REGISTRY,
    getVisualizerBackgroundModeLabel,
} from '../../../src/components/visualizer/backgrounds/registry';
import type { VisualizerBackgroundMode, VisualizerMode } from '../../../src/types';
import { FoliaI18nScope } from './FoliaI18nScope';
import { FoliaLabSettingsSection } from './LabSettingsSection';
import { useFoliaPlayer } from './PlayerProvider';
import { SettingsCard, SettingsSwitch } from './SettingsControls';
import { FoliaVisualizerSettings } from './VisualizerSettings';
import { useFoliaVisualizerBackgroundPreferences } from './useFoliaVisualizerBackgroundPreferences';

type SettingsSection = 'playback' | 'visualizer' | 'lab';

export interface FoliaPlayerSettingsSurfaceProps {
    open: boolean;
    onClose: () => void;
    extraSettings?: ReactNode;
}

export function FoliaPlayerSettingsSurface(props: FoliaPlayerSettingsSurfaceProps) {
    if (!props.open || typeof document === 'undefined') return null;
    return createPortal(
        <FoliaI18nScope><SettingsDialog {...props} /></FoliaI18nScope>,
        document.body,
    );
}

function SettingsDialog({ onClose, extraSettings }: FoliaPlayerSettingsSurfaceProps) {
    const { t } = useTranslation();
    const { actions, outputDevices, preferences, resolvedTheme } = useFoliaPlayer();
    const { backgroundActions, backgroundConfig } = useFoliaVisualizerBackgroundPreferences();
    const [section, setSection] = useState<SettingsSection>('playback');
    const refreshOutputDevices = actions.refreshOutputDevices;

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    useEffect(() => {
        void refreshOutputDevices();
    }, [refreshOutputDevices]);

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-3 backdrop-blur-md md:p-8"
            data-folia-settings
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) onClose();
            }}
        >
            <section
                className="flex h-[min(760px,calc(100dvh-1.5rem))] w-[min(880px,calc(100vw-1.5rem))] min-h-0 flex-col overflow-hidden rounded-2xl border border-white/15 shadow-2xl"
                style={{
                    background: `color-mix(in srgb, ${resolvedTheme.backgroundColor} 94%, transparent)`,
                    color: resolvedTheme.primaryColor,
                    fontFamily: resolvedTheme.fontFamily,
                }}
                role="dialog"
                aria-modal="true"
                aria-label={t('playerPackage.settings')}
            >
                <header className="flex shrink-0 items-center gap-3 border-b border-current/10 px-4 py-3 md:px-5">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-base font-semibold">{t('playerPackage.settings')}</h2>
                        <p className="truncate text-xs opacity-55">{t('playerPackage.settingsDescription')}</p>
                    </div>
                    {extraSettings}
                    <button type="button" className="grid size-9 place-items-center rounded-full transition-colors hover:bg-current/10" onClick={onClose} aria-label={t('ui.close')}>
                        <X size={18} />
                    </button>
                </header>

                <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)]">
                    <nav className="flex shrink-0 gap-2 border-b border-current/10 p-3 md:flex-col md:border-b-0 md:border-r" aria-label={t('playerPackage.settings')}>
                        <SectionButton active={section === 'playback'} icon={<SlidersHorizontal size={17} />} label={t('playerPackage.playbackSettings')} section="playback" onClick={() => setSection('playback')} />
                        <SectionButton active={section === 'visualizer'} icon={<Sparkles size={17} />} label={t('playerPackage.visualizerSettings')} section="visualizer" onClick={() => setSection('visualizer')} />
                        <SectionButton active={section === 'lab'} icon={<FlaskConical size={17} />} label={t('playerPackage.labSettings')} section="lab" onClick={() => setSection('lab')} />
                    </nav>

                    <div className="min-h-0 overflow-y-auto p-4 md:p-6">
                        {section === 'playback' ? (
                            <div className="space-y-4" data-folia-settings-section="playback">
                                <SettingsCard icon={<Database size={18} />} title={t('playerPackage.backgroundMetadata')} description={t('playerPackage.backgroundMetadataDescription')}>
                                    <SettingsSwitch
                                        checked={preferences.backgroundMetadataEnabled}
                                        label={t('playerPackage.backgroundMetadata')}
                                        onChange={(backgroundMetadataEnabled) => actions.setPreferences({ backgroundMetadataEnabled })}
                                    />
                                </SettingsCard>
                                <SettingsCard icon={<Volume2 size={18} />} title={t('playerPackage.volume')}>
                                    <input
                                        className="folia-native-range w-full"
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={preferences.volume}
                                        aria-label={t('playerPackage.volume')}
                                        onChange={(event) => actions.setPreferences({ volume: Number(event.target.value) })}
                                    />
                                </SettingsCard>
                                <SettingsCard icon={<SlidersHorizontal size={18} />} title={t('playerPackage.replayGain')}>
                                    <select className="h-10 w-full rounded-lg border border-current/15 bg-transparent px-3" value={preferences.replayGainMode} onChange={(event) => actions.setPreferences({ replayGainMode: event.target.value as typeof preferences.replayGainMode })}>
                                        <option value="off">{t('playerPackage.replayGainOff')}</option>
                                        <option value="track">{t('playerPackage.replayGainTrack')}</option>
                                        <option value="album">{t('playerPackage.replayGainAlbum')}</option>
                                    </select>
                                </SettingsCard>
                                <SettingsCard icon={<Volume2 size={18} />} title={t('playerPackage.outputDevice')} action={(
                                    <button type="button" className="grid size-8 place-items-center rounded-full hover:bg-current/10" onClick={() => void actions.refreshOutputDevices()} aria-label={t('playerPackage.refreshOutputDevices')}>
                                        <RefreshCw size={15} />
                                    </button>
                                )}>
                                    <select className="h-10 w-full rounded-lg border border-current/15 bg-transparent px-3" value={preferences.outputDeviceId ?? ''} onChange={(event) => actions.setPreferences({ outputDeviceId: event.target.value || undefined })}>
                                        <option value="">{t('playerPackage.outputDefault')}</option>
                                        {outputDevices.map((device) => <option key={device.id} value={device.id}>{device.label}</option>)}
                                    </select>
                                </SettingsCard>
                            </div>
                        ) : section === 'visualizer' ? (
                            <div className="space-y-4" data-folia-settings-section="visualizer">
                                <SettingsCard icon={<Sparkles size={18} />} title={t('playerPackage.visualizerMode')}>
                                    <select className="h-10 w-full rounded-lg border border-current/15 bg-transparent px-3" value={preferences.visualizerMode} onChange={(event) => actions.setPreferences({ visualizerMode: event.target.value as VisualizerMode })}>
                                        {VISUALIZER_REGISTRY.map((entry) => <option key={entry.mode} value={entry.mode}>{getVisualizerModeLabel(entry.mode, t)}</option>)}
                                    </select>
                                </SettingsCard>
                                <SettingsCard icon={<Sparkles size={18} />} title={t('playerPackage.visualizerBackground')}>
                                    <select
                                        data-folia-background-mode-control="settings"
                                        className="h-10 w-full rounded-lg border border-current/15 bg-transparent px-3"
                                        value={backgroundConfig.mode ?? 'latent'}
                                        onChange={(event) => backgroundActions.onModeChange?.(event.target.value as VisualizerBackgroundMode)}
                                    >
                                        {VISUALIZER_BACKGROUND_REGISTRY.map((entry) => <option key={entry.mode} value={entry.mode}>{getVisualizerBackgroundModeLabel(entry.mode, t)}</option>)}
                                    </select>
                                </SettingsCard>
                                <SettingsCard icon={<Languages size={18} />} title={t('playerPackage.lyricsDisplay')}>
                                    <div className="space-y-4">
                                        <SettingsSwitch checked={preferences.showSubtitleTranslation !== false} label={t('playerPackage.showTranslation')} onChange={(showSubtitleTranslation) => actions.setPreferences({ showSubtitleTranslation })} />
                                        <SettingsSwitch checked={preferences.showHarmonySubtitle !== false} label={t('playerPackage.showHarmony')} onChange={(showHarmonySubtitle) => actions.setPreferences({ showHarmonySubtitle })} />
                                        <ScaleControl label={t('playerPackage.lyricsFontScale')} value={preferences.lyricsFontScale ?? 1} onChange={(lyricsFontScale) => actions.setPreferences({ lyricsFontScale })} />
                                        <ScaleControl label={t('playerPackage.subtitleFontScale')} value={preferences.subtitleFontScale ?? 1} onChange={(subtitleFontScale) => actions.setPreferences({ subtitleFontScale })} />
                                    </div>
                                </SettingsCard>
                                <FoliaVisualizerSettings />
                            </div>
                        ) : (
                            <FoliaLabSettingsSection />
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

function SectionButton({ active, icon, label, onClick, section }: { active: boolean; icon: ReactNode; label: string; onClick: () => void; section: SettingsSection }) {
    return <button type="button" data-folia-settings-nav={section} className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors md:flex-none md:justify-start ${active ? 'bg-current/10 font-semibold' : 'opacity-60 hover:bg-current/5 hover:opacity-100'}`} onClick={onClick}>{icon}<span className="truncate">{label}</span></button>;
}

function ScaleControl({ label, onChange, value }: { label: string; onChange: (value: number) => void; value: number }) {
    return <label className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-xs"><span>{label}</span><span className="tabular-nums opacity-60">{value.toFixed(2)}x</span><input className="folia-native-range col-span-2 w-full" type="range" min="0.7" max="1.5" step="0.05" value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>;
}
