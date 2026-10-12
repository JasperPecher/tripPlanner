// Synthesized Web Audio API sound effects for Las Vegas Slot Machine
// Zero external audio files required - works offline, instant, iOS-friendly.

class VegasAudioEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const storedMute = localStorage.getItem("vegas_slot_muted");
      this.muted = storedMute === "true";
    }
  }

  private initContext() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    this.isUnlocked = true;
  }

  public isMute(): boolean {
    return this.muted;
  }

  public setMute(mute: boolean) {
    this.muted = mute;
    if (typeof window !== "undefined") {
      localStorage.setItem("vegas_slot_muted", mute ? "true" : "false");
    }
  }

  public toggleMute(): boolean {
    this.setMute(!this.muted);
    return this.muted;
  }

  // Mechanical lever pull & spring latch
  public playLever() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.15);

    // Spring snap
    setTimeout(() => {
      if (this.muted || !this.ctx) return;
      const t2 = this.ctx.currentTime;
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(320, t2);
      osc2.frequency.exponentialRampToValueAtTime(110, t2 + 0.08);

      gain2.gain.setValueAtTime(0.2, t2);
      gain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.08);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(t2);
      osc2.stop(t2 + 0.09);
    }, 150);
  }

  // Rhythmic mechanical ratchet tick while reels cycle
  public playTick(pitchMultiplier = 1) {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(450 * pitchMultiplier, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.035);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.04);
  }

  // Heavy mechanical reel lock latch sound
  public playReelLock(reelIndex: number = 0) {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const baseFreq = [180, 240, 320][reelIndex] || 220;
    osc.type = "square";
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  // Vegas Jackpot / Winner celebration fanfare!
  public playFanfare() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [
      { f: 523.25, time: 0.0, dur: 0.12 }, // C5
      { f: 659.25, time: 0.12, dur: 0.12 }, // E5
      { f: 783.99, time: 0.24, dur: 0.14 }, // G5
      { f: 1046.5, time: 0.38, dur: 0.35 }, // C6
      { f: 880.0, time: 0.75, dur: 0.15 }, // A5
      { f: 1046.5, time: 0.9, dur: 0.15 }, // C6
      { f: 1318.51, time: 1.05, dur: 0.6 }, // E6 (jackpot crescendo)
    ];

    notes.forEach((n) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + n.time;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(n.f, t);

      // Bell overtone shimmer
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + n.dur);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + n.dur + 0.05);
    });

    // Cascade of silver coins dropping into tray
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        this.playCoinClink();
      }, 300 + i * 110);
    }
  }

  // Silver coin clink in metal tray
  public playCoinClink() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const freq = 1800 + Math.random() * 900;
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.1);
  }
}

export const vegasAudio = new VegasAudioEngine();
