import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProgressControl, TransportControls } from './controls';
import { useFoliaPlayer } from './PlayerProvider';

// packages/player/src/RemoteSurface.tsx

export interface FoliaRemoteSurfaceProps {
    className?: string;
    compact?: boolean;
    idleLyricsDelayMs?: number;
}

export function FoliaRemoteSurface({ className = '', compact = false, idleLyricsDelayMs = 800 }: FoliaRemoteSurfaceProps) {
    const { t } = useTranslation('folia-player');
    const { snapshot } = useFoliaPlayer();
    const [controlsVisible, setControlsVisible] = useState(false);
    const timerRef = useRef<number | null>(null);
    const track = snapshot.activeTrack;

    useEffect(() => () => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    }, []);

    function revealControls() {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        setControlsVisible(true);
    }

    function settleToLyrics() {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setControlsVisible(false), idleLyricsDelayMs);
    }

    return (
        <section
            className={`folia-remote ${compact ? 'is-compact' : ''} ${className}`.trim()}
            data-folia-surface="remote"
            onPointerEnter={revealControls}
            onPointerMove={revealControls}
            onPointerLeave={settleToLyrics}
        >
            <div className="folia-remote__cover">
                {track?.coverUrl ? <img src={track.coverUrl} alt="" draggable={false} /> : <span>FOLIA</span>}
            </div>
            <div className="folia-remote__body">
                <div className="folia-track-copy">
                    <strong>{track?.title || t('ui.noTrack')}</strong>
                    <span>{track?.artist || track?.album || t('playerPackage.localPlayer')}</span>
                </div>
                <div className="folia-remote__swap" data-controls-visible={controlsVisible}>
                    <p className="folia-remote__lyric">{snapshot.currentLyric || track?.album || ' '}</p>
                    <div className="folia-remote__controls">
                        <TransportControls compact />
                    </div>
                </div>
                <ProgressControl showTimes={!compact} />
            </div>
        </section>
    );
}
