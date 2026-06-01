import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Search, Play, Star, ChevronLeft, ChevronRight, X, ArrowLeft } from 'lucide-react';

export default function Series({ playlistId, onPlay }) {
  const [categories, setCategories] = useState([]);
  const [seriesByCategory, setSeriesByCategory] = useState({});
  const [allSeries, setAllSeries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [seriesInfo, setSeriesInfo] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [heroSeries, setHeroSeries] = useState(null);

  useEffect(() => {
    loadAll();
  }, [playlistId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [catRes, seriesRes] = await Promise.all([
        api.get(`/xtream/${playlistId}/series/categories`),
        api.get(`/xtream/${playlistId}/series`)
      ]);

      const cats = catRes.data || [];
      const series = seriesRes.data || [];
      setCategories(cats);
      setAllSeries(series);

      const grouped = {};
      for (const cat of cats) {
        const catSeries = series.filter(s => String(s.category_id) === String(cat.category_id));
        if (catSeries.length > 0) {
          grouped[cat.category_id] = { name: cat.category_name, series: catSeries };
        }
      }
      setSeriesByCategory(grouped);

      const withLogo = series.filter(s => s.logo && s.rating);
      if (withLogo.length > 0) {
        setHeroSeries(withLogo[Math.floor(Math.random() * Math.min(20, withLogo.length))]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.length > 1) {
      const q = searchQuery.toLowerCase();
      setSearchResults(allSeries.filter(s => s.name.toLowerCase().includes(q)).slice(0, 30));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allSeries]);

  const openSeries = async (s) => {
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
      name: `${selectedSeries.name} - S${episode.season}E${episode.episode_num} - ${episode.title || ''}`,
      url: episode.play_url,
      logo: episode.info?.movie_image || selectedSeries.logo
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Series detail view
  if (selectedSeries && seriesInfo) {
    const seasons = Object.keys(seriesInfo.episodes || {});
    const episodes = selectedSeason ? seriesInfo.episodes[selectedSeason] || [] : [];

    return (
      <div className="space-y-6 -mt-6 -mx-6">
        {/* Hero */}
        <div className="relative h-[40vh] min-h-[300px]">
          <div className="absolute inset-0">
            {selectedSeries.logo && (
              <img src={selectedSeries.logo} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/70 to-dark-950/30" />
          </div>
          <div className="absolute top-6 left-6">
            <button
              onClick={() => { setSelectedSeries(null); setSeriesInfo(null); }}
              className="p-2 bg-dark-900/80 rounded-full hover:bg-dark-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
          <div className="absolute bottom-8 left-8 max-w-lg">
            <h1 className="text-3xl font-bold mb-2">{selectedSeries.name}</h1>
            <div className="flex items-center gap-4 text-sm text-dark-300 mb-3">
              {selectedSeries.rating && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4" fill="currentColor" />
                  {selectedSeries.rating}
                </span>
              )}
              {selectedSeries.year && <span>{selectedSeries.year}</span>}
              {selectedSeries.genre && <span>{selectedSeries.genre}</span>}
              <span>{seasons.length} saison{seasons.length > 1 ? 's' : ''}</span>
            </div>
            {seriesInfo.info?.plot && (
              <p className="text-sm text-dark-300 line-clamp-3">{seriesInfo.info.plot}</p>
            )}
          </div>
        </div>

        <div className="px-8">
          {/* Season tabs */}
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
            {seasons.map(season => (
              <button
                key={season}
                onClick={() => setSelectedSeason(season)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedSeason === season
                    ? 'bg-violet-600 text-white'
                    : 'bg-dark-800 text-dark-300 hover:bg-dark-700'
                }`}
              >
                Saison {season}
              </button>
            ))}
          </div>

          {/* Episodes */}
          <div className="space-y-3">
            {episodes.map((ep, idx) => (
              <div
                key={ep.id}
                onClick={() => handlePlayEpisode(ep)}
                className="flex items-center gap-4 p-4 bg-dark-800/50 rounded-xl border border-dark-700/50 hover:border-violet-500/50 hover:bg-dark-800 cursor-pointer transition-all group"
              >
                <span className="text-2xl font-bold text-dark-600 w-8 text-center">{ep.episode_num || idx + 1}</span>
                <div className="w-12 h-12 flex items-center justify-center bg-dark-700 rounded-lg group-hover:bg-violet-600 transition-colors shrink-0">
                  <Play className="w-5 h-5" fill="currentColor" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{ep.title || `Épisode ${ep.episode_num || idx + 1}`}</p>
                  {ep.info?.plot && <p className="text-xs text-dark-400 line-clamp-1 mt-1">{ep.info.plot}</p>}
                </div>
                {ep.info?.duration && <span className="text-xs text-dark-500 shrink-0">{ep.info.duration}</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 -mt-6 -mx-6">
      {/* Hero */}
      {heroSeries && !searchQuery && (
        <div className="relative h-[50vh] min-h-[400px]">
          <div className="absolute inset-0">
            {heroSeries.logo && (
              <img src={heroSeries.logo} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-950/80 to-transparent" />
          </div>
          <div className="absolute bottom-12 left-8 max-w-lg">
            <h1 className="text-4xl font-bold mb-3">{heroSeries.name}</h1>
            <div className="flex items-center gap-4 text-sm text-dark-300 mb-4">
              {heroSeries.rating && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4" fill="currentColor" />
                  {heroSeries.rating}
                </span>
              )}
              {heroSeries.year && <span>{heroSeries.year}</span>}
              {heroSeries.genre && <span>{heroSeries.genre}</span>}
            </div>
            {heroSeries.plot && (
              <p className="text-sm text-dark-300 line-clamp-3 mb-6">{heroSeries.plot}</p>
            )}
            <button
              onClick={() => openSeries(heroSeries)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              <Play className="w-5 h-5" fill="black" />
              Voir les épisodes
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-8">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une série..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      </div>

      {/* Search results or carousels */}
      {searchQuery.length > 1 ? (
        <div className="px-8">
          <h2 className="text-xl font-semibold mb-4">Résultats ({searchResults.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {searchResults.map(s => (
              <SeriesCard key={s.id} series={s} onClick={() => openSeries(s)} />
            ))}
          </div>
        </div>
      ) : (
        Object.entries(seriesByCategory).map(([catId, { name, series }]) => (
          <Carousel key={catId} title={name} items={series} onSelect={openSeries} />
        ))
      )}
    </div>
  );
}

function SeriesCard({ series, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group relative rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 hover:z-10"
    >
      <div className="aspect-[2/3] bg-dark-800">
        {series.logo ? (
          <img src={series.logo} alt={series.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-dark-600" />
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3">
        <Play className="w-10 h-10 text-white mb-2" fill="white" />
        <p className="text-sm font-medium text-center line-clamp-2">{series.name}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-dark-300">
          {series.rating && (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
              {series.rating}
            </span>
          )}
          {series.year && <span>{series.year}</span>}
        </div>
      </div>
    </div>
  );
}

function Carousel({ title, items, onSelect }) {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    const el = scrollRef.current;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <div className="relative group/carousel px-8">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-dark-950 to-transparent z-10 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div ref={scrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2">
          {items.slice(0, 30).map(s => (
            <div key={s.id} className="shrink-0 w-36 sm:w-40">
              <SeriesCard series={s} onClick={() => onSelect(s)} />
            </div>
          ))}
        </div>
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-dark-950 to-transparent z-10 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
