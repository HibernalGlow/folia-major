import { useCallback, useMemo, useRef } from 'react';
import {
    DEFAULT_LATENT_BACKGROUND_TUNING,
    DEFAULT_MONET_BACKGROUND_TUNING,
    DEFAULT_NOMAND_BACKGROUND_TUNING,
} from '../../../src/types';
import type {
    VisualizerBackgroundActions,
    VisualizerBackgroundConfig,
} from '../../../src/components/visualizer/backgrounds/definition';
import { sanitizeUrlBackgroundItem } from '../../../src/utils/urlBackground';
import { useFoliaPlayer } from './PlayerProvider';

// Connects upstream background controls to the host-owned player preference snapshot.
export function useFoliaVisualizerBackgroundPreferences(): {
    backgroundConfig: VisualizerBackgroundConfig;
    backgroundActions: VisualizerBackgroundActions;
} {
    const { actions, preferences } = useFoliaPlayer();
    const backgroundRef = useRef(preferences.background);
    backgroundRef.current = preferences.background;
    const updateBackground = useCallback((update: (current: VisualizerBackgroundConfig) => VisualizerBackgroundConfig) => {
        const nextBackground = update(backgroundRef.current);
        backgroundRef.current = nextBackground;
        actions.setPreferences({ background: nextBackground });
    }, [actions]);

    const backgroundActions = useMemo<VisualizerBackgroundActions>(() => ({
        onModeChange: mode => updateBackground(current => ({ ...current, mode })),
        common: {
            onCoverColorChange: useCoverColorBg => updateBackground(current => ({
                ...current,
                common: { ...current.common, useCoverColorBg },
            })),
            onOpacityChange: opacity => updateBackground(current => ({
                ...current,
                common: { ...current.common, opacity },
            })),
            onDisableGeometricChange: disableGeometricBackground => updateBackground(current => ({
                ...current,
                common: { ...current.common, disableGeometricBackground },
            })),
            onDisableVignetteChange: disableVignette => updateBackground(current => ({
                ...current,
                common: { ...current.common, disableVignette },
            })),
        },
        monet: {
            onTuningChange: patch => updateBackground(current => ({
                ...current,
                monet: { tuning: { ...DEFAULT_MONET_BACKGROUND_TUNING, ...current.monet?.tuning, ...patch } },
            })),
            onResetTuning: () => updateBackground(current => ({
                ...current,
                monet: { tuning: { ...DEFAULT_MONET_BACKGROUND_TUNING } },
            })),
        },
        nomand: {
            onTuningChange: patch => updateBackground(current => ({
                ...current,
                nomand: { tuning: { ...DEFAULT_NOMAND_BACKGROUND_TUNING, ...current.nomand?.tuning, ...patch } },
            })),
            onResetTuning: () => updateBackground(current => ({
                ...current,
                nomand: { tuning: { ...DEFAULT_NOMAND_BACKGROUND_TUNING } },
            })),
        },
        latent: {
            onTuningChange: patch => updateBackground(current => ({
                ...current,
                latent: { tuning: { ...DEFAULT_LATENT_BACKGROUND_TUNING, ...current.latent?.tuning, ...patch } },
            })),
            onResetTuning: () => updateBackground(current => ({
                ...current,
                latent: { tuning: { ...DEFAULT_LATENT_BACKGROUND_TUNING } },
            })),
        },
        url: {
            onAdd: item => updateBackground(current => {
                const nextItem = sanitizeUrlBackgroundItem(item);
                if (!nextItem) return current;
                const items = [...(current.url?.items ?? []), nextItem];
                return { ...current, url: { items, selectedId: current.url?.selectedId ?? nextItem.id } };
            }),
            onUpdate: (id, patch) => updateBackground(current => ({
                ...current,
                url: {
                    ...current.url,
                    items: (current.url?.items ?? []).map(item => (
                        item.id === id ? sanitizeUrlBackgroundItem({ ...item, ...patch, id }) ?? item : item
                    )),
                },
            })),
            onDelete: id => updateBackground(current => {
                const items = (current.url?.items ?? []).filter(item => item.id !== id);
                const selectedId = current.url?.selectedId === id ? items[0]?.id ?? null : current.url?.selectedId;
                return { ...current, url: { items, selectedId } };
            }),
            onSelect: selectedId => updateBackground(current => ({
                ...current,
                url: { ...current.url, selectedId },
            })),
        },
    }), [updateBackground]);

    return { backgroundConfig: preferences.background, backgroundActions };
}
