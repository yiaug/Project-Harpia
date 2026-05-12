import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, limit } from 'firebase/firestore';
import { db, auth } from '@/src/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, MessageSquare, Mic, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

export function RoomsAdminTab() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('text');
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Edit states
  const [editRoomId, setEditRoomId] = useState('');
  const [editRoomName, setEditRoomName] = useState('');

  const fetchRooms = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'chatRooms'), limit(100)));
      setRooms(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching rooms", error);
    }
  };

  useEffect(() => {
     fetchRooms();
  }, []);

  const handleCreateRoom = async () => {
      if(!newRoomName.trim()) return;
      setLoading(true);
      try {
         await addDoc(collection(db, 'chatRooms'), {
             name: newRoomName,
             type: newRoomType,
             createdBy: auth.currentUser?.uid,
             createdAt: serverTimestamp()
         });
         toast.success('Sala criada!');
         setNewRoomName('');
         setIsDialogOpen(false);
         fetchRooms();
      } catch(e) { toast.error("Erro ao criar"); }
      setLoading(false);
  }

  const handleDelete = async (id: string) => {
      if(!confirm("Tem certeza que deseja apagar esta sala? As mensagens continuam, mas ficarão inacessíveis.")) return;
      try {
         await deleteDoc(doc(db, 'chatRooms', id));
         toast.success('Sala apagada');
         fetchRooms();
      } catch(e) { toast.error("Erro ao apagar"); }
  }

  const handleEditInit = (id: string, name: string) => {
      setEditRoomId(id);
      setEditRoomName(name);
  }

  const saveEdit = async () => {
      if(!editRoomName.trim() || !editRoomId) return;
      try {
          await updateDoc(doc(db, 'chatRooms', editRoomId), { name: editRoomName });
          setEditRoomId('');
          setEditRoomName('');
          toast.success("Sala renomeada.");
          fetchRooms();
      } catch(e) { toast.error("Erro ao editar."); }
  }

  return (
      <div className="space-y-6">
         <div className="flex justify-between items-center">
             <h2 className="text-2xl font-serif text-rose-300 drop-shadow-sm">Controle de Câmaras</h2>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                 <DialogTrigger render={<Button className="bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/20" />}>
                     Abrir Câmara
                 </DialogTrigger>
                 <DialogContent className="bg-[#1a0b2e] border border-fuchsia-900/50 text-fuchsia-100 backdrop-blur-xl shadow-2xl">
                     <DialogHeader>
                         <DialogTitle className="font-serif text-2xl drop-shadow-sm">Conjurar Nova Câmara</DialogTitle>
                     </DialogHeader>
                     <div className="space-y-4 py-4">
                         <div className="space-y-2">
                             <Label className="text-zinc-400">Nome da Câmara</Label>
                             <Input value={newRoomName} onChange={e => setNewRoomName(e.target.value)} placeholder="Ex: Salão de Alquimia" className="bg-[#0c0514]/60 border-fuchsia-900/50 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 text-fuchsia-100 placeholder:text-zinc-600" />
                         </div>
                         <div className="space-y-2">
                             <Label className="text-zinc-400">Natureza da Câmara</Label>
                             <div className="flex gap-2">
                                <Button type="button" onClick={() => setNewRoomType('text')} variant={newRoomType === 'text' ? 'default' : 'outline'} className={`flex-1 transition-all ${newRoomType === 'text' ? 'bg-fuchsia-700 hover:bg-fuchsia-600 border-fuchsia-500 text-white' : 'border-fuchsia-900/50 text-zinc-400 hover:bg-fuchsia-900/20 hover:text-fuchsia-200'}`}>
                                    <MessageSquare className="w-4 h-4 mr-2" /> Ecos (Texto)
                                </Button>
                                <Button type="button" onClick={() => setNewRoomType('voice')} variant={newRoomType === 'voice' ? 'default' : 'outline'} className={`flex-1 transition-all ${newRoomType === 'voice' ? 'bg-amber-700 hover:bg-amber-600 border-amber-500 text-white' : 'border-amber-900/50 text-zinc-400 hover:bg-amber-900/20 hover:text-amber-200'}`}>
                                    <Mic className="w-4 h-4 mr-2" /> Frequência (Voz)
                                </Button>
                             </div>
                         </div>
                     </div>
                     <DialogFooter>
                         <Button onClick={handleCreateRoom} disabled={loading} className="bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/20">Manifestar</Button>
                     </DialogFooter>
                 </DialogContent>
             </Dialog>
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {rooms.map(room => (
                 <Card key={room.id} className="bg-[#1a0b2e]/60 border-fuchsia-900/30 hover:border-fuchsia-500/50 transition-all backdrop-blur-md shadow-lg shadow-fuchsia-900/10 group">
                     <CardHeader className="pb-3 flex flex-row items-center justify-between bg-[#0c0514]/20">
                         <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${room.type === 'text' ? 'bg-fuchsia-900/30' : 'bg-amber-900/30'}`}>
                                {room.type === 'text' ? <MessageSquare className="w-5 h-5 text-fuchsia-400" /> : <Mic className="w-5 h-5 text-amber-400" />}
                             </div>
                             {editRoomId === room.id ? (
                                 <Input value={editRoomName} onChange={e => setEditRoomName(e.target.value)} className="h-8 w-32 bg-[#0c0514]/80 border-fuchsia-500 text-sm text-fuchsia-100 focus:ring-1 focus:ring-fuchsia-500" />
                             ) : (
                                 <CardTitle className="text-fuchsia-100 text-lg font-serif">{room.name}</CardTitle>
                             )}
                         </div>
                         <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                             {editRoomId === room.id ? (
                                <Button onClick={saveEdit} size="sm" variant="ghost" className="h-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/20">Selo</Button>
                             ) : (
                                <Button onClick={() => handleEditInit(room.id, room.name)} variant="ghost" size="icon" className="w-8 h-8 text-zinc-400 hover:text-fuchsia-400 hover:bg-fuchsia-900/20">
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                             )}
                             <Button onClick={() => handleDelete(room.id)} variant="ghost" size="icon" className="w-8 h-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-900/20">
                                 <Trash2 className="w-4 h-4" />
                             </Button>
                         </div>
                     </CardHeader>
                 </Card>
             ))}
             {rooms.length === 0 && (
                 <div className="col-span-full py-12 text-center text-zinc-500 border border-fuchsia-900/20 border-dashed rounded-xl bg-[#1a0b2e]/30 font-serif">
                     Nenhuma câmara ecoa neste domínio.
                 </div>
             )}
         </div>
      </div>
  )
}
