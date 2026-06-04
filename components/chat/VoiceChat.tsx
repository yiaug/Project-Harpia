import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Phone, PhoneOff, ChevronLeft } from 'lucide-react';
// @ts-ignore
import { io } from 'socket.io-client';
import { auth } from '@/src/firebase';
import Peer from 'simple-peer';
import { toast } from 'sonner';

export function VoiceChat({ room, onBack }: { room: any, onBack: () => void }) {
   const [connected, setConnected] = useState(false);
   const [peers, setPeers] = useState<string[]>([]);
   const socketRef = useRef<any>(null);
   const userStream = useRef<MediaStream | null>(null);
   const peersRef = useRef<any[]>([]); // To keep track of peer instances
   const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({}); // Keep audio elements

   useEffect(() => {
      // Connect to Socket.io server only once
      const targetUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      socketRef.current = io(targetUrl);

      socketRef.current.on('user-connected', (userId: string) => {
         setPeers(prev => {
            if (!prev.includes(userId)) return [...prev, userId];
            return prev;
         });
         // The new user joined, let's create a peer connection offering to them
         if (userStream.current) {
            const peer = createPeer(userId, socketRef.current.id, userStream.current);
            peersRef.current.push({
               peerID: userId,
               peer,
            });
         }
      });

      // Handle receiving an offer from a newly joined peer
      socketRef.current.on('offer', (payload: any) => {
         // Create a peer to receive the stream
         if (userStream.current) {
             const peer = addPeer(payload.signal, payload.callerID, userStream.current);
             peersRef.current.push({
                peerID: payload.callerID,
                peer,
             });
             setPeers(prev => {
                if(!prev.includes(payload.callerID)) return [...prev, payload.callerID];
                return prev;
             });
         }
      });

      socketRef.current.on('answer', (payload: any) => {
         const item = peersRef.current.find(p => p.peerID === payload.id);
         if (item && !item.peer.destroyed) {
            try {
               item.peer.signal(payload.signal);
            } catch (err) {
               console.error("Signal error on answer:", err);
            }
         }
      });

      socketRef.current.on('user-disconnected', (userId: string) => {
         setPeers(prev => prev.filter(id => id !== userId));
         // Remove and destroy the peer
         const peerObj = peersRef.current.find(p => p.peerID === userId);
         if (peerObj) {
            try { peerObj.peer.destroy(); } catch(e) {}
         }
         peersRef.current = peersRef.current.filter(p => p.peerID !== userId);
         // Cleanup audio element
         if (audioRefs.current[userId]) {
            audioRefs.current[userId].pause();
            audioRefs.current[userId].srcObject = null;
            delete audioRefs.current[userId];
         }
      });

      return () => {
         socketRef.current?.disconnect();
         stopStream();
         peersRef.current.forEach(p => {
            try { p.peer.destroy(); } catch(e) {}
         });
      }
   }, []); // Removed 'connected' to prevent socket reconnect on state change

    const iceServers = {
       iceServers: [
           { urls: 'stun:stun.l.google.com:19302' },
           { urls: 'stun:global.stun.twilio.com:3478' }
       ]
    };

    function createPeer(userToSignal: string, callerID: string, stream: MediaStream) {
       const peer = new Peer({
           initiator: true,
           trickle: false,
           stream,
           config: iceServers
       });

       peer.on("signal", signal => {
           socketRef.current.emit("offer", {
               target: userToSignal,
               callerID: auth.currentUser?.uid || callerID,
               signal
           });
       });

       peer.on("stream", stream => {
           attachStream(userToSignal, stream);
       });

       return peer;
   }

   function addPeer(incomingSignal: any, callerID: string, stream: MediaStream) {
       const peer = new Peer({
           initiator: false,
           trickle: false,
           stream,
           config: iceServers
       });

       peer.on("signal", signal => {
           socketRef.current.emit("answer", { signal, target: callerID, id: auth.currentUser?.uid });
       });

       peer.on("stream", stream => {
           attachStream(callerID, stream);
       });

       peer.signal(incomingSignal);
       return peer;
   }

   const attachStream = (userId: string, stream: MediaStream) => {
       if (!audioRefs.current[userId]) {
           const audio = new Audio();
           audio.autoplay = true;
           audioRefs.current[userId] = audio;
           // Append to document to guarantee playback in some restrictive browsers
           audio.style.display = 'none';
           document.body.appendChild(audio);
       }
       audioRefs.current[userId].srcObject = stream;
       
       // Force play to overcome autoplay restrictions
       audioRefs.current[userId].play().catch(e => {
           console.error('Audio play error for user', userId, e);
       });
   }

   const stopStream = () => {
       if (userStream.current) {
           userStream.current.getTracks().forEach(track => track.stop());
           userStream.current = null;
       }
       // Also remove all appended audio elements
       Object.keys(audioRefs.current).forEach(userId => {
           const audio = audioRefs.current[userId];
           if (audio) {
               audio.pause();
               audio.srcObject = null;
               if (audio.parentNode) {
                   audio.parentNode.removeChild(audio);
               }
               delete audioRefs.current[userId];
           }
       });
   };

   const toggleConnection = async () => {
      if (connected) {
         socketRef.current?.emit('leave-room', room.id, auth.currentUser?.uid);
         setConnected(false);
         setPeers([]);
         stopStream();
         peersRef.current.forEach(p => {
             try { p.peer.destroy(); } catch(e) {}
         });
         peersRef.current = [];
      } else {
         try {
             const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
             userStream.current = stream;
             socketRef.current?.emit('join-room', room.id, auth.currentUser?.uid);
             setConnected(true);
         } catch (e: any) {
             toast.error("Para acessar as câmaras, permita o uso do microfone no seu navegador.");
             console.error("Audio error:", e);
         }
      }
   }

   return (
      <div className="w-full h-full flex flex-col bg-[#1a0b2e]/60 backdrop-blur-md rounded-xl">
         <div className="p-4 border-b border-fuchsia-900/30 bg-[#0c0514]/40 shrink-0 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => { if(connected) toggleConnection(); onBack(); }} className="md:hidden text-zinc-400 hover:text-fuchsia-100 hover:bg-fuchsia-900/20 -ml-2 transition-colors">
               <ChevronLeft className="w-5 h-5"/>
            </Button>
            <Mic className="w-5 h-5 text-amber-400 hidden md:block" />
            <span className="font-serif font-medium text-fuchsia-100 drop-shadow-sm">{room.name}</span>
         </div>
         <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center text-center p-8 relative">
            {/* Glowing background effect when connected */}
            {connected && <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent opacity-50 pointer-events-none"></div>}

            <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-6 transition-all duration-700 relative z-10 ${connected ? 'bg-amber-900/20 shadow-[0_0_60px_rgba(245,158,11,0.3)] border border-amber-500/30 scale-110' : 'bg-[#0c0514]/60 border border-fuchsia-900/40 shadow-lg shadow-fuchsia-900/10'}`}>
               <Mic className={`w-8 h-8 md:w-10 md:h-10 transition-colors duration-500 ${connected ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'text-zinc-500'}`} />
            </div>
            <h3 className="text-xl md:text-3xl font-serif text-fuchsia-50 mb-2 relative z-10 drop-shadow-md">{room.name}</h3>
            <p className="text-sm md:text-base text-zinc-400 max-w-sm mb-8 relative z-10 font-medium tracking-wide">
               Conecte sua aura para ecoar através do infinito. Sua voz será ouvida por todos na câmara.
            </p>
            
            {connected && (
              <div className="flex flex-wrap items-center justify-center gap-4 mb-8 max-h-[30vh] overflow-y-auto w-full px-4 relative z-10">
                 <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-[#1a0b2e] flex items-center justify-center border-2 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.4)] relative">
                       <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#1a0b2e]"></span>
                       <Mic className="w-6 h-6 text-fuchsia-100"/>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400/80 mt-3 drop-shadow-sm">Seu Eco</span>
                 </div>
                 {peers.map(p => (
                    <div key={p} className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                       <div className="w-14 h-14 rounded-full bg-[#0c0514]/80 flex items-center justify-center border border-fuchsia-900/50 shadow-md">
                          <Mic className="w-6 h-6 text-zinc-500"/>
                       </div>
                       <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-3">Espectro</span>
                    </div>
                 ))}
              </div>
            )}
            
            <Button 
               size="lg" 
               variant={connected ? 'destructive' : 'default'}
               className={`w-full md:w-auto h-14 md:h-14 rounded-full px-10 text-base font-medium transition-all relative z-10 
                  ${connected 
                     ? 'bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-500/30' 
                     : 'bg-amber-600/90 hover:bg-amber-600 text-amber-50 border border-amber-400/50 shadow-[0_0_30px_rgba(217,119,6,0.2)] hover:shadow-[0_0_40px_rgba(217,119,6,0.4)]'
                  }`}
               onClick={toggleConnection}
            >
               {connected ? (
                  <><PhoneOff className="w-5 h-5 mr-3" /> Silenciar Eco</>
               ) : (
                  <><Phone className="w-5 h-5 mr-3" /> Conjurar Voz</>
               )}
            </Button>
         </div>
      </div>
   )
}
