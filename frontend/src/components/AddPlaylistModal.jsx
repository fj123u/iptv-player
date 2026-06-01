import { useState } from 'react';
import { X, Link, Upload, Loader, Server } from 'lucide-react';
import api from '../utils/api';

export default function AddPlaylistModal({ onClose, onAdded }) {
  const [mode, setMode] = useState('xtream');
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [xtreamServer, setXtreamServer] = useState('');
  const [xtreamUser, setXtreamUser] = useState('');
  const [xtreamPass, setXtreamPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'xtream') {
        await api.post('/xtream/login', {
          server: xtreamServer,
          username: xtreamUser,
          password: xtreamPass,
          name: name || undefined
        });
      } else if (mode === 'url') {
        await api.post('/playlists/url', { name, url });
      } else {
        const formData = new FormData();
        formData.append('name', name);
        formData.append('file', file);
        await api.post('/playlists/file', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-dark-900 rounded-xl border border-dark-700 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-dark-800">
          <h2 className="text-lg font-semibold">Ajouter une playlist</h2>
          <button onClick={onClose} className="p-2 hover:bg-dark-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Mode toggle */}
          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => setMode('xtream')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors text-sm ${
                mode === 'xtream'
                  ? 'bg-violet-600/20 border-violet-500 text-violet-400'
                  : 'border-dark-700 text-dark-400 hover:border-dark-600'
              }`}
            >
              <Server className="w-4 h-4" />
              Xtream
            </button>
            <button
              type="button"
              onClick={() => setMode('url')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors text-sm ${
                mode === 'url'
                  ? 'bg-violet-600/20 border-violet-500 text-violet-400'
                  : 'border-dark-700 text-dark-400 hover:border-dark-600'
              }`}
            >
              <Link className="w-4 h-4" />
              URL
            </button>
            <button
              type="button"
              onClick={() => setMode('file')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border transition-colors text-sm ${
                mode === 'file'
                  ? 'bg-violet-600/20 border-violet-500 text-violet-400'
                  : 'border-dark-700 text-dark-400 hover:border-dark-600'
              }`}
            >
              <Upload className="w-4 h-4" />
              Fichier
            </button>
          </div>

          {mode === 'xtream' ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-300 mb-2">Serveur (URL)</label>
                <input
                  type="url"
                  value={xtreamServer}
                  onChange={(e) => setXtreamServer(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="http://serveur.com:port"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-300 mb-2">Identifiant</label>
                <input
                  type="text"
                  value={xtreamUser}
                  onChange={(e) => setXtreamUser(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="username"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-300 mb-2">Mot de passe</label>
                <input
                  type="password"
                  value={xtreamPass}
                  onChange={(e) => setXtreamPass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="password"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-300 mb-2">Nom (optionnel)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="Mon IPTV"
                />
              </div>
            </>
          ) : mode === 'url' ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-300 mb-2">Nom de la playlist</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="Ma playlist IPTV"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-300 mb-2">URL de la playlist M3U</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="https://exemple.com/playlist.m3u"
                  required
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-dark-300 mb-2">Nom de la playlist</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
                  placeholder="Ma playlist IPTV"
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-300 mb-2">Fichier M3U / M3U8</label>
                <input
                  type="file"
                  accept=".m3u,.m3u8"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full px-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 transition-colors file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-violet-600 file:text-white file:text-sm"
                  required
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {mode === 'xtream' ? 'Connexion...' : 'Chargement...'}
              </>
            ) : (
              mode === 'xtream' ? 'Se connecter' : 'Ajouter la playlist'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
