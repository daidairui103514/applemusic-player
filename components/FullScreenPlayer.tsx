import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, ChevronDown, MessageSquareQuote, ListMusic, Music } from 'lucide-react';
import { Track } from '../types';

interface FullScreenPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isOpen: boolean;
  onClose: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (val: number) => void;
}

const formatTime = (seconds: number) => {
  if (!seconds) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const FullScreenPlayer = ({
  currentTrack,
  isPlaying,
  progress,
  duration,
  volume,
  isOpen,
  onClose,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange
}: FullScreenPlayerProps) => {
  const [showLyrics, setShowLyrics] = useState(false);

  if (!isOpen) return null;

  const picUrl = currentTrack.al?.picUrl;
  const artistName = currentTrack.ar?.map(a => a.name).join(', ') || "未知艺术家";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-[#1c1c1e] text-white overflow-hidden transition-all duration-500">
      {/* Background Blur */}
      <div className="absolute inset-0 z-0">
         {picUrl && (
            <img 
                src={picUrl} 
                className="w-full h-full object-cover blur-[80px] opacity-60 scale-125"
                alt="" 
            />
         )}
         <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-center pt-12 pb-4 px-6">
        <button 
          onClick={onClose} 
          className="absolute left-6 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
        >
          <ChevronDown className="w-5 h-5 text-white" />
        </button>
        <div className="text-xs font-semibold tracking-widest text-white/60 uppercase">
          正在播放
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-row items-center justify-center px-12 gap-12 max-w-7xl mx-auto w-full">
        
        {/* Album Art Section */}
        <div className={`transition-all duration-500 ease-out ${showLyrics ? 'w-1/3 scale-90 opacity-80 cursor-pointer' : 'w-full max-w-[500px] scale-100'}`} onClick={() => showLyrics && setShowLyrics(false)}>
           <div className={`aspect-square rounded-xl shadow-2xl overflow-hidden bg-white/10 flex items-center justify-center ${isPlaying ? 'shadow-rose-500/20' : ''}`}>
              {picUrl ? (
                  <img 
                    src={picUrl} 
                    alt={currentTrack.name} 
                    className="w-full h-full object-cover"
                  />
              ) : (
                  <Music className="w-20 h-20 text-white/20" />
              )}
           </div>
        </div>

        {/* Lyrics Section (Placeholder) */}
        {showLyrics && (
           <div className="w-2/3 h-[500px] overflow-y-auto custom-scrollbar flex flex-col gap-6 text-2xl font-bold text-white/50 px-4 mask-image-b">
              <p className="text-white scale-110 origin-left transition-all">这是模拟的歌词展示</p>
              <p>为了完美的音乐体验</p>
              <p>请闭上眼睛</p>
              <p>用心感受旋律的流动</p>
              <p>这里每一行字</p>
              <p>都代表着节奏的跳动</p>
              <p>（歌词功能接入需要额外的API解析）</p>
              <p>暂以静态文本代替</p>
              <p>Enjoy the music</p>
              <p>Like an Apple Music user</p>
           </div>
        )}
      </div>

      {/* Controls Section */}
      <div className="relative z-10 pb-12 pt-8 px-12 max-w-4xl mx-auto w-full">
        {/* Track Info */}
        <div className="flex items-end justify-between mb-8">
           <div>
             <h2 className="text-3xl font-bold mb-2">{currentTrack.name}</h2>
             <p className="text-xl text-white/60">{artistName}</p>
           </div>
           <div className="flex gap-4">
              <button 
                onClick={() => setShowLyrics(!showLyrics)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showLyrics ? 'bg-white text-rose-500' : 'bg-white/10 text-white'}`}
              >
                 <MessageSquareQuote className="w-5 h-5 fill-current" />
              </button>
              <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                 <ListMusic className="w-5 h-5" />
              </button>
           </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8 group">
           <input
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 transition-all"
           />
           <div className="flex justify-between mt-2 text-xs font-medium text-white/40">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
           </div>
        </div>

        {/* Main Buttons */}
        <div className="flex items-center justify-between mb-8">
           <button className="text-white/40 hover:text-white transition-colors">
              <Shuffle className="w-6 h-6" />
           </button>
           
           <div className="flex items-center gap-10">
              <button onClick={onPrev} className="text-white hover:text-white/70 transition-colors">
                <SkipBack className="w-10 h-10 fill-current" />
              </button>
              <button 
                onClick={onTogglePlay}
                className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform shadow-xl shadow-white/10"
              >
                 {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
              </button>
              <button onClick={onNext} className="text-white hover:text-white/70 transition-colors">
                <SkipForward className="w-10 h-10 fill-current" />
              </button>
           </div>

           <button className="text-white/40 hover:text-white transition-colors">
              <Repeat className="w-6 h-6" />
           </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-4 px-12">
           <Volume2 className="w-4 h-4 text-white/40" />
           <input 
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              className="w-full h-1 bg-white/20 rounded-full appearance-none"
           />
           <Volume2 className="w-6 h-6 text-white/80" />
        </div>
      </div>
    </div>
  );
};