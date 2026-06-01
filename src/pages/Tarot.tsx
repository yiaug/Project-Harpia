import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Calendar, BookOpen, Loader2 } from 'lucide-react';
import { translateTarotCard } from '@/src/lib/tarotTranslation';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, limit } from 'firebase/firestore';
import { db, auth } from '@/src/firebase';
import { toast } from 'sonner';

export default function Tarot() {
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const [history, setHistory] = useState<any[]>([]);
  const [dailyCard, setDailyCard] = useState<any>(null);
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
         fetchHistory();
      } catch (e) {
         console.error('Error saving history', e);
      }
  }

  const drawCard = async (type: 'daily' | 'free') => {
    if (type === 'daily' && dailyCard) {
        setCard(dailyCard.card);
        setActiveTab('daily');
        return;
    }

    setLoading(true);
    setCard(null);
    try {
       const res = await fetch('/api/tarot/random');
       if (!res.ok) throw new Error('API request failed');
       const data = await res.json();
       if (data && data.cards && data.cards.length > 0) {
          const c = data.cards[0];
          // Use direct url with referrer policy to prevent failures on Render
          const imgUrl = `https://sacred-texts.com/tarot/pkt/img/${c.name_short}.jpg`;
          const translated = translateTarotCard(c.name, c.meaning_up);
          const finalCard = { ...c, imgUrl, name_pt: translated.nome_pt, meaning_pt: translated.significado_pt };
          setCard(finalCard);
          saveToHistory(finalCard, type);
       }
    } catch (e) {
       console.error(e);
       toast.error("Erro ao buscar a carta.");
    } finally {
       setLoading(false);
    }
  }
  
  // Normalize the image URL in case old history has external URLs
  const getImageUrl = (url: string) => {
    if (!url) return '';
    // Revert to direct URL to ensure it works on Render without proxy failures
    if (url.includes('/api/tarot/image/')) {
        return url.replace('/api/tarot/image/', 'https://sacred-texts.com/tarot/pkt/img/') + '.jpg';
    }
    return url;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 flex flex-col items-center pb-12 relative z-10 w-full px-4">
      <div className="text-center mb-6">
         <h1 className="text-3xl md:text-5xl font-serif text-fuchsia-100 flex items-center justify-center gap-3 drop-shadow-md">
            <Sparkles className="text-amber-400 w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]"/> 
            Oráculo de Harpia
         </h1>
         <p className="text-zinc-400 mt-3 md:text-lg tracking-wide font-medium">Conecte-se com o universo através do fluxo de energias arcaicas.</p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setCard(null); }} className="w-full">
         <TabsList className="grid w-full grid-cols-3 bg-[#1a0b2e]/80 backdrop-blur-md border border-fuchsia-900/40 p-1 md:p-1.5 rounded-xl md:rounded-2xl shadow-xl shadow-indigo-900/10">
            <TabsTrigger value="daily" className="data-[state=active]:bg-fuchsia-900/60 data-[state=active]:text-amber-300 text-zinc-400 transition-colors rounded-lg md:rounded-xl text-xs sm:text-sm whitespace-normal h-auto py-2.5">
               <Calendar className="w-4 h-4 mr-2 hidden sm:block" /> 
               <span className="hidden sm:inline">Visão Diária</span><span className="sm:hidden">Diária</span>
            </TabsTrigger>
            <TabsTrigger value="free" className="data-[state=active]:bg-fuchsia-900/60 data-[state=active]:text-amber-300 text-zinc-400 transition-colors rounded-lg md:rounded-xl text-xs sm:text-sm whitespace-normal h-auto py-2.5">
               <Sparkles className="w-4 h-4 mr-2 hidden sm:block" /> 
               <span className="hidden sm:inline">Consulta Livre</span><span className="sm:hidden">Livre</span>
            </TabsTrigger>
            <TabsTrigger value="diary" className="data-[state=active]:bg-fuchsia-900/60 data-[state=active]:text-amber-300 text-zinc-400 transition-colors rounded-lg md:rounded-xl text-xs sm:text-sm whitespace-normal h-auto py-2.5">
               <BookOpen className="w-4 h-4 mr-2 hidden sm:block" /> 
               <span className="hidden sm:inline">Grimório</span><span className="sm:hidden">Histórico</span>
            </TabsTrigger>
         </TabsList>

         <div className="mt-8">
            <TabsContent value="daily" className="mt-0">
                {!card || activeTab !== 'daily' ? (
                   <div className="flex flex-col items-center py-12 md:py-20 border border-fuchsia-900/20 bg-[#1a0b2e]/40 rounded-3xl backdrop-blur-sm">
                      {dailyCard ? (
                         <div className="text-center space-y-8 px-4">
                            <h2 className="text-2xl md:text-3xl text-amber-300 font-serif drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">O véu do seu dia já foi desvendado.</h2>
                            <Button onClick={() => { setCard(dailyCard.card); }} className="bg-amber-600/80 hover:bg-amber-600 text-white border border-amber-400/30 shadow-[0_0_20px_rgba(217,119,6,0.3)] transition-all h-14 px-8 text-lg rounded-full">
                               Contemplar Visão Novamente
                            </Button>
                         </div>
                      ) : (
                         <div className="text-center px-4">
                            <p className="text-zinc-400 mb-8 max-w-md mx-auto text-lg">Revele a carta destinada a guiar os seus passos no percurso de hoje.</p>
                            <Button onClick={() => drawCard('daily')} disabled={loading} size="lg" className="bg-amber-600/90 hover:bg-amber-500 text-amber-50 text-lg h-16 w-full sm:w-auto px-10 rounded-full shadow-[0_0_40px_rgba(217,119,6,0.4)] hover:shadow-[0_0_60px_rgba(217,119,6,0.6)] transition-all border border-amber-400/50">
                              {loading ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <Calendar className="w-6 h-6 mr-3" />}
                              {loading ? 'Consultando as Estrelas...' : 'Revelar Face Diária'}
                            </Button>
                         </div>
                      )}
                   </div>
                ) : null}
            </TabsContent>

            <TabsContent value="free" className="mt-0 flex justify-center">
                {!card || activeTab !== 'free' ? (
                   <div className="flex flex-col items-center py-12 md:py-20 border border-fuchsia-900/20 bg-[#1a0b2e]/40 rounded-3xl backdrop-blur-sm w-full">
                       <div className="text-center px-4">
                          <p className="text-zinc-400 mb-8 max-w-md mx-auto text-lg">Faça uma pergunta aos oráculos e retire uma carta do baralho milenar.</p>
                          <Button onClick={() => drawCard('free')} disabled={loading} size="lg" className="bg-[#2d1155]/80 hover:bg-[#3f1970] border border-fuchsia-500/50 hover:border-fuchsia-400 text-amber-100 text-lg h-16 w-full sm:w-auto px-10 rounded-full transition-all shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_30px_rgba(192,38,211,0.5)]">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-3 text-fuchsia-300" /> : <Sparkles className="w-6 h-6 mr-3 text-fuchsia-300" />}
                            {loading ? 'Lendo as Linhas...' : 'Evocar Carta'}
                          </Button>
                       </div>
                   </div>
                ) : null}
            </TabsContent>

            <TabsContent value="diary" className="mt-0">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {history.map((item, idx) => (
                     <Card key={idx} className="bg-[#1a0b2e]/80 border-fuchsia-900/40 flex overflow-hidden shadow-lg shadow-fuchsia-900/10 backdrop-blur-xl group hover:border-fuchsia-500/40 transition-colors cursor-default">
                        <div className="w-24 md:w-32 bg-[#0c0514] flex-shrink-0 relative overflow-hidden border-r border-fuchsia-900/30">
                           <img 
                              src={getImageUrl(item.card.imgUrl)} 
                              alt="Capa" 
                              loading="lazy"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover" 
                           />
                           <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#1a0b2e]/70 z-10 pointer-events-none"></div>
                        </div>
                        <div className="p-4 flex flex-col justify-center flex-1 relative z-20 min-w-0">
                           <div className="text-[10px] sm:text-xs text-amber-400 mb-1.5 font-medium uppercase tracking-wider">
                              {item.type === 'daily' ? 'Diária' : 'Livre'} • {item.date}
                           </div>
                           <h4 className="font-serif text-fuchsia-50 leading-tight text-base md:text-lg mb-2 truncate" title={item.card.name_pt}>{item.card.name_pt}</h4>
                           <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">{item.card.meaning_pt}</p>
                        </div>
                     </Card>
                  ))}
                  {history.length === 0 && (
                     <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-500 bg-[#1a0b2e]/30 rounded-3xl border border-fuchsia-900/20 border-dashed px-4 text-center">
                        <BookOpen className="w-12 h-12 mb-4 text-fuchsia-900/50" />
                        <h4 className="font-serif text-xl text-fuchsia-400/70 mb-2">Seu grimório repousa em silêncio.</h4>
                        <p>Evoque sua primeira carta para iniciar os registros.</p>
                     </div>
                  )}
               </div>
            </TabsContent>
         </div>
      </Tabs>

      {/* Card Display Area for Daily or Free */}
      {(activeTab === 'daily' || activeTab === 'free') && card && (
         <div className="flex justify-center w-full mt-6 animate-in fade-in duration-700">
           <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start w-full max-w-4xl bg-[#1a0b2e]/40 p-4 md:p-8 rounded-3xl border border-fuchsia-900/30 shadow-2xl backdrop-blur-md">
              {/* Card Image */}
              <div className="w-[240px] sm:w-[280px] md:w-[320px] shrink-0">
                 <div className="w-full aspect-[1/1.7] rounded-xl border-4 border-[#321350] shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden bg-[#0c0514]">
                    <img 
                       src={getImageUrl(card.imgUrl)} 
                       alt={card.name_pt} 
                       referrerPolicy="no-referrer"
                       className="w-full h-full object-cover" 
                    />
                 </div>
              </div>

              {/* Card Details */}
              <div className="flex-1 w-full bg-[#0f061b] rounded-2xl border border-fuchsia-900/20 p-6 md:p-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 md:p-8 opacity-[0.03] pointer-events-none">
                    <Sparkles className="w-32 h-32 md:w-64 md:h-64 text-fuchsia-500" />
                 </div>
                 
                 <div className="relative z-10 border-b border-fuchsia-900/20 pb-4 md:pb-6 mb-4 md:mb-6">
                    <h2 className="text-2xl md:text-4xl text-amber-400 font-serif drop-shadow-md mb-2">{card.name_pt}</h2>
                    <p className="text-fuchsia-400/80 capitalize tracking-widest font-medium text-xs md:text-sm">
                       {card.type === 'major' ? 'Arcano Maior' : 'Arcano Menor'}
                    </p>
                 </div>
                 
                 <div className="relative z-10">
                    <h3 className="text-xs font-bold text-fuchsia-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Sparkles className="w-4 h-4"/> A Profecia
                    </h3>
                    <p className="text-zinc-300 leading-relaxed text-base md:text-lg font-serif mb-8 whitespace-pre-line text-balance">
                       {card.meaning_pt}
                    </p>
                    
                    <Button 
                       onClick={() => setCard(null)} 
                       variant="outline" 
                       className="w-full sm:w-auto px-8 border-fuchsia-900/50 text-fuchsia-200 hover:bg-fuchsia-900/40 hover:text-white hover:border-fuchsia-400/50 transition-all rounded-full"
                    >
                       Ocultar Visão
                    </Button>
                 </div>
              </div>
            </div>
         </div>
      )}
    </div>
  )
}
