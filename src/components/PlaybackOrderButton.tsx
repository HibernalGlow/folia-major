import React from 'react';
import { Repeat, Repeat1, Repeat2 as RepeatOff, Shuffle } from 'lucide-react';

export type PlaybackOrder = 'off' | 'all' | 'one' | 'random';

interface PlaybackOrderButtonProps {
    loopMode: PlaybackOrder;
    onToggle: () => void;
    className?: string;
    color?: string;
    disabled?: boolean;
    iconSize?: number;
    iconClassName?: string;
    title?: string;
}

const PlaybackOrderButton: React.FC<PlaybackOrderButtonProps> = ({
    loopMode,
    onToggle,
    className = '',
    color,
    disabled = false,
    iconSize = 20,
    iconClassName,
    title,
}) => (
    <button
        type="button"
        data-folia-loop-mode={loopMode}
        onClick={(event) => {
            event.stopPropagation();
            onToggle();
        }}
        disabled={disabled}
        className={className}
        style={color ? { color } : undefined}
        title={title}
    >
        {loopMode === 'off'
            ? <RepeatOff size={iconSize} className={iconClassName} />
            : loopMode === 'one'
                ? <Repeat1 size={iconSize} className={iconClassName} />
                : loopMode === 'random'
                    ? <Shuffle size={iconSize} className={iconClassName} />
                    : <Repeat size={iconSize} className={iconClassName} />}
    </button>
);

export default PlaybackOrderButton;
