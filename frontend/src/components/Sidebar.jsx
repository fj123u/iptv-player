import { List, Folder, RefreshCw, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function Sidebar({
  playlists,
  groups,
  selectedGroup,
  selectedPlaylist,
  showFavorites,
  onSelectGroup,
  onSelectPlaylist,
  onDeletePlaylist,
  onRefreshPlaylist
}) {
  const [showPlaylists, setShowPlaylists] = useState(true);
  const [showCategories, setShowCategories] = useState(true);

  return (
    <aside className="w-64 bg-dark-900 border-r border-dark-800 overflow-y-auto hidden md:block shrink-0">
      <nav className="p-4 space-y-2">
        {/* All channels */}
        <button
          onClick={() => { onSelectGroup(null); onSelectPlaylist(null); }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
            !selectedGroup && !selectedPlaylist && !showFavorites
              ? 'bg-violet-600/20 text-violet-400'
              : 'hover:bg-dark-800 text-dark-300'
          }`}
        >
          <List className="w-4 h-4" />
          <span className="text-sm">Toutes les chaînes</span>
        </button>

        {/* Playlists section */}
        <div className="pt-4">
          <button
            onClick={() => setShowPlaylists(!showPlaylists)}
            className="flex items-center gap-2 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 w-full"
          >
            {showPlaylists ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Playlists ({playlists.length})
          </button>
          {showPlaylists && playlists.map(pl => (
            <div
              key={pl.id}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                selectedPlaylist === pl.id
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'hover:bg-dark-800 text-dark-300'
              }`}
              onClick={() => onSelectPlaylist(pl.id)}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span className="text-sm truncate flex-1">{pl.name}</span>
              <span className="text-xs text-dark-500">{pl.channel_count}</span>
              <div className="hidden group-hover:flex items-center gap-1">
                {pl.url && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRefreshPlaylist(pl.id); }}
                    className="p-1 hover:text-violet-400"
                    title="Rafraîchir"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDeletePlaylist(pl.id); }}
                  className="p-1 hover:text-red-400"
                  title="Supprimer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Categories section */}
        <div className="pt-4">
          <button
            onClick={() => setShowCategories(!showCategories)}
            className="flex items-center gap-2 text-xs font-semibold text-dark-400 uppercase tracking-wider mb-2 w-full"
          >
            {showCategories ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Catégories ({groups.length})
          </button>
          {showCategories && (
            <div className="max-h-96 overflow-y-auto space-y-0.5">
              {groups.map(g => (
                <button
                  key={g.group_name}
                  onClick={() => onSelectGroup(g.group_name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm ${
                    selectedGroup === g.group_name
                      ? 'bg-violet-600/20 text-violet-400'
                      : 'hover:bg-dark-800 text-dark-300'
                  }`}
                >
                  <span className="truncate">{g.group_name}</span>
                  <span className="text-xs text-dark-500 ml-2">{g.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>
    </aside>
  );
}
