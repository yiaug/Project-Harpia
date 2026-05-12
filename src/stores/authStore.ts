import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';

interface AuthState {
  user: FirebaseUser | null;
  dbUser: any | null;
  loading: boolean;
  setUser: (user: FirebaseUser | null) => void;
  setDbUser: (dbUser: any | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  dbUser: null,
  loading: true,
  setUser: (user) => set({ user }),
  setDbUser: (dbUser) => set({ dbUser }),
  setLoading: (loading) => set({ loading }),
}));
