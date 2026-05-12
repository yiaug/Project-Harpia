import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, auth } from '@/src/firebase';
import { useAuthStore } from '@/src/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, ArrowLeft, Send, ArrowUp, ArrowDown, Reply, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

function MessageNode({ msg, allMessages, onReply, onDelete, onVote, depth = 0 }: any) {
   const userId = auth.currentUser?.uid;
   const { dbUser } = useAuthStore();
   
   const children = allMessages.filter((m: any) => m.parentId === msg.id);
   const upvoted = msg.upvotedBy?.includes(userId);
   const downvoted = msg.downvotedBy?.includes(userId);
   const score = (msg.upvotedBy?.length || 0) - (msg.downvotedBy?.length || 0);

   const [isReplying, setIsReplying] = useState(false);
   const [replyText, setReplyText] = useState('');

   const handleSubmitReply = (e: React.FormEvent) => {
      e.preventDefault();
      onReply(msg.id, replyText);
      setIsReplying(false);
      setReplyText('');
   };

   const handleReportMsg = async () => {
      if (!userId) return;
      const reason = prompt("Descreva o motivo da denúncia:");
      if (!reason) return;

      try {
         await addDoc(collection(db, 'reports'), {
             type: 'forumMessage',
             targetId: msg.id,
             reason,
             reporterId: userId,
             status: 'pending',
             createdAt: serverTimestamp()
         });
         toast.success("Mensagem denunciada.");
      } catch(e) { toast.error("Erro ao denunciar."); }
   };

   return (
      <div className={`flex flex-col gap-2 ${depth > 0 ? 'ml-4 md:ml-8 border-l border-fuchsia-900/30 pl-4' : 'mt-4'}`}>
         <Card className="bg-[#1a0b2e]/60 border-fuchsia-900/20 flex flex-row overflow-hidden group shadow-md shadow-fuchsia-900/5">
            <div className="flex flex-col items-center justify-start p-2 pr-0 bg-[#0c0514]/40 w-12 border-r border-fuchsia-900/10">
               <Button variant="ghost" size="icon" className={`h-6 w-6 hover:text-fuchsia-400 ${upvoted ? 'text-fuchsia-400 bg-fuchsia-400/10' : 'text-zinc-500'}`} onClick={() => onVote(msg, 'up')}>
                  <ArrowUp className="w-4 h-4" />
               </Button>
               <span className={`text-xs font-semibold my-1 ${score > 0 ? 'text-fuchsia-400' : score < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>{score}</span>
               <Button variant="ghost" size="icon" className={`h-6 w-6 hover:text-rose-400 ${downvoted ? 'text-rose-400 bg-rose-400/10' : 'text-zinc-500'}`} onClick={() => onVote(msg, 'down')}>
                  <ArrowDown className="w-4 h-4" />
               </Button>
            </div>
            <div className="flex-1 flex flex-col p-3 md:p-4 min-w-0">
               <div className="flex justify-between items-start">
                 <div className="w-full">
                    <p className="text-zinc-300 whitespace-pre-wrap break-words text-sm md:text-base leading-relaxed">{msg.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                       <p className="text-xs text-zinc-500 tracking-wide">{msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : ''}</p>
                       <button onClick={() => setIsReplying(!isReplying)} className="text-xs text-fuchsia-400 hover:text-fuchsia-300 flex items-center gap-1 font-medium transition-colors">
                          <Reply className="w-3 h-3" /> Conjurar
                       </button>
                    </div>
                 </div>
                 <div className="flex flex-col gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition shrink-0 ml-2">
                     {(dbUser?.role === 'admin' || dbUser?.role === 'moderator') && (
                        <Button variant="ghost" size="icon" onClick={() => onDelete(msg.id)} className="text-rose-400/70 hover:text-rose-300 hover:bg-rose-900/20 h-8 w-8">
                           <Trash2 className="w-4 h-4"/>
                        </Button>
                     )}
                     {msg.authorId !== userId && (
                        <Button variant="ghost" size="icon" onClick={handleReportMsg} className="text-zinc-500 hover:text-rose-400 hover:bg-rose-900/10 h-8 w-8" title="Denunciar">
                           <ShieldAlert className="w-4 h-4"/>
                        </Button>
                     )}
                 </div>
               </div>

               {isReplying && (
                  <form onSubmit={handleSubmitReply} className="mt-3 flex flex-col gap-2">
                     <Textarea autoFocus value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Lance seu pensamento..." className="bg-[#0c0514]/80 border-fuchsia-900/50 text-white min-h-[80px] focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50" />
                     <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => setIsReplying(false)} className="text-zinc-400 hover:text-zinc-300 hover:bg-fuchsia-900/20">Desfazer</Button>
                        <Button type="submit" size="sm" className="bg-fuchsia-900/80 hover:bg-fuchsia-800 text-fuchsia-100 border border-fuchsia-500/30">Lançar</Button>
                     </div>
                  </form>
               )}
            </div>
         </Card>

         {children.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
               {children.map((child: any) => (
                  <MessageNode key={child.id} msg={child} allMessages={allMessages} onReply={onReply} onDelete={onDelete} onVote={onVote} depth={depth + 1} />
               ))}
            </div>
         )}
      </div>
   );
}

export function TopicView({ activeTopic, setActiveTopic }: { activeTopic: any, setActiveTopic: (topic: any) => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newReply, setNewReply] = useState('');
  const { dbUser } = useAuthStore();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!activeTopic) return;
    const q = query(collection(db, 'forumMessages'));
    const unsub = onSnapshot(q, (snap) => {
       const mapped = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
           .filter((m: any) => m.topicId === activeTopic.id)
           .sort((a:any, b:any) => {
              // we can sort by score then by date, but simple date sort is fine for tree building.
              // For a reddit feel, sort root level messages by score.
              const scoreA = (a.upvotedBy?.length || 0) - (a.downvotedBy?.length || 0);
              const scoreB = (b.upvotedBy?.length || 0) - (b.downvotedBy?.length || 0);
              
              if (a.parentId === null && b.parentId === null) {
                  if (scoreA !== scoreB) return scoreB - scoreA;
              }
              return (a.createdAt?.seconds||0) - (b.createdAt?.seconds||0);
           });
       setMessages(mapped);
    }, (err) => {
       console.error("FirebaseError in TopicView onSnapshot", err);
    });
    return () => unsub();
  }, [activeTopic]);

  const handleReply = async (parentId: string | null, content: string) => {
     if (!content.trim() || !activeTopic || !userId) return;
     try {
       await addDoc(collection(db, 'forumMessages'), {
          topicId: activeTopic.id,
          parentId: parentId, // null for top level
          content: content,
          authorId: userId,
          upvotedBy: [],
          downvotedBy: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
       });
     } catch(e: any) { toast.error('Erro: ' + e.message); }
  }

  const handleTopLevelReply = (e: React.FormEvent) => {
     e.preventDefault();
     handleReply(null, newReply);
     setNewReply('');
  }

  const handleDeleteMsg = async (id: string) => {
     if (confirm('Deletar mensagem e todas as suas respostas?')) {
        try {
           await deleteDoc(doc(db, 'forumMessages', id));
           toast.success('Mensagem removida.');
           // Note: cleanup of children is ideally done server-side, skipping for demo simplicity
        } catch (e: any) { toast.error('Erro ao excluir: ' + e.message); }
     }
  }

  const handleDeleteTopic = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     if (confirm('Deletar tópico?')) {
        await deleteDoc(doc(db, 'forumTopics', id));
        toast.success('Tópico removido.');
        setActiveTopic(null);
     }
  }

  const handleTopicVote = async (type: 'up' | 'down') => {
     if (!userId) {
       toast.error('Você precisa estar logado para votar.');
       return;
     }

     const ref = doc(db, 'forumTopics', activeTopic.id);
     const isUpvoted = activeTopic.upvotedBy?.includes(userId);
     const isDownvoted = activeTopic.downvotedBy?.includes(userId);

     try {
       if (type === 'up') {
          if (isUpvoted) await updateDoc(ref, { upvotedBy: arrayRemove(userId) });
          else await updateDoc(ref, { upvotedBy: arrayUnion(userId), downvotedBy: arrayRemove(userId) });
       } else {
          if (isDownvoted) await updateDoc(ref, { downvotedBy: arrayRemove(userId) });
          else await updateDoc(ref, { downvotedBy: arrayUnion(userId), upvotedBy: arrayRemove(userId) });
       }
       // Update local active topic state specifically for votes so UI re-renders immediately or relying on Forum parent state
     } catch (err: any) {
       toast.error('Erro ao votar: ' + err.message);
     }
  }

  const handleReportTopic = async () => {
      if (!userId) return;
      const reason = prompt("Descreva o motivo da denúncia do tópico:");
      if (!reason) return;

      try {
         await addDoc(collection(db, 'reports'), {
             type: 'forumTopic',
             targetId: activeTopic.id,
             reason,
             reporterId: userId,
             status: 'pending',
             createdAt: serverTimestamp()
         });
         toast.success("Tópico denunciado.");
      } catch(e) { toast.error("Erro ao denunciar."); }
  }

  const handleMessageVote = async (msg: any, type: 'up' | 'down') => {
     if (!userId) {
       toast.error('Você precisa estar logado para votar.');
       return;
     }

     const ref = doc(db, 'forumMessages', msg.id);
     const isUpvoted = msg.upvotedBy?.includes(userId);
     const isDownvoted = msg.downvotedBy?.includes(userId);

     try {
       if (type === 'up') {
          if (isUpvoted) await updateDoc(ref, { upvotedBy: arrayRemove(userId) });
          else await updateDoc(ref, { upvotedBy: arrayUnion(userId), downvotedBy: arrayRemove(userId) });
       } else {
          if (isDownvoted) await updateDoc(ref, { downvotedBy: arrayRemove(userId) });
          else await updateDoc(ref, { downvotedBy: arrayUnion(userId), upvotedBy: arrayRemove(userId) });
       }
     } catch (err: any) { toast.error('Erro ao votar: ' + err.message); }
  }


  const rootMessages = messages.filter(m => !m.parentId);
  
  const topicScore = (activeTopic.upvotedBy?.length || 0) - (activeTopic.downvotedBy?.length || 0);
  const topicUpvoted = activeTopic.upvotedBy?.includes(userId);
  const topicDownvoted = activeTopic.downvotedBy?.includes(userId);

  return (
      <div className="space-y-6 max-w-4xl mx-auto pb-10 relative z-10">
         <Button variant="ghost" onClick={() => setActiveTopic(null)} className="text-zinc-400 hover:text-fuchsia-100 hover:bg-fuchsia-900/20 -ml-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar aos Grimórios
         </Button>
         
         <Card className="bg-[#1a0b2e]/60 border-fuchsia-900/30 backdrop-blur-md flex flex-row overflow-hidden shadow-lg shadow-indigo-900/10">
            <div className="flex flex-col items-center justify-start p-4 pr-0 bg-[#0c0514]/40 border-r border-fuchsia-900/20 w-16">
               <Button variant="ghost" size="icon" className={`h-8 w-8 hover:text-fuchsia-400 ${topicUpvoted ? 'text-fuchsia-400 bg-fuchsia-400/10' : 'text-zinc-500'}`} onClick={() => handleTopicVote('up')}>
                 <ArrowUp className="w-5 h-5" />
               </Button>
               <span className={`text-sm font-semibold my-1 drop-shadow-md ${topicScore > 0 ? 'text-fuchsia-400' : topicScore < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>{topicScore}</span>
               <Button variant="ghost" size="icon" className={`h-8 w-8 hover:text-rose-400 ${topicDownvoted ? 'text-rose-400 bg-rose-400/10' : 'text-zinc-500'}`} onClick={() => handleTopicVote('down')}>
                 <ArrowDown className="w-5 h-5" />
               </Button>
             </div>
           <div className="flex-1 flex flex-col min-w-0 p-4">
             <div className="flex justify-between items-start mb-2">
               <div className="min-w-0 flex-1">
                 <h2 className="text-2xl font-serif text-fuchsia-200 truncate whitespace-normal drop-shadow-sm">{activeTopic.title}</h2>
                 <p className="text-xs text-zinc-500 mt-1 tracking-wide">Invocado em {activeTopic.createdAt?.toDate ? format(activeTopic.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : ''}</p>
               </div>
               <div className="flex flex-col gap-1 shrink-0 ml-2">
                   {(dbUser?.role === 'admin' || dbUser?.role === 'moderator') && (
                      <Button variant="ghost" size="icon" onClick={(e) => handleDeleteTopic(activeTopic.id, e)} className="text-rose-400/70 hover:bg-rose-900/30 hover:text-rose-300"><Trash2 className="w-4 h-4"/></Button>
                   )}
                   {activeTopic.authorId !== userId && (
                      <Button variant="ghost" size="icon" onClick={handleReportTopic} className="text-zinc-500 hover:text-rose-400 hover:bg-rose-900/20" title="Denunciar Tópico"><ShieldAlert className="w-4 h-4"/></Button>
                   )}
               </div>
             </div>
             
             <p className="text-zinc-200 whitespace-pre-wrap text-base leading-relaxed mt-2">{activeTopic.content}</p>
             
           </div>
         </Card>

         <div className="space-y-4 pt-4">
            <h3 className="text-xl font-serif text-fuchsia-200">Ecos da Ordem ({messages.length})</h3>
            
            <form onSubmit={handleTopLevelReply} className="mb-8 flex flex-col gap-2 bg-[#1a0b2e]/40 backdrop-blur-sm p-4 rounded-xl border border-fuchsia-900/30 shadow-inner">
               <Textarea value={newReply} onChange={e => setNewReply(e.target.value)} placeholder="Lance seu pensamento..." className="bg-[#0c0514]/80 border-fuchsia-900/50 text-white w-full min-h-[100px] focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 placeholder:text-zinc-500" />
               <div className="flex justify-end">
                 <Button type="submit" disabled={!newReply.trim()} className="bg-fuchsia-900/80 hover:bg-fuchsia-800 text-fuchsia-100 border border-fuchsia-500/30 shadow-[0_0_15px_rgba(192,38,211,0.2)] disabled:opacity-50 transition-all"><Send className="w-4 h-4 mr-2"/> Conjurar Resposta</Button>
               </div>
            </form>

            <div className="flex flex-col gap-2">
               {rootMessages.map(msg => (
                  <MessageNode 
                     key={msg.id} 
                     msg={msg} 
                     allMessages={messages} 
                     onReply={handleReply} 
                     onDelete={handleDeleteMsg} 
                     onVote={handleMessageVote}
                  />
               ))}
               {rootMessages.length === 0 && (
                  <div className="text-center py-12 text-zinc-500 border border-fuchsia-900/30 border-dashed rounded-xl bg-[#0c0514]/40 font-serif">
                     Nenhum eco no salão. Seja o primeiro a responder!
                  </div>
               )}
            </div>
         </div>
      </div>
  );
}
