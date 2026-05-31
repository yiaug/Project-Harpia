import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function DownloadAppDialog() {
  return (
    <Dialog>
      <DialogTrigger render={
        <Button variant="ghost" size="sm" className="text-fuchsia-400 hover:text-fuchsia-300 hover:bg-fuchsia-900/20 font-medium px-2 sm:px-3">
          <Download className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Instalar App</span>
        </Button>
      } />
      <DialogContent className="bg-[#1a0b2e] border-fuchsia-900/50 text-fuchsia-100 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">Instalar Harpia no Android</DialogTitle>
          <DialogDescription render={<div />} className="text-zinc-300 pt-4 leading-relaxed space-y-4">
            <p>
              Para trazer a magia de Harpia diretamente para suas mãos, siga os passos abaixo no seu navegador Android (recomendamos o Google Chrome):
            </p>
            <ol className="list-decimal pl-5 space-y-2 text-zinc-200">
              <li>Toque no botão <strong className="text-fuchsia-300">"Instalar Aplicativo"</strong> (ou semelhante) se for exibido na parte inferior da tela, ou pule para o próximo passo.</li>
              <li>Toque no botão de <strong>menu (três pontos)</strong> no canto superior direito do navegador.</li>
              <li>Selecione <strong className="text-fuchsia-300">"Adicionar à tela inicial"</strong> ou <strong className="text-fuchsia-300">"Instalar aplicativo"</strong>.</li>
              <li>Confirme tocando em <strong>Adicionar</strong> na janela que aparecer.</li>
            </ol>
            <div className="bg-fuchsia-950/40 p-4 rounded-lg border border-fuchsia-900/50 mt-4 text-sm font-medium">
              <p className="text-amber-200/90">
                <strong>Nota sobre segurança:</strong> Harpia é um Progressive Web App (PWA) seguro. Você <strong>não</strong> precisa habilitar "fontes desconhecidas" para instalá-lo!
              </p>
            </div>
            <p className="text-sm text-zinc-400 italic">
              No iOS (iPhone), use o Safari, toque no ícone de Compartilhar e escolha "Adicionar à Tela de Início".
            </p>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
