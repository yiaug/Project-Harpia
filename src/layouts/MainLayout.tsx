import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { db, auth } from '../firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { BookOpen, Scroll, Wand2, Flame, Shield, LogOut, Info, Feather } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DownloadAppDialog } from '../components/DownloadAppDialog';

export default function MainLayout() {
  const { dbUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
     // Listen for global settings changes
     const unsub = onSnapshot(doc(db, 'globalSettings', 'core'), (doc) => {
         if (doc.exists()) {
             const data = doc.data();
             setAnnouncement(data.globalAnnouncement || '');
         }
     }, (err) => {
         console.error("FirebaseError in MainLayout onSnapshot", err);
     });
     return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  }

  const navItems = [
    { path: '/', label: 'Biblioteca', icon: BookOpen },
    { path: '/forum', label: 'Fórum', icon: Feather },
    { path: '/tarot', label: 'Tarot', icon: Wand2 },
    { path: '/chats', label: 'Invocação', icon: Flame },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#0c0514] text-zinc-100 flex flex-col pb-16 md:pb-0 font-sans selection:bg-fuchsia-900/50 selection:text-fuchsia-100">
      {announcement && (
         <div className="bg-fuchsia-900/90 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2 border-b border-fuchsia-800">
             <Info className="w-4 h-4 shrink-0" />
             <span>{announcement}</span>
         </div>
      )}
      <header className="border-b border-fuchsia-900/30 bg-[#0c0514]/80 backdrop-blur-md sticky z-40" style={{ top: announcement ? 'auto' : 0 }}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-fuchsia-400 font-serif text-2xl tracking-wide font-bold drop-shadow-[0_0_15px_rgba(192,38,211,0.5)]">
            <Scroll className="w-6 h-6" />
            <span>Harpia</span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
               <Link key={item.path} to={item.path} className={`text-sm flex items-center gap-2 transition-all ${location.pathname === item.path ? 'text-fuchsia-400 font-medium drop-shadow-[0_0_8px_rgba(192,38,211,0.5)]' : 'text-zinc-400 hover:text-fuchsia-300'}`}>
                 <item.icon className="w-4 h-4"/> {item.label}
               </Link>
            ))}
            {(dbUser?.role === 'admin' || dbUser?.role === 'moderator') && (
               <Link to="/admin" className={`text-sm flex items-center gap-2 ${location.pathname === '/admin' ? 'text-amber-400 font-medium drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-amber-500/70 hover:text-amber-300'}`}>
                 <Shield className="w-4 h-4"/> Conselho
               </Link>
            )}
            <DownloadAppDialog />
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-zinc-400 hover:text-white hover:bg-white/5 ml-2">
               <LogOut className="w-4 h-4 mr-2" /> Desconectar
            </Button>
          </nav>

          {/* Mobile Logout (Header) */}
          <div className="md:hidden flex items-center gap-2">
             <div className="mr-2">
               <DownloadAppDialog />
             </div>
             {(dbUser?.role === 'admin' || dbUser?.role === 'moderator') && (
               <Link to="/admin" className="text-amber-500/70 hover:text-amber-400 transition-colors drop-shadow-[0_0_5px_rgba(251,191,36,0.3)]">
                 <Shield className="w-5 h-5"/>
               </Link>
             )}
             <Button variant="ghost" size="icon" onClick={handleLogout} className="text-zinc-400 hover:bg-white/5">
               <LogOut className="w-5 h-5" />
             </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-10 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0c0514]/90 backdrop-blur-xl border-t border-fuchsia-900/20 flex items-center justify-around p-2 pb-safe z-50">
        {navItems.map(item => {
           const isActive = location.pathname === item.path;
           return (
             <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1.5 p-2 min-w-[64px] transition-all duration-300 relative ${isActive ? 'text-fuchsia-300' : 'text-zinc-500 hover:text-zinc-300'}`}>
               {isActive && (
                 <div className="absolute inset-0 bg-fuchsia-500/10 rounded-xl pointer-events-none"></div>
               )}
               <item.icon className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]' : ''}`}/>
               <span className="text-[10px] font-medium tracking-wider uppercase">{item.label}</span>
             </Link>
           );
        })}
      </nav>
    </div>
  )
}

