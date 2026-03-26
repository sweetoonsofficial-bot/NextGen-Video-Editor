import React, { useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Maximize, 
  Volume2,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useWebGPU } from '../../hooks/useWebGPU';
import { formatTime } from '../../lib/utils';
import { AudioVisualizer } from '../editor/AudioVisualizer';

export const Player: React.FC = () => {
  const { isPlaying, setIsPlaying, currentTime, project } = useTimelineStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { error } = useWebGPU(canvasRef);

  // Set canvas resolution based on project
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = project.width;
      canvasRef.current.height = project.height;
    }
  }, [project.width, project.height]);

  return (
    <div className="flex-1 flex flex-col bg-black relative overflow-hidden">
      {/* Canvas Viewport */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="aspect-video w-full max-w-5xl bg-[#0a0a0a] shadow-2xl relative group border border-[#1a1a1a] overflow-hidden">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 gap-4 p-8 text-center">
              <AlertCircle size={48} />
              <p className="text-sm font-bold uppercase tracking-widest">WebGPU Error</p>
              <p className="text-xs text-zinc-500 max-w-xs">{error}</p>
            </div>
          ) : (
            <canvas 
              ref={canvasRef} 
              className="w-full h-full object-contain" 
            />
          )}
          
          <AudioVisualizer />
          
          {/* Overlay Controls (Hidden by default) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
             <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 transition-transform"
             >
               {isPlaying ? <Pause className="text-white fill-white" /> : <Play className="text-white fill-white ml-1" />}
             </button>
          </div>
        </div>
      </div>

      {/* Player Controls */}
      <div className="h-14 bg-black/40 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-6 absolute bottom-0 left-0 right-0 z-10">
        <div className="flex items-center gap-4">
          <button className="text-zinc-400 hover:text-white transition-colors"><SkipBack size={20} /></button>
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-white hover:scale-110 transition-transform"
          >
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
          <button className="text-zinc-400 hover:text-white transition-colors"><SkipForward size={20} /></button>
          <span className="text-zinc-400 font-mono text-sm ml-2">{formatTime(currentTime)}</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Volume2 size={18} className="text-zinc-400" />
            <div className="w-24 h-1 bg-zinc-800 rounded-full overflow-hidden relative group cursor-pointer">
              <input 
                type="range"
                min="0" max="1" step="0.01"
                value={project.masterVolume}
                onChange={(e) => useTimelineStore.getState().setMasterVolume(parseFloat(e.target.value))}
                className="absolute inset-0 opacity-0 cursor-pointer z-10"
              />
              <div 
                className="h-full bg-orange-500 transition-all" 
                style={{ width: `${project.masterVolume * 100}%` }}
              />
            </div>
          </div>
          <button className="text-zinc-400 hover:text-white transition-colors"><Settings size={18} /></button>
          <button className="text-zinc-400 hover:text-white transition-colors"><Maximize size={18} /></button>
        </div>
      </div>
    </div>
  );
};
