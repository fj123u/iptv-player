import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';

import authRoutes from './routes/auth.js';
import playlistRoutes from './routes/playlists.js';
import channelRoutes from './routes/channels.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

const upload = multer({ dest: join(__dirname, '..', 'uploads') });

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/playlists', (req, res, next) => {
  if (req.path === '/file' && req.method === 'POST') {
    upload.single('file')(req, res, next);
  } else {
    next();
  }
}, playlistRoutes);
app.use('/api/channels', channelRoutes);

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Serveur IPTV démarré sur le port ${PORT}`);
  });
}

start();
