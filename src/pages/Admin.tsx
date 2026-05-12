import { useState } from 'react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuthStore } from '../stores/authStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UsersTab } from '@/components/admin/UsersTab';
import { BooksTab } from '@/components/admin/BooksTab';
import { CategoriesTab } from '@/components/admin/CategoriesTab';
import { ReportsTab } from '@/src/components/admin/ReportsTab';
import { RoomsAdminTab } from '@/src/components/admin/RoomsAdminTab';
import { GlobalSettingsTab } from '@/src/components/admin/GlobalSettingsTab';
import { ShieldAlert, Settings } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function Admin() {
  const { dbUser } = useAuthStore();
  const isAdmin = dbUser?.role === 'admin';
  const isModerator = dbUser?.role === 'moderator' || isAdmin;
  
  const { data: users = [], refetch: fetchUsers } = useQuery<any[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'users'), limit(500)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: isModerator,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: books = [], refetch: fetchBooks } = useQuery<any[]>({
    queryKey: ['books'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'books'), limit(500)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: isAdmin,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: categories = [], refetch: fetchCategories } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'categories'), limit(100)));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    },
    enabled: isAdmin,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return (
    <div className="space-y-6 relative z-10">
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-fuchsia-100 drop-shadow-md">Conselho dos Magos</h1>
        <p className="text-zinc-400 mt-2 text-sm tracking-wide">Controle e visão sobre o domínio de Harpia.</p>
      </div>
      <Tabs defaultValue="users" className="w-full">
         <TabsList className="bg-[#1a0b2e]/60 border-fuchsia-900/30 flex-wrap h-auto backdrop-blur-md">
           <TabsTrigger value="users" className="data-[state=active]:bg-fuchsia-900/40 data-[state=active]:text-fuchsia-100">Iniciados</TabsTrigger>
           {isAdmin && <TabsTrigger value="categories" className="data-[state=active]:bg-fuchsia-900/40 data-[state=active]:text-fuchsia-100">Círculos</TabsTrigger>}
           {isAdmin && <TabsTrigger value="books" className="data-[state=active]:bg-fuchsia-900/40 data-[state=active]:text-fuchsia-100">Grimórios</TabsTrigger>}
           {isAdmin && <TabsTrigger value="chats" className="data-[state=active]:bg-fuchsia-900/40 data-[state=active]:text-fuchsia-100">Câmaras</TabsTrigger>}
           <TabsTrigger value="reports" className="data-[state=active]:bg-rose-900/40 data-[state=active]:text-rose-400 text-rose-500/70"><ShieldAlert className="w-4 h-4 mr-2"/> Inquisição</TabsTrigger>
           {isAdmin && <TabsTrigger value="settings" className="data-[state=active]:bg-fuchsia-900/40 data-[state=active]:text-fuchsia-100"><Settings className="w-4 h-4 mr-2"/> Leis</TabsTrigger>}
         </TabsList>
         
         <TabsContent value="users" className="mt-6">
            <UsersTab users={users} fetchUsers={fetchUsers} isAdmin={isAdmin} />
         </TabsContent>

         {isAdmin && (
             <TabsContent value="categories" className="mt-6">
                <CategoriesTab categories={categories} fetchCategories={fetchCategories} />
             </TabsContent>
         )}

         {isAdmin && (
             <TabsContent value="books" className="mt-6">
                <BooksTab books={books} fetchBooks={fetchBooks} categories={categories} />
             </TabsContent>
         )}

         {isAdmin && (
             <TabsContent value="chats" className="mt-6">
                <RoomsAdminTab />
             </TabsContent>
         )}

         <TabsContent value="reports" className="mt-6">
            <ReportsTab />
         </TabsContent>

         {isAdmin && (
             <TabsContent value="settings" className="mt-6">
                <GlobalSettingsTab />
             </TabsContent>
         )}
      </Tabs>
    </div>
  )
}
