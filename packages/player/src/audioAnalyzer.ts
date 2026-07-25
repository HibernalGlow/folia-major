import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react';
import { useMotionValue } from 'framer-motion';
import type { AudioBands } from '../../../src/types';
import type { FoliaMotionRuntime } from './types';

// packages/player/src/audioAnalyzer.ts

interface AnalyzerRuntime {
    activate(): Promise<void>;
    motion: FoliaMotionRuntime;
}

export function useFoliaAudioAnalyzer(audioRef: RefObject<HTMLAudioElement | null>): AnalyzerRuntime {
    const currentTime = useMotionValue(0);
    const audioPower = useMotionValue(0);
    const bass = useMotionValue(0);
    const lowMid = useMotionValue(0);
    const mid = useMotionValue(0);
    const vocal = useMotionValue(0);
    const treble = useMotionValue(0);
    const spectrum = useMotionValue(new Uint8Array(0));
    const contextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const binsRef = useRef<Uint8Array<ArrayBuffer>>(new Uint8Array(0));
    const frameRef = useRef<number | null>(null);

    const audioBands = useMemo<AudioBands>(() => ({ bass, lowMid, mid, vocal, treble, spectrum }), [bass, lowMid, mid, spectrum, treble, vocal]);

    const draw = useCallback(() => {
        const audio = audioRef.current;
        const analyser = analyserRef.current;
        if (!audio || !analyser) return;

        const bins = binsRef.current;
        if (bins.length !== analyser.frequencyBinCount) return;
        analyser.getByteFrequencyData(bins);
        const average = (from: number, to: number) => {
            const end = Math.min(to, bins.length);
            if (end <= from) return 0;
            let total = 0;
            for (let index = from; index < end; index += 1) total += bins[index] ?? 0;
            return total / (end - from);
        };
        const fifth = Math.max(1, Math.floor(bins.length / 5));

        currentTime.set(audio.currentTime || 0);
        audioPower.set(average(0, bins.length));
        bass.set(average(0, fifth));
        lowMid.set(average(fifth, fifth * 2));
        mid.set(average(fifth * 2, fifth * 3));
        vocal.set(average(fifth * 3, fifth * 4));
        treble.set(average(fifth * 4, bins.length));
        frameRef.current = requestAnimationFrame(draw);
    }, [audioPower, audioRef, bass, currentTime, lowMid, mid, spectrum, treble, vocal]);

    const activate = useCallback(async () => {
        const audio = audioRef.current;
        if (!audio || typeof AudioContext === 'undefined') return;
        if (!contextRef.current) {
            const context = new AudioContext();
            const analyser = context.createAnalyser();
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.72;
            binsRef.current = new Uint8Array(analyser.frequencyBinCount);
            spectrum.set(binsRef.current);
            const source = context.createMediaElementSource(audio);
            source.connect(analyser);
            analyser.connect(context.destination);
            contextRef.current = context;
            analyserRef.current = analyser;
        }
        if (contextRef.current.state === 'suspended') await contextRef.current.resume();
        if (frameRef.current === null) frameRef.current = requestAnimationFrame(draw);
    }, [audioRef, draw]);

    useEffect(() => () => {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        void contextRef.current?.close();
        contextRef.current = null;
        analyserRef.current = null;
        binsRef.current = new Uint8Array(0);
    }, []);

    const motion = useMemo<FoliaMotionRuntime>(() => ({ currentTime, audioPower, audioBands }), [audioBands, audioPower, currentTime]);

    return useMemo<AnalyzerRuntime>(() => ({ activate, motion }), [activate, motion]);
}
