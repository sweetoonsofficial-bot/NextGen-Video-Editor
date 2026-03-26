import { io, Socket } from 'socket.io-client';
import { useTimelineStore } from '../store/useTimelineStore';
import { useAuthStore } from '../store/useAuthStore';

import { usePresenceStore } from '../store/usePresenceStore';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return;

    try {
      this.socket = io(window.location.origin, {
        transports: ['polling'], // 🛠️ JUGAAD: Force polling ONLY to bypass proxy issues
        reconnectionAttempts: 50, // Be very persistent
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
      });
    } catch (e) {
      console.error('❌ [Socket] Failed to initialize socket:', e);
      return;
    }

    // Suppress benign WebSocket errors that might trigger unhandled rejections
    window.addEventListener('unhandledrejection', (event) => {
      const msg = event.reason?.message || '';
      if (msg.includes('WebSocket closed without opened') || msg.includes('failed to connect to websocket')) {
        event.preventDefault();
        console.warn('🤫 Suppressed benign WebSocket rejection');
      }
    });

    this.socket.on('connect', () => {
      try {
        console.log('✅ [Socket] Connected to Real-time Engine:', this.socket?.id);
        const user = useAuthStore.getState().user;
        const project = useTimelineStore.getState().project;
        
        if (user && project) {
          try {
            this.socket?.emit('join-project', project.id, user);
          } catch (e) {
            console.warn('⚠️ [Socket] Failed to emit join-project:', e);
          }
        }
      } catch (e) {
        console.error('❌ [Socket] Error in connect handler:', e);
      }
    });

    this.socket.on('connect_error', (error) => {
      try {
        console.error('❌ [Socket] Connection Error:', error.message);
        // If it's a transport error, try switching to polling if not already
        if (this.socket && (this.socket.io.opts.transports as any)?.includes('websocket')) {
          console.log('🔄 [Socket] Switching to polling transport...');
          (this.socket.io.opts.transports as any) = ['polling'];
        }
      } catch (e) {
        console.error('❌ [Socket] Error in connect_error handler');
      }
    });

    this.socket.on('disconnect', (reason) => {
      try {
        console.warn('⚠️ [Socket] Disconnected:', reason);
        usePresenceStore.getState().setUsers([]);
      } catch (e) {
        console.error('❌ [Socket] Error in disconnect handler');
      }
    });

    this.socket.on('timeline-sync', (update: any) => {
      try {
        // Apply remote updates to local store
        console.log('🔄 Syncing timeline from remote:', update);
        useTimelineStore.setState((state) => ({
          project: { ...state.project, ...update }
        }));
      } catch (e) {
        console.warn('⚠️ [Socket] Failed to sync timeline:', e);
      }
    });

    this.socket.on('playhead-sync', ({ userId, time }: { userId: string, time: number }) => {
      try {
        // Optionally show other users' playheads
        console.log(`📍 User ${userId} moved playhead to ${time}`);
      } catch (e) {
        console.warn('⚠️ [Socket] Failed to sync playhead:', e);
      }
    });

    this.socket.on('presence-update', (users: any[]) => {
      try {
        console.log('👥 Active editors:', users);
        usePresenceStore.getState().setUsers(users);
      } catch (e) {
        console.warn('⚠️ [Socket] Failed to update presence:', e);
      }
    });
  }

  emitTimelineUpdate(projectId: string, update: any) {
    try {
      this.socket?.emit('timeline-update', projectId, update);
    } catch (e) {
      console.warn('⚠️ [Socket] Failed to emit timeline update:', e);
    }
  }

  emitPlayheadMove(projectId: string, time: number) {
    try {
      this.socket?.emit('playhead-move', projectId, time);
    } catch (e) {
      console.warn('⚠️ [Socket] Failed to emit playhead move:', e);
    }
  }

  disconnect() {
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch (e) {
        console.warn('⚠️ [Socket] Error while disconnecting:', e);
      }
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
