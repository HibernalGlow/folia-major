import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import {
    DEFAULT_CAPPELLA_TUNING,
    DEFAULT_CADENZA_TUNING,
    DEFAULT_CLASSIC_TUNING,
    DEFAULT_CLADDAGH_TUNING,
    DEFAULT_DIORAMA_TUNING,
    DEFAULT_FUME_TUNING,
    DEFAULT_MONET_TUNING,
    DEFAULT_PARTITA_TUNING,
    DEFAULT_TILT_TUNING,
} from '../../../src/types';
import { getVisualizerRegistryEntry } from '../../../src/components/visualizer/registry';
import { getVisualizerBackgroundRegistryEntry } from '../../../src/components/visualizer/backgrounds/registry';
import type { VisualizerSettingsPanelProps } from '../../../src/components/visualizer/definition';
import type { VisualizerTuningBundle, VisualizerTuningMode } from '../../../src/components/visualizer/tuningRegistry';
import { useFoliaPlayer } from './PlayerProvider';
import { useFoliaVisualizerBackgroundPreferences } from './useFoliaVisualizerBackgroundPreferences';

// packages/player/src/VisualizerSettings.tsx

export function FoliaVisualizerSettings() {
    const { t } = useTranslation('folia-player');
    const { actions, isDaylight, preferences, resolvedTheme } = useFoliaPlayer();
    const { backgroundActions } = useFoliaVisualizerBackgroundPreferences();
    const tunings = preferences.visualizerTunings ?? {};
    const updateTuning = <M extends VisualizerTuningMode>(mode: M, patch: Partial<NonNullable<VisualizerTuningBundle[M]>>) => {
        const current = tunings[mode] ?? defaultTunings[mode];
        actions.setPreferences({ visualizerTunings: { ...tunings, [mode]: { ...current, ...patch } } });
    };
    const visualizerProps: VisualizerSettingsPanelProps = {
        t,
        isDaylight,
        theme: resolvedTheme,
        controlCardBg: 'color-mix(in srgb, var(--folia-surface) 82%, transparent)',
        rangeInputClass: 'folia-native-range',
        classicTuning: tunings.classic ?? DEFAULT_CLASSIC_TUNING,
        onClassicTuningChange: (patch) => updateTuning('classic', patch),
        partitaTuning: tunings.partita ?? DEFAULT_PARTITA_TUNING,
        onPartitaTuningChange: (patch) => updateTuning('partita', patch),
        fumeTuning: tunings.fume ?? DEFAULT_FUME_TUNING,
        onFumeTuningChange: (patch) => updateTuning('fume', patch),
        claddaghTuning: tunings.claddagh ?? DEFAULT_CLADDAGH_TUNING,
        onCladdaghTuningChange: (patch) => updateTuning('claddagh', patch),
        cappellaTuning: tunings.cappella ?? DEFAULT_CAPPELLA_TUNING,
        onCappellaTuningChange: (patch) => updateTuning('cappella', patch),
        tiltTuning: tunings.tilt ?? DEFAULT_TILT_TUNING,
        onTiltTuningChange: (patch) => updateTuning('tilt', patch),
        dioramaTuning: tunings.diorama ?? DEFAULT_DIORAMA_TUNING,
        onDioramaTuningChange: (patch) => updateTuning('diorama', patch),
        monetTuning: tunings.monet ?? DEFAULT_MONET_TUNING,
        onMonetTuningChange: (patch) => updateTuning('monet', patch),
    };
    const visualizerPanel = getVisualizerRegistryEntry(preferences.visualizerMode).renderSettingsPanel?.(visualizerProps);
    const backgroundEntry = preferences.background.mode
        ? getVisualizerBackgroundRegistryEntry(preferences.background.mode)
        : null;
    const backgroundPanel = backgroundEntry?.renderSettingsPanel?.({
            config: preferences.background,
            actions: backgroundActions,
            t,
            isDaylight,
            theme: resolvedTheme,
            controlCardBg: 'color-mix(in srgb, var(--folia-surface) 82%, transparent)',
            rangeInputClass: 'folia-native-range',
        });

    return <div className="folia-visualizer-settings" data-folia-background-settings>
        {visualizerPanel}
        {backgroundPanel ? <div className="space-y-3">
            {backgroundPanel}
            {backgroundEntry?.resetSettings ? <button
                type="button"
                data-folia-background-reset={preferences.background.mode}
                className="inline-flex items-center gap-2 rounded-lg border border-current/15 px-3 py-2 text-sm opacity-75 transition-colors hover:bg-current/10 hover:opacity-100"
                onClick={() => backgroundEntry.resetSettings?.(backgroundActions)}
                aria-label="Reset background settings"
                title="Reset background settings"
            >
                <RotateCcw size={15} />
                <span>{t('resetToDefaultTheme')}</span>
            </button> : null}
        </div> : null}
    </div>;
}

const defaultTunings: Required<VisualizerTuningBundle> = {
    classic: DEFAULT_CLASSIC_TUNING,
    cadenza: DEFAULT_CADENZA_TUNING,
    partita: DEFAULT_PARTITA_TUNING,
    fume: DEFAULT_FUME_TUNING,
    claddagh: DEFAULT_CLADDAGH_TUNING,
    cappella: DEFAULT_CAPPELLA_TUNING,
    tilt: DEFAULT_TILT_TUNING,
    diorama: DEFAULT_DIORAMA_TUNING,
    monet: DEFAULT_MONET_TUNING,
};
