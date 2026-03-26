import React from 'react';
import { 
  LayoutGrid, 
  Video, 
  Music, 
  Type, 
  Settings, 
  FolderOpen, 
  Layers,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { MediaLibrary } from '../editor/MediaLibrary';

export const Sidebar: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState('media');

  const navItems = [
    { id: 'media', icon: FolderOpen, label: 'Media' },
    { id: 'assets', icon: LayoutGrid, label: 'Assets' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'effects', icon: Sparkles, label: 'Effects' },
    { id: 'transitions', icon: Layers, label: 'Transitions' },
    { id: 'audio', icon: Music, label: 'Audio' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex h-full z-20">
      <aside className="w-16 md:w-20 bg-[#121212] border-r border-[#282828] flex flex-col items-center py-4 gap-4">
        <div className="mb-4">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Video className="text-white w-6 h-6" />
          </div>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "p-3 rounded-xl transition-all duration-200 group relative",
                activeTab === item.id 
                  ? "bg-orange-500/10 text-orange-500" 
                  : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="absolute left-full ml-4 px-2 py-1 bg-zinc-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Expanded Panel */}
      <div className="w-64 md:w-72 bg-[#121212] border-r border-[#282828] flex flex-col overflow-hidden">
        {activeTab === 'media' && <MediaLibrary />}
        {activeTab !== 'media' && (
          <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs italic">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} panel coming soon...
          </div>
        )}
      </div>
    </div>
  );
};
