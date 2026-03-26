import React, { useRef, useEffect, useState } from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { useEditorStore } from '../../store/useEditorStore';
import { socketService } from '../../lib/socket';

export const Playhead: React.FC = () => {
  const { currentTime, setCurrentTime, zoom, isPlaying, setIsPlaying, project } = useTimelineStore();
  const playheadRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    updateCurrentTime(e.clientX);
  };

  const updateCurrentTime = (clientX: number) => {
    const timelineElement = playheadRef.current?.parentElement;
    if (!timelineElement) return;
    
    const rect = timelineElement.getBoundingClientRect();
    const scrollLeft = timelineElement.scrollLeft;
    const x = clientX - rect.left + scrollLeft;
    const newTime = Math.max(0, x / zoom);
    setCurrentTime(newTime);
    socketService.emitPlayheadMove(project.id, newTime);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateCurrentTime(e.clientX);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, zoom, setCurrentTime]);

  // Playback loop using requestAnimationFrame
  useEffect(() => {
    if (!isPlaying) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      
      // Use functional update to get the latest state without depending on it
      useTimelineStore.setState((state) => ({
        currentTime: state.currentTime + delta
      }));
      
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying]);

  return (
    <div 
      ref={playheadRef}
      className="absolute top-0 bottom-0 w-px bg-orange-500 z-40 shadow-[0_0_15px_rgba(249,115,22,0.8)] cursor-ew-resize pointer-events-auto"
      style={{ left: currentTime * zoom }}
      onMouseDown={handleMouseDown}
    >
      <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-orange-500 rotate-45" />
      <div className="absolute top-0 -left-1.5 w-3 h-6 bg-orange-500 rounded-b-sm flex items-center justify-center">
        <div className="w-0.5 h-3 bg-white/30 rounded-full" />
      </div>
    </div>
  );
};
