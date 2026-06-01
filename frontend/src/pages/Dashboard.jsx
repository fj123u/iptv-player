import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import ChannelGrid from '../components/ChannelGrid';
import AddPlaylistModal from '../components/AddPlaylistModal';
import VideoPlayer from '../components/VideoPlayer';
import Vod from './Vod';
import Series from './Series';
import { Search, Plus, LogOut, Tv, Heart, Film, MonitorPlay } from 'lucide-react';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [channels, setChannels] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('live'); // live, vod, series
  const [xtreamPlaylistId, setXtreamPlaylistId] = useState(null);

  useEffect(() => {
    loadPlaylists();
    loadGroups();
  }, []);

  useEffect(() => {
    loadChannels();
  }, [selectedGroup, selectedPlaylist, searchQuery, showFavorites]);

  useEffect(() => {
    // Auto-detect xtream playlist for VOD/Series
    const xtream = playlists.find(p => p.url?.startsWith('xtream://'));
    if (xtream) setXtreamPlaylistId(xtream.id);
  }, [playlists]);

  const loadPlaylists = async () => {
    try {
      const { data } = await api.get('/playlists');
      setPlaylists(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadGroups = async () => {
    try {
      const { data } = await api.get('/channels/groups');
      setGroups(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadChannels = async () => {
    setLoading(true);
    try {
      if (showFavorites) {
        const { data } = await api.get('/channels/favorites');
        setChannels(data);
      } else {
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (selectedGroup) params.set('group', selectedGroup);
        if (selectedPlaylist) params.set('playlist_id', selectedPlaylist);
        const { data } = await api.get(`/channels/search?${params}`);
        setChannels(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaylistAdded = () => {
    loadPlaylists();
    loadGroups();
    loadChannels();
    setShowAddModal(false);
  };

  const handleDeletePlaylist = async (id) => {
    if (!confirm('Supprimer cette playlist ?')) return;
    try {
      await api.delete(`/playlists/${id}`);
      loadPlaylists();
      loadGroups();
      loadChannels();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefreshPlaylist = async (id) => {
    try {
      await api.post(`/playlists/${id}/refresh`);
      loadPlaylists();
      loadGroups();
      loadChannels();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (channelId) => {
    try {
      const { data } = await api.post(`/channels/${channelId}/favorite`);
      setChannels(prev => prev.map(ch =>
        ch.id === channelId ? { ...ch, is_favorite: data.is_favorite ? 1 : 0 } : ch
      ));
      if (showFavorites && !data.is_favorite) {
        setChannels(prev => prev.filter(ch => ch.id !== channelId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayContent = (content) => {
    setCurrentChannel(content);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Tv className="w-8 h-8 text-violet-500" />
          <h1 className="text-xl font-bold hidden sm:block">IPTV Player</h1>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-dark-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'live' ? 'bg-violet-600 text-white' : 'text-dark-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span className="hidden sm:inline">Live</span>
          </button>
          <button
            onClick={() => setActiveTab('vod')}
            disabled={!xtreamPlaylistId}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'vod' ? 'bg-violet-600 text-white' : 'text-dark-400 hover:text-white'
            } ${!xtreamPlaylistId ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Film className="w-4 h-4" />
            <span className="hidden sm:inline">Films</span>
          </button>
          <button
            onClick={() => setActiveTab('series')}
            disabled={!xtreamPlaylistId}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'series' ? 'bg-violet-600 text-white' : 'text-dark-400 hover:text-white'
            } ${!xtreamPlaylistId ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <MonitorPlay className="w-4 h-4" />
            <span className="hidden sm:inline">Séries</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'live' && (
            <>
              <button
                onClick={() => { setShowFavorites(!showFavorites); setSelectedGroup(null); setSelectedPlaylist(null); }}
                className={`p-2 rounded-lg transition-colors ${showFavorites ? 'bg-violet-600 text-white' : 'hover:bg-dark-800 text-dark-400'}`}
                title="Favoris"
              >
                <Heart className="w-5 h-5" fill={showFavorites ? 'currentColor' : 'none'} />
              </button>
            </>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Playlist</span>
          </button>
          <div className="flex items-center gap-2 ml-2">
            <span className="text-sm text-dark-400 hidden md:inline">{user?.username}</span>
            <button onClick={logout} className="p-2 hover:bg-dark-800 rounded-lg text-dark-400 hover:text-white transition-colors" title="Déconnexion">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - only for live */}
        {activeTab === 'live' && (
          <Sidebar
            playlists={playlists}
            groups={groups}
            selectedGroup={selectedGroup}
            selectedPlaylist={selectedPlaylist}
            showFavorites={showFavorites}
            onSelectGroup={(g) => { setSelectedGroup(g); setShowFavorites(false); setSelectedPlaylist(null); }}
            onSelectPlaylist={(p) => { setSelectedPlaylist(p); setShowFavorites(false); setSelectedGroup(null); }}
            onDeletePlaylist={handleDeletePlaylist}
            onRefreshPlaylist={handleRefreshPlaylist}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {currentChannel && (
            <VideoPlayer
              channel={currentChannel}
              onClose={() => setCurrentChannel(null)}
            />
          )}

          {activeTab === 'live' && (
            <>
              {/* Search bar for live */}
              <div className="mb-6 max-w-xl">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une chaîne..."
                    className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:border-violet-500 transition-colors"
                  />
                </div>
              </div>
              <ChannelGrid
                channels={channels}
                loading={loading}
                onPlay={setCurrentChannel}
                onToggleFavorite={handleToggleFavorite}
                currentChannel={currentChannel}
              />
            </>
          )}

          {activeTab === 'vod' && xtreamPlaylistId && (
            <Vod
              playlistId={xtreamPlaylistId}
              onBack={() => setActiveTab('live')}
              onPlay={handlePlayContent}
            />
          )}

          {activeTab === 'series' && xtreamPlaylistId && (
            <Series
              playlistId={xtreamPlaylistId}
              onBack={() => setActiveTab('live')}
              onPlay={handlePlayContent}
            />
          )}
        </main>
      </div>

      {showAddModal && (
        <AddPlaylistModal
          onClose={() => setShowAddModal(false)}
          onAdded={handlePlaylistAdded}
        />
      )}
    </div>
  );
}
