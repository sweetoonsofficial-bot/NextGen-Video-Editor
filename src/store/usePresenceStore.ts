import { create } from 'zustand';

interface PresenceUser {
  id: string;
  name: string;
  email?: string;
  projectId: string;
}

interface PresenceState {
  users: PresenceUser[];
  setUsers: (users: PresenceUser[]) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  users: [],
  setUsers: (users) => set({ users }),
}));
