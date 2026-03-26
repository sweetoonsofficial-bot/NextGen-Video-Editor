import React, { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Player } from './components/layout/Player';
import { Properties } from './components/layout/Properties';
import { TimelineContainer } from './components/layout/TimelineContainer';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './store/useAuthStore';
import { LogIn, Github, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { socketService } from './lib/socket';

import { useAudioSync } from './hooks/useAudioSync';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import { Header } from './components/layout/Header';

export default function App() {
  const { isAuthenticated, user } = useAuthStore();
  useAudioSync();
  useKeyboardShortcuts();

  useEffect(() => {
    if (isAuthenticated) {
      socketService.connect();
    }
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated]);

  // For Phase 1, we'll show a simple landing if not authenticated
  // In a real app, you'd use a proper client ID
  const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="h-screen w-screen bg-[#0a0a0a] text-zinc-300 flex flex-col overflow-hidden font-sans selection:bg-orange-500/30">
        <AnimatePresence mode="wait">
          {!isAuthenticated ? (
            <motion.div 
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center p-6 relative"
            >
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 blur-[120px] rounded-full pointer-events-none" />
              
              <div className="max-w-md w-full space-y-8 text-center relative z-10">
                <div className="space-y-2">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="w-20 h-20 bg-orange-500 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-orange-500/20 mb-6"
                  >
                    <LogIn className="text-white w-10 h-10" />
                  </motion.div>
                  <h1 className="text-5xl font-bold tracking-tighter text-white">NextGen</h1>
                  <p className="text-zinc-500 text-lg font-medium">The Billion-Dollar Browser NLE.</p>
                </div>

                <div className="space-y-4 pt-8">
                  <button 
                    onClick={() => useAuthStore.getState().login({ name: 'Demo User' }, 'demo-token')}
                    className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
                    Continue with Google
                  </button>
                  <button className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all active:scale-[0.98] flex items-center justify-center gap-3 border border-zinc-800">
                    <Github className="w-5 h-5" />
                    Continue with GitHub
                  </button>
                </div>

                <p className="text-[10px] text-zinc-600 uppercase tracking-widest pt-12">
                  100% Client-Side • Secure • $0 Server Cost
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="editor"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <Header />

              <div className="flex-1 flex overflow-hidden">
                <Sidebar />
                <main className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 flex overflow-hidden">
                    <Player />
                    <Properties />
                  </div>
                  <TimelineContainer />
                </main>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GoogleOAuthProvider>
  );
}
