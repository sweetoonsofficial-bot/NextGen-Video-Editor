/**
 * AI Service
 * Manages the AI Web Worker for transcription and background removal.
 */

class AIService {
  private worker: Worker | null = null;
  private isInitialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.worker = new Worker(new URL('../workers/ai.worker.ts', import.meta.url), {
        type: 'module'
      });
    }
  }

  async initWhisper(): Promise<void> {
    if (!this.worker) return;
    
    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.data.type === 'INIT_SUCCESS') {
          this.isInitialized = true;
          this.worker?.removeEventListener('message', handler);
          resolve();
        } else if (e.data.type === 'ERROR') {
          this.worker?.removeEventListener('message', handler);
          reject(new Error(e.data.payload));
        }
      };

      this.worker?.addEventListener('message', handler);
      this.worker?.postMessage({ type: 'INIT_WHISPER' });
    });
  }

  async transcribe(audioData: Float32Array): Promise<any> {
    if (!this.worker || !this.isInitialized) {
      await this.initWhisper();
    }

    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.data.type === 'TRANSCRIBE_SUCCESS') {
          this.worker?.removeEventListener('message', handler);
          resolve(e.data.payload);
        } else if (e.data.type === 'ERROR') {
          this.worker?.removeEventListener('message', handler);
          reject(new Error(e.data.payload));
        }
      };

      this.worker?.addEventListener('message', handler);
      this.worker?.postMessage({ type: 'TRANSCRIBE', payload: { audioData } });
    });
  }
}

export const aiService = new AIService();
