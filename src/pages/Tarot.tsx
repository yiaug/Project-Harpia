import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, RefreshCw, Calendar, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { translateTarotCard } from '@/src/lib/tarotTranslation';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { db, auth } from '@/src/firebase';
import { toast } from 'sonner';

export default function Tarot() {
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);
  
  const [activeTab, setActiveTab] = useState('daily');
  const [history, setHistory] = useState<any[]>([]);
  const [dailyCard, setDailyCard] = useState<any>(null); // To store if daily was drawn
  const userId = auth.currentUser?.uid;

  useEffect(() => {
     if (userId) {
        fetchHistory();
     }
  }, [userId]);

  const fetchHistory = async () => {
      try {
         const snap = await getDocs(query(collection(db, 'tarotHistory'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(50)));
         const hist = snap.docs.map(d => ({id: d.id, ...d.data()}));
         setHistory(hist);
         
         // Check today's daily
         const today = new Date().toISOString().split('T')[0];
         const drawnToday = hist.find((h: any) => h.type === 'daily' && h.date === today);
         if (drawnToday) {
             setDailyCard(drawnToday);
         }
      } catch(e) {
         console.error('Error fetching tarot history', e);
      }
  }

  const saveToHistory = async (drawn: any, type: string) => {
      if (!userId) return;
      try {
         const today = new Date().toISOString().split('T')[0];
         const docData = {
             userId,
             card: drawn,
             type,
             date: today,
             createdAt: serverTimestamp()
         };
         await addDoc(collection(db, 'tarotHistory'), docData);
         if (type === 'daily') {
             setDailyCard(docData);
         }
         fetchHistory(); // refresh
      } catch (e) {
         console.error('Error saving history', e);
      }
  }

  const drawCard = async (type: 'daily' | 'free') => {
    if (type === 'daily' && dailyCard) {
        setCard(dailyCard.card);
        setFlipped(true); // show directly
        return;
    }

    setLoading(true);
    setFlipped(false);
    setCard(null);
    try {
       const res = await fetch('/api/tarot/random');
       const data = await res.json();
       if (data && data.cards && data.cards.length > 0) {
          const c = data.cards[0];
          const imgUrl = `https://sacred-texts.com/tarot/pkt/img/${c.name_short}.jpg`;
          
          const translated = translateTarotCard(c.name, c.meaning_up);

          const img = new Image();
          img.src = imgUrl;
          img.onload = () => {
             const finalCard = { ...c, imgUrl, name_pt: translated.nome_pt, meaning_pt: translated.significado_pt };
             setCard(finalCard);
             setLoading(false);
             saveToHistory(finalCard, type);
          };
       }
    } catch (e) {
       console.error(e);
       toast.error("Erro ao buscar a carta.");
       setLoading(false);
    }
  }

  const handleFlip = () => {
     if (card && !loading) {
       setFlipped(true);
     }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center pb-12 relative z-10 w-full">
      <div className="text-center mb-4">
         <h1 className="text-4xl font-serif text-fuchsia-100 flex items-center justify-center gap-3 drop-shadow-md"><Sparkles className="text-amber-400 w-8 h-8 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]"/> Oráculo de Harpia</h1>
         <p className="text-zinc-400 mt-2 tracking-wide font-medium">Conecte-se com o universo através do fluxo de energias arcaicas.</p>
      </div>

      <Tabs defaultValue="daily" className="w-full" onValueChange={setActiveTab}>
         <TabsList className="grid w-full grid-cols-3 bg-[#1a0b2e]/60 backdrop-blur-md border border-fuchsia-900/30 p-1 rounded-xl shadow-lg shadow-indigo-900/10">
            <TabsTrigger value="daily" className="data-[state=active]:bg-fuchsia-900/40 data-[state=active]:text-amber-300 text-zinc-400 transition-colors rounded-lg"><Calendar className="w-4 h-4 mr-2 hidden sm:block" /> Visão Diária</TabsTrigger>
            <TabsTrigger value="free" className="data-[state=active]:bg-fuchsia-900/40 data-[state=active]:text-amber-300 text-zinc-400 transition-colors rounded-lg"><Sparkles className="w-4 h-4 mr-2 hidden sm:block" /> Consulta Livre</TabsTrigger>
            <TabsTrigger value="diary" className="data-[state=active]:bg-fuchsia-900/40 data-[state=active]:text-amber-300 text-zinc-400 transition-colors rounded-lg"><BookOpen className="w-4 h-4 mr-2 hidden sm:block" /> Grimório Pessoal</TabsTrigger>
         </TabsList>

         <div className="mt-8">
            <TabsContent value="daily" className="mt-0">
                {!card || activeTab !== 'daily' ? (
                   <div className="flex flex-col items-center py-12">
                      {dailyCard ? (
                         <div className="text-center space-y-6">
                            <h2 className="text-2xl text-amber-300 font-serif drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">O véu do seu dia já foi desvendado.</h2>
                            <Button onClick={() => { setCard(dailyCard.card); setFlipped(true); }} className="bg-amber-600/80 hover:bg-amber-600 text-white border border-amber-400/30 shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all">Contemplar Visão</Button>
                         </div>
                      ) : (
                         <Button onClick={() => drawCard('daily')} disabled={loading} size="lg" className="bg-amber-600/90 hover:bg-amber-500 text-amber-50 text-lg h-16 px-8 rounded-full shadow-[0_0_40px_rgba(217,119,6,0.4)] hover:shadow-[0_0_60px_rgba(217,119,6,0.6)] transition-all border border-amber-400/50">
                           {loading ? <RefreshCw className="w-6 h-6 animate-spin mr-2" /> : <Calendar className="w-6 h-6 mr-2" />}
                           {loading ? 'Consultando as Estrelas...' : 'Revelar Face Diária'}
                         </Button>
                      )}
                   </div>
                ) : null}
            </TabsContent>

            <TabsContent value="free" className="mt-0 flex justify-center">
                {!card || activeTab !== 'free' ? (
                   <div className="py-12">
                       <Button onClick={() => drawCard('free')} disabled={loading} size="lg" className="bg-[#1a0b2e]/80 hover:bg-fuchsia-900/40 border border-fuchsia-500/50 text-amber-100 text-lg h-16 px-8 rounded-full transition-all shadow-[0_0_20px_rgba(192,38,211,0.2)]">
                         {loading ? <RefreshCw className="w-6 h-6 animate-spin mr-2 text-fuchsia-400" /> : <Sparkles className="w-6 h-6 mr-2 text-fuchsia-400" />}
                         {loading ? 'Lendo as Linhas...' : 'Evocar Carta Espontânea'}
                       </Button>
                   </div>
                ) : null}
            </TabsContent>

            <TabsContent value="diary" className="mt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {history.map((item, idx) => (
                     <Card key={idx} className="bg-[#1a0b2e]/60 border-fuchsia-900/30 flex overflow-hidden shadow-lg shadow-fuchsia-900/10 backdrop-blur-sm group hover:border-fuchsia-500/30 transition-all cursor-default">
                        <div className="w-1/3 bg-[#0c0514]/60 flex-shrink-0 relative overflow-hidden">
                           <img src={item.card.imgUrl} alt="Capa" className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500 z-0" />
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a0b2e]/60 z-10"></div>
                        </div>
                        <div className="p-4 flex flex-col justify-center w-2/3 relative z-20">
                           <div className="text-xs text-amber-400/80 mb-2 font-medium uppercase tracking-wider">{item.type === 'daily' ? 'Divinação' : 'Consulta'} • {item.date}</div>
                           <h4 className="font-serif text-fuchsia-100 leading-tight text-lg mb-2">{item.card.name_pt}</h4>
                           <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">{item.card.meaning_pt}</p>
                        </div>
                     </Card>
                  ))}
                  {history.length === 0 && (
                     <div className="col-span-full text-center py-16 text-zinc-500 font-serif text-lg bg-[#1a0b2e]/30 rounded-xl border border-fuchsia-900/20 border-dashed">
                        Seu grimório repousa sem murmúrios. Evoque a primeira carta.
                     </div>
                  )}
               </div>
            </TabsContent>
         </div>
      </Tabs>

      {/* Card Display Area for Daily or Free */}
      {(activeTab === 'daily' || activeTab === 'free') && card && (
         <div className="flex justify-center w-full min-h-[450px] mt-8">
          <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start w-full max-w-4xl">
              {/* 3D Card Container */}
              <div className="perspective-1000 w-[240px] md:w-[280px] shrink-0" onClick={handleFlip}>
                <motion.div 
                   className="w-[240px] md:w-[280px] aspect-[1/1.7] relative preserve-3d cursor-pointer drop-shadow-[0_20px_30px_rgba(251,191,36,0.15)] group"
                   animate={{ rotateY: flipped ? 180 : 0 }}
                   transition={{ type: "spring", stiffness: 50, damping: 20 }}
                >
                   {/* Back of card */}
                   <div className="absolute inset-0 backface-hidden bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d4/RWS_Tarot_00_Fool.jpg')] bg-cover bg-center rounded-2xl border-4 border-[#4a1d6a] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] flex items-center justify-center before:absolute before:inset-0 before:bg-[#0c0514]/90 before:rounded-xl">
                      <div className="relative z-10 text-amber-500/70 flex flex-col items-center group-hover:text-amber-400 transition-colors">
                        <Sparkles className="w-16 h-16 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                        <span className="text-sm mt-4 font-serif tracking-widest uppercase">Revelar</span>
                      </div>
                   </div>
                   {/* Front of card */}
                   <div className="absolute inset-0 backface-hidden [transform:rotateY(180deg)] rounded-2xl border-4 border-amber-600/80 shadow-[0_0_30px_rgba(217,119,6,0.3)] overflow-hidden bg-slate-100">
                      <img src={card.imgUrl} alt={card.name} className="w-full h-full object-cover" />
                   </div>
                </motion.div>
              </div>

              <div className="flex-1 w-full relative">
                <AnimatePresence>
                   {flipped && (
                      <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                      >
                         <Card className="bg-[#1a0b2e]/80 border-fuchsia-900/40 backdrop-blur-xl shadow-2xl shadow-indigo-900/30 overflow-hidden relative">
                           <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                              <Sparkles className="w-48 h-48 text-fuchsia-500" />
                           </div>
                           <CardHeader className="relative border-b border-fuchsia-900/20 bg-[#0c0514]/40">
                             <CardTitle className="text-3xl text-amber-400 font-serif drop-shadow-md">{card.name_pt}</CardTitle>
                             <CardDescription className="text-fuchsia-300/80 capitalize tracking-wider font-medium mt-2">{card.type === 'major' ? 'Arcano Maior' : 'Arcano Menor'}</CardDescription>
                           </CardHeader>
                           <CardContent className="space-y-6 pt-6 relative">
                              <div>
                                 <h3 className="text-xs font-bold text-fuchsia-500 uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles className="w-3 h-3"/> Profecia</h3>
                                 <p className="text-zinc-200 leading-loose text-lg font-serif italic">{card.meaning_pt}</p>
                              </div>
                              <div className="pt-6 border-t border-fuchsia-900/20">
                                 <Button onClick={() => setCard(null)} variant="outline" className="w-full border-fuchsia-900/50 text-fuchsia-200 hover:bg-fuchsia-900/30 hover:text-white transition-all shadow-sm">
                                    Ocultar Visão
                                 </Button>
                              </div>
                           </CardContent>
                         </Card>
                      </motion.div>
                   )}
                </AnimatePresence>
              </div>
            </div>
         </div>
      )}
    </div>
  )
}
