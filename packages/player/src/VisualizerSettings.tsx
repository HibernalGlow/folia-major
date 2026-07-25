import { useTranslation } from 'react-i18next';
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
import type { VisualizerBackgroundActions } from '../../../src/components/visualizer/backgrounds/definition';
import type { VisualizerTuningBundle, VisualizerTuningMode } from '../../../src/components/visualizer/tuningRegistry';
import { useFoliaPlayer } from './PlayerProvider';

// packages/player/src/VisualizerSettings.tsx

export function FoliaVisualizerSettings() {
    const { t } = useTranslation('folia-player');
    const { actions, isDaylight, preferences, resolvedTheme } = useFoliaPlayer();
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
    const backgroundActions: VisualizerBackgroundActions = {
        onModeChange: (mode) => actions.setPreferences({ background: { ...preferences.background, mode } }),
        common: {
            onCoverColorChange: (useCoverColorBg) => actions.setPreferences({ background: { ...preferences.background, common: { ...preferences.background.common, useCoverColorBg } } }),
            onOpacityChange: (opacity) => actions.setPreferences({ background: { ...preferences.background, common: { ...preferences.background.common, opacity } } }),
            onDisableGeometricChange: (disableGeometricBackground) => actions.setPreferences({ background: { ...preferences.background, common: { ...preferences.background.common, disableGeometricBackground } } }),
            onDisableVignetteChange: (disableVignette) => actions.setPreferences({ background: { ...preferences.background, common: { ...preferences.background.common, disableVignette } } }),
        },
    };
    const visualizerPanel = getVisualizerRegistryEntry(preferences.visualizerMode).renderSettingsPanel?.(visualizerProps);
    const backgroundPanel = preferences.background.mode
        ? getVisualizerBackgroundRegistryEntry(preferences.background.mode).renderSettingsPanel?.({
            config: preferences.background,
            actions: backgroundActions,
            t,
            isDaylight,
            theme: resolvedTheme,
            controlCardBg: 'color-mix(in srgb, var(--folia-surface) 82%, transparent)',
            rangeInputClass: 'folia-native-range',
        })
        : null;

    return <div className="folia-visualizer-settings">{visualizerPanel}{backgroundPanel}</div>;
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
