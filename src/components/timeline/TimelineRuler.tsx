import React from 'react';
import { useTimelineStore } from '../../store/useTimelineStore';
import { formatTime } from '../../lib/utils';

export const TimelineRuler: React.FC = () => {
  const { zoom, project } = useTimelineStore();
  
  // Calculate how many ticks to show based on project duration and zoom
  const duration = Math.max(project.duration + 60, 300); // Show at least 5 mins
  const ticks = [];
  
  // Major ticks every 5 seconds, minor every 1 second
  for (let i = 0; i <= duration; i++) {
    if (i % 5 === 0) {
      ticks.push(
        <div 
          key={i} 
          className="absolute h-full border-l border-zinc-700 flex flex-col justify-end pb-1"
          style={{ left: i * zoom }}
        >
          <span className="text-[9px] text-zinc-500 font-mono ml-1 mb-1">
            {formatTime(i).split('.')[0]}
          </span>
        </div>
      );
    } else {
      ticks.push(
        <div 
          key={i} 
          className="absolute h-2 bottom-0 border-l border-zinc-800"
          style={{ left: i * zoom }}
        />
      );
    }
  }

  return (
    <div className="h-6 border-b border-[#282828] sticky top-0 bg-[#0a0a0a] z-10 w-full overflow-visible">
      {ticks}
    </div>
  );
};
