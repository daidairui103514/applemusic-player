import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, ListMusic, Maximize2, ChevronsUp, Music } from 'lucide-react';
import { usePlayer } from '../store/PlayerContext';
import { FullScreenPlayer } from './FullScreenPlayer';

const formatTime = (seconds: number) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const PlayerBar = () => {
  const { 
    currentTrack, 
    isPlaying, 
    togglePlay, 
    nextTrack, 
    prevTrack, 
    progress, 
    duration, 
    seek,
    volume,
    setVolume
  } = usePlayer();

  const [isFullScreen, setIsFullScreen] = useState(false);

  // Still show the basic bar if track is loaded
  if (!currentTrack) {
    return (
      <div className="fixed bottom-0 left-0 z-50 h-24 w-full glass border-t border-white/5 flex items-center justify-center text-white/30 text-sm">
        选择一首歌曲开始播放
      </div>
    );
  }

  const picUrl = currentTrack.al?.picUrl;
  const artistName = currentTrack.ar?.map(a => a.name).join(', ') || "未知艺术家";

  return (
    <>
      <div 
        className="h-24 w-full glass border-t border-white/10 flex items-center justify-between px-6 z-50 fixed bottom-0 left-0 transition-transform duration-300"
        style={{ transform: isFullScreen ? 'translateY(100%)' : 'translateY(0)' }} // Slide down when full screen is open
      >
        
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/4 group cursor-pointer" onClick={() => setIsFullScreen(true)}>
          <div className="w-14 h-14 rounded-md overflow-hidden shadow-lg relative bg-white/10 flex items-center justify-center group-hover:scale-105 transition-transform">
            {picUrl ? (
                <img 
                  src={picUrl} 
                  alt={currentTrack.name} 
                  className="w-full h-full object-cover"
                />
            ) : (
                <Music className="w-6 h-6 text-white/30" />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
              <ChevronsUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="flex flex-col justify-center overflow-hidden">
            <h4 className="text-sm font-medium text-white truncate hover:underline">
              {currentTrack.name || "未知歌曲"}
            </h4>
            <p className="text-xs text-white/50 truncate hover:text-white/80 transition-colors">
              {artistName}
            </p>
          </div>
        </div>

        {/* Controls & Progress */}
        <div className="flex flex-col items-center flex-1 max-w-2xl px-4">
          <div className="flex items-center gap-6 mb-2">
            <button className="text-white/40 hover:text-white transition-colors" title="随机播放">
              <Shuffle className="w-4 h-4" />
            </button>
            <button onClick={prevTrack} className="text-white/70 hover:text-white transition-colors">
              <SkipBack className="w-6 h-6 fill-current" />
            </button>
            <button 
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-white/10"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
            </button>
            <button onClick={nextTrack} className="text-white/70 hover:text-white transition-colors">
              <SkipForward className="w-6 h-6 fill-current" />
            </button>
            <button className="text-white/40 hover:text-white transition-colors" title="循环播放">
              <Repeat className="w-4 h-4" />
            </button>
          </div>
          
          <div className="w-full flex items-center gap-3 text-xs text-white/40 font-mono group">
            <span className="w-8 text-right">{formatTime(progress)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={(e) => seek(Number(e.target.value))}
              className="flex-1 h-1 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:invisible group-hover:[&::-webkit-slider-thumb]:visible [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
            />
            <span className="w-8">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume & Extras */}
        <div className="flex items-center justify-end gap-4 w-1/4">
          <button className="text-white/50 hover:text-white" title="播放列表">
             <ListMusic className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 w-28 group">
            <Volume2 className="w-5 h-5 text-white/50" />
            <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none hover:bg-white/20"
            />
          </div>
        </div>
      </div>

      <FullScreenPlayer 
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        progress={progress}
        duration={duration}
        volume={volume}
        isOpen={isFullScreen}
        onClose={() => setIsFullScreen(false)}
        onTogglePlay={togglePlay}
        onNext={nextTrack}
        onPrev={prevTrack}
        onSeek={seek}
        onVolumeChange={setVolume}
      />
    </>
  );
};
