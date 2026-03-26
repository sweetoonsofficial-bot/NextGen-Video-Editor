import { Track, MediaClip } from '../types/editor';

class AudioEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private trackNodes: Map<string, { 
    gain: GainNode; 
    panner: StereoPannerNode; 
    analyser: AnalyserNode;
    sources: AudioBufferSourceNode[];
  }> = new Map();
  private audioBuffers: Map<string, AudioBuffer> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterAnalyser = this.context.createAnalyser();
      this.masterAnalyser.fftSize = 256;
      
      this.masterGain.connect(this.masterAnalyser);
      this.masterAnalyser.connect(this.context.destination);
    }
  }

  getMasterAnalyser(): AnalyserNode | null {
    return this.masterAnalyser;
  }

  async loadClip(clip: MediaClip): Promise<void> {
    if (!this.context || !clip.originalUrl) return;
    if (this.audioBuffers.has(clip.id)) return;

    try {
      const response = await fetch(clip.originalUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.audioBuffers.set(clip.id, audioBuffer);
    } catch (error) {
      console.error('Failed to load audio clip:', error);
    }
  }

  setupTrack(track: Track, allTracks: Track[]) {
    if (!this.context || !this.masterGain) return;
    if (this.trackNodes.has(track.id)) return;

    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    const analyser = this.context.createAnalyser();
    analyser.fftSize = 256;

    gain.connect(panner);
    panner.connect(analyser);
    analyser.connect(this.masterGain);

    this.trackNodes.set(track.id, { gain, panner, analyser, sources: [] });
    this.updateTrackSettings(track, allTracks);
  }

  updateTrackSettings(track: Track, allTracks: Track[]) {
    const nodes = this.trackNodes.get(track.id);
    if (!nodes) return;

    const hasSolo = allTracks.some(t => t.isSoloed);
    const isMutedBySolo = hasSolo && !track.isSoloed;
    const volume = (track.isMuted || isMutedBySolo) ? 0 : track.volume;
    
    nodes.gain.gain.setTargetAtTime(volume, this.context!.currentTime, 0.05);
    nodes.panner.pan.setTargetAtTime(track.pan, this.context!.currentTime, 0.05);
  }

  getLevels(trackId: string): number {
    const nodes = this.trackNodes.get(trackId);
    if (!nodes) return 0;

    const dataArray = new Uint8Array(nodes.analyser.frequencyBinCount);
    nodes.analyser.getByteTimeDomainData(dataArray);

    let max = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const val = Math.abs(dataArray[i] - 128) / 128;
      if (val > max) max = val;
    }
    return max;
  }

  play(tracks: Track[], currentTime: number) {
    if (!this.context) return;
    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    this.stopAll();

    const startTimeInContext = this.context.currentTime;

    tracks.forEach(track => {
      this.setupTrack(track, tracks);
      const nodes = this.trackNodes.get(track.id);
      if (!nodes) return;

      track.clips.forEach(clip => {
        const buffer = this.audioBuffers.get(clip.id);
        if (!buffer) return;

        const clipEndTime = clip.startTime + clip.duration;
        
        // If clip ends in the future
        if (clipEndTime > currentTime) {
          const source = this.context!.createBufferSource();
          source.buffer = buffer;
          source.connect(nodes.gain);

          const delay = Math.max(0, clip.startTime - currentTime);
          const offset = Math.max(0, currentTime - clip.startTime) + clip.sourceStart;
          const duration = clip.duration - Math.max(0, currentTime - clip.startTime);
          
          source.start(startTimeInContext + delay, offset, duration);
          nodes.sources.push(source);
        }
      });
    });
  }

  stopAll() {
    this.trackNodes.forEach(nodes => {
      nodes.sources.forEach(source => {
        try {
          source.stop();
        } catch (e) {}
      });
      nodes.sources = [];
    });
  }

  setMasterVolume(volume: number) {
    if (this.masterGain && this.context) {
      this.masterGain.gain.setTargetAtTime(volume, this.context.currentTime, 0.05);
    }
  }

  getStream(): MediaStream | null {
    if (!this.context || !this.masterGain) return null;
    const dest = this.context.createMediaStreamDestination();
    this.masterGain.connect(dest);
    return dest.stream;
  }
}

export const audioEngine = new AudioEngine();
