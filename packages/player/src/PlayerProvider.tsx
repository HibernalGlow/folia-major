import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type CSSProperties,
    type ReactNode,
} from 'react';
import { useFoliaAudioAnalyzer } from './audioAnalyzer';
import { clamp, currentLyricLine, mergeResolvedTrack, playbackVolume } from './runtime';
import { DEFAULT_FOLIA_DUAL_THEME } from './theme';
import {
    DEFAULT_FOLIA_PLAYER_PREFERENCES,
    type FoliaOutputDevice,
    type FoliaPlayerContextValue,
    type FoliaPlayerHostAdapter,
    type FoliaPlayerPreferences,
    type FoliaResolvedTrack,
    type FoliaTrack,
} from './types';
import type { DualTheme } from '../../../src/types';

// packages/player/src/PlayerProvider.tsx

export interface FoliaPlayerProviderProps {
    children: ReactNode;
    tracks: FoliaTrack[];
    onTracksChange: (tracks: FoliaTrack[]) => void;
    libraryRoots?: string[];
    onLibraryRootsChange?: (roots: string[]) => void;
    preferences?: Partial<FoliaPlayerPreferences>;
    onPreferencesChange?: (preferences: FoliaPlayerPreferences) => void;
    host?: FoliaPlayerHostAdapter;
    theme?: DualTheme;
    isDaylight?: boolean;
}

const FoliaPlayerContext = createContext<FoliaPlayerContextValue | null>(null);

export function FoliaPlayerProvider({
    children,
    tracks,
    onTracksChange,
    libraryRoots = [],
    onLibraryRootsChange,
    preferences: preferenceOverrides,
    onPreferencesChange,
    host = {},
    theme = DEFAULT_FOLIA_DUAL_THEME,
    isDaylight = false,
}: FoliaPlayerProviderProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [activeId, setActiveId] = useState<string | null>(tracks[0]?.id ?? null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resolved, setResolved] = useState<Record<string, FoliaResolvedTrack>>({});
    const [outputDevices, setOutputDevices] = useState<FoliaOutputDevice[]>([]);
    const autoplayRef = useRef(false);
    const releasesRef = useRef(new Map<string, () => void>());
    const analyzer = useFoliaAudioAnalyzer(audioRef);
    const preferences = useMemo<FoliaPlayerPreferences>(() => ({
        ...DEFAULT_FOLIA_PLAYER_PREFERENCES,
        ...preferenceOverrides,
        background: {
            ...DEFAULT_FOLIA_PLAYER_PREFERENCES.background,
            ...preferenceOverrides?.background,
        },
    }), [preferenceOverrides]);
    const effectiveTracks = useMemo(() => tracks.map((track) => mergeResolvedTrack(track, resolved[track.id])), [resolved, tracks]);
    const activeIndex = Math.max(0, effectiveTracks.findIndex((track) => track.id === activeId));
    const activeTrack = effectiveTracks[activeIndex] ?? null;
    const themeStyle = useMemo(() => ({
        '--folia-background': (isDaylight ? theme.light : theme.dark).backgroundColor,
        '--folia-foreground': (isDaylight ? theme.light : theme.dark).primaryColor,
        '--folia-accent': (isDaylight ? theme.light : theme.dark).accentColor,
        '--folia-secondary': (isDaylight ? theme.light : theme.dark).secondaryColor,
        '--folia-font': (isDaylight ? theme.light : theme.dark).fontFamily ?? 'inherit',
        '--folia-font-weight': (isDaylight ? theme.light : theme.dark).fontWeight ?? 400,
    } as CSSProperties), [isDaylight, theme]);
    const attachAudio = useCallback((element: HTMLAudioElement | null) => {
        audioRef.current = element;
        setAudio((current) => current === element ? current : element);
    }, []);

    useEffect(() => {
        if (!tracks.length) setActiveId(null);
        else if (!activeId || !tracks.some((track) => track.id === activeId)) setActiveId(tracks[0]?.id ?? null);
    }, [activeId, tracks]);

    useEffect(() => {
        if (!activeTrack || !host.hydrateTrack || resolved[activeTrack.id]) return;
        const controller = new AbortController();
        setIsLoading(true);
        void host.hydrateTrack(activeTrack, controller.signal).then((value) => {
            if (controller.signal.aborted) {
                value.release?.();
                return;
            }
            if (value.release) releasesRef.current.set(activeTrack.id, value.release);
            setResolved((current) => ({ ...current, [activeTrack.id]: value }));
        }).catch((cause) => {
            if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : String(cause));
        }).finally(() => {
            if (!controller.signal.aborted) setIsLoading(false);
        });
        return () => controller.abort();
    }, [activeTrack, host, resolved]);

    useEffect(() => () => {
        for (const release of releasesRef.current.values()) release();
        releasesRef.current.clear();
    }, []);

    useEffect(() => {
        if (!audio) return;
        audio.volume = playbackVolume(activeTrack, preferences);
    }, [activeTrack, audio, preferences]);

    useEffect(() => {
        if (!audio || !preferences.outputDeviceId) return;
        const sinkAudio = audio as HTMLAudioElement & { setSinkId?: (id: string) => Promise<void> };
        void sinkAudio.setSinkId?.(preferences.outputDeviceId).catch((cause) => {
            setError(cause instanceof Error ? cause.message : String(cause));
        });
    }, [audio, preferences.outputDeviceId]);

    const selectTrack = useCallback((index: number, autoplay = isPlaying) => {
        if (!tracks.length) return;
        const nextIndex = (index % tracks.length + tracks.length) % tracks.length;
        autoplayRef.current = autoplay;
        setCurrentTime(0);
        analyzer.motion.currentTime.set(0);
        setActiveId(tracks[nextIndex]?.id ?? null);
    }, [analyzer.motion.currentTime, isPlaying, tracks]);

    const play = useCallback(async () => {
        if (!audioRef.current || !activeTrack) return;
        setError(null);
        await analyzer.activate().catch(() => undefined);
        await audioRef.current.play();
    }, [activeTrack, analyzer]);
    const pause = useCallback(() => audioRef.current?.pause(), []);
    const next = useCallback(() => selectTrack(activeIndex + 1, isPlaying), [activeIndex, isPlaying, selectTrack]);
    const previous = useCallback(() => selectTrack(activeIndex - 1, isPlaying), [activeIndex, isPlaying, selectTrack]);

    const setPreferences = useCallback((patch: Partial<FoliaPlayerPreferences>) => {
        onPreferencesChange?.({ ...preferences, ...patch });
    }, [onPreferencesChange, preferences]);

    const scanLibrary = useCallback(async () => {
        if (!host.scanLibraryRoots || !libraryRoots.length) return;
        const controller = new AbortController();
        setIsLoading(true);
        setError(null);
        try {
            onTracksChange(await host.scanLibraryRoots(libraryRoots, controller.signal));
        } catch (cause) {
            setError(cause instanceof Error ? cause.message : String(cause));
        } finally {
            setIsLoading(false);
        }
    }, [host, libraryRoots, onTracksChange]);

    const actions = useMemo(() => ({
        play,
        pause,
        toggle: async () => audioRef.current?.paused ? play() : pause(),
        previous,
        next,
        seek: (time: number) => {
            const target = clamp(time, 0, duration || Number.MAX_SAFE_INTEGER);
            if (audioRef.current) audioRef.current.currentTime = target;
            setCurrentTime(target);
            analyzer.motion.currentTime.set(target);
        },
        selectTrack,
        removeTrack: (index: number) => onTracksChange(tracks.filter((_, trackIndex) => trackIndex !== index)),
        shuffle: () => onTracksChange([...tracks].sort(() => Math.random() - 0.5)),
        scanLibrary,
        addLibraryRoot: async (root?: string) => {
            const selected = root?.trim() || await host.pickLibraryRoot?.();
            if (!selected || libraryRoots.includes(selected)) return;
            onLibraryRootsChange?.([...libraryRoots, selected]);
        },
        removeLibraryRoot: (root: string) => onLibraryRootsChange?.(libraryRoots.filter((candidate) => candidate !== root)),
        setPreferences,
        refreshOutputDevices: async () => {
            if (!navigator.mediaDevices?.enumerateDevices) return;
            const devices = await navigator.mediaDevices.enumerateDevices();
            setOutputDevices(devices.filter((device) => device.kind === 'audiooutput').map((device, index) => ({
                id: device.deviceId,
                label: device.label || `Output ${index + 1}`,
            })));
        },
    }), [analyzer.motion.currentTime, duration, host, libraryRoots, next, onLibraryRootsChange, onTracksChange, pause, play, previous, scanLibrary, selectTrack, setPreferences, tracks]);

    const lines = activeTrack?.lyrics?.lines ?? [];
    const lyric = currentLyricLine(lines, currentTime);
    const snapshot = useMemo(() => ({
        activeTrack,
        activeIndex,
        currentTime,
        duration,
        isPlaying,
        isLoading,
        error,
        currentLyric: lyric?.fullText ?? '',
        progress: duration > 0 ? clamp(currentTime / duration, 0, 1) : 0,
    }), [activeIndex, activeTrack, currentTime, duration, error, isLoading, isPlaying, lyric?.fullText]);

    const value = useMemo<FoliaPlayerContextValue>(() => ({
        audio,
        tracks: effectiveTracks,
        libraryRoots,
        preferences,
        theme,
        resolvedTheme: isDaylight ? theme.light : theme.dark,
        isDaylight,
        outputDevices,
        snapshot,
        actions,
        motion: analyzer.motion,
    }), [actions, analyzer.motion, audio, effectiveTracks, isDaylight, libraryRoots, outputDevices, preferences, snapshot, theme]);

    return (
        <FoliaPlayerContext.Provider value={value}>
            <div className="folia-player-root" data-folia-daylight={isDaylight} style={themeStyle}>
                <audio
                ref={attachAudio}
                crossOrigin="anonymous"
                preload="metadata"
                src={activeTrack?.src}
                className="folia-player-audio"
                onCanPlay={() => {
                    if (!autoplayRef.current) return;
                    autoplayRef.current = false;
                    void play().catch((cause) => setError(cause instanceof Error ? cause.message : String(cause)));
                }}
                onDurationChange={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
                onTimeUpdate={(event) => {
                    const time = event.currentTarget.currentTime || 0;
                    setCurrentTime(time);
                    analyzer.motion.currentTime.set(time);
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onError={() => setError('Unable to play this track.')}
                onEnded={() => {
                    if (preferences.loopMode === 'one') {
                        actions.seek(0);
                        void play();
                    } else if (preferences.loopMode === 'all' || activeIndex < tracks.length - 1) {
                        selectTrack(activeIndex + 1, true);
                    } else {
                        setIsPlaying(false);
                    }
                }}
                />
                {children}
            </div>
        </FoliaPlayerContext.Provider>
    );
}

export function useFoliaPlayer(): FoliaPlayerContextValue {
    const context = useContext(FoliaPlayerContext);
    if (!context) throw new Error('Folia player surfaces require FoliaPlayerProvider.');
    return context;
}
