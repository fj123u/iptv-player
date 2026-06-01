import { Router } from 'express';
import axios from 'axios';
import { run, get, all, getDb, saveDatabase } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

function parseXtreamUrl(url) {
  const parts = url.replace('xtream://', '').split('|');
  return { server: parts[0], username: parts[1], password: parts[2] };
}

router.post('/login', async (req, res) => {
  const { server, username, password, name } = req.body;

  if (!server || !username || !password) {
    return res.status(400).json({ error: 'Serveur, identifiant et mot de passe requis' });
  }

  const cleanServer = server.replace(/\/$/, '');

  try {
    const { data } = await axios.get(`${cleanServer}/player_api.php`, {
      params: { username, password },
      timeout: 15000
    });

    if (!data || data.user_info?.auth === 0) {
      return res.status(401).json({ error: 'Identifiants Xtream incorrects' });
    }

    const playlistName = name || `Xtream - ${data.user_info?.username || username}`;

    const result = run(
      'INSERT INTO playlists (user_id, name, url) VALUES (?, ?, ?)',
      [req.user.id, playlistName, `xtream://${cleanServer}|${username}|${password}`]
    );
    const playlistId = result.lastInsertRowid;

    // Charger les chaînes live
    const catRes = await axios.get(`${cleanServer}/player_api.php`, {
      params: { username, password, action: 'get_live_categories' },
      timeout: 15000
    });
    const categories = catRes.data || [];

    const streamsRes = await axios.get(`${cleanServer}/player_api.php`, {
      params: { username, password, action: 'get_live_streams' },
      timeout: 30000
    });
    const streams = streamsRes.data || [];

    const catMap = {};
    for (const cat of categories) {
      catMap[cat.category_id] = cat.category_name;
    }

    const db = getDb();
    let count = 0;
    for (const stream of streams) {
      const streamUrl = `${cleanServer}/live/${username}/${password}/${stream.stream_id}.m3u8`;
      const groupName = catMap[stream.category_id] || 'Non classé';
      db.run(
        'INSERT INTO channels (playlist_id, name, url, logo, group_name) VALUES (?, ?, ?, ?, ?)',
        [playlistId, stream.name || 'Sans nom', streamUrl, stream.stream_icon || null, groupName]
      );
      count++;
    }
    saveDatabase();

    res.status(201).json({
      id: playlistId,
      name: playlistName,
      channel_count: count,
      user_info: {
        status: data.user_info?.status,
        exp_date: data.user_info?.exp_date,
        max_connections: data.user_info?.max_connections
      }
    });
  } catch (err) {
    if (err.response?.status === 401 || err.response?.status === 403) {
      return res.status(401).json({ error: 'Identifiants Xtream incorrects' });
    }
    res.status(500).json({ error: 'Impossible de se connecter au serveur Xtream', detail: err.message });
  }
});

// VOD categories
router.get('/:playlistId/vod/categories', async (req, res) => {
  const playlist = get('SELECT * FROM playlists WHERE id = ? AND user_id = ?', [req.params.playlistId, req.user.id]);
  if (!playlist || !playlist.url?.startsWith('xtream://')) {
    return res.status(404).json({ error: 'Playlist Xtream non trouvée' });
  }

  const { server, username, password } = parseXtreamUrl(playlist.url);

  try {
    const { data } = await axios.get(`${server}/player_api.php`, {
      params: { username, password, action: 'get_vod_categories' },
      timeout: 15000
    });
    res.json(data || []);
  } catch {
    res.status(500).json({ error: 'Erreur chargement catégories VOD' });
  }
});

// VOD streams (films)
router.get('/:playlistId/vod', async (req, res) => {
  const playlist = get('SELECT * FROM playlists WHERE id = ? AND user_id = ?', [req.params.playlistId, req.user.id]);
  if (!playlist || !playlist.url?.startsWith('xtream://')) {
    return res.status(404).json({ error: 'Playlist Xtream non trouvée' });
  }

  const { server, username, password } = parseXtreamUrl(playlist.url);
  const { category_id } = req.query;

  try {
    const params = { username, password, action: 'get_vod_streams' };
    if (category_id) params.category_id = category_id;

    const { data } = await axios.get(`${server}/player_api.php`, {
      params,
      timeout: 30000
    });

    const films = (data || []).map(film => ({
      id: film.stream_id,
      name: film.name,
      logo: film.stream_icon || film.cover_big || null,
      rating: film.rating || null,
      year: film.year || null,
      genre: film.genre || null,
      plot: film.plot || null,
      cast: film.cast || null,
      director: film.director || null,
      url: `${server}/movie/${username}/${password}/${film.stream_id}.${film.container_extension || 'mp4'}`,
      container: film.container_extension || 'mp4',
      category_id: film.category_id
    }));

    res.json(films);
  } catch {
    res.status(500).json({ error: 'Erreur chargement VOD' });
  }
});

// VOD info
router.get('/:playlistId/vod/:vodId', async (req, res) => {
  const playlist = get('SELECT * FROM playlists WHERE id = ? AND user_id = ?', [req.params.playlistId, req.user.id]);
  if (!playlist || !playlist.url?.startsWith('xtream://')) {
    return res.status(404).json({ error: 'Playlist Xtream non trouvée' });
  }

  const { server, username, password } = parseXtreamUrl(playlist.url);

  try {
    const { data } = await axios.get(`${server}/player_api.php`, {
      params: { username, password, action: 'get_vod_info', vod_id: req.params.vodId },
      timeout: 15000
    });
    if (data?.info) {
      data.info.play_url = `${server}/movie/${username}/${password}/${req.params.vodId}.${data.movie_data?.container_extension || 'mp4'}`;
    }
    res.json(data || {});
  } catch {
    res.status(500).json({ error: 'Erreur chargement info film' });
  }
});

// Series categories
router.get('/:playlistId/series/categories', async (req, res) => {
  const playlist = get('SELECT * FROM playlists WHERE id = ? AND user_id = ?', [req.params.playlistId, req.user.id]);
  if (!playlist || !playlist.url?.startsWith('xtream://')) {
    return res.status(404).json({ error: 'Playlist Xtream non trouvée' });
  }

  const { server, username, password } = parseXtreamUrl(playlist.url);

  try {
    const { data } = await axios.get(`${server}/player_api.php`, {
      params: { username, password, action: 'get_series_categories' },
      timeout: 15000
    });
    res.json(data || []);
  } catch {
    res.status(500).json({ error: 'Erreur chargement catégories séries' });
  }
});

// Series list
router.get('/:playlistId/series', async (req, res) => {
  const playlist = get('SELECT * FROM playlists WHERE id = ? AND user_id = ?', [req.params.playlistId, req.user.id]);
  if (!playlist || !playlist.url?.startsWith('xtream://')) {
    return res.status(404).json({ error: 'Playlist Xtream non trouvée' });
  }

  const { server, username, password } = parseXtreamUrl(playlist.url);
  const { category_id } = req.query;

  try {
    const params = { username, password, action: 'get_series' };
    if (category_id) params.category_id = category_id;

    const { data } = await axios.get(`${server}/player_api.php`, {
      params,
      timeout: 30000
    });

    const series = (data || []).map(s => ({
      id: s.series_id,
      name: s.name,
      logo: s.cover || null,
      rating: s.rating || null,
      year: s.year || null,
      genre: s.genre || null,
      plot: s.plot || null,
      cast: s.cast || null,
      category_id: s.category_id
    }));

    res.json(series);
  } catch {
    res.status(500).json({ error: 'Erreur chargement séries' });
  }
});

// Series info (seasons + episodes)
router.get('/:playlistId/series/:seriesId', async (req, res) => {
  const playlist = get('SELECT * FROM playlists WHERE id = ? AND user_id = ?', [req.params.playlistId, req.user.id]);
  if (!playlist || !playlist.url?.startsWith('xtream://')) {
    return res.status(404).json({ error: 'Playlist Xtream non trouvée' });
  }

  const { server, username, password } = parseXtreamUrl(playlist.url);

  try {
    const { data } = await axios.get(`${server}/player_api.php`, {
      params: { username, password, action: 'get_series_info', series_id: req.params.seriesId },
      timeout: 15000
    });

    if (data?.episodes) {
      for (const season of Object.keys(data.episodes)) {
        data.episodes[season] = data.episodes[season].map(ep => ({
          ...ep,
          play_url: `${server}/series/${username}/${password}/${ep.id}.${ep.container_extension || 'mp4'}`
        }));
      }
    }

    res.json(data || {});
  } catch {
    res.status(500).json({ error: 'Erreur chargement info série' });
  }
});

export default router;
