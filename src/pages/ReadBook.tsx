import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function ReadBook() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [book, setBook] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState<string>('1');
  const [progressDocId, setProgressDocId] = useState<string | null>(null);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchBook = async () => {
      if (!bookId) return;
      const docRef = doc(db, 'books', bookId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setBook(snap.data());
      }

      if (userId) {
        const pSnap = await getDocs(query(collection(db, 'userProgress'), where('userId', '==', userId), where('bookId', '==', bookId), limit(1)));
        if (!pSnap.empty) {
            setProgressDocId(pSnap.docs[0].id);
            setCurrentPage(pSnap.docs[0].data().lastPage || '1');
        } else {
            // Check query param if new 
            const searchParams = new URLSearchParams(location.search);
            const pageFromUrl = searchParams.get('page');
            if (pageFromUrl) setCurrentPage(pageFromUrl);
        }
      }
    };
    fetchBook();
  }, [bookId, userId]);

  const handleSaveProgress = async () => {
    if (!userId || !bookId) return;
    try {
      if (progressDocId) {
        await updateDoc(doc(db, 'userProgress', progressDocId), {
           lastPage: currentPage, updatedAt: serverTimestamp()
        });
      } else {
        const ref = await addDoc(collection(db, 'userProgress'), {
           userId, bookId, lastPage: currentPage, updatedAt: serverTimestamp()
        });
        setProgressDocId(ref.id);
      }
      toast.success('Página salva! Você poderá retomar de onde parou.');
    } catch (e: any) {
      toast.error('Erro ao salvar progresso.');
    }
  }

  const handleReportBook = async () => {
      if (!userId || !bookId) return;
      const reason = prompt("Descreva o motivo da denúncia para este livro:");
      if (!reason) return;

      try {
         await addDoc(collection(db, 'reports'), {
             type: 'book',
             targetId: bookId,
             reason,
             reporterId: userId,
             status: 'pending',
             createdAt: serverTimestamp()
         });
         toast.success("Livro denunciado. Nossa equipe vai verificar.");
      } catch(e) {
         toast.error("Erro ao denunciar.");
      }
  }

  if (!book) return <div className="text-center text-slate-400 mt-10">Carregando livro...</div>;

  let embedUrl = book.pdfUrl;
  if (embedUrl.includes('drive.google.com') && embedUrl.includes('/view')) {
    embedUrl = embedUrl.replace('/view', '/preview');
    const split = embedUrl.split('?');
    embedUrl = split[0]; 
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-12rem)] md:h-[calc(100dvh-8rem)] relative z-10 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')} className="text-zinc-400 hover:text-fuchsia-100 hover:bg-fuchsia-900/20 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Retornar
          </Button>
          <h1 className="text-xl font-serif text-fuchsia-200 truncate max-w-[200px] sm:max-w-md drop-shadow-sm" title={book.title}>{book.title}</h1>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 bg-[#1a0b2e]/60 border border-fuchsia-900/30 backdrop-blur-md p-1.5 rounded-lg shrink-0 shadow-lg shadow-fuchsia-900/10">
           <Button variant="ghost" size="sm" onClick={handleReportBook} className="text-zinc-500 hover:text-rose-400 hover:bg-rose-900/20 px-2 transition-colors" title="Denunciar Grimório">
              <ShieldAlert className="w-4 h-4" />
           </Button>
           <span className="w-px h-4 bg-fuchsia-900/30"></span>
           <span className="text-zinc-400 text-sm pl-2">Marcador:</span>
           <input 
              type="number" 
              value={currentPage}
              onChange={e => setCurrentPage(e.target.value)}
              className="w-16 bg-[#0c0514]/80 border border-fuchsia-900/50 rounded text-center text-white py-1 outline-none text-sm focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50"
           />
           <Button variant="ghost" size="sm" onClick={handleSaveProgress} className="text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-900/20 px-2 transition-colors" title="Salvar Marcador">
             <Save className="w-4 h-4" />
           </Button>
        </div>
      </div>
      <div className="flex-1 bg-[#1a0b2e]/60 rounded-xl overflow-hidden border border-fuchsia-900/30 shadow-lg shadow-indigo-900/10 relative group backdrop-blur-sm">
         {/* Instruction overlay briefly shown or just use the input above */}
        <iframe src={embedUrl} className="w-full h-full border-0" allow="autoplay" />
      </div>
    </div>
  );
}
