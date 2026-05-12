import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

export function CategoriesTab({ categories, fetchCategories }: { categories: any[], fetchCategories: () => void }) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategoryName.trim(),
        createdAt: serverTimestamp(),
      });
      toast.success('Categoria adicionada!');
      setNewCategoryName('');
      fetchCategories();
    } catch (e: any) {
      toast.error('Erro ao adicionar: ' + e.message);
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name?.trim()) return;
    try {
      await updateDoc(doc(db, 'categories', editingCategory.id), {
        name: editingCategory.name.trim()
      });
      toast.success('Categoria atualizada!');
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (e: any) {
      toast.error('Erro ao atualizar: ' + e.message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if(!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    try {
       await deleteDoc(doc(db, 'categories', id));
       toast.success("Categoria excluída");
       fetchCategories();
    } catch (e: any) {
       toast.error("Erro ao excluir: " + e.message);
    }
  }

  const openEditDialog = (category: any) => {
     setEditingCategory({ ...category });
     setIsEditDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <Card className="bg-[#1a0b2e]/60 border-fuchsia-900/30 backdrop-blur-md shadow-lg shadow-fuchsia-900/10">
        <CardHeader>
          <CardTitle className="text-fuchsia-200 font-serif">Fundar Novo Círculo</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-4 max-w-md">
            <Input 
              placeholder="Nome do Círculo (Categoria)" 
              required 
              value={newCategoryName} 
              onChange={e => setNewCategoryName(e.target.value)} 
              className="bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50" 
            />
            <Button type="submit" className="bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/20 whitespace-nowrap">Estabelecer</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[#1a0b2e]/60 border-fuchsia-900/30 backdrop-blur-md shadow-lg shadow-fuchsia-900/10">
        <CardHeader>
          <CardTitle className="text-fuchsia-200 font-serif">Círculos de Conhecimento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-fuchsia-900/20">
            <Table>
              <TableHeader className="bg-[#0c0514]/60">
                <TableRow className="border-fuchsia-900/20 hover:bg-transparent">
                  <TableHead className="text-zinc-400 font-serif">Nomeação</TableHead>
                  <TableHead className="text-zinc-400 font-serif w-24">Encantos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(c => (
                  <TableRow key={c.id} className="border-fuchsia-900/10 hover:bg-fuchsia-900/10 transition-colors">
                    <TableCell className="text-fuchsia-100 font-medium">{c.name}</TableCell>
                    <TableCell>
                       <div className="flex gap-2 opacity-70 hover:opacity-100 transition-opacity">
                         <Button size="icon" variant="ghost" onClick={() => openEditDialog(c)} className="text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300">
                            <Pencil className="w-4 h-4" />
                         </Button>
                         <Button size="icon" variant="ghost" onClick={() => handleDeleteCategory(c.id)} className="text-rose-400 hover:bg-rose-900/20 hover:text-rose-300">
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
        <DialogContent className="bg-[#1a0b2e] border border-fuchsia-900/50 text-fuchsia-100 backdrop-blur-xl shadow-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl drop-shadow-sm">Transmutar Círculo</DialogTitle>
          </DialogHeader>
          {editingCategory && (
             <form onSubmit={handleEditCategory} className="space-y-4 py-4">
                <Input 
                  placeholder="Nome do Círculo" 
                  required 
                  value={editingCategory.name} 
                  onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} 
                  className="bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50" 
                />
                <Button type="submit" className="w-full bg-emerald-700 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/20">Selar Alterações</Button>
             </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
