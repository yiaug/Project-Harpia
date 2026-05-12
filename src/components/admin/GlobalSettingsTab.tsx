import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function GlobalSettingsTab() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
      registrationsEnabled: true,
      maintenanceMode: false,
      globalAnnouncement: ''
  });

  const fetchSettings = async () => {
      try {
         const snap = await getDoc(doc(db, 'globalSettings', 'core'));
         if (snap.exists()) {
             setSettings(snap.data() as any);
         }
      } catch(e) { }
  };

  useEffect(() => {
     fetchSettings();
  }, []);

  const saveSettings = async () => {
      setLoading(true);
      try {
          await setDoc(doc(db, 'globalSettings', 'core'), settings, { merge: true });
          toast.success("Configurações salvas!");
      } catch(e) {
          toast.error("Erro ao salvar configurações.");
      }
      setLoading(false);
  }

  return (
      <div className="space-y-6">
          <Card className="bg-[#1a0b2e]/60 border-fuchsia-900/30 backdrop-blur-md shadow-lg shadow-fuchsia-900/10">
             <CardHeader>
                <CardTitle className="text-fuchsia-200 font-serif">Leis do Domínio</CardTitle>
                <CardDescription className="text-zinc-400">Controle o véu entre os mundos e o fluxo de novas essências.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                 <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                         <Label className="text-fuchsia-100 text-base font-serif">Permitir Novos Despertares (Registros)</Label>
                         <div className="text-sm text-zinc-400">Novas almas podem encontrar a entrada do labirinto.</div>
                     </div>
                     <Switch 
                         checked={settings.registrationsEnabled} 
                         onCheckedChange={v => setSettings({...settings, registrationsEnabled: v})} 
                         className="data-[state=checked]:bg-fuchsia-600 data-[state=unchecked]:bg-[#0c0514]"
                     />
                 </div>
                 <div className="flex items-center justify-between">
                     <div className="space-y-0.5">
                         <Label className="text-fuchsia-100 text-base font-serif">Selar Portões (Modo Manutenção)</Label>
                         <div className="text-sm text-zinc-400">Restringe a realidade apenas aos Arqui-magos.</div>
                     </div>
                     <Switch 
                         checked={settings.maintenanceMode} 
                         onCheckedChange={v => setSettings({...settings, maintenanceMode: v})}
                         className="data-[state=checked]:bg-rose-600 data-[state=unchecked]:bg-[#0c0514]" 
                     />
                 </div>
             </CardContent>
          </Card>

          <Card className="bg-[#1a0b2e]/60 border-fuchsia-900/30 backdrop-blur-md shadow-lg shadow-fuchsia-900/10">
             <CardHeader>
                <CardTitle className="text-fuchsia-200 font-serif">Eco da Mente Universal (Aviso Global)</CardTitle>
                <CardDescription className="text-zinc-400">Manifeste um aviso nos céus do domínio de Harpia.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                 <div className="space-y-2">
                     <Label className="text-fuchsia-100 font-serif">Vibração da Mensagem</Label>
                     <Input 
                         value={settings.globalAnnouncement} 
                         onChange={e => setSettings({...settings, globalAnnouncement: e.target.value})}
                         placeholder="Ex: Uma nova estrela brilha na grande biblioteca..."
                         className="bg-[#0c0514]/60 border-fuchsia-900/50 text-fuchsia-100 placeholder:text-zinc-600 focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50"
                     />
                     <p className="text-xs text-zinc-500">Deixe o vácuo se quiser silenciar a mente universal.</p>
                 </div>
             </CardContent>
          </Card>

          <div className="flex justify-end">
             <Button onClick={saveSettings} disabled={loading} className="bg-fuchsia-700 hover:bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-900/20">
                 Gravar nas Leis Cósmicas
             </Button>
          </div>
      </div>
  )
}
