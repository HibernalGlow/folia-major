import { createFrameRateLimitedRaf } from '../../../src/utils/frameRateLimiter';
import type { VisualizerFrameRate } from '../../../src/types';

// packages/player/src/scopedFrameRateLimiter.ts

type ActiveFrameRate = Exclude<VisualizerFrameRate, 'off'>;
type FrameRateLimitedRaf = ReturnType<typeof createFrameRateLimitedRaf>;

const activeLimits = new Map<symbol, ActiveFrameRate>();
let installedLimiter: FrameRateLimitedRaf | null = null;
let nativeRequestAnimationFrame: typeof window.requestAnimationFrame | null = null;
let nativeCancelAnimationFrame: typeof window.cancelAnimationFrame | null = null;

export function setScopedVisualizerFrameRate(owner: symbol, frameRate: VisualizerFrameRate): void {
    if (frameRate === 'off') activeLimits.delete(owner);
    else activeLimits.set(owner, frameRate);
    reconcileFrameRateLimiter();
}

export function clearScopedVisualizerFrameRate(owner: symbol): void {
    if (!activeLimits.delete(owner)) return;
    reconcileFrameRateLimiter();
}

function reconcileFrameRateLimiter(): void {
    if (typeof window === 'undefined') return;
    const effectiveFrameRate = getEffectiveFrameRate();

    if (effectiveFrameRate === 'off') {
        restoreNativeAnimationFrame();
        return;
    }

    if (installedLimiter) {
        installedLimiter.setFrameRate(effectiveFrameRate);
        return;
    }

    nativeRequestAnimationFrame = window.requestAnimationFrame;
    nativeCancelAnimationFrame = window.cancelAnimationFrame;
    installedLimiter = createFrameRateLimitedRaf(
        (callback) => nativeRequestAnimationFrame?.call(window, callback) ?? 0,
        (handle) => nativeCancelAnimationFrame?.call(window, handle),
        effectiveFrameRate,
    );
    window.requestAnimationFrame = installedLimiter.requestAnimationFrame;
    window.cancelAnimationFrame = installedLimiter.cancelAnimationFrame;
}

function restoreNativeAnimationFrame(): void {
    if (!installedLimiter) return;
    if (nativeRequestAnimationFrame && window.requestAnimationFrame === installedLimiter.requestAnimationFrame) {
        window.requestAnimationFrame = nativeRequestAnimationFrame;
    }
    if (nativeCancelAnimationFrame && window.cancelAnimationFrame === installedLimiter.cancelAnimationFrame) {
        window.cancelAnimationFrame = nativeCancelAnimationFrame;
    }
    installedLimiter = null;
    nativeRequestAnimationFrame = null;
    nativeCancelAnimationFrame = null;
}

function getEffectiveFrameRate(): VisualizerFrameRate {
    if (activeLimits.size === 0) return 'off';
    let frameRate: ActiveFrameRate = 120;
    for (const limit of activeLimits.values()) frameRate = Math.min(frameRate, limit) as ActiveFrameRate;
    return frameRate;
}
