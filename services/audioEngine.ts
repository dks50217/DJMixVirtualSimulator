import { AppState } from "../types";

// Helper to create Biquad filters
const createFilter = (ctx: AudioContext, type: BiquadFilterType, frequency: number) => {
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = frequency;
  filter.gain.value = 0;
  return filter;
};

class Channel {
  ctx: AudioContext;
  gainNode: GainNode; // Channel Volume
  crossfaderNode: GainNode; // Crossfader impact
  
  // EQ Nodes
  lowFilter: BiquadFilterNode;
  midFilter: BiquadFilterNode;
  highFilter: BiquadFilterNode;

  // Playback State
  source: AudioBufferSourceNode | null = null;
  buffer: AudioBuffer | null = null;
  startTime: number = 0;
  startOffset: number = 0;
  isPlaying: boolean = false;

  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;

    // Create Nodes
    this.crossfaderNode = ctx.createGain();
    this.gainNode = ctx.createGain();
    this.lowFilter = createFilter(ctx, 'lowshelf', 320);
    this.midFilter = createFilter(ctx, 'peaking', 1000);
    this.highFilter = createFilter(ctx, 'highshelf', 3200);

    // Connect Graph: Source -> Low -> Mid -> High -> Vol -> CF -> Master
    // Note: Source is connected in play()
    this.lowFilter.connect(this.midFilter);
    this.midFilter.connect(this.highFilter);
    this.highFilter.connect(this.gainNode);
    this.gainNode.connect(this.crossfaderNode);
    this.crossfaderNode.connect(destination);
  }

  loadBuffer(buffer: AudioBuffer) {
    this.stop();
    this.buffer = buffer;
    this.startOffset = 0;
  }

  play(speed: number) {
    if (!this.buffer || this.isPlaying) return;

    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.playbackRate.value = speed;
    this.source.loop = true; // DJ tracks usually loop or stop, let's loop for demo
    
    this.source.connect(this.lowFilter);

    this.startTime = this.ctx.currentTime;
    // Handle loop logic for offset
    const offset = this.startOffset % this.buffer.duration;
    this.source.start(0, offset);
    this.isPlaying = true;
  }

  stop() {
    if (this.source && this.isPlaying) {
      try {
        this.source.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      // Calculate where we stopped so we can resume
      this.startOffset += (this.ctx.currentTime - this.startTime) * this.source.playbackRate.value;
    }
    this.source = null;
    this.isPlaying = false;
  }

  setVolume(val: number) {
    this.gainNode.gain.setTargetAtTime(val, this.ctx.currentTime, 0.01);
  }

  setSpeed(val: number) {
    if (this.source) {
      this.source.playbackRate.setTargetAtTime(val, this.ctx.currentTime, 0.1);
    }
  }

  setEQ(low: number, mid: number, high: number) {
    // Map 0-1 range to Decibels (-20dB to +20dB, with 0.5 being 0dB)
    // 0 -> -20, 0.5 -> 0, 1 -> +20
    const mapdB = (v: number) => (v - 0.5) * 40;
    
    this.lowFilter.gain.setTargetAtTime(mapdB(low), this.ctx.currentTime, 0.1);
    this.midFilter.gain.setTargetAtTime(mapdB(mid), this.ctx.currentTime, 0.1);
    this.highFilter.gain.setTargetAtTime(mapdB(high), this.ctx.currentTime, 0.1);
  }
}

export class DJAudioEngine {
  ctx: AudioContext;
  masterGain: GainNode;
  deckA: Channel;
  deckB: Channel;

  constructor() {
    const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
    this.ctx = new AudioContextClass();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);

    this.deckA = new Channel(this.ctx, this.masterGain);
    this.deckB = new Channel(this.ctx, this.masterGain);
  }

  async resume() {
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  async loadTrack(deck: 'deckA' | 'deckB', file: File): Promise<{ duration: number }> {
    await this.resume();
    const arrayBuffer = await file.arrayBuffer();
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
    
    if (deck === 'deckA') {
      this.deckA.loadBuffer(audioBuffer);
    } else {
      this.deckB.loadBuffer(audioBuffer);
    }
    return { duration: audioBuffer.duration };
  }

  syncState(state: AppState) {
    // Master
    this.masterGain.gain.setTargetAtTime(state.mixer.masterVolume, this.ctx.currentTime, 0.01);

    // Crossfader Logic
    // Linear approximation:
    // Val -1: A=1, B=0
    // Val 0: A=1, B=1
    // Val 1: A=0, B=1
    const cf = state.mixer.crossfader;
    
    // Equal Power Crossfade curve is better, but let's stick to linear for simplicity/predictability in demo
    const volA = cf > 0 ? 1 - cf : 1;
    const volB = cf < 0 ? 1 + cf : 1;

    this.deckA.crossfaderNode.gain.setTargetAtTime(volA, this.ctx.currentTime, 0.01);
    this.deckB.crossfaderNode.gain.setTargetAtTime(volB, this.ctx.currentTime, 0.01);

    // Deck A
    this.syncDeck(this.deckA, state.deckA);
    // Deck B
    this.syncDeck(this.deckB, state.deckB);
  }

  private syncDeck(channel: Channel, state: import("../types").DeckState) {
    if (state.isPlaying && !channel.isPlaying && state.isLoaded) {
      channel.play(state.speed);
    } else if (!state.isPlaying && channel.isPlaying) {
      channel.stop();
    }

    if (channel.isPlaying) {
      channel.setSpeed(state.speed);
    }

    channel.setVolume(state.volume);
    channel.setEQ(state.eq.low, state.eq.mid, state.eq.high);
  }
}

export const audioEngine = new DJAudioEngine();
