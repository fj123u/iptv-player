import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Search, Play, Star, ArrowLeft, ChevronRight } from 'lucide-react';

export default function Series({ playlistId, onBack, onPlay }) {
  const [categories, setCategories] = useState([]);
  const [series, setSeries] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [seriesInfo, setSeriesInfo] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);

  useEffect(() => {
    loadCategories();
  }, [playlistId]);

  useEffect(() => {
    loadSeries();
  }, [selectedCategory, playlistId]);

  const loadCategories = async () => {
    try {
      const { data } = await api.get(`/xtream/${playlistId}/series/categories`);
      setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSeries = async () => {
    setLoading(true);
    try {
      const params = selectedCategory ? `?category_id=${selectedCategory}` : '';
      const { data } = await api.get(`/xtream/${playlistId}/series${params}`);
      setSeries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSeriesInfo = async (s) => {
    setSelectedSeries(s);
    setLoadingInfo(true);
    try {
      const { data } = await api.get(`/xtream/${playlistId}/series/${s.id}`);
      setSeriesInfo(data);
      const seasons = Object.keys(data.episodes || {});
      if (seasons.length > 0) setSelectedSeason(seasons[0]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInfo(false);
    }
  };

  const handlePlayEpisode = (episode) => {
    onPlay({
      name: `${selectedSeries.name} - S${episode.season}E${episode.episode_num} - ${episode.title}`,
      url: episode.play_url,
      logo: episode.info?.movie_image || selectedSeries.logo
    });
  };

  const filteredSeries = searchQuery
    ? series.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : series;

  // Detail view
  if (selectedSeries && seriesInfo) {
    const seasons = Object.keys(seriesInfo.episodes || {});
    const episodes = selectedSeason ? seriesInfo.episodes[selectedSeason] || [] : [];

    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => { setSelectedSeries(null); setSeriesInfo(null); }} className="p-2 hover:bg-dark-800 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold">{selectedSeries.name}</h2>
        </div>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Info */}
          <div className="w-64 shrink-0">
            {selectedSeries.logo && (
              <img src={selectedSeries.logo} alt={selectedSeries.name} className="w-full rounded-lg mb-4" />
            )}
            <div className="space-y-2 text-sm">
              {selectedSeries.year && <p className="text-dark-400">Année : {selectedSeries.year}</p>}
              {selectedSeries.rating && (
                <p className="flex items-center gap-1 text-dark-400">
                  <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                  {selectedSeries.rating}
                </p>
              )}
              {selectedSeries.genre && <p className="text-dark-400">{selectedSeries.genre}</p>}
              {seriesInfo.info?.plot && <p className="text-dark-500 text-xs mt-3">{seriesInfo.info.plot}</p>}
            </div>

            {/* Season selector */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-dark-300 mb-2">Saisons</h3>
              <div className="space-y-1">
                {seasons.map(season => (
                  <button
                    key={season}
                    onClick={() => setSelectedSeason(season)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedSeason === season ? 'bg-violet-600/20 text-violet-400' : 'hover:bg-dark-800 text-dark-300'
                    }`}
                  >
                    Saison {season}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Episodes */}
          <div className="flex-1 overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Saison {selectedSeason} ({episodes.length} épisodes)</h3>
            <div className="space-y-2">
              {episodes.map(ep => (
                <div
                  key={ep.id}
                  onClick={() => handlePlayEpisode(ep)}
                  className="flex items-center gap-4 p-4 bg-dark-800 rounded-xl border border-dark-700 hover:border-violet-500/50 cursor-pointer transition-all group"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-dark-700 rounded-lg group-hover:bg-violet-600 transition-colors">
                    <Play className="w-5 h-5" fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      E{ep.episode_num}. {ep.title || `Épisode ${ep.episode_num}`}
                    </p>
                    {ep.info?.plot && <p className="text-xs text-dark-400 truncate mt-1">{ep.info.plot}</p>}
                  </div>
                  {ep.info?.duration && <span className="text-xs text-dark-500">{ep.info.duration}</span>}
                  <ChevronRight className="w-4 h-4 text-dark-500 group-hover:text-violet-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-dark-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold">Séries</h2>
        <div className="flex-1 max-w-md ml-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une série..."
              className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 overflow-hidden">
        {/* Categories */}
        <div className="w-48 shrink-0 overflow-y-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-1 transition-colors ${
              !selectedCategory ? 'bg-violet-600/20 text-violet-400' : 'hover:bg-dark-800 text-dark-300'
            }`}
          >
            Toutes
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

        {/* Series grid */}
        <div className="flex-1 overflow-y-auto">
          {loading || loadingInfo ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-dark-800 rounded-xl animate-pulse aspect-[2/3]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredSeries.map(s => (
                <div
                  key={s.id}
                  className="group relative bg-dark-800 rounded-xl overflow-hidden border border-dark-700 hover:border-violet-500/50 transition-all cursor-pointer hover:scale-105"
                  onClick={() => loadSeriesInfo(s)}
                >
                  <div className="aspect-[2/3] relative">
                    {s.logo ? (
                      <img src={s.logo} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-dark-700">
                        <Play className="w-10 h-10 text-dark-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-12 h-12 text-white" fill="white" />
                    </div>
                    {s.rating && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded text-xs">
                        <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
                        {s.rating}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium truncate">{s.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {s.year && <span className="text-xs text-dark-400">{s.year}</span>}
                      {s.genre && <span className="text-xs text-dark-500 truncate">{s.genre}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
