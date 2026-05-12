import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, setDoc, serverTimestamp, deleteDoc, limit, orderBy } from 'firebase/firestore';
import { db, auth } from '@/src/firebase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Heart, Bookmark, Play, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export function BookDetailsDialog({ book, open, onOpenChange }: { book: any, open: boolean, onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;
  const [reviews, setReviews] = useState<any[]>([]);
  const [shelfStatus, setShelfStatus] = useState<any>(null); // {status: 'want_to_read' | 'reading' | 'read', isFavorite: boolean}
  const [shelfDocId, setShelfDocId] = useState<string | null>(null);
  
  const [myReview, setMyReview] = useState('');
  const [myRating, setMyRating] = useState(0);

  useEffect(() => {
    if (book && open && userId) {
      fetchBookData();
    }
  }, [book, open, userId]);

  const fetchBookData = async () => {
     try {
       // Fetch Reviews
       const rvSnap = await getDocs(query(collection(db, 'bookReviews'), where('bookId', '==', book.id), limit(50)));
       const rvData = rvSnap.docs.map(d => ({ id: d.id, ...d.data() }));
       setReviews(rvData);
       
       const myRv: any = rvData.find((r: any) => r.userId === userId);
       if (myRv) {
          setMyReview(myRv.comment);
          setMyRating(myRv.rating);
       }

       // Fetch Shelf Status
       const shelfSnap = await getDocs(query(collection(db, 'userShelves'), where('userId', '==', userId), where('bookId', '==', book.id)));
       if (!shelfSnap.empty) {
          const s = shelfSnap.docs[0];
          setShelfDocId(s.id);
          setShelfStatus(s.data());
       } else {
          setShelfDocId(null);
          setShelfStatus({ status: null, isFavorite: false });
       }
     } catch (e) {
       console.error("Error fetching book data", e);
     }
  }

  const handleUpdateShelf = async (status: string | null, isFavorite: boolean) => {
    if (!userId) return;
    try {
       if (shelfDocId) {
          await updateDoc(doc(db, 'userShelves', shelfDocId), {
             status, isFavorite, updatedAt: serverTimestamp()
          });
          setShelfStatus({ status, isFavorite });
       } else {
          const docRef = await addDoc(collection(db, 'userShelves'), {
             userId, bookId: book.id, status, isFavorite, updatedAt: serverTimestamp()
          });
          setShelfDocId(docRef.id);
          setShelfStatus({ status, isFavorite });
       }
       toast.success("Estante atualizada");
    } catch (e: any) {
       toast.error("Erro ao atualizar a estante.");
    }
  }

  const handleSaveReview = async () => {
    if (!userId) return;
    if (myRating === 0) {
      toast.error("Por favor, dê uma nota de 1 a 5 estrelas.");
      return;
    }
    
    try {
      const myRv = reviews.find(r => r.userId === userId);
      if (myRv) {
         await updateDoc(doc(db, 'bookReviews', myRv.id), {
            rating: myRating, comment: myReview, updatedAt: serverTimestamp()
         });
         toast.success("Avaliação atualizada");
      } else {
         await addDoc(collection(db, 'bookReviews'), {
            userId, bookId: book.id, rating: myRating, comment: myReview, createdAt: serverTimestamp(), updatedAt: serverTimestamp()
         });
         toast.success("Avaliação salva");
      }
      fetchBookData(); // reload
    } catch (e: any) {
       toast.error("Erro ao salvar avaliação.");
    }
  }

  const getAvgRating = () => {
     if (reviews.length === 0) return 0;
     const sum = reviews.reduce((a, b) => a + (b.rating || 0), 0);
     return (sum / reviews.length).toFixed(1);
  }

  if (!book) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a0b2e]/95 border-fuchsia-900/50 text-fuchsia-100 sm:max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-3xl font-serif text-fuchsia-200 drop-shadow-sm">{book.title}</DialogTitle>
          <DialogDescription className="text-zinc-400 font-serif italic text-lg">{book.author}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6 mt-4">
           {/* Left side: cover and actions */}
           <div className="w-full md:w-1/3 space-y-4">
              <div className="aspect-[2/3] w-full bg-[#0c0514] rounded-lg overflow-hidden border border-fuchsia-900/30 shadow-[0_0_15px_rgba(217,70,239,0.1)] relative group">
                 <div className="absolute inset-0 bg-gradient-to-t from-[#0c0514] to-transparent opacity-50 z-10"></div>
                 {book.coverBase64 ? (
                    <img src={book.coverBase64} alt="Capa" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 font-serif italic relative z-20">Sem grimório material</div>
                 )}
              </div>
              
              <Button onClick={() => { onOpenChange(false); navigate(`/read/${book.id}`); }} className="w-full bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/20 font-serif tracking-wide">
                 <Play className="w-4 h-4 mr-2" /> Decifrar Grimório
              </Button>

              <div className="grid grid-cols-2 gap-2 mt-2">
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => handleUpdateShelf('want_to_read', shelfStatus?.isFavorite || false)}
                   className={`border-fuchsia-900/30 transition-colors ${shelfStatus?.status === 'want_to_read' ? 'bg-fuchsia-900/40 text-fuchsia-300 border-fuchsia-500/50' : 'bg-transparent hover:bg-fuchsia-900/20 text-zinc-400 hover:text-fuchsia-200'}`}
                 >
                   <Bookmark className="w-4 h-4 mr-1" /> Desejo
                 </Button>
                 
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => handleUpdateShelf('reading', shelfStatus?.isFavorite || false)}
                   className={`border-fuchsia-900/30 transition-colors ${shelfStatus?.status === 'reading' ? 'bg-sky-900/40 text-sky-300 border-sky-500/50' : 'bg-transparent hover:bg-fuchsia-900/20 text-zinc-400 hover:text-fuchsia-200'}`}
                 >
                   <Play className="w-4 h-4 mr-1" /> Etéreo
                 </Button>
                 
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => handleUpdateShelf('read', shelfStatus?.isFavorite || false)}
                   className={`border-fuchsia-900/30 transition-colors ${shelfStatus?.status === 'read' ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/50' : 'bg-transparent hover:bg-fuchsia-900/20 text-zinc-400 hover:text-fuchsia-200'}`}
                 >
                   <CheckCircle className="w-4 h-4 mr-1" /> Absorvido
                 </Button>
                 
                 <Button 
                   variant="outline" 
                   size="sm" 
                   onClick={() => handleUpdateShelf(shelfStatus?.status, !(shelfStatus?.isFavorite))}
                   className={`border-fuchsia-900/30 transition-colors ${shelfStatus?.isFavorite ? 'bg-rose-900/40 text-rose-400 border-rose-500/50' : 'bg-transparent hover:bg-rose-900/20 text-zinc-400 hover:text-rose-200'}`}
                 >
                   <Heart className={`w-4 h-4 mr-1 ${shelfStatus?.isFavorite && 'fill-rose-400'}`} /> Essência
                 </Button>
              </div>
           </div>

           {/* Right side: details and reviews */}
           <div className="w-full md:w-2/3 space-y-6">
              <div>
                 <h3 className="text-xl font-serif text-fuchsia-200 mb-2 border-b border-fuchsia-900/30 pb-2 inline-block">Vislumbre</h3>
                 <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">{book.synopsis}</p>
              </div>

              <div className="border-t border-fuchsia-900/30 pt-6">
                 <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-serif text-fuchsia-200">Ecos da Comunidade</h3>
                    <div className="flex items-center gap-2 text-amber-400">
                       <Star className="w-5 h-5 fill-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]" />
                       <span className="font-bold font-serif text-lg text-amber-100">{getAvgRating()}</span>
                       <span className="text-zinc-500 text-sm">({reviews.length})</span>
                    </div>
                 </div>

                 {/* My Review Form */}
                 <div className="bg-[#0c0514]/60 p-4 rounded-lg border border-fuchsia-900/30 mb-6">
                    <h4 className="text-base font-serif text-fuchsia-300 mb-2">Deixe seu Eco</h4>
                    <div className="flex items-center gap-1 mb-3">
                       {[1,2,3,4,5].map(star => (
                         <Star 
                           key={star} 
                           className={`w-6 h-6 cursor-pointer transition-all hover:scale-110 ${myRating >= star ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.5)]' : 'text-zinc-600'}`} 
                           onClick={() => setMyRating(star)}
                         />
                       ))}
                    </div>
                    <Textarea 
                      placeholder="Transmita suas visões sobre esta obra..." 
                      className="bg-[#1a0b2e]/60 border-fuchsia-900/50 min-h-[80px] text-fuchsia-100 placeholder:text-zinc-600 focus:ring-1 focus:ring-fuchsia-500/50"
                      value={myReview}
                      onChange={e => setMyReview(e.target.value)}
                    />
                    <Button onClick={handleSaveReview} className="mt-3 bg-fuchsia-700 hover:bg-fuchsia-600 w-full md:w-auto text-white shadow-lg shadow-fuchsia-900/20">Selar Avaliação</Button>
                 </div>

                 {/* Reviews List */}
                 <div className="space-y-4">
                    {reviews.map(rev => (
                       <div key={rev.id} className="bg-[#1a0b2e]/40 p-4 rounded-lg border border-fuchsia-900/20 hover:border-fuchsia-500/30 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                             <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} className={`w-3.5 h-3.5 ${rev.rating >= s ? 'fill-amber-400 text-amber-400' : 'text-zinc-700'}`} />
                                ))}
                             </div>
                             <span className="text-xs text-zinc-500 font-serif italic">{rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString() : ''}</span>
                          </div>
                          <p className="text-sm text-zinc-300 leading-relaxed">{rev.comment}</p>
                       </div>
                    ))}
                    {reviews.length === 0 && (
                       <p className="text-zinc-500 text-sm text-center py-6 font-serif italic border border-dashed border-fuchsia-900/20 rounded-lg">Nenhum eco ressoa por aqui ainda.</p>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
