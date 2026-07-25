import { Check, Cpu, EyeOff, Gauge, MonitorPause, PanelRightClose, Undo2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { VISUALIZER_FRAME_RATE_OPTIONS } from '../../../src/utils/frameRateLimiter';
import { useFoliaPlayer } from './PlayerProvider';
import { SettingsCard, SettingsSwitch } from './SettingsControls';
import type { FoliaVisualizerFrameRate } from './types';

// packages/player/src/LabSettingsSection.tsx

export function FoliaLabSettingsSection() {
    const { t } = useTranslation();
    const { actions, preferences } = useFoliaPlayer();
    const limiterEnabled = preferences.visualizerFrameRate !== 'off';
    const selectedFrameRate = preferences.visualizerFrameRate === 'off' ? 120 : preferences.visualizerFrameRate;
    const selectedFrameRateIndex = Math.max(0, VISUALIZER_FRAME_RATE_OPTIONS.indexOf(selectedFrameRate));

    const setFrameRate = (frameRate: FoliaVisualizerFrameRate) => {
        actions.setPreferences({ visualizerFrameRate: frameRate });
    };

    return (
        <div className="space-y-5" data-folia-settings-section="lab">
            <SettingsGroup
                description={t('playerPackage.labPerformanceDescription')}
                title={t('playerPackage.labPerformance')}
            >
                <SettingsCard
                    action={<SettingsSwitch checked={preferences.staticMode} label={t('playerPackage.staticMode')} onChange={(staticMode) => actions.setPreferences({ staticMode })} />}
                    description={t('playerPackage.staticModeDescription')}
                    icon={<MonitorPause size={18} />}
                    title={t('playerPackage.staticMode')}
                >
                    <p className="text-[11px] leading-5 opacity-45">{t('playerPackage.staticModeDetail')}</p>
                </SettingsCard>

                <SettingsCard
                    action={<SettingsSwitch checked={preferences.disableHomeDynamicBackground} label={t('playerPackage.disableHomeDynamicBackground')} onChange={(disableHomeDynamicBackground) => actions.setPreferences({ disableHomeDynamicBackground })} />}
                    description={t('playerPackage.disableHomeDynamicBackgroundDescription')}
                    icon={<Gauge size={18} />}
                    title={t('playerPackage.disableHomeDynamicBackground')}
                >
                    <p className="text-[11px] leading-5 opacity-45">{t('playerPackage.disableHomeDynamicBackgroundDetail')}</p>
                </SettingsCard>

                <SettingsCard
                    action={<SettingsSwitch checked={limiterEnabled} label={t('playerPackage.visualizerFrameRate')} onChange={(enabled) => setFrameRate(enabled ? selectedFrameRate : 'off')} />}
                    description={t('playerPackage.visualizerFrameRateDescription')}
                    icon={<Cpu size={18} />}
                    title={t('playerPackage.visualizerFrameRate')}
                >
                    <div className={`space-y-3 transition-opacity ${limiterEnabled ? 'opacity-100' : 'pointer-events-none opacity-40'}`}>
                        <div className="flex items-center justify-between text-xs">
                            <span>{t('playerPackage.visualizerFrameRateValue')}</span>
                            <span className="font-mono opacity-65">{selectedFrameRate} FPS</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max={VISUALIZER_FRAME_RATE_OPTIONS.length - 1}
                            step="1"
                            value={selectedFrameRateIndex}
                            className="folia-native-range w-full"
                            aria-label={t('playerPackage.visualizerFrameRateValue')}
                            disabled={!limiterEnabled}
                            onChange={(event) => {
                                const index = Math.min(
                                    VISUALIZER_FRAME_RATE_OPTIONS.length - 1,
                                    Math.max(0, Number(event.target.value)),
                                );
                                setFrameRate(VISUALIZER_FRAME_RATE_OPTIONS[index]);
                            }}
                        />
                        <div className="grid grid-cols-3 font-mono text-[10px] opacity-50">
                            {VISUALIZER_FRAME_RATE_OPTIONS.map((frameRate, index) => (
                                <span key={frameRate} className={index === 1 ? 'text-center' : index === 2 ? 'text-right' : ''}>{frameRate}</span>
                            ))}
                        </div>
                    </div>
                </SettingsCard>
            </SettingsGroup>

            <SettingsGroup
                description={t('playerPackage.labPlayerUiDescription')}
                title={t('playerPackage.labPlayerUi')}
            >
                <SettingsCard
                    description={t('playerPackage.hidePlayerUiDescription')}
                    icon={<EyeOff size={18} />}
                    title={t('playerPackage.hidePlayerUi')}
                >
                    <div className="flex flex-wrap gap-2">
                        <VisibilityOption
                            checked={preferences.hidePlayerProgressBar}
                            label={t('playerPackage.hidePlayerProgressBar')}
                            onChange={(hidePlayerProgressBar) => actions.setPreferences({ hidePlayerProgressBar })}
                        />
                        <VisibilityOption
                            checked={preferences.hidePlayerTranslationSubtitle}
                            label={t('playerPackage.hidePlayerTranslationSubtitle')}
                            onChange={(hidePlayerTranslationSubtitle) => actions.setPreferences({ hidePlayerTranslationSubtitle })}
                        />
                        <VisibilityOption
                            checked={preferences.hidePlayerRightPanelButton}
                            label={t('playerPackage.hidePlayerRightPanelButton')}
                            onChange={(hidePlayerRightPanelButton) => actions.setPreferences({ hidePlayerRightPanelButton })}
                        />
                    </div>
                </SettingsCard>

                <SettingsCard
                    action={<SettingsSwitch checked={preferences.showOpenPanelCloseButton} label={t('playerPackage.showOpenPanelCloseButton')} onChange={(showOpenPanelCloseButton) => actions.setPreferences({ showOpenPanelCloseButton })} />}
                    description={t('playerPackage.showOpenPanelCloseButtonDescription')}
                    icon={<PanelRightClose size={18} />}
                    title={t('playerPackage.showOpenPanelCloseButton')}
                />

                <SettingsCard
                    action={<SettingsSwitch checked={preferences.alwaysShowPlayerBackButton} label={t('playerPackage.alwaysShowPlayerBackButton')} onChange={(alwaysShowPlayerBackButton) => actions.setPreferences({ alwaysShowPlayerBackButton })} />}
                    description={t('playerPackage.alwaysShowPlayerBackButtonDescription')}
                    icon={<Undo2 size={18} />}
                    title={t('playerPackage.alwaysShowPlayerBackButton')}
                />
            </SettingsGroup>
        </div>
    );
}

function SettingsGroup({ children, description, title }: { children: ReactNode; description: string; title: string }) {
    return (
        <section className="space-y-3">
            <header>
                <h3 className="text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-xs leading-5 opacity-55">{description}</p>
            </header>
            {children}
        </section>
    );
}

function VisibilityOption({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
    return (
        <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs transition-colors ${checked ? 'border-current/20 bg-current/10' : 'border-current/10 hover:bg-current/5'}`}
            onClick={() => onChange(!checked)}
        >
            <span className={`grid size-4 place-items-center rounded border ${checked ? 'border-current/30 bg-current/10' : 'border-current/20'}`}>
                {checked ? <Check size={12} /> : null}
            </span>
            <span>{label}</span>
        </button>
    );
}
