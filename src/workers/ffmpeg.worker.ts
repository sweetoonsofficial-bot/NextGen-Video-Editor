import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

let ffmpeg: FFmpeg | null = null;

const loadFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;
  
  ffmpeg = new FFmpeg();
  
  // Use multi-threaded core for performance
  const baseURL = 'https://unpkg.com/@ffmpeg/core-mt@0.12.6/dist/esm';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript'),
  });
  
  return ffmpeg;
};

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;
  
  try {
    const instance = await loadFFmpeg();
    
    switch (type) {
      case 'GENERATE_PROXY': {
        const { file, id } = payload;
        const inputName = `input_${id}`;
        const outputName = `proxy_${id}.mp4`;
        
        await instance.writeFile(inputName, await fetchFile(file));
        
        // Generate 480p proxy with fast preset
        await instance.exec([
          '-i', inputName,
          '-vf', 'scale=-2:480',
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '28',
          '-c:a', 'aac',
          '-b:a', '128k',
          outputName
        ]);
        
        const data = await instance.readFile(outputName);
        const proxyBlob = new Blob([data], { type: 'video/mp4' });
        const proxyUrl = URL.createObjectURL(proxyBlob);
        
        self.postMessage({ 
          type: 'PROXY_READY', 
          payload: { id, proxyUrl } 
        });
        
        // Cleanup
        await instance.deleteFile(inputName);
        await instance.deleteFile(outputName);
        break;
      }
      
      case 'GET_METADATA': {
        const { file, id } = payload;
        const inputName = `meta_${id}`;
        
        await instance.writeFile(inputName, await fetchFile(file));
        
        // We can use ffprobe-like logic or just parse ffmpeg output
        // For now, let's assume we just need duration
        // A more robust implementation would use a dedicated ffprobe build or parse logs
        
        self.postMessage({ 
          type: 'METADATA_READY', 
          payload: { id, metadata: { duration: 0 } } // Placeholder
        });
        
        await instance.deleteFile(inputName);
        break;
      }

      case 'TRIM_VIDEO': {
        const { file, id, start, duration } = payload;
        const inputName = `trim_in_${id}`;
        const outputName = `trim_out_${id}.mp4`;

        await instance.writeFile(inputName, await fetchFile(file));

        await instance.exec([
          '-ss', start.toString(),
          '-i', inputName,
          '-t', duration.toString(),
          '-c', 'copy', // Fast trim without re-encoding
          outputName
        ]);

        const data = await instance.readFile(outputName);
        const trimmedBlob = new Blob([data], { type: 'video/mp4' });
        const trimmedUrl = URL.createObjectURL(trimmedBlob);

        self.postMessage({
          type: 'TRIM_READY',
          payload: { id, trimmedUrl }
        });

        await instance.deleteFile(inputName);
        await instance.deleteFile(outputName);
        break;
      }

      case 'EXTRACT_AUDIO': {
        const { file, id } = payload;
        const inputName = `audio_in_${id}`;
        const outputName = `audio_out_${id}.wav`;

        await instance.writeFile(inputName, await fetchFile(file));

        // Extract 16kHz mono WAV for Whisper
        await instance.exec([
          '-i', inputName,
          '-vn',
          '-acodec', 'pcm_s16le',
          '-ar', '16000',
          '-ac', '1',
          outputName
        ]);

        const data = await instance.readFile(outputName);
        const audioBlob = new Blob([data], { type: 'audio/wav' });

        self.postMessage({
          type: 'AUDIO_EXTRACTED',
          payload: { id, audioBlob }
        });

        await instance.deleteFile(inputName);
        await instance.deleteFile(outputName);
        break;
      }
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', payload: error.message });
  }
};
