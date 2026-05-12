import React, { useState } from 'react';
import { collection, query, getDocs, orderBy, where, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Input } from '@/components/ui/input';
import { Scroll, Search, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BookDetailsDialog } from '@/src/components/library/BookDetailsDialog';
import { useQuery } from '@tanstack/react-query';

export default function Library() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;

  const { data: books = [] } = useQuery<any[]>({
    queryKey: ['books'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'books'), limit(500)));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const snap = await getDocs(query(collection(db, 'categories'), orderBy('name'), limit(100)));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: rawProgress = [] } = useQuery<any[]>({
    queryKey: ['userProgress', userId],
    queryFn: async () => {
      if (!userId) return [];
      const snap = await getDocs(query(collection(db, 'userProgress'), where('userId', '==', userId)));
      return snap.docs.map(d => d.data());
    },
    enabled: !!userId,
  });

  const readingProgress = rawProgress.map(p => ({
    ...p,
    book: books.find(b => b.id === (p as any).bookId)
  })).filter(p => p.book);

  const filteredBooks = books.filter(book => {
      const matchSearch = String((book as any).title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          String((book as any).author || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'all' || (book as any).categoryId === selectedCategory;
      return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-8 relative z-10">
       <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
         <div>
           <h1 className="text-4xl font-serif text-fuchsia-100 drop-shadow-md">Biblioteca Arcaica</h1>
           <p className="text-zinc-400 mt-2 text-sm tracking-wide">Explore os conhecimentos sagrados e feitiços milenares.</p>
         </div>
         
         <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fuchsia-400 opacity-70 group-focus-within:opacity-100 transition-opacity" />
              <Input 
                placeholder="Buscar grimórios, magos..." 
                className="pl-9 bg-[#1a0b2e]/60 border-fuchsia-900/30 text-white w-full sm:w-64 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 backdrop-blur-sm"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            
            <select 
              className="flex h-10 items-center justify-between rounded-md border bg-[#1a0b2e]/60 border-fuchsia-900/30 text-zinc-300 px-3 py-2 text-sm w-full sm:w-48 outline-none focus:border-fuchsia-500/50 backdrop-blur-sm"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todos os Círculos</option>
              {categories.map(c => (
                 <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
         </div>
       </div>
       
       {readingProgress.length > 0 && (
         <div className="mb-8">
           <h2 className="text-xl font-serif text-fuchsia-200 mb-4 flex items-center gap-2">
             <Play className="w-4 h-4 text-fuchsia-400" />
             Estudo em Progresso
           </h2>
           <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
             {readingProgress.map(prog => (
               <div 
                 key={prog.bookId}
                 onClick={() => navigate(`/read/${prog.bookId}?page=${prog.lastPage || 1}`)}
                 className="flex-shrink-0 w-64 bg-[#1a0b2e]/40 border border-fuchsia-900/30 rounded-lg p-3 flex gap-3 cursor-pointer hover:bg-[#1a0b2e]/80 hover:border-fuchsia-500/50 hover:shadow-[0_0_15px_rgba(217,70,239,0.15)] transition-all duration-300 group backdrop-blur-md"
               >
                 <div className="w-16 h-24 bg-[#0c0514] flex-shrink-0 rounded overflow-hidden relative border border-fuchsia-900/20">
                    <div className="absolute inset-0 bg-gradient-to-t from-fuchsia-900/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {prog.book?.coverBase64 ? (
                      <img src={prog.book.coverBase64} alt="Capa" className="w-full h-full object-cover relative z-10" />
                    ) : (
                      <Scroll className="w-8 h-8 text-fuchsia-900 m-auto mt-8 relative z-10" />
                    )}
                 </div>
                 <div className="flex flex-col justify-center min-w-0">
                    <h3 className="font-medium text-zinc-200 text-sm truncate group-hover:text-fuchsia-300 transition-colors">{prog.book?.title}</h3>
                    <p className="text-xs text-zinc-500 mt-1">Pág. {prog.lastPage}</p>
                    <div className="mt-2 text-fuchsia-400 text-xs flex items-center font-medium opacity-80 group-hover:opacity-100">
                      Retomar Leitura
                    </div>
                 </div>
               </div>
             ))}
           </div>
         </div>
       )}
       
       {filteredBooks.length === 0 ? (
          <div className="text-center py-20 bg-[#1a0b2e]/30 rounded-lg border border-fuchsia-900/20 border-dashed backdrop-blur-sm">
            <Scroll className="w-12 h-12 text-fuchsia-900/50 mx-auto mb-4" />
            <h3 className="text-xl text-zinc-300 font-serif">Nenhum tomo encontrado</h3>
            <p className="text-zinc-500 mt-2">O conhecimento que busca está oculto. Ajuste sua vidência.</p>
          </div>
       ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
            {filteredBooks.map(book => (
              <div 
                  key={book.id} 
                  className="group relative cursor-pointer aspect-[2/3] rounded-lg overflow-hidden bg-[#0c0514] border border-fuchsia-900/20 shadow-lg shadow-black/50 transition-all duration-500 hover:shadow-[0_0_20px_rgba(217,70,239,0.3)] hover:border-fuchsia-500/50 hover:-translate-y-1"
                  onClick={() => setSelectedBook(book)}
              >
                {book.coverBase64 ? (
                    <img src={book.coverBase64} alt={book.title} className="object-cover w-full h-full group-hover:scale-110 group-hover:rotate-1 transition-all duration-700 opacity-90 group-hover:opacity-100" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b2e] to-[#0c0514]"></div>
                        <Scroll className="w-12 h-12 text-fuchsia-900/60 mb-3 relative z-10 group-hover:text-fuchsia-500/80 transition-colors" />
                        <span className="text-sm font-serif text-fuchsia-200/70 line-clamp-3 relative z-10 group-hover:text-fuchsia-100">{book.title}</span>
                    </div>
                )}
                
                {/* Overlay on hover */}
                <div className="absolute inset-x-0 bottom-0 top-0 bg-gradient-to-t from-[#0c0514] via-[#0c0514]/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-20">
                  <h3 className="text-fuchsia-100 font-serif text-sm md:text-base leading-tight mb-1 drop-shadow-md">{book.title}</h3>
                  <p className="text-fuchsia-400/80 text-xs tracking-wider">{book.author}</p>
                </div>
              </div>
            ))}
          </div>
       )}

       <BookDetailsDialog 
         book={selectedBook} 
         open={!!selectedBook} 
         onOpenChange={(o) => { if (!o) setSelectedBook(null); }} 
       />
    </div>
  )
}
