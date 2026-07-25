import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useFoliaPlayer } from './PlayerProvider';

// packages/player/src/controls.tsx

export function ArtworkProgressButton({ compact = false }: { compact?: boolean }) {
    const { t } = useTranslation('folia-player');
    const { actions, snapshot } = useFoliaPlayer();
    const track = snapshot.activeTrack;
    const progress = `${Math.round(snapshot.progress * 360)}deg`;
    const label = snapshot.isPlaying ? t('remote.pause') : t('remote.play');

    return (
        <button
            type="button"
            className={compact ? 'folia-artwork-button is-compact' : 'folia-artwork-button'}
            style={{ '--folia-progress-angle': progress } as React.CSSProperties}
            onClick={() => void actions.toggle()}
            aria-label={label}
            title={label}
        >
            <span className="folia-artwork-button__image">
                {track?.coverUrl
                    ? <img src={track.coverUrl} alt="" draggable={false} />
                    : <span className="folia-artwork-button__fallback">F</span>}
            </span>
            <span className="folia-artwork-button__overlay">
                {snapshot.isPlaying ? <Pause /> : <Play className="folia-play-glyph" />}
            </span>
        </button>
    );
}

export function TransportControls({ compact = false, artworkPlayButton = false }: { compact?: boolean; artworkPlayButton?: boolean }) {
    const { t } = useTranslation('folia-player');
    const { actions, snapshot } = useFoliaPlayer();
    return (
        <div className={compact ? 'folia-transport is-compact' : 'folia-transport'}>
            <IconButton label={t('remote.previous')} onClick={actions.previous}><SkipBack /></IconButton>
            {artworkPlayButton ? <ArtworkProgressButton compact={compact} /> : (
                <IconButton className="is-primary" label={snapshot.isPlaying ? t('remote.pause') : t('remote.play')} onClick={() => void actions.toggle()}>
                    {snapshot.isPlaying ? <Pause /> : <Play className="folia-play-glyph" />}
                </IconButton>
            )}
            <IconButton label={t('remote.next')} onClick={actions.next}><SkipForward /></IconButton>
            <span className="folia-transport__state" aria-live="polite">
                {snapshot.isLoading ? t('status.loadingSong') : null}
            </span>
        </div>
    );
}

export function ProgressControl({ showTimes = true }: { showTimes?: boolean }) {
    const { t } = useTranslation('folia-player');
    const { actions, snapshot } = useFoliaPlayer();
    const maximum = snapshot.duration > 0 ? snapshot.duration : 1;
    return (
        <div className="folia-progress-control">
            {showTimes ? <span>{formatTime(snapshot.currentTime)}</span> : null}
            <input
                type="range"
                min={0}
                max={maximum}
                step={0.1}
                value={Math.min(snapshot.currentTime, maximum)}
                disabled={!snapshot.activeTrack || snapshot.duration <= 0}
                onChange={(event) => actions.seek(Number(event.currentTarget.value))}
                aria-label={t('playerPackage.playbackProgress')}
                style={{ '--folia-progress': `${snapshot.progress * 100}%` } as CSSProperties}
            />
            {showTimes ? <span>{formatTime(snapshot.duration)}</span> : null}
        </div>
    );
}

export function IconButton({ label, onClick, children, className = '' }: { label: string; onClick(): void; children: ReactNode; className?: string }) {
    return (
        <button type="button" className={`folia-icon-button ${className}`.trim()} title={label} aria-label={label} onClick={onClick}>
            {children}
        </button>
    );
}

export function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const total = Math.floor(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
