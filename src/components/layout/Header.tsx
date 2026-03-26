import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useTimelineStore } from '../../store/useTimelineStore';
import { 
  Play, 
  Share2, 
  Download, 
  Settings, 
  User, 
  LogOut, 
  ChevronDown,
  Cloud,
  History,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExportModal } from '../modals/ExportModal';
import { socketService } from '../../lib/socket';

import { usePresenceStore } from '../../store/usePresenceStore';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { project } = useTimelineStore();
  const { users: presenceUsers } = usePresenceStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Filter out current user from presence list for display if needed, 
  // or just show all. Let's show all but maybe highlight current.
  const otherUsers = presenceUsers.filter(u => u.id !== (socketService as any).socket?.id);
  const displayUsers = presenceUsers.slice(0, 3);
  const remainingCount = presenceUsers.length - displayUsers.length;

  return (
    <header className="h-14 bg-[#121212] border-b border-[#282828] flex items-center justify-between px-4 z-30">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Play size={18} fill="white" className="text-white ml-0.5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-white tracking-tight uppercase">{project.name}</h1>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
              <Cloud size={10} className="text-green-500" />
              <span>Saved to cloud</span>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {['File', 'Edit', 'View', 'Project', 'Help'].map((item) => (
            <button key={item} className="px-3 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-md transition-all uppercase tracking-wider">
              {item}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center -space-x-2 mr-4">
          {displayUsers.map((u, i) => (
            <div 
              key={u.id} 
              className="w-7 h-7 rounded-full border-2 border-[#121212] bg-zinc-800 flex items-center justify-center overflow-hidden group relative"
              title={u.name}
            >
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`} alt={u.name} />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-[8px] text-white font-bold truncate px-1">{u.name.split(' ')[0]}</span>
              </div>
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="w-7 h-7 rounded-full border-2 border-[#121212] bg-orange-500 flex items-center justify-center text-[10px] font-bold text-white">
              +{remainingCount}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-zinc-800 mx-2" />

        <button className="flex items-center gap-2 px-3 py-1.5 text-[11px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-wider">
          <History size={14} />
          History
        </button>

        <button className="flex items-center gap-2 px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold rounded-lg transition-all uppercase tracking-wider">
          <Share2 size={14} />
          Share
        </button>

        <button 
          onClick={() => setShowExportModal(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-orange-500/20 uppercase tracking-wider"
        >
          <Download size={14} />
          Export
        </button>

        <div className="h-6 w-px bg-zinc-800 mx-2" />

        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-1 pr-2 py-1 bg-zinc-900 hover:bg-zinc-800 rounded-full border border-zinc-800 transition-all group"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
              {user?.name?.[0] || 'U'}
            </div>
            <ChevronDown size={14} className={`text-zinc-500 group-hover:text-white transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-56 bg-[#181818] border border-[#282828] rounded-xl shadow-2xl overflow-hidden py-1"
              >
                <div className="px-4 py-3 border-b border-[#282828] mb-1">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
                </div>
                <button className="w-full px-4 py-2.5 text-left text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-3 transition-colors">
                  <User size={14} />
                  Profile Settings
                </button>
                <button className="w-full px-4 py-2.5 text-left text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center gap-3 transition-colors">
                  <Settings size={14} />
                  Preferences
                </button>
                <div className="h-px bg-[#282828] my-1" />
                <button 
                  onClick={logout}
                  className="w-full px-4 py-2.5 text-left text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} />
    </header>
  );
};
