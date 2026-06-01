import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './database.js';

import authRoutes from './routes/auth.js';
import playlistRoutes from './routes/playlists.js';
import channelRoutes from './routes/channels.js';
import xtreamRoutes from './routes/xtream.js';

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
app.use('/api/xtream', xtreamRoutes);

app.get('/api/proxy', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL requise' });

  try {
    // Pour les vidéos (VOD), utiliser le streaming
    const isVideo = url.match(/\.(mp4|mkv|avi|ts)(\?|$)/i) && !url.includes('.m3u8');

    const response = await axios.get(url, {
      responseType: isVideo ? 'stream' : 'arraybuffer',
      timeout: isVideo ? 0 : 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Referer': new URL(url).origin + '/'
      },
      maxRedirects: 5
    });

    if (isVideo) {
      const contentType = response.headers['content-type'] || 'video/mp4';
      res.set({
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Transfer-Encoding': 'chunked'
      });
      if (response.headers['content-length']) {
        res.set('Content-Length', response.headers['content-length']);
      }
      response.data.pipe(res);
      return;
    }

    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const isPlaylist = url.includes('.m3u8') || url.includes('.m3u') ||
      contentType.includes('mpegurl') || contentType.includes('x-mpegURL');

    res.set({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    if (isPlaylist) {
      let content = Buffer.from(response.data).toString('utf-8');
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

      // Réécrire les URLs relatives en URLs absolues proxifiées
      content = content.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          let absoluteUrl;
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            absoluteUrl = trimmed;
          } else {
            absoluteUrl = baseUrl + trimmed;
          }
          return '/api/proxy?url=' + encodeURIComponent(absoluteUrl);
        }
        // Réécrire les URI dans les tags EXT-X (comme EXT-X-KEY)
        if (trimmed.includes('URI="')) {
          return trimmed.replace(/URI="([^"]+)"/, (match, uri) => {
            let absoluteUri;
            if (uri.startsWith('http://') || uri.startsWith('https://')) {
              absoluteUri = uri;
            } else {
              absoluteUri = baseUrl + uri;
            }
            return 'URI="/api/proxy?url=' + encodeURIComponent(absoluteUri) + '"';
          });
        }
        return line;
      }).join('\n');

      res.set('Content-Type', 'application/vnd.apple.mpegurl');
      res.send(content);
    } else {
      res.set('Content-Type', contentType);
      res.send(Buffer.from(response.data));
    }
  } catch (err) {
    res.status(502).json({ error: 'Impossible de récupérer le flux', detail: err.message });
  }
});

async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Serveur IPTV démarré sur le port ${PORT}`);
  });
}

start();
