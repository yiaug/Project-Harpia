import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { TopicView } from '@/components/forum/TopicView';

export default function Forum() {
  const [topics, setTopics] = useState<any[]>([]);
  const [activeTopic, setActiveTopic] = useState<any>(null);
  
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const { dbUser } = useAuthStore();
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const q = query(collection(db, 'forumTopics'), orderBy('createdAt', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
       const mapped = snap.docs.map(d => ({ id: d.id, ...d.data() }));
       // Optional: sorting by vote score: 
       // mapped.sort((a,b) => ((b.upvotedBy?.length || 0) - (b.downvotedBy?.length || 0)) - ((a.upvotedBy?.length || 0) - (a.downvotedBy?.length || 0)));
       setTopics(mapped);
       if (activeTopic) {
          const updatedActive = mapped.find(t => t.id === activeTopic.id);
          if (!updatedActive) setActiveTopic(null); // was deleted
          else setActiveTopic(updatedActive);
       }
    }, (err) => {
       console.error("FirebaseError in Forum onSnapshot", err);
    });
    return () => unsub();
  }, [activeTopic?.id]);

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim() || !userId) return;
    try {
      await addDoc(collection(db, 'forumTopics'), {
        title: newTitle,
        content: newContent,
        authorId: userId,
        categoryId: 'general',
        upvotedBy: [],
        downvotedBy: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewTitle('');
      setNewContent('');
      toast.success('Tópico criado!');
    } catch (e: any) { toast.error('Erro: ' + e.message); }
  }

  const handleDeleteTopic = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     if (confirm('Deletar tópico?')) {
        await deleteDoc(doc(db, 'forumTopics', id));
        toast.success('Tópico removido.');
     }
  }

  const handleVote = async (topic: any, type: 'up' | 'down', e: React.MouseEvent) => {
     e.stopPropagation();
     if (!userId) {
       toast.error('Você precisa estar logado para votar.');
       return;
     }

     const ref = doc(db, 'forumTopics', topic.id);
     const isUpvoted = topic.upvotedBy?.includes(userId);
     const isDownvoted = topic.downvotedBy?.includes(userId);

     try {
       if (type === 'up') {
          if (isUpvoted) {
             await updateDoc(ref, { upvotedBy: arrayRemove(userId) });
          } else {
             await updateDoc(ref, { upvotedBy: arrayUnion(userId), downvotedBy: arrayRemove(userId) });
          }
       } else {
          if (isDownvoted) {
             await updateDoc(ref, { downvotedBy: arrayRemove(userId) });
          } else {
             await updateDoc(ref, { downvotedBy: arrayUnion(userId), upvotedBy: arrayRemove(userId) });
          }
       }
     } catch (err: any) {
       toast.error('Erro ao votar: ' + err.message);
     }
  }

  if (activeTopic) {
     return <TopicView activeTopic={activeTopic} setActiveTopic={setActiveTopic} />;
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="relative z-10 mb-8">
         <h1 className="text-4xl font-serif text-fuchsia-100 flex items-center gap-3 drop-shadow-md"><MessageSquare className="text-fuchsia-400 w-8 h-8" /> Círculo de Debates</h1>
         <p className="text-zinc-400 mt-2 tracking-wide text-sm">Compartilhe suas experiências e dúvidas com a ordem.</p>
      </div>

      <Card className="bg-[#1a0b2e]/60 border-fuchsia-900/30 backdrop-blur-md relative z-10 shadow-lg shadow-indigo-900/10">
        <CardHeader>
          <CardTitle className="text-lg text-fuchsia-100/90 font-serif">A conjurar um novo debate...</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateTopic} className="space-y-4">
             <Input placeholder="Título do grimório de debate..." value={newTitle} onChange={e => setNewTitle(e.target.value)} className="bg-[#0c0514]/80 border-fuchsia-900/50 text-white focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 placeholder:text-zinc-500" />
             <Textarea placeholder="Insira o feitiço descritivo..." value={newContent} onChange={e => setNewContent(e.target.value)} className="bg-[#0c0514]/80 border-fuchsia-900/50 text-white min-h-[100px] focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 placeholder:text-zinc-500" />
             <Button type="submit" className="bg-fuchsia-900/80 hover:bg-fuchsia-800 text-fuchsia-100 border border-fuchsia-500/30 shadow-[0_0_15px_rgba(192,38,211,0.2)] transition-all">Invocar Tópico</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4 relative z-10">
         {topics.map(topic => {
           const upvoted = topic.upvotedBy?.includes(userId);
           const downvoted = topic.downvotedBy?.includes(userId);
           const score = (topic.upvotedBy?.length || 0) - (topic.downvotedBy?.length || 0);

           return (
             <Card key={topic.id} className="bg-[#1a0b2e]/60 border-fuchsia-900/30 backdrop-blur-md cursor-pointer hover:border-fuchsia-500/50 hover:shadow-[0_0_15px_rgba(217,70,239,0.15)] transition-all flex flex-row group" onClick={() => setActiveTopic(topic)}>
               <div className="flex flex-col items-center justify-start p-4 pr-0 bg-[#0c0514]/40 rounded-l-xl border-r border-fuchsia-900/20">
                 <Button variant="ghost" size="icon" className={`h-8 w-8 hover:text-fuchsia-400 ${upvoted ? 'text-fuchsia-400 bg-fuchsia-400/10' : 'text-zinc-500'}`} onClick={(e) => handleVote(topic, 'up', e)}>
                   <ArrowUp className="w-5 h-5" />
                 </Button>
                 <span className={`text-sm font-semibold my-1 drop-shadow-md ${score > 0 ? 'text-fuchsia-400' : score < 0 ? 'text-rose-400' : 'text-zinc-400'}`}>{score}</span>
                 <Button variant="ghost" size="icon" className={`h-8 w-8 hover:text-rose-400 ${downvoted ? 'text-rose-400 bg-rose-400/10' : 'text-zinc-500'}`} onClick={(e) => handleVote(topic, 'down', e)}>
                   <ArrowDown className="w-5 h-5" />
                 </Button>
               </div>
               <div className="flex-1 flex flex-col min-w-0">
                 <CardHeader className="flex flex-row items-start justify-between pb-2 pr-4 pt-4 pl-4">
                   <div className="min-w-0 flex-1 pr-2">
                      <CardTitle className="text-xl text-fuchsia-200 mb-1 truncate group-hover:text-fuchsia-100 transition-colors drop-shadow-sm">{topic.title}</CardTitle>
                      <p className="text-xs text-zinc-500 tracking-wide">
                        Invocado em {topic.createdAt?.toDate ? format(topic.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : ''}
                      </p>
                   </div>
                   {dbUser?.role === 'admin' && (
                      <Button variant="ghost" size="icon" onClick={(e) => handleDeleteTopic(topic.id, e)} className="text-rose-400/70 hover:bg-rose-900/30 hover:text-rose-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4"/>
                      </Button>
                   )}
                 </CardHeader>
                 <CardContent className="pl-4 pr-4 pb-4">
                    <p className="text-zinc-300 line-clamp-2 leading-relaxed text-sm">{topic.content}</p>
                 </CardContent>
               </div>
             </Card>
           );
         })}
      </div>
    </div>
  )
}

