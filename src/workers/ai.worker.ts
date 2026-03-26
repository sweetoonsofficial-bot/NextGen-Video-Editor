import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js for browser environment
env.allowLocalModels = false;
env.useBrowserCache = true;

let transcriber: any = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'INIT_WHISPER':
      try {
        if (!transcriber) {
          transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny.en');
        }
        self.postMessage({ type: 'INIT_SUCCESS' });
      } catch (error: any) {
        self.postMessage({ type: 'ERROR', payload: error.message });
      }
      break;

    case 'TRANSCRIBE':
      try {
        if (!transcriber) {
          throw new Error('Transcriber not initialized');
        }
        
        const { audioData } = payload;
        const result = await transcriber(audioData, {
          chunk_length_s: 30,
          stride_length_s: 5,
          return_timestamps: true,
        });
        
        self.postMessage({ type: 'TRANSCRIBE_SUCCESS', payload: result });
      } catch (error: any) {
        self.postMessage({ type: 'ERROR', payload: error.message });
      }
      break;

    default:
      console.warn(`Unknown message type: ${type}`);
  }
};
