import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, MessageSquare } from 'lucide-react';

import { TextChat } from '@/components/chat/TextChat';
import { VoiceChat } from '@/components/chat/VoiceChat';

export default function Chats() {
  const [rooms, setRooms] = useState<any[]>([]);
  const { dbUser } = useAuthStore();
  const [activeRoom, setActiveRoom] = useState<any>(null);

  useEffect(() => {
    const q = query(collection(db, 'chatRooms'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
       const mappedRooms = snap.docs.map(d => ({ id: d.id, ...d.data() }));
       setRooms(mappedRooms);
       
       if (activeRoom) {
          const stillExists = mappedRooms.find((r: any) => r.id === activeRoom.id);
          if (!stillExists) setActiveRoom(null);
       }
    }, (err) => {
       console.error("FirebaseError in Chats onSnapshot", err);
    });
    return () => unsub();
  }, [activeRoom?.id]);

  return (
    <div className="flex h-[calc(100dvh-12rem)] md:h-[calc(100dvh-8rem)] gap-0 md:gap-6 relative z-10 w-full">
       {/* Sidebar / Room List */}
       <div className={`w-full md:w-1/3 flex-col space-y-4 ${activeRoom ? 'hidden md:flex' : 'flex'}`}>
          <Card className="bg-[#1a0b2e]/60 border-fuchsia-900/30 backdrop-blur-md flex-1 flex flex-col overflow-hidden shadow-lg shadow-indigo-900/10">
             <CardHeader className="border-b border-fuchsia-900/20 pb-4 bg-[#0c0514]/40">
               <CardTitle className="text-xl font-serif text-fuchsia-100 drop-shadow-sm">Câmaras de Ecos</CardTitle>
             </CardHeader>
             <CardContent className="flex-1 overflow-y-auto p-0 scroll-smooth">
               {rooms.map(room => (
                 <div 
                   key={room.id} 
                   onClick={() => setActiveRoom(room)}
                   className={`p-4 border-b border-fuchsia-900/10 cursor-pointer hover:bg-fuchsia-900/20 transition-all flex items-center justify-between group ${activeRoom?.id === room.id ? 'bg-fuchsia-900/30 border-l-4 border-l-fuchsia-400' : 'border-l-4 border-l-transparent'}`}
                 >
                   <div className="flex items-center gap-3">
                     <div className={`p-3 rounded-xl transition-colors ${room.type === 'voice' ? 'bg-amber-900/20 text-amber-500 group-hover:bg-amber-900/40 group-hover:text-amber-400' : 'bg-fuchsia-900/20 text-fuchsia-400 group-hover:bg-fuchsia-900/40 group-hover:text-fuchsia-300'}`}>
                        {room.type === 'voice' ? <Mic className="w-5 h-5"/> : <MessageSquare className="w-5 h-5"/>}
                     </div>
                     <span className={`font-medium transition-colors ${activeRoom?.id === room.id ? 'text-fuchsia-100' : 'text-zinc-300 group-hover:text-fuchsia-200'}`}>{room.name}</span>
                   </div>
                 </div>
               ))}
               {rooms.length === 0 && <div className="p-8 text-center text-zinc-500 font-serif">Ainda não existem câmaras abertas.</div>}
             </CardContent>
          </Card>
       </div>
       
       {/* Chat Area */}
       <div className={`flex-1 bg-[#1a0b2e]/60 border border-fuchsia-900/30 backdrop-blur-md md:rounded-xl overflow-hidden flex-col items-center justify-center relative shadow-lg shadow-fuchsia-900/10 ${activeRoom ? 'flex absolute inset-0 md:relative z-20' : 'hidden md:flex'}`}>
          {activeRoom ? (
             activeRoom.type === 'voice' ? <VoiceChat room={activeRoom} onBack={() => setActiveRoom(null)} /> : <TextChat room={activeRoom} onBack={() => setActiveRoom(null)} />
          ) : (
             <div className="text-zinc-500 flex flex-col items-center p-8 text-center">
                 <div className="bg-[#0c0514]/40 border border-fuchsia-900/30 p-6 rounded-full mb-6 relative">
                   <div className="absolute inset-0 bg-fuchsia-500/10 rounded-full blur-xl animate-pulse"></div>
                   <MessageSquare className="w-12 h-12 text-fuchsia-400/50 relative z-10" />
                 </div>
                 <h3 className="text-2xl font-serif text-fuchsia-200/80 mb-2">Salão Principal</h3>
                 <p className="max-w-xs text-sm mt-2">Escolha uma câmara ao lado para conectar sua essência aos demais membros da Ordem.</p>
             </div>
          )}
       </div>
    </div>
  )
}
