import React, { useState, useRef, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, setDoc, where } from 'firebase/firestore';
import { db, auth } from '@/src/firebase';
import { useAuthStore } from '@/src/stores/authStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageSquare, Trash2, Send, ChevronLeft, Heart, ThumbsUp, Smile, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const EMOJIS = ['❤️', '😂', '👍'];

export function TextChat({ room, onBack }: { room: any, onBack: () => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [presences, setPresences] = useState<any[]>([]);
  const msgEndRef = useRef<HTMLDivElement>(null);
  const { dbUser } = useAuthStore();
  const userId = auth.currentUser?.uid;
  const userName = dbUser?.email?.split('@')[0] || 'Usuário';
  
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
     // Fetch Messages
     const q = query(collection(db, 'chatMessages')); 
     const unsubMsg = onSnapshot(q, (snap) => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any)).filter(m => m.roomId === room.id).sort((a:any,b:any) => (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0));
        setMessages(msgs);
        setTimeout(() => msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
     }, (err) => {
        console.error("FirebaseError in TextChat msgs onSnapshot", err);
     });

     // Fetch Presences
     const pQuery = query(collection(db, 'chatPresences'), where('roomId', '==', room.id));
     const unsubPres = onSnapshot(pQuery, (snap) => {
        const pList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
         // Filter out stale presences (> 1 minute)
        const now = Date.now();
        const active = pList.filter((p: any) => p.updatedAt && typeof p.updatedAt.toMillis === 'function' && (now - p.updatedAt.toMillis() < 60000));
        setPresences(active);
     }, (err) => {
        console.error("FirebaseError in TextChat pres onSnapshot", err);
     });

     return () => {
        unsubMsg();
        unsubPres();
     };
  }, [room.id]);

  useEffect(() => {
     if (!userId) return;
     // Join Room Presence
     const presenceRef = doc(db, 'chatPresences', `${room.id}_${userId}`);
     const updatePresence = async () => {
         try {
            await setDoc(presenceRef, {
                roomId: room.id,
                userId,
                userName,
                isTyping: false,
                updatedAt: serverTimestamp()
            });
         } catch(e){}
     };
     
     updatePresence();
     const interval = setInterval(updatePresence, 30000); // keep alive

     return () => {
        clearInterval(interval);
        deleteDoc(presenceRef).catch(()=>{});
     };
  }, [room.id, userId, userName]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewMsg(e.target.value);
      if (!userId) return;
      
      const presenceRef = doc(db, 'chatPresences', `${room.id}_${userId}`);
      setDoc(presenceRef, {
          roomId: room.id,
          userId,
          userName,
          isTyping: true,
          updatedAt: serverTimestamp()
      }, { merge: true }).catch(()=>{});

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
          setDoc(presenceRef, { isTyping: false, updatedAt: serverTimestamp() }, { merge: true }).catch(()=>{});
      }, 2000);
  }

  const send = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!newMsg.trim()) return;
     const content = newMsg;
     setNewMsg('');
     // Clear typing state
     if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
     if (userId) {
        setDoc(doc(db, 'chatPresences', `${room.id}_${userId}`), { isTyping: false, updatedAt: serverTimestamp() }, { merge: true }).catch(()=>{});
     }

     try {
       await addDoc(collection(db, 'chatMessages'), {
          roomId: room.id,
          content,
          authorId: userId,
          authorName: userName,
          reactions: {}, // { "emoji": [userIds] }
          createdAt: serverTimestamp()
       });
     } catch (e: any) { alert(e.message); }
  }

  const handleDeleteMsg = async (id: string) => {
     if (confirm('Deletar mensagem?')) {
        await deleteDoc(doc(db, 'chatMessages', id));
     }
  }

  const handleReaction = async (msgId: string, emoji: string, currentReactions: any = {}) => {
     if (!userId) return;
     const userList = currentReactions[emoji] || [];
     const hasReacted = userList.includes(userId);
     
     const newReactions = { ...currentReactions };
     if (hasReacted) {
         newReactions[emoji] = userList.filter((uid: string) => uid !== userId);
         if (newReactions[emoji].length === 0) delete newReactions[emoji];
     } else {
         newReactions[emoji] = [...userList, userId];
     }

     try {
        await updateDoc(doc(db, 'chatMessages', msgId), {
            reactions: newReactions
        });
     } catch(e) { console.error("Error updating reactions", e); }
  }

  const handleReport = async (msgId: string) => {
      if (!userId) return;
      const reason = prompt("Por favor, descreva o motivo da denúncia:");
      if (!reason) return;

      try {
          await addDoc(collection(db, 'reports'), {
              type: 'chatMessage',
              targetId: msgId,
              reason,
              reporterId: userId,
              status: 'pending',
              createdAt: serverTimestamp()
          });
          toast.success("Mensagem denunciada.");
      } catch(e) {
          toast.error("Erro ao denunciar.");
      }
  }

  const typingUsers = presences.filter(p => p.isTyping && p.userId !== userId);

  return (
      <div className="w-full h-full flex flex-col bg-[#0c0514]">
         <div className="p-4 border-b border-fuchsia-900/30 bg-[#1a0b2e]/80 shrink-0 flex flex-col gap-2 backdrop-blur-md">
            <div className="flex items-center gap-3">
               <Button variant="ghost" size="icon" onClick={onBack} className="md:hidden text-zinc-400 hover:text-fuchsia-100 hover:bg-fuchsia-900/20 -ml-2 transition-colors">
                  <ChevronLeft className="w-5 h-5"/>
               </Button>
               <MessageSquare className="w-5 h-5 text-fuchsia-400 hidden md:block" />
               <span className="font-serif font-medium text-fuchsia-100 drop-shadow-sm">{room.name}</span>
            </div>
            
            <div className="flex px-8 -mt-2">
               <div className="text-xs text-zinc-400 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-1 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  {presences.length} presentes: {presences.map(p => p.userId === userId ? 'Seu Eco' : p.userName).join(', ')}
               </div>
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-fuchsia-900/10 via-[#0c0514] to-[#0c0514]">
            {messages.map(m => (
               <div key={m.id} className={`flex flex-col ${m.authorId === userId ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-end gap-2 group flex-wrap max-w-full relative">
                     <div className={`px-4 py-2 rounded-2xl max-w-[85vw] md:max-w-md break-words relative shadow-md ${m.authorId === userId ? 'bg-fuchsia-800 text-fuchsia-50 rounded-br-sm shadow-fuchsia-900/20' : 'bg-[#1a0b2e] border border-fuchsia-900/40 text-fuchsia-100 rounded-bl-sm shadow-indigo-900/10'}`}>
                        {m.authorId !== userId && <p className="text-xs text-fuchsia-400/80 mb-1 font-medium tracking-wide">{m.authorName}</p>}
                        {m.content}
                        
                        {/* Reaction Menu on hover */}
                        <div className={`absolute top-0 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all bg-[#0c0514] border border-fuchsia-900/50 rounded-full shadow-[0_0_15px_rgba(217,70,239,0.2)] flex items-center px-2 py-1 gap-1 z-10 ${m.authorId === userId ? 'right-4' : 'left-4'}`}>
                            {EMOJIS.map(e => (
                               <button key={e} onClick={() => handleReaction(m.id, e, m.reactions)} className="hover:scale-125 transition-transform text-lg">{e}</button>
                            ))}
                        </div>
                     </div>
                     <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition shrink-0 self-center">
                         {(dbUser?.role === 'admin' || dbUser?.role === 'moderator') && (
                            <button onClick={() => handleDeleteMsg(m.id)} className="text-zinc-600 hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4"/></button>
                         )}
                         {m.authorId !== userId && (
                            <button onClick={() => handleReport(m.id)} className="text-zinc-600 hover:text-amber-500 transition-colors" title="Denunciar Vibração"><ShieldAlert className="w-4 h-4"/></button>
                         )}
                     </div>
                  </div>
                  
                  {/* Display Reactions */}
                  {m.reactions && Object.keys(m.reactions).length > 0 && (
                     <div className={`flex gap-1 mt-1 ${m.authorId === userId ? 'pr-2' : 'pl-2'}`}>
                        {Object.entries(m.reactions).map(([emoji, users]: [string, any]) => (
                            <div key={emoji} onClick={() => handleReaction(m.id, emoji, m.reactions)} className={`text-[10px] px-1.5 py-0.5 rounded-full border cursor-pointer select-none transition-colors ${users.includes(userId) ? 'bg-fuchsia-900/40 border-fuchsia-500/50 text-fuchsia-200' : 'bg-[#1a0b2e]/60 border-fuchsia-900/30 text-zinc-400 hover:border-fuchsia-500/30'}`}>
                               {emoji} {users.length}
                            </div>
                        ))}
                     </div>
                  )}
               </div>
            ))}
            <div ref={msgEndRef} />
         </div>

         {/* Typing indicator */}
         {typingUsers.length > 0 && (
            <div className="px-6 py-1 text-xs text-fuchsia-400 italic bg-[#1a0b2e]/80 backdrop-blur-sm animate-pulse border-t border-fuchsia-900/20 font-medium">
               {typingUsers.length === 1 ? `${typingUsers[0].userName} está conjurando...` : 'Vários feitiços estão sendo conjurados...'}
            </div>
         )}

         <form onSubmit={send} className="p-3 md:p-4 border-t border-fuchsia-900/30 bg-[#1a0b2e]/90 backdrop-blur-md shrink-0 flex gap-2 relative z-10">
            <Input value={newMsg} onChange={handleTyping} placeholder="Canalize seu eco..." className="bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 flex-1 focus-visible:ring-1 focus-visible:ring-fuchsia-500/50 rounded-full px-4 placeholder:text-zinc-600" />
            <Button type="submit" size="icon" disabled={!newMsg.trim()} className="bg-fuchsia-700 hover:bg-fuchsia-600 text-white w-10 h-10 rounded-full shrink-0 shadow-[0_0_15px_rgba(217,70,239,0.4)] disabled:opacity-50 disabled:shadow-none transition-all"><Send className="w-4 h-4 ml-0.5"/></Button>
         </form>
      </div>
  )
}
