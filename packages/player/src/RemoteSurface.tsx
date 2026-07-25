import { useCallback, useMemo } from 'react';
import RemoteControlApp from '../../../src/components/remote/RemoteControlApp';
import { PlayerState } from '../../../src/types';
import type { RemoteControlCommand, RemoteControlSnapshot } from '../../../src/types/remoteControl';
import { idleVideoExportState } from '../../../src/types/videoExport';
import { FoliaI18nScope } from './FoliaI18nScope';
import { useFoliaPlayer } from './PlayerProvider';

export interface FoliaRemoteSurfaceProps {
    className?: string;
    compact?: boolean;
    idleLyricsDelayMs?: number;
}

/** Folia's original Remote Control card, driven by the host player context. */
export function FoliaRemoteSurface({
    className = '',
    compact = false,
    idleLyricsDelayMs = 800,
}: FoliaRemoteSurfaceProps) {
    const { actions, isDaylight, resolvedTheme, snapshot, tracks } = useFoliaPlayer();
    const track = snapshot.activeTrack;
    const remoteSnapshot = useMemo<RemoteControlSnapshot>(() => ({
        hasTrack: Boolean(track),
        title: track?.title ?? null,
        artist: track?.artist ?? track?.album ?? null,
        coverUrl: track?.coverUrl ?? null,
        currentTime: snapshot.currentTime,
        duration: snapshot.duration,
        playerState: snapshot.isPlaying
            ? PlayerState.PLAYING
            : track ? PlayerState.PAUSED : PlayerState.IDLE,
        canGoPrevious: tracks.length > 1,
        canGoNext: tracks.length > 1,
        controlsDisabled: !track || snapshot.isLoading,
        isStageActive: false,
        transparentModeEnabled: false,
        mainWindowClickThroughEnabled: false,
        mainWindowAlwaysOnTop: false,
        mainWindowBorderVisible: true,
        playerChromeHidden: false,
        playerChromeVisibilityMode: 'auto-hide',
        exportState: idleVideoExportState(),
        isDaylight,
        lyrics: track?.lyrics ?? null,
        lyricOffsetMs: 0,
        isLiked: false,
        updatedAt: snapshot.currentTime,
    }), [isDaylight, snapshot.currentTime, snapshot.duration, snapshot.isLoading, snapshot.isPlaying, track, tracks.length]);
    const handleCommand = useCallback((command: RemoteControlCommand) => {
        switch (command.type) {
            case 'play-pause':
                void actions.toggle();
                break;
            case 'play':
                void actions.play();
                break;
            case 'pause':
                actions.pause();
                break;
            case 'previous':
                actions.previous();
                break;
            case 'next':
                actions.next();
                break;
            case 'seek':
                actions.seek(command.time);
                break;
        }
    }, [actions]);

    return (
        <section
            className={`folia-upstream-remote relative min-h-0 w-full overflow-hidden ${compact ? 'is-compact' : ''} ${className}`.trim()}
            data-folia-surface="remote"
            data-folia-source="upstream-remote-control"
        >
            <FoliaI18nScope>
                <RemoteControlApp
                    embedded
                    className="min-h-[146px]"
                    snapshot={remoteSnapshot}
                    onCommand={handleCommand}
                    idleLyricsDelayMs={idleLyricsDelayMs}
                    theme={resolvedTheme}
                />
            </FoliaI18nScope>
        </section>
    );
}
