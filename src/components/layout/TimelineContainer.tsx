import React, { useRef } from 'react';
import { 
  Scissors, 
  MousePointer2, 
  Hand, 
  ZoomIn, 
  ZoomOut,
  Magnet,
  Plus
} from 'lucide-react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useEditorStore } from '../../store/useEditorStore';
import { cn } from '../../lib/utils';
import { TimelineRuler } from '../timeline/TimelineRuler';
import { TimelineTrack } from '../timeline/TimelineTrack';
import { Playhead } from '../timeline/Playhead';

export const TimelineContainer: React.FC = () => {
  const { zoom, setZoom, project, setCurrentTime } = useTimelineStore();
  const { activeTool, setActiveTool } = useEditorStore();
  const timelineRef = useRef<HTMLDivElement>(null);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const scrollLeft = timelineRef.current.scrollLeft;
      const x = e.clientX - rect.left + scrollLeft;
      const newTime = Math.max(0, x / zoom);
      setCurrentTime(newTime);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.shiftKey && timelineRef.current) {
      timelineRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div className="h-80 bg-[#121212] border-t border-[#282828] flex flex-col overflow-hidden relative">
      {/* Timeline Toolbar */}
      <div className="h-10 border-b border-white/5 flex items-center justify-between px-4 z-20 bg-black/40 backdrop-blur-xl absolute top-0 left-0 right-0">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setActiveTool('select')}
            className={cn("p-1.5 rounded transition-colors", activeTool === 'select' ? "bg-orange-500 text-white" : "text-zinc-500 hover:text-zinc-300")}
          >
            <MousePointer2 size={16} />
          </button>
          <button 
            onClick={() => setActiveTool('razor')}
            className={cn("p-1.5 rounded transition-colors", activeTool === 'razor' ? "bg-orange-500 text-white" : "text-zinc-500 hover:text-zinc-300")}
          >
            <Scissors size={16} />
          </button>
          <button 
            onClick={() => setActiveTool('hand')}
            className={cn("p-1.5 rounded transition-colors", activeTool === 'hand' ? "bg-orange-500 text-white" : "text-zinc-500 hover:text-zinc-300")}
          >
            <Hand size={16} />
          </button>
          <div className="w-px h-4 bg-[#282828] mx-2" />
          <button className="p-1.5 text-orange-500"><Magnet size={16} /></button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setZoom(Math.max(1, zoom - 2))} className="text-zinc-500 hover:text-zinc-300"><ZoomOut size={16} /></button>
            <input 
              type="range" 
              min="1" 
              max="100" 
              value={zoom} 
              onChange={(e) => setZoom(parseInt(e.target.value))}
              className="w-24 accent-orange-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
            />
            <button onClick={() => setZoom(Math.min(100, zoom + 2))} className="text-zinc-500 hover:text-zinc-300"><ZoomIn size={16} /></button>
          </div>
          <button className="flex items-center gap-1 text-xs font-medium text-zinc-400 hover:text-white transition-colors">
            <Plus size={14} /> Add Track
          </button>
        </div>
      </div>

      {/* Timeline Content */}
      <div 
        ref={timelineRef}
        className="flex-1 flex overflow-x-auto overflow-y-hidden relative bg-[#0a0a0a] scrollbar-hide pt-10"
        onMouseDown={handleTimelineClick}
        onWheel={handleWheel}
      >
        <div 
          className="relative h-full"
          style={{ width: Math.max(project.duration + 60, 300) * zoom }}
        >
          <TimelineRuler />
          
          {/* Grid Lines */}
          <div className="absolute inset-0 pointer-events-none opacity-5 z-0">
            <div className="w-full h-full" style={{ backgroundSize: `${zoom * 5}px 100%`, backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px)' }} />
          </div>

          {/* Tracks */}
          <div className="flex flex-col">
            {project.tracks.map((track) => (
              <TimelineTrack key={track.id} track={track} />
            ))}
          </div>

          {/* Playhead */}
          <Playhead />
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-black/60 border-t border-white/5 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">System Online</span>
          </div>
          <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">WebGPU: Active</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">FPS: 60</span>
          <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">Project: {project.width}x{project.height} @ {project.fps}fps</span>
        </div>
      </div>
    </div>
  );
};
