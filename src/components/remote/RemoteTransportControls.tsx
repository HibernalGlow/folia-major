import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PlayerState } from '../../types';

export interface RemoteControlColors {
    primaryBackground: string;
    primaryForeground: string;
    secondaryBackground: string;
    secondaryForeground: string;
}

interface RemoteTransportControlsProps {
    currentTime: number;
    duration: number;
    playerState: PlayerState;
    hasTrack: boolean;
    controlsDisabled: boolean;
    canGoPrevious: boolean;
    canGoNext: boolean;
    isDaylight: boolean;
    onPrevious: () => void;
    onTogglePlay: () => void;
    onNext: () => void;
    onSeek: (time: number) => void;
    controlColors?: RemoteControlColors;
    extraActions?: ReactNode;
    className?: string;
}

interface RemoteTransportButtonsProps {
    playerState: PlayerState;
    disabled: boolean;
    canGoPrevious: boolean;
    canGoNext: boolean;
    isDaylight: boolean;
    onPrevious: () => void;
    onTogglePlay: () => void;
    onNext: () => void;
    controlColors?: RemoteControlColors;
}

export const RemoteTransportButtons: React.FC<RemoteTransportButtonsProps> = ({
    playerState,
    disabled,
    canGoPrevious,
    canGoNext,
    isDaylight,
    onPrevious,
    onTogglePlay,
    onNext,
    controlColors,
}) => {
    const { t } = useTranslation();
    const isPlaying = playerState === PlayerState.PLAYING;

    return (
        <div className="flex items-center gap-1.5">
            <button
                type="button"
                data-folia-remote-control="previous"
                title={t('remote.previous')}
                disabled={disabled || !canGoPrevious}
                onClick={onPrevious}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 ${controlColors
                    ? 'hover:brightness-110'
                    : isDaylight
                        ? 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                style={controlColors ? {
                    backgroundColor: controlColors.secondaryBackground,
                    color: controlColors.secondaryForeground,
                } : undefined}
            >
                <SkipBack size={16} strokeWidth={2} />
            </button>
            <button
                type="button"
                data-folia-remote-control="play-pause"
                title={isPlaying ? t('remote.pause') : t('remote.play')}
                disabled={disabled}
                onClick={onTogglePlay}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 ${controlColors
                    ? 'hover:brightness-105'
                    : isDaylight
                        ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                        : 'bg-white text-zinc-950 hover:bg-white/90'}`}
                style={controlColors ? {
                    backgroundColor: controlColors.primaryBackground,
                    color: controlColors.primaryForeground,
                } : undefined}
            >
                {isPlaying
                    ? <Pause size={16} fill="currentColor" />
                    : <Play size={16} className="translate-x-0.5" fill="currentColor" />}
            </button>
            <button
                type="button"
                data-folia-remote-control="next"
                title={t('remote.next')}
                disabled={disabled || !canGoNext}
                onClick={onNext}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 ${controlColors
                    ? 'hover:brightness-110'
                    : isDaylight
                        ? 'bg-black/5 text-black/60 hover:bg-black/10 hover:text-black'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'}`}
                style={controlColors ? {
                    backgroundColor: controlColors.secondaryBackground,
                    color: controlColors.secondaryForeground,
                } : undefined}
            >
                <SkipForward size={16} strokeWidth={2} />
            </button>
        </div>
    );
};

interface RemoteSeekBarProps {
    value: number;
    duration: number;
    disabled: boolean;
    isDaylight: boolean;
    onChange: (time: number) => void;
    onPointerDown: () => void;
    onPointerCancel: () => void;
    onPointerUp: () => void;
    onCommitFromKeyboard: () => void;
}

export const RemoteSeekBar: React.FC<RemoteSeekBarProps> = ({
    value,
    duration,
    disabled,
    isDaylight,
    onChange,
    onPointerDown,
    onPointerCancel,
    onPointerUp,
    onCommitFromKeyboard,
}) => {
    const progressPercent = duration > 0 ? (value / duration) * 100 : 0;

    return (
        <div className="w-full" data-folia-remote-seek>
            <div className="relative flex h-5 w-full items-center" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <div className={`h-[3px] w-full overflow-hidden rounded-full transition-colors ${isDaylight ? 'bg-black/10' : 'bg-white/15'}`}>
                    <div
                        className={`h-full rounded-full transition-all duration-75 ${isDaylight ? 'bg-[#1c1917]' : 'bg-white'}`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
                <input
                    aria-label="Seek"
                    type="range"
                    min={0}
                    max={duration || 1}
                    step={0.1}
                    value={value}
                    disabled={disabled || duration <= 0}
                    onChange={(event) => onChange(Number(event.currentTarget.value))}
                    onPointerDown={onPointerDown}
                    onPointerCancel={onPointerCancel}
                    onPointerUp={onPointerUp}
                    onKeyUp={(event) => {
                        if (event.key === 'Enter') {
                            onCommitFromKeyboard();
                        }
                    }}
                    className="absolute inset-x-0 z-10 h-5 w-full cursor-pointer appearance-none bg-transparent opacity-0 disabled:cursor-not-allowed [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-transparent"
                />
            </div>
        </div>
    );
};

const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) {
        return '0:00';
    }

    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const rest = totalSeconds % 60;
    return `${minutes}:${String(rest).padStart(2, '0')}`;
};

const RemoteTransportControls: React.FC<RemoteTransportControlsProps> = ({
    currentTime,
    duration,
    playerState,
    hasTrack,
    controlsDisabled,
    canGoPrevious,
    canGoNext,
    isDaylight,
    onPrevious,
    onTogglePlay,
    onNext,
    onSeek,
    controlColors,
    extraActions,
    className = '',
}) => {
    const [pendingSeek, setPendingSeek] = useState<number | null>(null);
    const pendingSeekRef = useRef<number | null>(null);
    const isDraggingRef = useRef(false);
    const lastSeekTimeRef = useRef(0);
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const displayedTime = pendingSeek ?? currentTime;
    const progressValue = safeDuration > 0 ? Math.max(0, Math.min(displayedTime, safeDuration)) : 0;
    const primaryDisabled = controlsDisabled || !hasTrack;

    useEffect(() => {
        if (isDraggingRef.current || Date.now() - lastSeekTimeRef.current <= 800) {
            return;
        }
        pendingSeekRef.current = null;
        setPendingSeek(null);
    }, [currentTime]);

    const commitPendingSeek = () => {
        isDraggingRef.current = false;
        const nextTime = pendingSeekRef.current;
        if (nextTime === null) {
            return;
        }
        lastSeekTimeRef.current = Date.now();
        onSeek(nextTime);
    };

    return (
        <motion.div
            key="playback-panel"
            data-folia-remote-transport
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className={`flex h-[70px] w-full flex-col justify-between ${className}`.trim()}
        >
            <RemoteSeekBar
                value={progressValue}
                duration={safeDuration}
                disabled={primaryDisabled}
                isDaylight={isDaylight}
                onChange={(nextTime) => {
                    pendingSeekRef.current = nextTime;
                    setPendingSeek(nextTime);
                }}
                onPointerDown={() => {
                    isDraggingRef.current = true;
                }}
                onPointerCancel={() => {
                    isDraggingRef.current = false;
                }}
                onPointerUp={commitPendingSeek}
                onCommitFromKeyboard={commitPendingSeek}
            />

            <div className="relative min-h-0 w-full flex-1">
                <motion.div
                    key="controls-view"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute inset-0 flex flex-col justify-between"
                >
                    <div className="flex justify-between text-[10px] tabular-nums transition-colors" style={{ color: isDaylight ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.3)' }}>
                        <span>{formatTime(progressValue)}</span>
                        <span>{formatTime(safeDuration)}</span>
                    </div>

                    <div className="flex w-full items-center justify-between">
                        <RemoteTransportButtons
                            playerState={playerState}
                            disabled={primaryDisabled}
                            canGoPrevious={canGoPrevious}
                            canGoNext={canGoNext}
                            isDaylight={isDaylight}
                            onPrevious={onPrevious}
                            onTogglePlay={onTogglePlay}
                            onNext={onNext}
                            controlColors={controlColors}
                        />
                        {extraActions}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default RemoteTransportControls;
