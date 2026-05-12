import { LogOut, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function PendingApproval() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  }

  return (
    <div className="flex h-[100dvh] items-center justify-center bg-[#0c0514] p-4 relative overflow-hidden">
      {/* Mystical Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-fuchsia-900/20 via-[#0c0514] to-[#0c0514]"></div>
      
      <Card className="w-full max-w-md border-fuchsia-900/30 bg-[#1a0b2e]/60 backdrop-blur-md text-center relative z-10 shadow-2xl shadow-indigo-900/20">
        <CardHeader>
           <div className="mx-auto bg-fuchsia-900/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.2)]">
             <ShieldAlert className="w-8 h-8 drop-shadow-md" />
           </div>
           <CardTitle className="text-3xl font-serif text-fuchsia-100 drop-shadow-sm">Limiar do Círculo</CardTitle>
           <CardDescription className="text-zinc-400 mt-2 text-base">
             Sua aura foi percebida, mas sua entrada na Ordem repousa em análise pelos Mestres.
           </CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-zinc-300 mb-6 leading-relaxed">
             Para conjurar sua aprovação, apresente o selo de oferta (comprovante) aos guardiões através do portal abaixo:
           </p>
           <div className="bg-[#0c0514]/60 p-4 rounded-xl border border-fuchsia-900/50 font-mono text-xl text-emerald-400 tracking-wider mb-6 shadow-inner drop-shadow-sm">
             41 99564-7137
           </div>
           <Button variant="ghost" onClick={handleLogout} className="text-zinc-400 hover:text-fuchsia-100 hover:bg-fuchsia-900/20 transition-all">
              <LogOut className="w-4 h-4 mr-2" /> Retornar à Névoa (Sair)
           </Button>
        </CardContent>
      </Card>
    </div>
  )
}
