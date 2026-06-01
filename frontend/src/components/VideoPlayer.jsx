import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { X, Volume2, VolumeX, Maximize, Minimize, Play, Pause, AlertCircle } from 'lucide-react';

export default function VideoPlayer({ channel, onClose }) {
  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !channel?.url) return;

    setError(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = '/api/proxy?url=' + encodeURIComponent(channel.url);
    const isDirectVideo = channel.url.match(/\.(mp4|mkv|avi)(\?|$)/i);

    if (isDirectVideo) {
      video.src = streamUrl;
      video.play().catch(() => {});
    } else if (Hls.isSupported()) {
      const hls = new Hls();
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            setError('Impossible de charger cette chaîne.');
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [channel]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    video.muted = !video.muted;
    setMuted(video.muted);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    videoRef.current.volume = val;
    setVolume(val);
    setMuted(val === 0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="mb-6" ref={containerRef}>
      <div className="relative bg-black rounded-xl overflow-hidden group">
        <video
          ref={videoRef}
          className="w-full aspect-video"
          playsInline
          autoPlay
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center px-6">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-24 accent-violet-500"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-dark-200 font-medium">{channel.name}</span>
              <button onClick={toggleFullscreen} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                {fullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
