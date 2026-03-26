import React from 'react';
import { Upload, FileVideo, Loader2, Plus, Trash2, Sparkles, CheckCircle2 } from 'lucide-react';
import { saveFileToOPFS } from '../../lib/opfs';
import { ffmpegService } from '../../lib/ffmpeg';
import { aiService } from '../../lib/ai';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useEditorStore, MediaAsset } from '../../store/useEditorStore';

export const MediaLibrary: React.FC = () => {
  const { assets, addAsset, updateAsset, removeAsset } = useEditorStore();
  const { addClip } = useTimelineStore();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList.item(i);
      if (file) files.push(file);
    }

    for (const file of files) {
      const id = crypto.randomUUID();
      const type: 'video' | 'audio' | 'image' = file.type.startsWith('video') 
        ? 'video' 
        : file.type.startsWith('audio') 
          ? 'audio' 
          : 'image';

      const newAsset: MediaAsset = {
        id,
        name: file.name,
        type,
        isProcessing: true,
        isTranscribing: false,
        file
      };

      addAsset(newAsset);

      try {
        // 1. Save to OPFS for persistence
        await saveFileToOPFS(file, `original_${id}`);

        // 2. Generate Proxy if it's a video
        if (newAsset.type === 'video') {
          const proxyUrl = await ffmpegService.generateProxy(id, file);
          updateAsset(id, { proxyUrl, isProcessing: false });
        } else {
          updateAsset(id, { isProcessing: false });
        }
      } catch (error) {
        console.error('Failed to process asset:', error);
        removeAsset(id);
      }
    }
  };

  const handleTranscribe = async (asset: MediaAsset) => {
    updateAsset(asset.id, { isTranscribing: true });
    try {
      // 1. Extract audio using FFmpeg
      const audioBlob = await ffmpegService.extractAudio(asset.id, asset.file);
      
      // 2. Decode audio for Whisper
      const audioContext = new AudioContext();
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const float32Data = audioBuffer.getChannelData(0);

      // 3. Transcribe with AI Service
      const result = await aiService.transcribe(float32Data);
      
      updateAsset(asset.id, { 
        isTranscribing: false, 
        transcription: result.text 
      });
    } catch (error) {
      console.error('Transcription failed:', error);
      updateAsset(asset.id, { isTranscribing: false });
    }
  };

  const addToTimeline = (asset: MediaAsset) => {
    const trackId = asset.type === 'audio' ? 'a1' : 'v1';
    addClip(trackId, {
      id: crypto.randomUUID(),
      name: asset.name,
      type: asset.type,
      startTime: 0,
      duration: 10,
      sourceStart: 0,
      trackId,
      proxyUrl: asset.proxyUrl,
      originalUrl: URL.createObjectURL(asset.file),
      volume: 1,
      opacity: 1,
      transform: { x: 0, y: 0, scale: 1, rotation: 0 }
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#121212]">
      <div className="p-4 border-b border-[#282828] flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Project Assets</h3>
        <label className="cursor-pointer p-1.5 bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors">
          <Upload size={14} className="text-white" />
          <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="video/*,audio/*,image/*" />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {assets.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30">
            <Upload size={32} className="mb-4" />
            <p className="text-xs">Drag and drop media files here or click the upload button</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {assets.map((asset) => (
              <div 
                key={asset.id} 
                className="group bg-[#1a1a1a] border border-[#282828] rounded-xl p-2 flex items-center gap-3 hover:border-orange-500/50 transition-all"
              >
                <div className="w-16 h-10 bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
                  {asset.isProcessing || asset.isTranscribing ? (
                    <Loader2 size={16} className="text-orange-500 animate-spin" />
                  ) : (
                    <FileVideo size={16} className="text-zinc-600" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11px] font-medium text-zinc-300 truncate">{asset.name}</p>
                    {asset.transcription && <CheckCircle2 size={10} className="text-green-500" />}
                  </div>
                  <p className="text-[9px] text-zinc-500 uppercase">
                    {asset.type} • {asset.isProcessing ? 'Processing...' : asset.isTranscribing ? 'Transcribing...' : 'Ready'}
                  </p>
                </div>

                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleTranscribe(asset)}
                    disabled={asset.isProcessing || asset.isTranscribing}
                    className="p-1.5 text-zinc-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg disabled:opacity-50"
                    title="AI Transcribe"
                  >
                    <Sparkles size={14} />
                  </button>
                  <button 
                    onClick={() => addToTimeline(asset)}
                    disabled={asset.isProcessing || asset.isTranscribing}
                    className="p-1.5 text-orange-500 hover:bg-orange-500/10 rounded-lg disabled:opacity-50"
                  >
                    <Plus size={14} />
                  </button>
                  <button 
                    onClick={() => removeAsset(asset.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
