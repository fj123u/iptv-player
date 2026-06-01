import { Play, Heart, Tv } from 'lucide-react';

export default function ChannelGrid({ channels, loading, onPlay, onToggleFavorite, currentChannel }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-dark-800 rounded-xl animate-pulse aspect-video" />
        ))}
      </div>
    );
  }

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-dark-400">
        <Tv className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-lg">Aucune chaîne trouvée</p>
        <p className="text-sm mt-1">Ajoutez une playlist pour commencer</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {channels.map(channel => (
        <div
          key={channel.id}
          className={`group relative bg-dark-800 rounded-xl overflow-hidden border transition-all cursor-pointer hover:scale-105 hover:shadow-xl ${
            currentChannel?.id === channel.id
              ? 'border-violet-500 ring-2 ring-violet-500/50'
              : 'border-dark-700 hover:border-dark-600'
          }`}
          onClick={() => onPlay(channel)}
        >
          <div className="aspect-video flex items-center justify-center bg-dark-850 relative">
            {channel.logo ? (
              <img
                src={channel.logo}
                alt={channel.name}
                className="w-full h-full object-contain p-4"
                onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
            ) : null}
            <div
              className={`${channel.logo ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center`}
            >
              <Tv className="w-10 h-10 text-dark-600" />
            </div>

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-12 h-12 text-white" fill="white" />
            </div>
          </div>

          <div className="p-3">
            <h3 className="text-sm font-medium truncate">{channel.name}</h3>
            {channel.group_name && (
              <p className="text-xs text-dark-400 mt-1 truncate">{channel.group_name}</p>
            )}
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(channel.id); }}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
              channel.is_favorite
                ? 'bg-red-500/80 text-white'
                : 'bg-black/50 text-white opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart className="w-4 h-4" fill={channel.is_favorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      ))}
    </div>
  );
}
