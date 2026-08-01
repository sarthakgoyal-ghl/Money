/**
 * Soft completion chime — Cursor-like “done” cue: brief major arpeggio,
 * sine tones, low volume. No asset file; synthesised on demand.
 */

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedContext || sharedContext.state === "closed") {
    sharedContext = new AudioCtx();
  }
  return sharedContext;
}

/** Peak gain — keep soft so it never competes with the UI or startles. */
const PEAK = 0.045;

/**
 * Plays a short ascending C–E–G chime. Safe to call repeatedly; overlaps are
 * fine at this volume. Resolves quietly if Audio is unavailable or blocked.
 */
export async function playSuccessChime(): Promise<void> {
  try {
    const ctx = getContext();
    if (!ctx) return;

    if (ctx.state === "suspended") {
      await ctx.resume();
    }

    const now = ctx.currentTime;
    // C5 · E5 · G5 — bright but soft major triad, ~Cursor completion cadence.
    const notes = [523.25, 659.25, 783.99];
    const step = 0.07;

    notes.forEach((frequency, index) => {
      const t0 = now + index * step;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, t0);

      // Tiny second harmonic for body without harshness.
      const partial = ctx.createOscillator();
      const partialGain = ctx.createGain();
      partial.type = "sine";
      partial.frequency.setValueAtTime(frequency * 2, t0);
      partialGain.gain.setValueAtTime(PEAK * 0.12, t0);

      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(PEAK, t0 + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.52);

      partialGain.gain.setValueAtTime(0, t0);
      partialGain.gain.linearRampToValueAtTime(PEAK * 0.1, t0 + 0.02);
      partialGain.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      partial.connect(partialGain);
      partialGain.connect(ctx.destination);

      osc.start(t0);
      osc.stop(t0 + 0.55);
      partial.start(t0);
      partial.stop(t0 + 0.4);
    });
  } catch {
    // Autoplay policy or missing Audio — celebration still works visually.
  }
}
