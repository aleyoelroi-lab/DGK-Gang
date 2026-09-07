/**
 * SpeechMeowDetector
 * Listens to user's microphone for spoken "meow" (using Web Speech API + Audio Pitch Fallback).
 * When "meow" is detected, triggers a sonic wave that charms and drastically slows down humans!
 */

type MeowCallback = (transcript: string) => void;

class SpeechMeowDetector {
  private recognition: any = null;
  private isRunning: boolean = false;
  private onMeowCallbacks: Set<MeowCallback> = new Set();
  private onHissCallbacks: Set<MeowCallback> = new Set();
  private lastTriggerTime: number = 0;
  private lastHissTime: number = 0;
  public lastTranscript: string = '';
  public isSupported: boolean = false;

  // Audio frequency fallback
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private pitchInterval: any = null;

  constructor() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      this.isSupported = true;
      try {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript.toLowerCase();
          }

          this.lastTranscript = currentTranscript.trim();

          // Check if transcript contains hiss variants (brag claws & stun humans)
          const hissRegex = /\b(hiss|hisss|hissss|hsss|hss|hissing|claws|claw|brag)\b/i;
          if (hissRegex.test(currentTranscript)) {
            this.handleHissDetected(currentTranscript);
            return;
          }

          // Check if transcript contains meow variants
          const meowRegex = /\b(meow|meoww|miao|miaow|mew|nyan|purr|psps|mrow|maow)\b/i;
          if (meowRegex.test(currentTranscript)) {
            this.handleMeowDetected(currentTranscript);
          }
        };

        this.recognition.onerror = (err: any) => {
          // Ignore normal aborted / no-speech errors
          if (err.error !== 'no-speech' && err.error !== 'aborted') {
            console.debug('Speech recognition event:', err.error);
          }
        };

        this.recognition.onend = () => {
          // Auto-restart if should be running
          if (this.isRunning) {
            try {
              this.recognition.start();
            } catch (e) {
              // already active or waiting
            }
          }
        };
      } catch (e) {
        console.warn('SpeechRecognition init error:', e);
      }
    }
  }

  public subscribe(cb: MeowCallback) {
    this.onMeowCallbacks.add(cb);
    return () => this.onMeowCallbacks.delete(cb);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;

    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        // already started
      }
    }

    // Also attach pitch detector fallback if mic permission is granted
    this.startAudioPitchFallback();
  }

  public stop() {
    this.isRunning = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.stopAudioPitchFallback();
  }

  private handleMeowDetected(transcript: string) {
    const now = Date.now();
    // 1.8s debounce so user can meow rhythmically
    if (now - this.lastTriggerTime < 1800) return;
    this.lastTriggerTime = now;

    // Dispatch global event for visual feedback
    const displayWord = transcript.includes('meow') ? 'MEOW!' : transcript.toUpperCase() || 'MEOW!';
    window.dispatchEvent(
      new CustomEvent('speech-meow-detected', {
        detail: { transcript: displayWord },
      })
    );

    this.onMeowCallbacks.forEach((cb) => cb(displayWord));
  }

  public handleHissDetected(transcript: string = 'HISS!') {
    const now = Date.now();
    // 2s debounce
    if (now - this.lastHissTime < 2000) return;
    this.lastHissTime = now;

    const displayWord = 'HISS! (CLAW BRAG)';
    window.dispatchEvent(
      new CustomEvent('speech-hiss-detected', {
        detail: { transcript: displayWord },
      })
    );

    this.onHissCallbacks.forEach((cb) => cb(displayWord));
  }

  public subscribeHiss(cb: (transcript: string) => void) {
    this.onHissCallbacks.add(cb);
    return () => this.onHissCallbacks.delete(cb);
  }

  // Audio frequency analyzer fallback (listens for high-pitched melodic meow ~ 450Hz - 1100Hz)
  private async startAudioPitchFallback() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      if (this.micStream) return;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      source.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);
      let highToneStreak = 0;

      this.pitchInterval = setInterval(() => {
        if (!this.analyser || !this.isRunning) return;
        this.analyser.getByteFrequencyData(buffer);

        // Analyze frequency bins in vocal meow range (approx 400Hz - 1100Hz -> bins 10 to 30 with 512 FFT at 44.1kHz)
        let maxVocalEnergy = 0;
        let maxLowEnergy = 0;

        for (let i = 2; i < 8; i++) {
          maxLowEnergy += buffer[i];
        }
        for (let i = 10; i < 28; i++) {
          if (buffer[i] > maxVocalEnergy) maxVocalEnergy = buffer[i];
        }

        // Distinct meow profile: elevated melodic high mid-frequency above background noise
        if (maxVocalEnergy > 165 && maxVocalEnergy > maxLowEnergy * 0.4) {
          highToneStreak++;
          if (highToneStreak >= 3) {
            highToneStreak = 0;
            this.handleMeowDetected('MEOW! (Voice Pitch)');
          }
        } else {
          highToneStreak = Math.max(0, highToneStreak - 1);
        }
      }, 100);
    } catch (err) {
      // Mic permission not granted yet or cancelled
    }
  }

  private stopAudioPitchFallback() {
    if (this.pitchInterval) {
      clearInterval(this.pitchInterval);
      this.pitchInterval = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const speechMeowDetector = new SpeechMeowDetector();
