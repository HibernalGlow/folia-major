import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Album, Artist, PlayerState, SongResult, UnifiedSong, type LyricData, type Theme } from '../../types';
import { canResolveSongCatalogRef } from '../../services/onlineMusic/catalogRefs';
import { getProviderSongMetadata, getProviderSongPageUrl } from '../../services/onlineMusic/songMetadata';
import PlaybackOrderButton, { type PlaybackOrder } from '../PlaybackOrderButton';
import RemoteLyricOverlay from '../remote/RemoteLyricOverlay';
import RemoteTransportControls from '../remote/RemoteTransportControls';

export interface CoverTabPlayback {
    currentTime: number;
    duration: number;
    playerState: PlayerState;
    lyrics: LyricData | null;
    lyricOffsetMs?: number;
    loopMode: PlaybackOrder;
    hasTrack: boolean;
    controlsDisabled: boolean;
    canGoPrevious: boolean;
    canGoNext: boolean;
    isDaylight: boolean;
    theme: Theme;
    onPrevious: () => void;
    onTogglePlay: () => void;
    onNext: () => void;
    onSeek: (time: number) => void;
    onToggleLoop: () => void;
}

interface CoverTabProps {
    currentSong: SongResult | null;
    onAlbumSelect: (song: SongResult, album: Album) => void;
    onSelectArtist: (song: SongResult, artist: Artist) => void;
    onOpenCurrentLocalAlbum: () => void;
    onOpenCurrentLocalArtist: (entityId?: string) => void;
    onOpenCurrentNavidromeAlbum: () => void;
    onOpenCurrentNavidromeArtist: () => void;
    onCopySongInfoSuccess: () => void;
    playback?: CoverTabPlayback;
}

const CoverTab: React.FC<CoverTabProps> = ({
    currentSong,
    onAlbumSelect,
    onSelectArtist,
    onOpenCurrentLocalAlbum,
    onOpenCurrentLocalArtist,
    onOpenCurrentNavidromeAlbum,
    onOpenCurrentNavidromeArtist,
    onCopySongInfoSuccess,
    playback,
}) => {
    const { t } = useTranslation();
    const isLocalSong = Boolean(currentSong && (((currentSong as any).isLocal === true) || (currentSong as any).localRef?.songId));
    const isNavidromeSong = Boolean(currentSong && (currentSong as any).isNavidrome === true);
    const isStageSong = Boolean(currentSong && (currentSong as any).isStage === true);
    const songMetadata = currentSong ? getProviderSongMetadata(currentSong) : null;
    const displayArtists = songMetadata?.artists || [];
    const displayAlbumName = songMetadata?.album?.name || '';
    const canOpenAlbum = Boolean(currentSong && !isStageSong && (
        isLocalSong
        || isNavidromeSong
        || canResolveSongCatalogRef(currentSong as UnifiedSong, 'album', currentSong.album)
    ));
    const displayArtistNames = displayArtists.map((artist) => artist.name).join(', ');
    const copyTitleLine = currentSong
        ? `${currentSong.name || ''} - ${displayArtistNames} - ${displayAlbumName}`
        : '';
    const songPageUrl = getProviderSongPageUrl(currentSong);
    const copyPayload = copyTitleLine
        ? [copyTitleLine, songPageUrl || ''].filter(Boolean).join('\n')
        : '';
    const canCopySongInfo = Boolean(copyPayload);

    const copyText = async (text: string) => {
        if (navigator.clipboard?.writeText && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
            return;
        }

        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        document.body.appendChild(textarea);
        textarea.select();

        try {
            document.execCommand('copy');
        } finally {
            document.body.removeChild(textarea);
        }
    };

    const openProviderSongPage = () => {
        if (!songPageUrl) {
            return;
        }

        const openSongPage = window.electron?.openExternalUrl
            ? window.electron.openExternalUrl(songPageUrl)
            : Promise.resolve(Boolean(window.open(songPageUrl, '_blank', 'noopener,noreferrer')));

        void openSongPage.catch((error) => {
            console.error('Failed to open provider song page:', error);
        });
    };

    // Normal click copies song info; Ctrl+click opens the provider song page when available.
    const handleSongTitleClick = (event: React.MouseEvent<HTMLHeadingElement>) => {
        if (event.ctrlKey && songPageUrl) {
            openProviderSongPage();
            return;
        }

        if (!copyPayload) {
            return;
        }

        void copyText(copyPayload)
            .then(() => {
                onCopySongInfoSuccess();
            })
            .catch((error) => {
                console.error('Failed to copy current song info:', error);
            });
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex flex-col items-center space-y-4 text-center"
            data-folia-cover-tab
        >
            <div className="space-y-1 relative w-full">
                <div className="flex items-start justify-center gap-2">
                    <h2
                        className={canCopySongInfo
                            ? 'text-2xl font-bold line-clamp-2 cursor-pointer hover:opacity-80 transition-opacity'
                            : 'text-2xl font-bold line-clamp-2'}
                        onClick={handleSongTitleClick}
                    >
                        {currentSong?.name || t('ui.noTrack')}
                    </h2>
                </div>
                <div className="text-sm opacity-60 space-y-1">
                    <div className="font-medium">
                        {displayArtists.map((a, i) => {
                            const canOpenArtist = Boolean(currentSong && !isStageSong && (
                                isLocalSong
                                || isNavidromeSong
                                || canResolveSongCatalogRef(currentSong as UnifiedSong, 'artist', a)
                            ));
                            return (
                            <React.Fragment key={`${a.entityId || a.id}-${i}`}>
                                {i > 0 && ", "}
                                <span
                                    className={canOpenArtist ? 'cursor-pointer hover:underline hover:opacity-100 transition-opacity' : ''}
                                    onClick={() => {
                                        if (!canOpenArtist) {
                                            return;
                                        }
                                        if (isLocalSong) {
                                            onOpenCurrentLocalArtist(a.entityId);
                                            return;
                                        }
                                        if (isNavidromeSong) {
                                            onOpenCurrentNavidromeArtist();
                                            return;
                                        }
                                        if (currentSong) onSelectArtist(currentSong, a);
                                    }}
                                >
                                    {a.name}
                                </span>
                            </React.Fragment>
                            );
                        })}
                    </div>
                    <div
                        className={canOpenAlbum ? 'opacity-60 cursor-pointer hover:opacity-100 hover:underline transition-all' : 'opacity-60'}
                        onClick={() => {
                            if (!canOpenAlbum) {
                                return;
                            }
                            if (isLocalSong) {
                                onOpenCurrentLocalAlbum();
                                return;
                            }
                            if (isNavidromeSong) {
                                onOpenCurrentNavidromeAlbum();
                                return;
                            }
                            const album = currentSong?.album;
                            if (currentSong && album) onAlbumSelect(currentSong, album);
                        }}
                    >
                        {displayAlbumName}
                    </div>
                </div>
            </div>
            {playback && (
                <div className="w-full space-y-2 pt-1 text-left" data-folia-cover-playback>
                    <RemoteTransportControls
                        currentTime={playback.currentTime}
                        duration={playback.duration}
                        playerState={playback.playerState}
                        hasTrack={playback.hasTrack}
                        controlsDisabled={playback.controlsDisabled}
                        canGoPrevious={playback.canGoPrevious}
                        canGoNext={playback.canGoNext}
                        isDaylight={playback.isDaylight}
                        onPrevious={playback.onPrevious}
                        onTogglePlay={playback.onTogglePlay}
                        onNext={playback.onNext}
                        onSeek={playback.onSeek}
                        controlColors={{
                            primaryBackground: playback.theme.primaryColor,
                            primaryForeground: playback.theme.backgroundColor,
                            secondaryBackground: playback.isDaylight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.10)',
                            secondaryForeground: playback.theme.primaryColor,
                        }}
                        extraActions={(
                            <PlaybackOrderButton
                                loopMode={playback.loopMode}
                                onToggle={playback.onToggleLoop}
                                disabled={playback.controlsDisabled}
                                iconSize={16}
                                title={t('commands.items.playback-loop.title')}
                                color={playback.theme.primaryColor}
                                className={`flex h-8 w-8 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-35 ${playback.loopMode !== 'off'
                                    ? (playback.isDaylight ? 'bg-black/10' : 'bg-white/20')
                                    : (playback.isDaylight ? 'bg-black/5 opacity-50 hover:bg-black/10 hover:opacity-100' : 'bg-white/5 opacity-50 hover:bg-white/10 hover:opacity-100')}`}
                            />
                        )}
                    />
                    <div className="relative h-14 min-w-0 overflow-hidden" data-folia-cover-lyrics>
                        <RemoteLyricOverlay
                            lyrics={playback.lyrics}
                            currentTime={playback.currentTime - (playback.lyricOffsetMs ?? 0) / 1000}
                            duration={playback.duration}
                            playerState={playback.playerState}
                            hasTrack={playback.hasTrack}
                            visible
                            baseColor={playback.theme.secondaryColor}
                            activeColor={playback.theme.primaryColor}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default CoverTab;
