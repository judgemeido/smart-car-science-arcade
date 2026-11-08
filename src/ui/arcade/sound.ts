/** One short, locally synthesized cue. No audio is created before explicit opt-in. */
export function createArcadeSound() {
  let enabled = false; let active = true; let context: AudioContext | null = null; let disposed = false;
  return {
    setEnabled(value: boolean) { enabled = value; if (!value) void context?.suspend().catch(() => {}); },
    play(kind: 'correct' | 'incorrect' | 'neutral') {
      if (!enabled || !active || disposed || typeof AudioContext === 'undefined') return;
      try {
        context ??= new AudioContext(); void context.resume().catch(() => {});
        const oscillator = context.createOscillator(); const gain = context.createGain(); const time = context.currentTime;
        oscillator.type = 'sine'; oscillator.frequency.value = kind === 'correct' ? 660 : kind === 'incorrect' ? 240 : 420;
        gain.gain.setValueAtTime(0.035, time); gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.13);
        oscillator.connect(gain); gain.connect(context.destination); oscillator.start(time); oscillator.stop(time + 0.14);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      } catch { /* Visual feedback remains the complete cue. */ }
    },
    setActive(value: boolean) { active = value; if (!value) void context?.suspend().catch(() => {}); },
    dispose() { disposed = true; active = false; void context?.close().catch(() => {}); context = null; },
  };
}
