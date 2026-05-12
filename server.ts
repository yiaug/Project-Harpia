import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  
  app.use(express.json());

  const appURL = process.env.APP_URL || 'http://localhost:3000';
  const corsOrigin = process.env.NODE_ENV === 'production' ? appURL : '*';

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin, // More secure setting for prod
    }
  });

  // Socket.io for Real-time Voice & Text chat routing
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    
    // Join a room (Voice or Text)
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId);
      if (userId) {
        socket.join(userId); // Join personal room for signaling
      }
      socket.to(roomId).emit('user-connected', userId);
      
      socket.on('disconnect', () => {
        socket.to(roomId).emit('user-disconnected', userId);
      });
    });

    // WebRTC Signaling
    socket.on('offer', (payload) => {
        io.to(payload.target).emit('offer', payload);
    });
    
    socket.on('answer', (payload) => {
        io.to(payload.target).emit('answer', payload);
    });
    
    socket.on('ice-candidate', (payload) => {
        io.to(payload.target).emit('ice-candidate', payload);
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/tarot/random', async (req, res) => {
    try {
      const resp = await fetch('https://tarotapi.dev/api/v1/cards/random?n=1');
      if (!resp.ok) {
        return res.status(resp.status).json({ error: 'Tarot API error' });
      }
      const data = await resp.json();
      res.json(data);
    } catch (e) {
      console.error('Tarot proxy error:', e);
      res.status(500).json({ error: 'Failed to fetch from Tarot API' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen({ port: PORT, host: '0.0.0.0' }, () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
