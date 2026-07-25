import { useEffect, useRef, useState } from 'react';
import { ListMusic, Maximize2, PictureInPicture2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ProgressControl, TransportControls, IconButton } from './controls';
import { useFoliaPlayer } from './PlayerProvider';

// packages/player/src/BarSurface.tsx

export interface FoliaBarSurfaceProps {
    className?: string;
    collapseDelayMs?: number;
    onOpenPanel?: () => void;
    onOpenFloating?: () => void;
    onOpenFullscreen?: () => void;
}

export function FoliaBarSurface({
    className = '',
    collapseDelayMs = 300,
    onOpenPanel,
    onOpenFloating,
    onOpenFullscreen,
}: FoliaBarSurfaceProps) {
    const { t } = useTranslation('folia-player');
    const { snapshot } = useFoliaPlayer();
    const [expanded, setExpanded] = useState(false);
    const timerRef = useRef<number | null>(null);

    useEffect(() => () => {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    }, []);

    function expand() {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        setExpanded(true);
    }

    function scheduleCollapse() {
        if (timerRef.current !== null) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => setExpanded(false), collapseDelayMs);
    }

    const track = snapshot.activeTrack;
    return (
        <section
            className={`folia-bar ${expanded ? 'is-expanded' : 'is-collapsed'} ${className}`.trim()}
            data-folia-surface="bar"
            onPointerEnter={expand}
            onPointerMove={expand}
            onPointerLeave={scheduleCollapse}
        >
            <div className="folia-bar__main">
                <TransportControls compact={!expanded} artworkPlayButton />
                <div className="folia-track-copy">
                    <strong>{track?.title || t('ui.noTrack')}</strong>
                    <span>{snapshot.currentLyric || track?.artist || t('playerPackage.localPlayer')}</span>
                </div>
                <div className="folia-bar__actions">
                    {onOpenPanel ? <IconButton label={t('playerPackage.openPlayer')} onClick={onOpenPanel}><ListMusic /></IconButton> : null}
                    {onOpenFloating ? <IconButton label={t('playerPackage.floatingPlayer')} onClick={onOpenFloating}><PictureInPicture2 /></IconButton> : null}
                    {onOpenFullscreen ? <IconButton label={t('playerPackage.fullscreenLyrics')} onClick={onOpenFullscreen}><Maximize2 /></IconButton> : null}
                </div>
            </div>
            <ProgressControl showTimes={expanded} />
        </section>
    );
}
