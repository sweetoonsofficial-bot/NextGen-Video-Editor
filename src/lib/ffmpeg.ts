/**
 * FFmpeg Service Wrapper
 * Orchestrates communication with the FFmpeg Web Worker.
 */

export class FFmpegService {
  private worker: Worker;
  private callbacks: Map<string, (data: any) => void> = new Map();

  constructor() {
    // Initialize worker with Vite's worker loader
    this.worker = new Worker(
      new URL('../workers/ffmpeg.worker.ts', import.meta.url),
      { type: 'module' }
    );

    this.worker.onmessage = (e) => {
      const { type, payload } = e.data;
      
      if (type === 'ERROR') {
        console.error('FFmpeg Worker Error:', payload);
        return;
      }

      const callback = this.callbacks.get(payload.id);
      if (callback) {
        // Handle different response types based on the worker's message type
        if (type === 'PROXY_READY') {
          callback(payload.proxyUrl);
        } else if (type === 'TRIM_READY') {
          callback(payload.trimmedUrl);
        } else if (type === 'AUDIO_EXTRACTED') {
          callback(payload.audioBlob);
        } else {
          callback(payload);
        }
        this.callbacks.delete(payload.id);
      }
    };
  }

  async generateProxy(id: string, file: File): Promise<string> {
    return new Promise((resolve) => {
      this.callbacks.set(id, (url) => resolve(url));
      this.worker.postMessage({
        type: 'GENERATE_PROXY',
        payload: { id, file }
      });
    });
  }

  async trimVideo(id: string, file: File, start: number, duration: number): Promise<string> {
    return new Promise((resolve) => {
      this.callbacks.set(id, (url) => resolve(url));
      this.worker.postMessage({
        type: 'TRIM_VIDEO',
        payload: { id, file, start, duration }
      });
    });
  }

  async extractAudio(id: string, file: File): Promise<Blob> {
    return new Promise((resolve) => {
      this.callbacks.set(id, (blob) => resolve(blob));
      this.worker.postMessage({
        type: 'EXTRACT_AUDIO',
        payload: { id, file }
      });
    });
  }

  terminate() {
    this.worker.terminate();
  }
}

export const ffmpegService = new FFmpegService();
