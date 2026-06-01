import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Search, Play, Star, ArrowLeft } from 'lucide-react';

export default function Vod({ playlistId, onBack, onPlay }) {
  const [categories, setCategories] = useState([]);
  const [films, setFilms] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedFilm, setSelectedFilm] = useState(null);

  useEffect(() => {
    loadCategories();
  }, [playlistId]);

  useEffect(() => {
    loadFilms();
  }, [selectedCategory, playlistId]);

  const loadCategories = async () => {
    try {
      const { data } = await api.get(`/xtream/${playlistId}/vod/categories`);
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFilms = async () => {
    setLoading(true);
    try {
      const params = selectedCategory ? `?category_id=${selectedCategory}` : '';
      const { data } = await api.get(`/xtream/${playlistId}/vod${params}`);
      setFilms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFilms = searchQuery
    ? films.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : films;

  const handlePlayFilm = (film) => {
    onPlay({ name: film.name, url: film.url, logo: film.logo });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-dark-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold">Films</h2>
        <div className="flex-1 max-w-md ml-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un film..."
              className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Categories sidebar */}
        <div className="w-48 shrink-0 overflow-y-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              !selectedCategory ? 'bg-violet-600/20 text-violet-400' : 'hover:bg-dark-800 text-dark-300'
            }`}
          >
            Tous ({films.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.category_id}
              onClick={() => setSelectedCategory(cat.category_id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors truncate ${
                selectedCategory === cat.category_id ? 'bg-violet-600/20 text-violet-400' : 'hover:bg-dark-800 text-dark-300'
              }`}
            >
              {cat.category_name}
            </button>
          ))}
        </div>

        {/* Films grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-dark-800 rounded-xl animate-pulse aspect-[2/3]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFilms.map(film => (
                <div
                  key={film.id}
                  className="group relative bg-dark-800 rounded-xl overflow-hidden border border-dark-700 hover:border-violet-500/50 transition-all cursor-pointer hover:scale-105"
                  onClick={() => setSelectedFilm(film)}
                >
                  <div className="aspect-[2/3] relative">
                    {film.logo ? (
                      <img src={film.logo} alt={film.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-dark-700">
                        <Play className="w-10 h-10 text-dark-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" fill="white" />
                    </div>
                    {film.rating && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded text-xs">
                        <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                        {film.rating}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium truncate">{film.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {film.year && <span className="text-xs text-dark-400">{film.year}</span>}
                      {film.genre && <span className="text-xs text-dark-500 truncate">{film.genre}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Film detail modal */}
      {selectedFilm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedFilm(null)}>
          <div className="bg-dark-900 rounded-xl border border-dark-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex gap-6 p-6">
              {selectedFilm.logo && (
                <img src={selectedFilm.logo} alt={selectedFilm.name} className="w-40 h-60 object-cover rounded-lg shrink-0" />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">{selectedFilm.name}</h2>
                <div className="flex flex-wrap gap-3 text-sm text-dark-400 mb-4">
                  {selectedFilm.year && <span>{selectedFilm.year}</span>}
                  {selectedFilm.rating && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                      {selectedFilm.rating}
                    </span>
                  )}
                  {selectedFilm.genre && <span>{selectedFilm.genre}</span>}
                </div>
                {selectedFilm.director && <p className="text-sm text-dark-300 mb-2"><strong>Réalisateur :</strong> {selectedFilm.director}</p>}
                {selectedFilm.cast && <p className="text-sm text-dark-400 mb-4"><strong>Casting :</strong> {selectedFilm.cast}</p>}
                {selectedFilm.plot && <p className="text-sm text-dark-400 mb-4">{selectedFilm.plot}</p>}
                <button
                  onClick={() => { handlePlayFilm(selectedFilm); setSelectedFilm(null); }}
                  className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-medium transition-colors"
                >
                  <Play className="w-5 h-5" fill="white" />
                  Regarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
