import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, orderBy, deleteDoc, limit } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export function ReportsTab() {
  const [reports, setReports] = useState<any[]>([]);

  const fetchReports = async () => {
      try {
         const snap = await getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc'), limit(100)));
         setReports(snap.docs.map(d => ({id: d.id, ...d.data()})));
      } catch(e) {
         console.error('Error fetching reports', e);
      }
  };

  useEffect(() => {
     fetchReports();
  }, []);

  const handleResolve = async (id: string, action: 'ignore' | 'deleteContent') => {
      try {
          const report = reports.find(r => r.id === id);
          if (!report) return;

          if (action === 'deleteContent') {
              // We need to delete the target content based on type
              if (report.type === 'chatMessage') {
                  await deleteDoc(doc(db, 'chatMessages', report.targetId));
              } else if (report.type === 'forumMessage') {
                  await deleteDoc(doc(db, 'forumMessages', report.targetId));
              } else if (report.type === 'forumTopic') {
                  await deleteDoc(doc(db, 'forumTopics', report.targetId));
              } else if (report.type === 'book') {
                  await deleteDoc(doc(db, 'books', report.targetId));
              }
              toast.success("Conteúdo ofensivo excluído.");
          }

          await updateDoc(doc(db, 'reports', id), {
              status: 'resolved',
              resolvedAction: action
          });
          toast.success("Denúncia resolvida.");
          fetchReports();
      } catch(e) {
         toast.error("Erro ao resolver denúncia.");
      }
  }

  return (
      <div className="space-y-6">
          <h2 className="text-2xl font-serif text-rose-300 flex items-center drop-shadow-sm"><ShieldAlert className="w-6 h-6 mr-3 text-rose-500" /> Fila da Inquisição</h2>
          <div className="grid grid-cols-1 gap-4">
              {reports.filter(r => r.status === 'pending').map(r => (
                  <Card key={r.id} className="bg-[#1a0b2e]/60 border-rose-900/30 backdrop-blur-md shadow-md shadow-rose-900/10">
                      <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                             <div>
                                <CardTitle className="text-rose-400 text-lg font-serif">Denúncia: {r.type}</CardTitle>
                                <CardDescription className="text-zinc-400 mt-1">
                                    Motivo: <span className="text-zinc-200">{r.reason}</span>
                                </CardDescription>
                             </div>
                             <div className="text-xs text-zinc-500">
                                 {r.createdAt?.seconds ? format(new Date(r.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm') : ''}
                             </div>
                          </div>
                      </CardHeader>
                      <CardContent>
                          <div className="text-sm bg-[#0c0514]/40 p-3 rounded-lg border border-fuchsia-900/20 mb-4 font-mono text-zinc-400">
                              Alvo ID: {r.targetId}
                          </div>
                          <div className="flex items-center gap-3">
                              <Button onClick={() => handleResolve(r.id, 'deleteContent')} variant="destructive" size="sm" className="bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-500/30">
                                  <Trash2 className="w-4 h-4 mr-2" /> Excluir Maldição
                              </Button>
                              <Button onClick={() => handleResolve(r.id, 'ignore')} variant="outline" size="sm" className="border-fuchsia-900/30 text-zinc-300 hover:bg-fuchsia-900/20 hover:text-white">
                                  <CheckCircle2 className="w-4 h-4 mr-2" /> Ignorar Ilusão
                              </Button>
                          </div>
                      </CardContent>
                  </Card>
              ))}
              {reports.filter(r => r.status === 'pending').length === 0 && (
                  <div className="text-center py-12 text-zinc-500 bg-[#1a0b2e]/40 rounded-xl border border-fuchsia-900/20 border-dashed font-serif">
                      Nenhuma heresia detectada. O domínio está em harmonia. ⚖️
                  </div>
              )}
          </div>
      </div>
  )
}
