import React, { useRef, useState, useEffect } from 'react';
import { MediaClip } from '../../types/editor';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useEditorStore } from '../../store/useEditorStore';
import { cn } from '../../lib/utils';
import { Video, Music, Type, Sparkles } from 'lucide-react';

interface TimelineClipProps {
  clip: MediaClip;
}

export const TimelineClip: React.FC<TimelineClipProps> = ({ clip }) => {
  const { zoom, updateClip, setSelectedClipId, selectedClipId, currentTime } = useTimelineStore();
  const { activeTool } = useEditorStore();
  const clipRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const isSelected = selectedClipId === clip.id;

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'start' | 'end') => {
    e.stopPropagation();
    setSelectedClipId(clip.id);
    
    if (activeTool === 'razor') {
      // Razor logic will go here
      return;
    }

    if (type === 'move') {
      setIsDragging(true);
      const startX = e.clientX;
      setDragOffset(startX - (clip.startTime * zoom));
    } else {
      setIsResizing(type);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset;
        let newStartTime = Math.max(0, newX / zoom);
        
        // Simple snapping to playhead
        if (Math.abs(newStartTime - currentTime) < (5 / zoom)) {
          newStartTime = currentTime;
        }

        updateClip(clip.trackId, clip.id, { startTime: newStartTime });
      } else if (isResizing) {
        const newX = e.clientX;
        if (isResizing === 'end') {
          const newDuration = Math.max(0.1, (newX - (clipRef.current?.getBoundingClientRect().left || 0)) / zoom);
          updateClip(clip.trackId, clip.id, { duration: newDuration });
        } else {
          const deltaX = (clipRef.current?.getBoundingClientRect().left || 0) - newX;
          const deltaSeconds = deltaX / zoom;
          const newStartTime = Math.max(0, clip.startTime - deltaSeconds);
          const newDuration = Math.max(0.1, clip.duration + deltaSeconds);
          
          updateClip(clip.trackId, clip.id, { 
            startTime: newStartTime, 
            duration: newDuration,
            sourceStart: clip.sourceStart + (clip.startTime - newStartTime)
          });
        }
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, zoom, clip, updateClip, currentTime]);

  const Icon = clip.type === 'video' ? Video : clip.type === 'audio' ? Music : clip.type === 'image' ? Sparkles : Type;

  return (
    <div
      ref={clipRef}
      className={cn(
        "absolute h-12 top-2 rounded-md border flex items-center px-2 cursor-pointer select-none overflow-hidden transition-shadow",
        clip.type === 'video' ? "bg-blue-500/20 border-blue-500/50" : "bg-green-500/20 border-green-500/50",
        isSelected && "ring-2 ring-white border-white shadow-[0_0_15px_rgba(255,255,255,0.3)] z-30"
      )}
      style={{
        left: clip.startTime * zoom,
        width: clip.duration * zoom,
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
      {/* Resize Handles */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1.5 hover:bg-white/50 cursor-ew-resize z-10"
        onMouseDown={(e) => handleMouseDown(e, 'start')}
      />
      <div 
        className="absolute right-0 top-0 bottom-0 w-1.5 hover:bg-white/50 cursor-ew-resize z-10"
        onMouseDown={(e) => handleMouseDown(e, 'end')}
      />

      <Icon size={14} className="mr-2 text-zinc-300 shrink-0" />
      <span className="text-[10px] font-medium text-zinc-200 truncate">{clip.name}</span>
      
      {/* Waveform/Thumbnail placeholder */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        {clip.type === 'audio' ? (
          <div className="w-full h-full flex items-center gap-0.5 px-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex-1 bg-white" style={{ height: `${Math.random() * 100}%` }} />
            ))}
          </div>
        ) : clip.proxyUrl ? (
          <img src={clip.proxyUrl} className="w-full h-full object-cover" alt="" />
        ) : null}
      </div>
    </div>
  );
};
