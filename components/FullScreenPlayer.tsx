import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, ChevronDown, Quote, ListMusic, Music } from 'lucide-react';
import { Track, LyricLine } from '../types';
import { neteaseService } from '../services/neteaseService';

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

// Regex to parse [mm:ss.xx] lyric lines
const LYRIC_REGEX = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;

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
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const lyricContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch Lyrics when track changes
  useEffect(() => {
    if (isOpen && currentTrack) {
        setLyrics([]);
        setIsLoadingLyrics(true);
        neteaseService.getLyric(currentTrack.id)
            .then(data => {
                const lrcText = data.lrc?.lyric || "";
                if (!lrcText) {
                    setLyrics([{ time: 0, text: "暂无歌词" }]);
                    return;
                }
                const parsed: LyricLine[] = [];
                const lines = lrcText.split('\n');
                lines.forEach(line => {
                    const match = LYRIC_REGEX.exec(line);
                    if (match) {
                        const min = parseInt(match[1]);
                        const sec = parseInt(match[2]);
                        const ms = parseInt(match[3]);
                        const text = match[4].trim();
                        // Only add if text exists
                        if (text) {
                            parsed.push({
                                time: min * 60 + sec + ms / 1000,
                                text
                            });
                        }
                    }
                });
                setLyrics(parsed);
            })
            .catch(() => setLyrics([{ time: 0, text: "歌词加载失败" }]))
            .finally(() => setIsLoadingLyrics(false));
    }
  }, [currentTrack, isOpen]);

  // Determine active lyric index
  const activeLyricIndex = lyrics.findIndex((line, index) => {
      const nextLine = lyrics[index + 1];
      return progress >= line.time && (!nextLine || progress < nextLine.time);
  });

  // Auto scroll lyrics
  useEffect(() => {
      if (showLyrics && lyricContainerRef.current && activeLyricIndex !== -1) {
          const activeEl = lyricContainerRef.current.children[activeLyricIndex] as HTMLElement;
          if (activeEl) {
              activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [activeLyricIndex, showLyrics]);

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
      <div className="relative z-10 flex-1 flex flex-row items-center justify-center px-12 gap-12 max-w-7xl mx-auto w-full h-[calc(100vh-250px)]">
        
        {/* Album Art Section */}
        <div 
            className={`transition-all duration-500 ease-out flex items-center justify-center ${showLyrics ? 'w-1/3 opacity-80 cursor-pointer hidden md:flex' : 'w-full max-w-[500px]'}`} 
            onClick={() => showLyrics && setShowLyrics(false)}
        >
           <div className={`aspect-square w-full rounded-xl shadow-2xl overflow-hidden bg-white/10 flex items-center justify-center transition-transform duration-700 ${isPlaying && !showLyrics ? 'scale-100 shadow-rose-500/20' : 'scale-90'}`}>
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

        {/* Lyrics Section */}
        {showLyrics && (
           <div 
                ref={lyricContainerRef}
                className="w-full md:w-2/3 h-full overflow-y-auto custom-scrollbar flex flex-col gap-8 text-center px-4 mask-image-b py-20"
           >
              {isLoadingLyrics ? (
                  <div className="text-white/50 animate-pulse mt-20">正在加载歌词...</div>
              ) : lyrics.length > 0 ? (
                  lyrics.map((line, i) => (
                      <p 
                        key={i} 
                        className={`transition-all duration-500 cursor-pointer hover:text-white/80 ${i === activeLyricIndex ? 'text-white text-3xl font-bold scale-105' : 'text-white/30 text-xl font-medium blur-[1px]'}`}
                        onClick={() => onSeek(line.time)}
                      >
                          {line.text}
                      </p>
                  ))
              ) : (
                  <div className="text-white/30 mt-20">暂无歌词</div>
              )}
           </div>
        )}
      </div>

      {/* Controls Section */}
      <div className="relative z-10 pb-12 pt-4 px-12 max-w-4xl mx-auto w-full">
        {/* Track Info */}
        <div className="flex items-end justify-between mb-8">
           <div className="overflow-hidden">
             <h2 className="text-3xl font-bold mb-2 truncate pr-4">{currentTrack.name}</h2>
             <p className="text-xl text-white/60 truncate">{artistName}</p>
           </div>
           <div className="flex gap-4 shrink-0">
              <button 
                onClick={() => setShowLyrics(!showLyrics)}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showLyrics ? 'bg-white text-rose-500' : 'bg-white/10 text-white'}`}
                title="歌词"
              >
                 <Quote className="w-5 h-5 fill-current" />
              </button>
              <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:text-white">
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
