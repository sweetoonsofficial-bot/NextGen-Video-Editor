import React from 'react';
import { Track } from '../../types/editor';
import { useTimelineStore } from '../../store/useTimelineStore';
import { TimelineClip } from './TimelineClip';
import { cn } from '../../lib/utils';
import { Lock, Eye, EyeOff, Volume2, VolumeX } from 'lucide-react';

interface TimelineTrackProps {
  track: Track;
}

export const TimelineTrack: React.FC<TimelineTrackProps> = ({ track }) => {
  const { zoom, project } = useTimelineStore();

  return (
    <div className="h-16 border-b border-[#282828] relative group flex">
      {/* Track Header */}
      <div className="w-48 border-r border-[#282828] flex flex-col justify-center px-4 gap-1 hover:bg-zinc-800/30 transition-colors bg-[#121212] z-10 sticky left-0">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-zinc-500 uppercase font-black tracking-tighter">{track.type}</span>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="text-zinc-500 hover:text-zinc-300"><Lock size={12} /></button>
            <button className="text-zinc-500 hover:text-zinc-300">{track.isVisible ? <Eye size={12} /> : <EyeOff size={12} />}</button>
            <button className="text-zinc-500 hover:text-zinc-300">{track.isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}</button>
          </div>
        </div>
        <span className="text-xs text-zinc-300 font-bold truncate">{track.name}</span>
      </div>

      {/* Track Content */}
      <div className="flex-1 relative overflow-visible">
        {track.clips.map((clip) => (
          <TimelineClip key={clip.id} clip={clip} />
        ))}
      </div>
    </div>
  );
};
