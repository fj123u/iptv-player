import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import { Search, Play, Star, Info, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Vod({ playlistId, onPlay }) {
  const [categories, setCategories] = useState([]);
  const [filmsByCategory, setFilmsByCategory] = useState({});
  const [allFilms, setAllFilms] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilm, setSelectedFilm] = useState(null);
  const [heroFilm, setHeroFilm] = useState(null);

  useEffect(() => {
    loadAll();
  }, [playlistId]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [catRes, filmsRes] = await Promise.all([
        api.get(`/xtream/${playlistId}/vod/categories`),
        api.get(`/xtream/${playlistId}/vod`)
      ]);

      const cats = catRes.data || [];
      const films = filmsRes.data || [];
      setCategories(cats);
      setAllFilms(films);

      // Group by category
      const grouped = {};
      for (const cat of cats) {
        const catFilms = films.filter(f => String(f.category_id) === String(cat.category_id));
        if (catFilms.length > 0) {
          grouped[cat.category_id] = { name: cat.category_name, films: catFilms };
        }
      }
      setFilmsByCategory(grouped);

      // Pick hero
      const withLogo = films.filter(f => f.logo && f.rating);
      if (withLogo.length > 0) {
        setHeroFilm(withLogo[Math.floor(Math.random() * Math.min(20, withLogo.length))]);
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
      setSearchResults(allFilms.filter(f => f.name.toLowerCase().includes(q)).slice(0, 30));
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, allFilms]);

  const handlePlay = (film) => {
    onPlay({ name: film.name, url: film.url, logo: film.logo });
    setSelectedFilm(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 -mt-6 -mx-6">
      {/* Hero Banner */}
      {heroFilm && !searchQuery && (
        <div className="relative h-[50vh] min-h-[400px]">
          <div className="absolute inset-0">
            {heroFilm.logo && (
              <img src={heroFilm.logo} alt="" className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-dark-950/80 to-transparent" />
          </div>
          <div className="absolute bottom-12 left-8 max-w-lg">
            <h1 className="text-4xl font-bold mb-3">{heroFilm.name}</h1>
            <div className="flex items-center gap-4 text-sm text-dark-300 mb-4">
              {heroFilm.rating && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4" fill="currentColor" />
                  {heroFilm.rating}
                </span>
              )}
              {heroFilm.year && <span>{heroFilm.year}</span>}
              {heroFilm.genre && <span>{heroFilm.genre}</span>}
            </div>
            {heroFilm.plot && (
              <p className="text-sm text-dark-300 line-clamp-3 mb-6">{heroFilm.plot}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => handlePlay(heroFilm)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-white/90 transition-colors"
              >
                <Play className="w-5 h-5" fill="black" />
                Lecture
              </button>
              <button
                onClick={() => setSelectedFilm(heroFilm)}
                className="flex items-center gap-2 px-6 py-3 bg-dark-700/80 hover:bg-dark-600 rounded-lg font-medium transition-colors"
              >
                <Info className="w-5 h-5" />
                Plus d'infos
              </button>
            </div>
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
            placeholder="Rechercher un film..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      </div>

      {/* Search results */}
      {searchQuery.length > 1 ? (
        <div className="px-8">
          <h2 className="text-xl font-semibold mb-4">Résultats ({searchResults.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {searchResults.map(film => (
              <FilmCard key={film.id} film={film} onClick={() => setSelectedFilm(film)} />
            ))}
          </div>
        </div>
      ) : (
        /* Carousels by category */
        Object.entries(filmsByCategory).map(([catId, { name, films }]) => (
          <Carousel key={catId} title={name} items={films} onSelect={setSelectedFilm} />
        ))
      )}

      {/* Detail Modal */}
      {selectedFilm && (
        <FilmModal film={selectedFilm} onClose={() => setSelectedFilm(null)} onPlay={() => handlePlay(selectedFilm)} />
      )}
    </div>
  );
}

function FilmCard({ film, onClick }) {
  return (
    <div
      onClick={onClick}
      className="group relative rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 hover:z-10"
    >
      <div className="aspect-[2/3] bg-dark-800">
        {film.logo ? (
          <img src={film.logo} alt={film.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="w-8 h-8 text-dark-600" />
          </div>
        )}
      </div>
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3">
        <Play className="w-10 h-10 text-white mb-2" fill="white" />
        <p className="text-sm font-medium text-center line-clamp-2">{film.name}</p>
        <div className="flex items-center gap-2 mt-1 text-xs text-dark-300">
          {film.rating && (
            <span className="flex items-center gap-0.5">
              <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />
              {film.rating}
            </span>
          )}
          {film.year && <span>{film.year}</span>}
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
          {items.slice(0, 30).map(film => (
            <div key={film.id} className="shrink-0 w-36 sm:w-40">
              <FilmCard film={film} onClick={() => onSelect(film)} />
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

function FilmModal({ film, onClose, onPlay }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-900 rounded-2xl border border-dark-700 max-w-3xl w-full max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header image */}
        <div className="relative h-64">
          {film.logo ? (
            <img src={film.logo} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-dark-800" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-dark-900/80 rounded-full hover:bg-dark-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 -mt-16 relative">
          <h2 className="text-2xl font-bold mb-3">{film.name}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
            {film.rating && (
              <span className="flex items-center gap-1 text-yellow-400 font-medium">
                <Star className="w-4 h-4" fill="currentColor" />
                {film.rating}/10
              </span>
            )}
            {film.year && <span className="text-dark-300">{film.year}</span>}
            {film.genre && <span className="px-2 py-0.5 bg-dark-700 rounded text-dark-300 text-xs">{film.genre}</span>}
          </div>

          <button
            onClick={onPlay}
            className="flex items-center gap-2 px-8 py-3 bg-violet-600 hover:bg-violet-700 rounded-lg font-semibold transition-colors mb-6"
          >
            <Play className="w-5 h-5" fill="white" />
            Regarder maintenant
          </button>

          {film.plot && <p className="text-sm text-dark-300 mb-4 leading-relaxed">{film.plot}</p>}
          {film.director && <p className="text-sm text-dark-400"><span className="text-dark-200">Réalisateur :</span> {film.director}</p>}
          {film.cast && <p className="text-sm text-dark-400 mt-1"><span className="text-dark-200">Casting :</span> {film.cast}</p>}
        </div>
      </div>
    </div>
  );
}
