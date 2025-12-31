import { useRef, useCallback, useEffect } from 'react';

export function useAlarm() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const isPlayingRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  const createAlarmSound = useCallback(() => {
    if (audioContextRef.current) return;

    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }, []);

  const startAlarm = useCallback(() => {
    if (isPlayingRef.current) return;

    createAlarmSound();
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    isPlayingRef.current = true;

    // Create oscillating alarm pattern
    const playTone = (frequency: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.type = 'square';
      oscillator.frequency.value = frequency;

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    };

    // Alarm pattern: alternating high and low frequencies
    let toggle = false;
    playTone(toggle ? 1200 : 800, 0.3);

    intervalRef.current = window.setInterval(() => {
      if (!isPlayingRef.current) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      toggle = !toggle;
      playTone(toggle ? 1200 : 800, 0.3);
    }, 400);
  }, [createAlarmSound]);

  const stopAlarm = useCallback(() => {
    isPlayingRef.current = false;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {
        // Already stopped
      }
      oscillatorRef.current = null;
    }

    if (gainRef.current) {
      gainRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAlarm();
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [stopAlarm]);

  return {
    startAlarm,
    stopAlarm,
    isPlaying: isPlayingRef.current,
  };
}
