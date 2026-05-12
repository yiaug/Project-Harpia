import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { useAuthStore } from './stores/authStore';
import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Layout
import MainLayout from './layouts/MainLayout';

// Pages
import Login from './pages/Login';
import PendingApproval from './pages/PendingApproval';
import Library from './pages/Library';
import Forum from './pages/Forum';
import Tarot from './pages/Tarot';
import Chats from './pages/Chats';
import Admin from './pages/Admin';
import ReadBook from './pages/ReadBook';

function ProtectedRoute({ children, reqRole, needsApproval }: { children: React.ReactNode, reqRole?: string, needsApproval?: boolean }) {
  const { user, dbUser, loading } = useAuthStore();

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-950 text-indigo-400">Despertando o Nexus...</div>;
  if (!user) return <Navigate to="/login" />;

  if (needsApproval && dbUser?.status !== 'approved' && dbUser?.role !== 'admin' && dbUser?.role !== 'moderator') {
     return <Navigate to="/pending-approval" />;
  }

  if (reqRole) {
      if (reqRole === 'admin' && !(dbUser?.role === 'admin' || dbUser?.role === 'moderator')) {
          return <Navigate to="/" />; // fallback to home/library
      } else if (reqRole !== 'admin' && dbUser?.role !== reqRole) {
          return <Navigate to="/" />;
      }
  }

  return children;
}

const queryClient = new QueryClient();

export default function App() {
  const { setUser, setDbUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDbUser(docSnap.data());
        } else {
          setDbUser(null);
        }
      } else {
        setDbUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          
          <Route path="/" element={<MainLayout />}>
            <Route index element={
              <ProtectedRoute needsApproval>
                <Library />
              </ProtectedRoute>
            } />
            
            <Route path="read/:bookId" element={
              <ProtectedRoute needsApproval>
                <ReadBook />
              </ProtectedRoute>
            } />

            <Route path="forum" element={
               <ProtectedRoute needsApproval>
                 <Forum />
               </ProtectedRoute>
            } />

            <Route path="tarot" element={
               <ProtectedRoute needsApproval>
                 <Tarot />
               </ProtectedRoute>
            } />

            <Route path="chats" element={
               <ProtectedRoute needsApproval>
                 <Chats />
               </ProtectedRoute>
            } />

            <Route path="admin" element={
               <ProtectedRoute reqRole="admin">
                 <Admin />
               </ProtectedRoute>
            } />
          </Route>
        </Routes>
        <Toaster theme="dark" position="top-center" />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
