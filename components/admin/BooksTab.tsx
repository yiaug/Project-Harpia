import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export function BooksTab({ books, fetchBooks, categories }: { books: any[], fetchBooks: () => void, categories: any[] }) {
  const [newBook, setNewBook] = useState({ title: '', author: '', synopsis: '', categoryId: '', pdfUrl: '', coverBase64: '' });
  const [editingBook, setEditingBook] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
           setNewBook(prev => ({ ...prev, coverBase64: reader.result as string }));
        };
        reader.readAsDataURL(file);
     }
  }

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.categoryId) {
       toast.error("Por favor, selecione uma categoria para o livro.");
       return;
    }
    try {
      await addDoc(collection(db, 'books'), {
        ...newBook,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Livro adicionado!');
      setNewBook({ title: '', author: '', synopsis: '', categoryId: '', pdfUrl: '', coverBase64: '' });
      fetchBooks();
    } catch (e: any) {
      toast.error('Erro ao adicionar: ' + e.message);
    }
  }

  const handleDeleteBook = async (id: string) => {
    if(!confirm("Tem certeza que deseja excluir este livro?")) return;
    try {
       await deleteDoc(doc(db, 'books', id));
       toast.success("Livro excluído");
       fetchBooks();
    } catch (e: any) {
       toast.error("Erro ao excluir livro: " + e.message);
    }
  }

  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook.categoryId) {
       toast.error("Por favor, selecione uma categoria para o livro.");
       return;
    }
    try {
      await updateDoc(doc(db, 'books', editingBook.id), {
        title: editingBook.title,
        author: editingBook.author,
        synopsis: editingBook.synopsis,
        categoryId: editingBook.categoryId,
        pdfUrl: editingBook.pdfUrl,
        coverBase64: editingBook.coverBase64,
        updatedAt: serverTimestamp()
      });
      toast.success('Livro atualizado!');
      setIsEditDialogOpen(false);
      setEditingBook(null);
      fetchBooks();
    } catch (e: any) {
      toast.error('Erro ao atualizar: ' + e.message);
    }
  }

  const handleEditCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
           setEditingBook((prev: any) => ({ ...prev, coverBase64: reader.result as string }));
        };
        reader.readAsDataURL(file);
     }
  }

  const openEditDialog = (book: any) => {
    setEditingBook({ ...book });
    setIsEditDialogOpen(true);
  }

  const getCategoryName = (id: string) => {
    return categories.find(c => c.id === id)?.name || id;
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a0b2e]/60 border-fuchsia-900/30 backdrop-blur-md shadow-lg shadow-fuchsia-900/10">
        <CardHeader>
          <CardTitle className="text-fuchsia-200 font-serif">Adiscionar Grimório</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddBook} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input placeholder="Título (Nome do Grimório)" required value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} className="bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50" />
                <Input placeholder="Autor (Sábio)" required value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} className="bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50" />
                
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 px-3 py-2 text-sm focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50"
                  required
                  value={newBook.categoryId}
                  onChange={e => setNewBook({...newBook, categoryId: e.target.value})}
                >
                  <option value="" disabled className="bg-[#1a0b2e]">Selecione um Círculo</option>
                  {categories.map(c => (
                     <option key={c.id} value={c.id} className="bg-[#1a0b2e]">{c.name}</option>
                  ))}
                </select>

                <Input placeholder="Link do Prisma (URL PDF/Drive)" required value={newBook.pdfUrl} onChange={e => setNewBook({...newBook, pdfUrl: e.target.value})} className="bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50" />
              </div>
              <Textarea placeholder="Sinopse (Vislumbre do Conhecimento)" required value={newBook.synopsis} onChange={e => setNewBook({...newBook, synopsis: e.target.value})} className="bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                    <label className="text-sm text-zinc-400 mb-1 block">Aura da Capa</label>
                    <Input type="file" accept="image/*" onChange={handleCoverUpload} className="bg-[#0c0514]/60 border-fuchsia-900/50 text-zinc-400 cursor-pointer focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 file:bg-fuchsia-900/50 file:text-fuchsia-200 file:border-0 file:rounded file:px-2 file:py-1 file:mr-4 file:hover:bg-fuchsia-800 transition-colors" />
                </div>
                {newBook.coverBase64 && (
                    <div className="w-16 h-24 bg-[#0c0514] rounded overflow-hidden border border-fuchsia-900/50">
                      <img src={newBook.coverBase64} className="w-full h-full object-cover" />
                    </div>
                )}
              </div>
              <Button type="submit" className="bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/20">Selar Grimório</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[#1a0b2e]/60 border-fuchsia-900/30 backdrop-blur-md shadow-lg shadow-fuchsia-900/10">
        <CardHeader>
          <CardTitle className="text-fuchsia-200 font-serif">Biblioteca Arcana</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto rounded-lg border border-fuchsia-900/20">
              <Table>
              <TableHeader className="bg-[#0c0514]/60">
                <TableRow className="border-fuchsia-900/20 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-serif">Título</TableHead>
                  <TableHead className="text-zinc-400 font-serif">Autor</TableHead>
                  <TableHead className="text-zinc-400 font-serif">Círculo</TableHead>
                  <TableHead className="text-zinc-400 font-serif min-w-[150px]">Manifestado em</TableHead>
                  <TableHead className="text-zinc-400 font-serif w-24">Encantos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map(b => (
                  <TableRow key={b.id} className="border-fuchsia-900/10 hover:bg-fuchsia-900/10 transition-colors">
                    <TableCell className="text-fuchsia-100 min-w-[200px] font-medium">{b.title}</TableCell>
                    <TableCell className="text-zinc-400 min-w-[150px]">{b.author}</TableCell>
                    <TableCell className="text-zinc-400">{getCategoryName(b.categoryId)}</TableCell>
                    <TableCell className="text-zinc-500 whitespace-nowrap">{b.createdAt?.seconds ? new Date(b.createdAt.seconds * 1000).toLocaleDateString() : ''}</TableCell>
                    <TableCell>
                       <div className="flex gap-2 opacity-70 hover:opacity-100 transition-opacity">
                         <Button size="icon" variant="ghost" onClick={() => openEditDialog(b)} className="text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300">
                            <Pencil className="w-4 h-4" />
                         </Button>
                         <Button size="icon" variant="ghost" onClick={() => handleDeleteBook(b.id)} className="text-rose-400 hover:bg-rose-900/20 hover:text-rose-300">
                            <Trash2 className="w-4 h-4" />
                         </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1a0b2e] border border-fuchsia-900/50 text-fuchsia-100 backdrop-blur-xl shadow-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl drop-shadow-sm">Ajustar Aura do Grimório</DialogTitle>
          </DialogHeader>
          {editingBook && (
            <form onSubmit={handleEditBook} className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input placeholder="Título" required value={editingBook.title} onChange={e => setEditingBook({...editingBook, title: e.target.value})} className="bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50" />
                <Input placeholder="Autor" required value={editingBook.author} onChange={e => setEditingBook({...editingBook, author: e.target.value})} className="bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50" />
                
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-md border bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 px-3 py-2 text-sm focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50"
                  required
                  value={editingBook.categoryId}
                  onChange={e => setEditingBook({...editingBook, categoryId: e.target.value})}
                >
                  <option value="" disabled className="bg-[#1a0b2e]">Selecione um Círculo</option>
                  {categories.map(c => (
                     <option key={c.id} value={c.id} className="bg-[#1a0b2e]">{c.name}</option>
                  ))}
                </select>

                <Input placeholder="URL do Google Drive/PDF" required value={editingBook.pdfUrl} onChange={e => setEditingBook({...editingBook, pdfUrl: e.target.value})} className="bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50" />
              </div>
              <Textarea placeholder="Sinopse" required value={editingBook.synopsis} onChange={e => setEditingBook({...editingBook, synopsis: e.target.value})} className="bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 min-h-[100px]" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                    <label className="text-sm text-zinc-400 mb-1 block">Aura da Capa (Opcional transmutação)</label>
                    <Input type="file" accept="image/*" onChange={handleEditCoverUpload} className="bg-[#0c0514]/60 border-fuchsia-900/50 text-zinc-400 cursor-pointer file:bg-fuchsia-900/50 file:text-fuchsia-200 file:border-0 file:rounded file:px-2 file:py-1 file:mr-4 file:hover:bg-fuchsia-800 transition-colors focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50" />
                </div>
                {editingBook.coverBase64 && (
                    <div className="w-16 h-24 bg-[#0c0514] rounded border border-fuchsia-900/50 overflow-hidden">
                      <img src={editingBook.coverBase64} className="w-full h-full object-cover" />
                    </div>
                )}
              </div>
              <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-600 text-white mt-4 shadow-lg shadow-emerald-900/20">Selar Alterações</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
