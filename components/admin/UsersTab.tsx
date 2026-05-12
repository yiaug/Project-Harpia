import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, ShieldAlert } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebase';
import { toast } from 'sonner';

export function UsersTab({ users, fetchUsers, isAdmin }: { users: any[], fetchUsers: () => void, isAdmin?: boolean }) {
  
  const updateUserStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { status, updatedAt: serverTimestamp() });
      toast.success(`Status atualizado para ${status}`);
      fetchUsers();
    } catch (e: any) {
      toast.error(`Erro: ${e.message}`);
    }
  }

  const updateUserRole = async (id: string, role: string) => {
    try {
      await updateDoc(doc(db, 'users', id), { role, updatedAt: serverTimestamp() });
      toast.success(`Role alterada para ${role}`);
      fetchUsers();
    } catch (e: any) {
      toast.error(`Erro ao mudar role: ${e.message}`);
    }
  }

  return (
    <Card className="bg-[#1a0b2e]/60 border-fuchsia-900/30 backdrop-blur-md shadow-lg shadow-fuchsia-900/10">
      <CardHeader>
        <CardTitle className="text-fuchsia-200 font-serif">Iniciados & Aprovações</CardTitle>
        <CardDescription className="text-zinc-400">Aprove a entrada ao Círculo ou bloqueie presenças não desejadas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-fuchsia-900/20">
          <Table>
            <TableHeader className="bg-[#0c0514]/60">
              <TableRow className="border-fuchsia-900/20 hover:bg-transparent">
                <TableHead className="text-zinc-400 font-serif">Essência (Email)</TableHead>
                <TableHead className="text-zinc-400 font-serif">Estado</TableHead>
                <TableHead className="text-zinc-400 font-serif">Grau</TableHead>
                <TableHead className="text-zinc-400 font-serif text-right">Encantos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id} className="border-fuchsia-900/10 hover:bg-fuchsia-900/10 transition-colors">
                  <TableCell className="text-fuchsia-100 min-w-[200px] font-medium">{u.email}</TableCell>
                  <TableCell>
                      <Badge variant={u.status === 'approved' ? 'default' : u.status === 'blocked' ? 'destructive' : 'secondary'} className={`${u.status === 'approved' ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/50' : u.status === 'blocked' ? 'bg-rose-900/30 text-rose-400 border-rose-500/50' : 'bg-amber-900/30 text-amber-400 border-amber-500/50'} border backdrop-blur-sm`}>
                        {u.status === 'approved' ? 'Desperto' : u.status === 'blocked' ? 'Banido' : 'Pendente'}
                      </Badge>
                  </TableCell>
                  <TableCell>
                      <Badge variant="outline" className="border-fuchsia-900/50 text-fuchsia-400 bg-fuchsia-950/20">
                        {u.role === 'user' ? 'Iniciado' : u.role === 'moderator' ? 'Inquisidor' : 'Arqui-mago'}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2 whitespace-nowrap">
                      {u.status !== 'approved' && (
                        <Button size="sm" variant="outline" className="border-emerald-900/50 text-emerald-400 hover:bg-emerald-900/20 hover:text-emerald-300 transition-colors" onClick={() => updateUserStatus(u.id, 'approved')}><Check className="w-4 h-4 mr-1"/> Despertar</Button>
                      )}
                      {u.status !== 'blocked' && u.role !== 'admin' && (
                        <Button size="sm" variant="outline" className="border-rose-900/50 text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 transition-colors" onClick={() => updateUserStatus(u.id, 'blocked')}><X className="w-4 h-4 mr-1"/> Banir</Button>
                      )}
                      {isAdmin && u.role === 'user' && (
                        <Button size="sm" variant="outline" className="border-amber-900/50 text-amber-400 hover:bg-amber-900/20 hover:text-amber-300 transition-colors" onClick={() => updateUserRole(u.id, 'moderator')}><ShieldAlert className="w-4 h-4 mr-1"/> Elevar (Inquisidor)</Button>
                      )}
                      {isAdmin && u.role === 'moderator' && (
                        <Button size="sm" variant="outline" className="border-zinc-700/50 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300 transition-colors" onClick={() => updateUserRole(u.id, 'user')}><X className="w-4 h-4 mr-1"/> Rebaixar</Button>
                      )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
