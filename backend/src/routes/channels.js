import { Router } from 'express';
import { run, get, all, getDb, saveDatabase } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/search', (req, res) => {
  const { q, group, playlist_id } = req.query;

  let query = `
    SELECT c.*, p.name as playlist_name,
      CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
    FROM channels c
    JOIN playlists p ON p.id = c.playlist_id
    LEFT JOIN favorites f ON f.channel_id = c.id AND f.user_id = ?
    WHERE p.user_id = ?
  `;
  const params = [req.user.id, req.user.id];

  if (q) {
    query += ' AND c.name LIKE ?';
    params.push(`%${q}%`);
  }

  if (group) {
    query += ' AND c.group_name = ?';
    params.push(group);
  }

  if (playlist_id) {
    query += ' AND c.playlist_id = ?';
    params.push(Number(playlist_id));
  }

  query += ' ORDER BY c.group_name, c.name LIMIT 200';

  const channels = all(query, params);
  res.json(channels);
});

router.get('/groups', (req, res) => {
  const groups = all(`
    SELECT c.group_name, COUNT(*) as count
    FROM channels c
    JOIN playlists p ON p.id = c.playlist_id
    WHERE p.user_id = ?
    GROUP BY c.group_name
    ORDER BY c.group_name
  `, [req.user.id]);

  res.json(groups);
});

router.get('/favorites', (req, res) => {
  const channels = all(`
    SELECT c.*, p.name as playlist_name, 1 as is_favorite
    FROM favorites f
    JOIN channels c ON c.id = f.channel_id
    JOIN playlists p ON p.id = c.playlist_id
    WHERE f.user_id = ?
    ORDER BY f.created_at DESC
  `, [req.user.id]);

  res.json(channels);
});

router.post('/:id/favorite', (req, res) => {
  const channelId = Number(req.params.id);

  const channel = get(`
    SELECT c.* FROM channels c
    JOIN playlists p ON p.id = c.playlist_id
    WHERE c.id = ? AND p.user_id = ?
  `, [channelId, req.user.id]);

  if (!channel) {
    return res.status(404).json({ error: 'Chaîne non trouvée' });
  }

  const existing = get('SELECT id FROM favorites WHERE user_id = ? AND channel_id = ?', [req.user.id, channelId]);

  if (existing) {
    const db = getDb();
    db.run('DELETE FROM favorites WHERE user_id = ? AND channel_id = ?', [req.user.id, channelId]);
    saveDatabase();
    res.json({ is_favorite: false });
  } else {
    run('INSERT INTO favorites (user_id, channel_id) VALUES (?, ?)', [req.user.id, channelId]);
    res.json({ is_favorite: true });
  }
});

export default router;
