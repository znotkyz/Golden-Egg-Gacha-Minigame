/**
 * Web Audio FX Engine for Golden Egg Gacha
 * Generates rich, instant procedural sound effects without external audio files.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.initAudioContext();
  }

  initAudioContext() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  ensureAudio() {
    if (!this.ctx) this.initAudioContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  // Soft tactile button tap
  playClick() {
    if (this.isMuted) return;
    this.ensureAudio();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.08);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Metallic gold coin jingle
  playCoin() {
    if (this.isMuted) return;
    this.ensureAudio();
    const t = this.ctx.currentTime;

    [987.77, 1318.51].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.06);

      gain.gain.setValueAtTime(0.25, t + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t + i * 0.06);
      osc.stop(t + i * 0.06 + 0.35);
    });
  }

  // Magic egg shuffle whoosh/rattle
  playShuffle() {
    if (this.isMuted) return;
    this.ensureAudio();
    const t = this.ctx.currentTime;
    const duration = 1.1;

    // Fast whipping noise swooshes
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.3);
    filter.frequency.exponentialRampToValueAtTime(800, t + 0.6);
    filter.frequency.exponentialRampToValueAtTime(2200, t + 0.85);
    filter.frequency.exponentialRampToValueAtTime(400, t + duration);
    filter.Q.value = 2.5;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.02, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.15);
    gain.gain.linearRampToValueAtTime(0.25, t + duration * 0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + duration);

    // Rapid magical flutter notes
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1046.50, 783.99, 659.25, 523.25];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const st = t + idx * 0.09;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, st);
      oscGain.gain.setValueAtTime(0.09, st);
      oscGain.gain.exponentialRampToValueAtTime(0.001, st + 0.14);

      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);

      osc.start(st);
      osc.stop(st + 0.14);
    });
  }

  // Egg cracking and burst
  playEggCrack() {
    if (this.isMuted) return;
    this.ensureAudio();
    const t = this.ctx.currentTime;

    // Crack snap
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);

    // Sparkle high chime
    const chime = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chime.type = 'sine';
    chime.frequency.setValueAtTime(1400, t + 0.05);
    chime.frequency.exponentialRampToValueAtTime(2200, t + 0.25);

    chimeGain.gain.setValueAtTime(0.2, t + 0.05);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    chime.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chime.start(t + 0.05);
    chime.stop(t + 0.4);
  }

  // Normal prize reveal fanfare
  playNormalReward() {
    if (this.isMuted) return;
    this.ensureAudio();
    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C

    chords.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = t + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.2, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(st);
      osc.stop(st + 0.5);
    });
  }

  // Epic Grand Prize Fanfare!
  playGrandPrize() {
    if (this.isMuted) return;
    this.ensureAudio();
    const t = this.ctx.currentTime;

    // Victory fanfare notes
    const fanfare = [
      { f: 523.25, d: 0.15, offset: 0 },       // C5
      { f: 523.25, d: 0.15, offset: 0.15 },    // C5
      { f: 523.25, d: 0.15, offset: 0.30 },    // C5
      { f: 659.25, d: 0.45, offset: 0.45 },    // E5
      { f: 783.99, d: 0.35, offset: 0.90 },    // G5
      { f: 1046.50, d: 0.80, offset: 1.25 }    // C6
    ];

    fanfare.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = t + note.offset;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(note.f, st);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 2200;

      gain.gain.setValueAtTime(0.3, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + note.d);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(st);
      osc.stop(st + note.d);
    });
  }

  // Refresh Board shimmer chime
  playRefresh() {
    if (this.isMuted) return;
    this.ensureAudio();
    const t = this.ctx.currentTime;
    const freqs = [784, 988, 1175, 1568, 1976];

    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = t + i * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, st);

      gain.gain.setValueAtTime(0.2, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(st);
      osc.stop(st + 0.4);
    });
  }

  // Insufficient gold buzz
  playError() {
    if (this.isMuted) return;
    this.ensureAudio();
    const t = this.ctx.currentTime;

    [150, 130].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = t + i * 0.12;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, st);

      gain.gain.setValueAtTime(0.25, st);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(st);
      osc.stop(st + 0.1);
    });
  }
}

window.soundEngine = new SoundEngine();
