'use client';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientNodes: AudioNode[] = [];
  private heartbeatInterval: number | null = null;
  private heartRate: number = 60;

  init() {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);
  }

  startAmbientDrone() {
    if (!this.ctx || !this.masterGain) return;
    // Low rumbling drone
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 30;
    const gain1 = this.ctx.createGain();
    gain1.gain.value = 0.08;
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.value = 80;
    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start();

    // Sub bass pulse
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 25;
    const gain2 = this.ctx.createGain();
    gain2.gain.value = 0.12;
    // LFO for pulsing
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.3;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain);
    lfoGain.connect(gain2.gain);
    lfo.start();
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start();

    // High eerie tone
    const osc3 = this.ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.value = 880;
    const gain3 = this.ctx.createGain();
    gain3.gain.value = 0.015;
    const vibrato = this.ctx.createOscillator();
    vibrato.frequency.value = 5;
    const vibGain = this.ctx.createGain();
    vibGain.gain.value = 10;
    vibrato.connect(vibGain);
    vibGain.connect(osc3.frequency);
    vibrato.start();
    osc3.connect(gain3);
    gain3.connect(this.masterGain);
    osc3.start();

    this.ambientNodes.push(osc1, osc2, osc3, lfo, vibrato);
  }

  playFootstep() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 80 + Math.random() * 40;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 200;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  startHeartbeat(rate: number = 60) {
    this.stopHeartbeat();
    this.heartRate = rate;
    const playBeat = () => {
      if (!this.ctx || !this.masterGain) return;
      // Double thump
      for (let i = 0; i < 2; i++) {
        const osc = this.ctx!.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 40;
        const gain = this.ctx!.createGain();
        gain.gain.setValueAtTime(0.25, this.ctx!.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.12 + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(this.ctx!.currentTime + i * 0.12);
        osc.stop(this.ctx!.currentTime + i * 0.12 + 0.15);
      }
    };
    playBeat();
    this.heartbeatInterval = window.setInterval(playBeat, (60 / this.heartRate) * 1000);
  }

  updateHeartbeatRate(rate: number) {
    this.heartRate = rate;
    if (this.heartbeatInterval !== null) {
      this.startHeartbeat(rate);
    }
  }

  stopHeartbeat() {
    if (this.heartbeatInterval !== null) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  playWhisper() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 1.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / bufferSize);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    filter.Q.value = 5;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.5);
    const panner = this.ctx.createStereoPanner();
    panner.pan.value = Math.random() * 2 - 1;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(panner);
    panner.connect(this.masterGain);
    source.start();
  }

  playJumpScare() {
    if (!this.ctx || !this.masterGain) return;
    // Loud dissonant screech
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 200 + Math.random() * 800;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.5);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 1.5);
    }
    // Noise burst
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / bufferSize);
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  playCreak() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + 1.0);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 0.3);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.0);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 10;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.0);
  }

  playDrip() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.15);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  stopAll() {
    this.ambientNodes.forEach(n => {
      if (n instanceof OscillatorNode) {
        try { n.stop(); } catch (e) { /* already stopped */ }
      }
    });
    this.ambientNodes = [];
    this.stopHeartbeat();
  }
}
