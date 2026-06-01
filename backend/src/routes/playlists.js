import { Router } from 'express';
import axios from 'axios';
import { readFileSync } from 'fs';
import { run, get, all, getDb, saveDatabase } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { parseM3U } from '../utils/m3uParser.js';

const router = Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  const playlists = all(`
    SELECT p.id, p.user_id, p.name, p.url, p.file_path, p.created_at,
      (SELECT COUNT(*) FROM channels c WHERE c.playlist_id = p.id) as channel_count
    FROM playlists p
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `, [req.user.id]);

  res.json(playlists);
});

router.post('/url', async (req, res) => {
  const { name, url } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: 'Nom et URL requis' });
  }

  try {
    const response = await axios.get(url, { timeout: 30000, responseType: 'text' });
    const channels = parseM3U(response.data);

    const result = run('INSERT INTO playlists (user_id, name, url) VALUES (?, ?, ?)', [req.user.id, name, url]);
    const playlistId = result.lastInsertRowid;

    const db = getDb();
    for (const ch of channels) {
      db.run('INSERT INTO channels (playlist_id, name, url, logo, group_name) VALUES (?, ?, ?, ?, ?)',
        [playlistId, ch.name, ch.url, ch.logo, ch.group_name]);
    }
    saveDatabase();

    res.status(201).json({ id: playlistId, name, channel_count: channels.length });
  } catch (error) {
    if (error.message === 'Format M3U invalide') {
      return res.status(400).json({ error: 'Format M3U invalide' });
    }
    res.status(500).json({ error: 'Impossible de récupérer la playlist' });
  }
});

router.post('/file', (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Fichier requis' });
  }

  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nom requis' });
  }

  try {
    const content = readFileSync(req.file.path, 'utf-8');
    const channels = parseM3U(content);

    const result = run('INSERT INTO playlists (user_id, name, file_path) VALUES (?, ?, ?)', [req.user.id, name, req.file.path]);
    const playlistId = result.lastInsertRowid;

    const db = getDb();
    for (const ch of channels) {
      db.run('INSERT INTO channels (playlist_id, name, url, logo, group_name) VALUES (?, ?, ?, ?, ?)',
        [playlistId, ch.name, ch.url, ch.logo, ch.group_name]);
    }
    saveDatabase();

    res.status(201).json({ id: playlistId, name, channel_count: channels.length });
  } catch (error) {
    if (error.message === 'Format M3U invalide') {
      return res.status(400).json({ error: 'Format M3U invalide' });
    }
    res.status(500).json({ error: 'Erreur lors du traitement du fichier' });
  }
});

router.delete('/:id', (req, res) => {
  const playlist = get('SELECT * FROM playlists WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist non trouvée' });
  }

  const db = getDb();
  db.run('DELETE FROM favorites WHERE channel_id IN (SELECT id FROM channels WHERE playlist_id = ?)', [req.params.id]);
  db.run('DELETE FROM channels WHERE playlist_id = ?', [req.params.id]);
  db.run('DELETE FROM playlists WHERE id = ?', [req.params.id]);
  saveDatabase();

  res.json({ message: 'Playlist supprimée' });
});

router.get('/:id/channels', (req, res) => {
  const playlist = get('SELECT * FROM playlists WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist non trouvée' });
  }

  const channels = all('SELECT * FROM channels WHERE playlist_id = ? ORDER BY group_name, name', [req.params.id]);
  const groups = [...new Set(channels.map(ch => ch.group_name))].sort();

  res.json({ channels, groups });
});

router.post('/:id/refresh', async (req, res) => {
  const playlist = get('SELECT * FROM playlists WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!playlist) {
    return res.status(404).json({ error: 'Playlist non trouvée' });
  }

  if (!playlist.url) {
    return res.status(400).json({ error: 'Seules les playlists par URL peuvent être rafraîchies' });
  }

  try {
    const response = await axios.get(playlist.url, { timeout: 30000, responseType: 'text' });
    const channels = parseM3U(response.data);

    const db = getDb();
    db.run('DELETE FROM favorites WHERE channel_id IN (SELECT id FROM channels WHERE playlist_id = ?)', [playlist.id]);
    db.run('DELETE FROM channels WHERE playlist_id = ?', [playlist.id]);

    for (const ch of channels) {
      db.run('INSERT INTO channels (playlist_id, name, url, logo, group_name) VALUES (?, ?, ?, ?, ?)',
        [playlist.id, ch.name, ch.url, ch.logo, ch.group_name]);
    }
    saveDatabase();

    res.json({ message: 'Playlist rafraîchie', channel_count: channels.length });
  } catch {
    res.status(500).json({ error: 'Impossible de rafraîchir la playlist' });
  }
});

export default router;
