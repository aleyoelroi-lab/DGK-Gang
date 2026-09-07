/**
 * Web Audio API synthesizer for Feline Syndicate 3D
 * Provides retro-modern game SFX, cat vocalizations, ambient city noise, and banter effects
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmGain: GainNode | null = null;
  private bgmOscs: OscillatorNode[] = [];
  private bgmPlaying: boolean = false;

  // Custom Recorded Audio Buffers & Data
  private customMeowBuffer: AudioBuffer | null = null;
  private customHissBuffer: AudioBuffer | null = null;
  private customMeowDataUrl: string | null = null;
  private customHissDataUrl: string | null = null;
  private isAudioLoaded: boolean = false;

  constructor() {
    // Attempt loading saved audio upon construct
    if (typeof window !== 'undefined') {
      this.loadSavedRecordings();
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.08, this.ctx.currentTime);
    }
  }

  // --- PERSISTENT CUSTOM RECORDINGS MANAGEMENT ---
  public async loadSavedRecordings() {
    try {
      const savedMeow = localStorage.getItem('feline_custom_meow_audio');
      if (savedMeow) {
        this.customMeowDataUrl = savedMeow;
        await this.decodeCustomAudio('meow', savedMeow);
      }
      const savedHiss = localStorage.getItem('feline_custom_hiss_audio');
      if (savedHiss) {
        this.customHissDataUrl = savedHiss;
        await this.decodeCustomAudio('hiss', savedHiss);
      }
      this.isAudioLoaded = true;
    } catch (err) {
      console.warn('Could not load saved cat recordings:', err);
    }
  }

  private async decodeCustomAudio(type: 'meow' | 'hiss', dataUrl: string) {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const res = await fetch(dataUrl);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer.slice(0));
      if (type === 'meow') {
        this.customMeowBuffer = audioBuffer;
      } else {
        this.customHissBuffer = audioBuffer;
      }
    } catch (e) {
      console.warn(`Failed to decode custom ${type} audio buffer:`, e);
    }
  }

  public async saveCustomRecording(type: 'meow' | 'hiss', dataUrl: string, metadata?: { duration?: number; timestamp?: number }) {
    try {
      if (type === 'meow') {
        this.customMeowDataUrl = dataUrl;
        localStorage.setItem('feline_custom_meow_audio', dataUrl);
        if (metadata) {
          localStorage.setItem('feline_custom_meow_meta', JSON.stringify(metadata));
        }
      } else {
        this.customHissDataUrl = dataUrl;
        localStorage.setItem('feline_custom_hiss_audio', dataUrl);
        if (metadata) {
          localStorage.setItem('feline_custom_hiss_meta', JSON.stringify(metadata));
        }
      }
      await this.decodeCustomAudio(type, dataUrl);
      return true;
    } catch (err) {
      console.error('Error saving custom recording to localStorage:', err);
      return false;
    }
  }

  public clearCustomRecording(type: 'meow' | 'hiss') {
    if (type === 'meow') {
      this.customMeowBuffer = null;
      this.customMeowDataUrl = null;
      localStorage.removeItem('feline_custom_meow_audio');
      localStorage.removeItem('feline_custom_meow_meta');
    } else {
      this.customHissBuffer = null;
      this.customHissDataUrl = null;
      localStorage.removeItem('feline_custom_hiss_audio');
      localStorage.removeItem('feline_custom_hiss_meta');
    }
  }

  public hasCustomMeow(): boolean {
    return Boolean(this.customMeowDataUrl || this.customMeowBuffer);
  }

  public hasCustomHiss(): boolean {
    return Boolean(this.customHissDataUrl || this.customHissBuffer);
  }

  public getCustomAudioMetadata(type: 'meow' | 'hiss') {
    try {
      const raw = localStorage.getItem(`feline_custom_${type}_meta`);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public getCustomAudioDataUrl(type: 'meow' | 'hiss'): string | null {
    return type === 'meow' ? this.customMeowDataUrl : this.customHissDataUrl;
  }

  public playCustomAudioDirect(type: 'meow' | 'hiss', playbackRate: number = 1.0, volume: number = 1.0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const buffer = type === 'meow' ? this.customMeowBuffer : this.customHissBuffer;
    if (buffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = playbackRate;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(Math.max(0.1, Math.min(2.5, volume * 1.2)), this.ctx.currentTime);

        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
        return;
      } catch (err) {
        console.warn('Failed to play custom buffer, falling back to Audio element:', err);
      }
    }

    // Fallback: HTML Audio Element
    const dataUrl = type === 'meow' ? this.customMeowDataUrl : this.customHissDataUrl;
    if (dataUrl) {
      try {
        const audio = new Audio(dataUrl);
        audio.volume = Math.min(1, volume);
        audio.playbackRate = playbackRate;
        audio.play().catch(() => {});
      } catch (e) {
        console.warn('Audio fallback failed:', e);
      }
    }
  }

  // --- CAT VOCALS & MEOWS ---
  public playCatMeow(characterId: string = 'orange_gangster') {
    if (this.isMuted) return;
    
    // If player has saved a real meow recording, prioritize playing the user's real recording!
    if (this.hasCustomMeow()) {
      this.playCustomAudioDirect('meow', 1.0, 1.0);
      return;
    }

    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.0, t);

    if (characterId === 'orange_gangster') {
      // Deeper, smooth mafia meow
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.15);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.45);
      filter.frequency.setValueAtTime(800, t);
    } else if (characterId === 'black_ninja') {
      // Quiet, high-pitch stealth chirp
      osc.frequency.setValueAtTime(550, t);
      osc.frequency.exponentialRampToValueAtTime(850, t + 0.1);
      osc.frequency.exponentialRampToValueAtTime(450, t + 0.3);
      filter.frequency.setValueAtTime(1400, t);
    } else if (characterId === 'sassy_tabby') {
      // Sarcastic rising squeak
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(700, t + 0.2);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.4);
      filter.frequency.setValueAtTime(1100, t);
    } else {
      // Brawler rowdy growl-meow
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(480, t + 0.12);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.5);
      filter.frequency.setValueAtTime(600, t);
    }

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.5);
  }

  // --- CUTE MEOW MEOW (KEY 'E') ---
  public playMeowMeow() {
    if (this.isMuted) return;

    // Prioritize user's real recorded meow!
    if (this.hasCustomMeow()) {
      this.playCustomAudioDirect('meow', 1.0, 1.1);
      return;
    }

    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Two quick rhythmic cute meows
    [0, 0.22].forEach((offset, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'triangle';
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3.5, t + offset);

      const baseFreq = idx === 0 ? 420 : 480;
      osc.frequency.setValueAtTime(baseFreq, t + offset);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.6, t + offset + 0.08);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.85, t + offset + 0.2);

      filter.frequency.setValueAtTime(1100 + idx * 200, t + offset);

      gain.gain.setValueAtTime(0.001, t + offset);
      gain.gain.linearRampToValueAtTime(0.22, t + offset + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t + offset);
      osc.stop(t + offset + 0.22);
    });
  }

  // --- ANGRY CAT HISS / SKKKKK (KEY 'R') ---
  public playAngryHiss() {
    if (this.isMuted) return;

    // Prioritize user's real recorded skkkkk / hiss!
    if (this.hasCustomHiss()) {
      this.playCustomAudioDirect('hiss', 1.0, 1.2);
      return;
    }

    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = 0.65;
    const bufferSize = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Filtered noise with crackle / skkk transients
    for (let i = 0; i < bufferSize; i++) {
      const p = i / bufferSize;
      const crackle = Math.random() < 0.15 ? (Math.random() * 2 - 1) * 1.5 : (Math.random() * 2 - 1);
      data[i] = crackle * (1 - p * 0.7);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(3600, t + 0.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + dur);

    // Also add a low growl undertone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(90, t + dur);
    oscGain.gain.setValueAtTime(0.1, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  // --- FIERCE HISS WITH CLAW BRAG (STUNS ALL HUMANS FOR 10 SECONDS!) ---
  public playFierceHissWithClaws() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Razor Claw Swiping Whooshes (2 rapid slashing sounds)
    for (let swipe = 0; swipe < 2; swipe++) {
      const swipeTime = t + swipe * 0.18;
      const swipeOsc = this.ctx.createOscillator();
      const swipeFilter = this.ctx.createBiquadFilter();
      const swipeGain = this.ctx.createGain();

      swipeOsc.type = 'sawtooth';
      swipeOsc.frequency.setValueAtTime(1400, swipeTime);
      swipeOsc.frequency.exponentialRampToValueAtTime(120, swipeTime + 0.14);

      swipeFilter.type = 'bandpass';
      swipeFilter.frequency.setValueAtTime(2200, swipeTime);
      swipeFilter.Q.setValueAtTime(3.5, swipeTime);

      swipeGain.gain.setValueAtTime(0.01, swipeTime);
      swipeGain.gain.linearRampToValueAtTime(0.4, swipeTime + 0.02);
      swipeGain.gain.exponentialRampToValueAtTime(0.001, swipeTime + 0.16);

      swipeOsc.connect(swipeFilter);
      swipeFilter.connect(swipeGain);
      swipeGain.connect(this.ctx.destination);

      swipeOsc.start(swipeTime);
      swipeOsc.stop(swipeTime + 0.16);
    }

    // 2. Ferocious Aggressive Hiss Noise Burst
    const bufferSize = this.ctx.sampleRate * 1.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const p = i / bufferSize;
      const crackle = Math.random() * 2 - 1;
      data[i] = crackle * (1 - p * 0.5) * (Math.random() < 0.2 ? 1.4 : 0.9);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.frequency.exponentialRampToValueAtTime(4200, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.linearRampToValueAtTime(0.55, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 1.4);

    // 3. Shockwave Ring (Stun frequency)
    const stunOsc = this.ctx.createOscillator();
    const stunGain = this.ctx.createGain();
    stunOsc.type = 'sine';
    stunOsc.frequency.setValueAtTime(880, t);
    stunOsc.frequency.exponentialRampToValueAtTime(220, t + 0.8);
    stunGain.gain.setValueAtTime(0.25, t);
    stunGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    stunOsc.connect(stunGain);
    stunGain.connect(this.ctx.destination);
    stunOsc.start(t);
    stunOsc.stop(t + 0.8);
  }

  // --- INSANE MODE ALARM (10-Minute Timer Expired, Humans Go Insane!) ---
  public playInsaneModeAlarm() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    for (let siren = 0; siren < 3; siren++) {
      const sTime = t + siren * 0.45;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(380, sTime);
      osc.frequency.exponentialRampToValueAtTime(820, sTime + 0.22);
      osc.frequency.exponentialRampToValueAtTime(350, sTime + 0.44);

      gain.gain.setValueAtTime(0.02, sTime);
      gain.gain.linearRampToValueAtTime(0.35, sTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, sTime + 0.44);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(sTime);
      osc.stop(sTime + 0.44);
    }
  }

  // --- BOX ENTERED SAFE CHIME ---
  public playBoxEnteredSafe() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const noteTime = t + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.01, noteTime);
      gain.gain.linearRampToValueAtTime(0.25, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(noteTime);
      osc.stop(noteTime + 0.6);
    });
  }

  // --- INNOCENT CUTE PURR (BLENDING IN) ---
  public playInnocentPurr() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const mainGain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, t);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(24, t); // rapid purr flutter
    lfoGain.gain.setValueAtTime(18, t);

    lfo.connect(osc.frequency);

    mainGain.gain.setValueAtTime(0.01, t);
    mainGain.gain.linearRampToValueAtTime(0.12, t + 0.1);
    mainGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc.connect(mainGain);
    mainGain.connect(this.ctx.destination);

    lfo.start(t);
    osc.start(t);
    lfo.stop(t + 0.85);
    osc.stop(t + 0.85);
  }

  // --- LOCOMOTION SFX ---
  public playJump() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(520, t + 0.18);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playDash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Noise buffer for whoosh
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(2200, t + 0.1);
    filter.frequency.exponentialRampToValueAtTime(150, t + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
  }

  public playClimbScrape() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(450 + Math.random() * 150, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.08);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  public playBounce() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.3);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  // --- BANTER SFX ---
  public playBanterAction(type: string) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (type === 'tickle') {
      // Rapid cute staccato arpeggio
      [600, 800, 1000, 1200, 1500].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);
        g.gain.setValueAtTime(0.12, t + idx * 0.06);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.08);
        osc.connect(g);
        g.connect(this.ctx!.destination);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.09);
      });
    } else if (type === 'dance') {
      // Hip-hop disco synth chord
      const notes = [220, 277.18, 329.63, 440];
      notes.forEach((f) => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, t);
        g.gain.setValueAtTime(0.08, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(g);
        g.connect(this.ctx!.destination);
        osc.start(t);
        osc.stop(t + 0.45);
      });
    } else if (type === 'purr') {
      // Harmonic resonance wave
      const chord = [349.23, 440, 523.25, 659.25];
      chord.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.08);
        g.gain.setValueAtTime(0.1, t + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        osc.connect(g);
        g.connect(this.ctx!.destination);
        osc.start(t + i * 0.08);
        osc.stop(t + 0.85);
      });
    } else if (type === 'play_hide') {
      // Boing pop
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.25);
      g.gain.setValueAtTime(0.18, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    } else {
      // Mischief clatter / slip
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(120, t + 0.25);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    }
  }

  // --- HUMAN ALERTS & OUTCOMES ---
  public playHumanAww() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.linearRampToValueAtTime(380, t + 0.4);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  public playHumanAlarm() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.15);
    osc.frequency.linearRampToValueAtTime(880, t + 0.3);

    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  public playScoreJingle() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);
      g.gain.setValueAtTime(0.12, t + idx * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.2);
      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.25);
    });
  }

  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Gentle retro arcade game-over descending melody (soft, not loud)
    [329.63, 293.66, 261.63, 196.0].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.14);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.95, t + idx * 0.14 + 0.16);

      g.gain.setValueAtTime(0.09, t + idx * 0.14);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.14 + 0.22);

      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(t + idx * 0.14);
      osc.stop(t + idx * 0.14 + 0.25);
    });
  }

  public playKissSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Comical wet pop / kiss smack sound
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.12);

    g.gain.setValueAtTime(0.18, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  public playKissHuntAlert() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Thrilling suspense alert chord
    [440, 554.37, 659.25, 830.61].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.linearRampToValueAtTime(freq * 1.05, t + 0.4);

      g.gain.setValueAtTime(0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(t);
      osc.stop(t + 0.65);
    });
  }

  public playComboStreak(combo: number = 1) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const baseFreq = 440 + Math.min(6, combo) * 80;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.15);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playGlassBreak() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // High sparkly chime + shatter noise
    [1200, 1800, 2400, 3100].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq + Math.random() * 200, t + idx * 0.03);
      g.gain.setValueAtTime(0.12, t + idx * 0.03);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.03 + 0.18);
      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(t + idx * 0.03);
      osc.stop(t + idx * 0.03 + 0.2);
    });
  }

  public playMissionSuccess() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Victory fanfare notes
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);
      g.gain.setValueAtTime(0.15, t + idx * 0.08);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.35);
      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.4);
    });
  }

  public playSurgeAlert() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.linearRampToValueAtTime(440, t + 0.25);
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  public playBustedSiren() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Quiet, gentle retro game over chime (not loud)
    [261.63, 246.94, 220.0, 174.61].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);
      g.gain.setValueAtTime(0.08, t + idx * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.18);

      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.2);
    });
  }

  public startCityAmbient() {
    if (this.bgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.04, this.ctx.currentTime);
      this.bgmGain.connect(this.ctx.destination);

      // Low urban rumble & gentle synth chord
      const bass = this.ctx.createOscillator();
      bass.type = 'triangle';
      bass.frequency.setValueAtTime(55, this.ctx.currentTime); // A1 note
      bass.connect(this.bgmGain);
      bass.start();

      const pad = this.ctx.createOscillator();
      pad.type = 'sine';
      pad.frequency.setValueAtTime(110, this.ctx.currentTime);
      pad.connect(this.bgmGain);
      pad.start();

      this.bgmOscs = [bass, pad];
      this.bgmPlaying = true;
    } catch {
      // Audio context might need user gesture
    }
  }

  public stopCityAmbient() {
    this.bgmOscs.forEach(o => {
      try { o.stop(); o.disconnect(); } catch { /* ignore */ }
    });
    this.bgmOscs = [];
    this.bgmPlaying = false;
  }

  // --- NOTIFICATION SOUNDS ---
  public playThirtySecondsWarning() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Rhythmic 3-tone urgency chime (660Hz -> 880Hz -> 1174Hz with resonant decay)
    const notes = [
      { freq: 659.25, timeOffset: 0.0, dur: 0.18, vol: 0.18 },
      { freq: 880.0, timeOffset: 0.16, dur: 0.2, vol: 0.2 },
      { freq: 1174.66, timeOffset: 0.32, dur: 0.38, vol: 0.24 },
    ];

    notes.forEach((note) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, t + note.timeOffset);
      osc.frequency.exponentialRampToValueAtTime(note.freq * 1.04, t + note.timeOffset + note.dur);

      g.gain.setValueAtTime(note.vol, t + note.timeOffset);
      g.gain.exponentialRampToValueAtTime(0.0001, t + note.timeOffset + note.dur);

      // Harmonic overtone for crisp acoustic penetration
      const harm = this.ctx!.createOscillator();
      const harmG = this.ctx!.createGain();
      harm.type = 'triangle';
      harm.frequency.setValueAtTime(note.freq * 2, t + note.timeOffset);
      harmG.gain.setValueAtTime(note.vol * 0.35, t + note.timeOffset);
      harmG.gain.exponentialRampToValueAtTime(0.0001, t + note.timeOffset + note.dur * 0.7);

      osc.connect(g);
      harm.connect(harmG);
      g.connect(this.ctx!.destination);
      harmG.connect(this.ctx!.destination);

      osc.start(t + note.timeOffset);
      harm.start(t + note.timeOffset);
      osc.stop(t + note.timeOffset + note.dur);
      harm.stop(t + note.timeOffset + note.dur);
    });
  }

  public playNewTaskArrival() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Bright, cheerful 4-note ascending quest arpeggio (C5 -> E5 -> G5 -> C6) with sparkle
    const notes = [
      { freq: 523.25, timeOffset: 0.0, dur: 0.15, vol: 0.15 },
      { freq: 659.25, timeOffset: 0.09, dur: 0.16, vol: 0.17 },
      { freq: 783.99, timeOffset: 0.18, dur: 0.18, vol: 0.19 },
      { freq: 1046.5, timeOffset: 0.27, dur: 0.45, vol: 0.25 },
    ];

    notes.forEach((n) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.freq, t + n.timeOffset);

      g.gain.setValueAtTime(n.vol, t + n.timeOffset);
      g.gain.exponentialRampToValueAtTime(0.0001, t + n.timeOffset + n.dur);

      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(t + n.timeOffset);
      osc.stop(t + n.timeOffset + n.dur);
    });

    // Sparkle layer for magic quest dispatch feel
    [1567.98, 2093.0, 2637.02].forEach((freq, idx) => {
      const sparkle = this.ctx!.createOscillator();
      const sparkleG = this.ctx!.createGain();
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(freq, t + 0.28 + idx * 0.05);
      sparkleG.gain.setValueAtTime(0.09, t + 0.28 + idx * 0.05);
      sparkleG.gain.exponentialRampToValueAtTime(0.0001, t + 0.28 + idx * 0.05 + 0.25);

      sparkle.connect(sparkleG);
      sparkleG.connect(this.ctx!.destination);
      sparkle.start(t + 0.28 + idx * 0.05);
      sparkle.stop(t + 0.28 + idx * 0.05 + 0.3);
    });
  }

  // --- GROSS SLOW-MO WET KISS & SPRINT EFFECTS ---
  public playGrossWetKissSquelch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    // 1. Slow-motion drone / time-dilation dread sweep
    const slowMoOsc = this.ctx.createOscillator();
    const slowMoGain = this.ctx.createGain();
    slowMoOsc.type = 'sawtooth';
    slowMoOsc.frequency.setValueAtTime(140, t);
    slowMoOsc.frequency.exponentialRampToValueAtTime(35, t + 1.2);
    slowMoGain.gain.setValueAtTime(0.18, t);
    slowMoGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + 1.2);

    slowMoOsc.connect(filter);
    filter.connect(slowMoGain);
    slowMoGain.connect(this.ctx.destination);

    slowMoOsc.start(t);
    slowMoOsc.stop(t + 1.25);

    // 2. Wet slobber suction & greasy puckered lips smack ("SCHLUP-MACKKK!")
    [0.12, 0.45, 0.85].forEach((offset, idx) => {
      // Noise burst for wet saliva splatter
      const bufferSize = this.ctx!.sampleRate * 0.22;
      const noiseBuffer = this.ctx!.createBuffer(1, bufferSize, this.ctx!.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }

      const whiteNoise = this.ctx!.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const noiseFilter = this.ctx!.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1400 - idx * 250, t + offset);
      noiseFilter.Q.setValueAtTime(3.5, t + offset);

      const noiseGain = this.ctx!.createGain();
      noiseGain.gain.setValueAtTime(0.32, t + offset);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.2);

      whiteNoise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx!.destination);

      whiteNoise.start(t + offset);
      whiteNoise.stop(t + offset + 0.22);

      // Wet suction pop oscillator (gross fleshy lip release)
      const popOsc = this.ctx!.createOscillator();
      const popGain = this.ctx!.createGain();
      popOsc.type = 'triangle';
      popOsc.frequency.setValueAtTime(160 + idx * 40, t + offset);
      popOsc.frequency.exponentialRampToValueAtTime(650, t + offset + 0.05);
      popOsc.frequency.exponentialRampToValueAtTime(80, t + offset + 0.18);

      popGain.gain.setValueAtTime(0.28, t + offset);
      popGain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.18);

      popOsc.connect(popGain);
      popGain.connect(this.ctx!.destination);

      popOsc.start(t + offset);
      popOsc.stop(t + offset + 0.19);
    });
  }

  public playSprintBurst() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Aerodynamic wind rush burst
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.24);

    g.gain.setValueAtTime(0.12, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  // Floating Skill Pickups Sound (Sparkling Harmonic Arpeggio)
  public playSkillPickup(type: string) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const freqs = type === 'lightning' ? [523.25, 659.25, 783.99, 1046.5, 1318.5] :
                  type === 'spring' ? [440, 554.37, 659.25, 880] :
                  type === 'frog' ? [392, 523.25, 659.25, 783.99] :
                  [349.23, 440, 523.25, 698.46];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, t + idx * 0.04 + 0.15);

      g.gain.setValueAtTime(0.18, t + idx * 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.04 + 0.22);

      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(t + idx * 0.04);
      osc.stop(t + idx * 0.04 + 0.23);
    });
  }

  // Frog Double Jump sound (bouncy ribbit boing)
  public playDoubleJumpRibbit() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.18);

    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  // Comical Trap Dance Disco Beat (5 seconds of funky groove!)
  public playTrapDanceTrigger() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // Funky disco bassline and whistle
    const notes = [220, 277.18, 329.63, 440, 329.63, 277.18, 220, 164.81];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const g = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + idx * 0.22);

      g.gain.setValueAtTime(0.14, t + idx * 0.22);
      g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.22 + 0.18);

      osc.connect(g);
      g.connect(this.ctx!.destination);
      osc.start(t + idx * 0.22);
      osc.stop(t + idx * 0.22 + 0.19);
    });

    // Party whistle slide
    const whistle = this.ctx.createOscillator();
    const wGain = this.ctx.createGain();
    whistle.type = 'sine';
    whistle.frequency.setValueAtTime(800, t);
    whistle.frequency.linearRampToValueAtTime(1600, t + 0.35);
    whistle.frequency.linearRampToValueAtTime(1100, t + 0.7);

    wGain.gain.setValueAtTime(0.12, t);
    wGain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);

    whistle.connect(wGain);
    wGain.connect(this.ctx.destination);
    whistle.start(t);
    whistle.stop(t + 0.75);
  }

  // --- SHORTCUT HELPERS FOR ACTIONS & REWARDS ---
  public playCustomOrSyntheticMeow() {
    this.playMeowMeow();
  }

  public playCustomOrSyntheticHiss() {
    this.playAngryHiss();
  }

  public playCelebration() {
    this.playMissionSuccess();
  }

  public playCredEarned() {
    this.playScoreJingle();
  }
}

export const soundEngine = new SoundEngine();
