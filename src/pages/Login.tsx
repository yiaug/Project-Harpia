import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scroll } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const { setDbUser } = useAuthStore();
  
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await checkAndCreateUser(result.user);
    } catch (e: any) {
      console.error(e);
      if (e.code === 'auth/cancelled-popup-request' || e.code === 'auth/popup-closed-by-user') {
        return; // Usuário fechou o popup
      }
      toast.error('Erro no login: ' + e.message);
    }
  };

  const checkAndCreateUser = async (firebaseUser: any) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userDocRef);
    const isSuperAdmin = firebaseUser.email?.toLowerCase() === 'smiley62830@gmail.com';

    if (!userSnap.exists()) {
       const newUserData = {
         uid: firebaseUser.uid,
         email: firebaseUser.email || '',
         role: isSuperAdmin ? 'admin' : 'user', 
         status: isSuperAdmin ? 'approved' : 'pending',
         createdAt: serverTimestamp(),
         updatedAt: serverTimestamp()
       };
       await setDoc(userDocRef, newUserData);
       setDbUser(newUserData);
       navigate(isSuperAdmin ? '/' : '/pending-approval');
    } else {
       const dbUser = userSnap.data();
       if (isSuperAdmin && (dbUser.role !== 'admin' || dbUser.status !== 'approved')) {
          dbUser.role = 'admin';
          dbUser.status = 'approved';
          await setDoc(userDocRef, { ...dbUser, updatedAt: serverTimestamp() });
       }
       setDbUser(dbUser);
       if (dbUser.status === 'pending') {
          navigate('/pending-approval');
       } else {
          navigate('/');
       }
    }
  }

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-[#0c0514] p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-[#0c0514] to-[#0c0514] pointer-events-none"></div>
      <Card className="w-full max-w-sm border-fuchsia-900/30 bg-[#1a0b2e]/60 backdrop-blur-xl shadow-2xl shadow-indigo-900/20 z-10">
        <CardHeader className="text-center pb-2">
           <div className="mx-auto bg-gradient-to-br from-fuchsia-900/50 to-indigo-900/50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-fuchsia-500/20 rotate-3 transition-transform hover:rotate-6">
             <Scroll className="w-8 h-8 text-fuchsia-400 drop-shadow-[0_0_5px_rgba(232,121,249,0.5)] -rotate-3" />
           </div>
           <CardTitle className="text-3xl font-serif text-fuchsia-100 tracking-wide drop-shadow-md">Harpia</CardTitle>
           <CardDescription className="text-zinc-400 mt-2">Vozes arcanas, sabedoria oculta.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
           <Button variant="outline" className="w-full bg-[#0c0514] border-fuchsia-900/50 text-fuchsia-100 hover:bg-fuchsia-900/30 hover:text-white hover:border-fuchsia-500/50 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(217,70,239,0.2)]" onClick={handleGoogleLogin}>
             Iniciar Ritual de Acesso
           </Button>
        </CardContent>
      </Card>
    </div>
  )
}
