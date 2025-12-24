import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, ChevronDown, Quote, ListMusic, Music, MoreHorizontal } from 'lucide-react';
import { Track, LyricLine } from '../types';
import { neteaseService } from '../services/neteaseService';
import { useSettings } from '../store/SettingsContext';

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
  const { lyricSize, blurLevel, enableMotion } = useSettings();
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const lyricContainerRef = useRef<HTMLDivElement>(null);
  
  // Fetch Lyrics
  useEffect(() => {
    if (currentTrack) {
        setLyrics([]);
        setIsLoadingLyrics(true);
        neteaseService.getLyric(currentTrack.id)
            .then(data => {
                const lrcText = data.lrc?.lyric || "";
                if (!lrcText) {
                    setLyrics([{ time: 0, text: "纯音乐，请欣赏" }]);
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
            .catch(() => setLyrics([{ time: 0, text: "暂无歌词" }]))
            .finally(() => setIsLoadingLyrics(false));
    }
  }, [currentTrack]);

  // Active Lyric Logic
  const activeLyricIndex = lyrics.findIndex((line, index) => {
      const nextLine = lyrics[index + 1];
      return progress >= line.time && (!nextLine || progress < nextLine.time);
  });

  useEffect(() => {
      if (showLyrics && lyricContainerRef.current && activeLyricIndex !== -1) {
          const activeEl = lyricContainerRef.current.children[activeLyricIndex] as HTMLElement;
          if (activeEl) {
              activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
      }
  }, [activeLyricIndex, showLyrics]);

  const picUrl = currentTrack.al?.picUrl;
  const artistName = currentTrack.ar?.map(a => a.name).join(', ') || "未知艺术家";

  // Dynamic Styles based on Settings
  const blurClass = blurLevel === 'low' ? 'blur-[40px]' : blurLevel === 'medium' ? 'blur-[80px]' : 'blur-[120px]';
  
  const getLyricActiveSize = () => {
     switch(lyricSize) {
         case 'small': return 'text-2xl md:text-3xl';
         case 'large': return 'text-4xl md:text-5xl';
         default: return 'text-3xl md:text-4xl';
     }
  };

  const getLyricInactiveSize = () => {
    switch(lyricSize) {
        case 'small': return 'text-base md:text-xl';
        case 'large': return 'text-xl md:text-3xl';
        default: return 'text-lg md:text-2xl';
    }
  };

  const containerClass = isOpen 
    ? "translate-y-0 opacity-100 pointer-events-auto" 
    : "translate-y-[100vh] opacity-0 pointer-events-none";

  return (
    <div className={`fixed inset-0 z-[100] bg-[#1c1c1e] text-white overflow-hidden transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col ${containerClass}`}>
      
      {/* 1. Dynamic Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute inset-0 bg-[#1c1c1e]" />
         {picUrl && (
            <>
                {/* Layer 2: Animated Breathing Color Blob */}
                <div className="absolute inset-0 flex items-center justify-center opacity-60">
                    <img 
                        src={picUrl} 
                        className={`w-[120%] h-[120%] object-cover saturate-[2] ${blurClass} ${enableMotion ? 'animate-pulse-slow' : ''}`} 
                        alt=""
                    />
                </div>
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            </>
         )}
         <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
      </div>

      {/* 2. Header (Draggable handle area) */}
      <div className="relative z-10 flex items-center justify-between pt-10 pb-6 px-8">
        <button 
          onClick={onClose} 
          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
        >
          <ChevronDown className="w-5 h-5 text-white" />
        </button>
        <div className="w-12 h-1 bg-white/20 rounded-full absolute left-1/2 -translate-x-1/2 top-4"></div>
      </div>

      {/* 3. Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row items-center justify-center px-8 md:px-16 gap-8 md:gap-20 max-w-7xl mx-auto w-full h-[60vh]">
        
        {/* Album Art Section - Apple Style Scaling */}
        <div 
            className={`relative transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1) flex items-center justify-center w-full max-w-[400px] md:max-w-[500px] aspect-square
            ${showLyrics ? 'md:w-[40%] scale-75 opacity-60 cursor-pointer hover:opacity-100 hover:scale-80' : 'md:w-full'}
            `} 
            onClick={() => showLyrics && setShowLyrics(false)}
        >
           {/* The Image Container with Dynamic Shadow */}
           <div className={`relative w-full h-full rounded-xl transition-all duration-700 cubic-bezier(0.2, 0.8, 0.2, 1)
               ${isPlaying && !showLyrics ? 'scale-100 shadow-[0_20px_50px_rgba(0,0,0,0.5)]' : 'scale-[0.85] shadow-2xl'}
           `}>
                {picUrl ? (
                    <img 
                        src={picUrl} 
                        alt={currentTrack.name} 
                        className="w-full h-full object-cover rounded-xl select-none"
                    />
                ) : (
                    <div className="w-full h-full bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                        <Music className="w-32 h-32 text-white/10" />
                    </div>
                )}
                {/* Glossy reflection effect */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/10 to-transparent pointer-events-none border border-white/5"></div>
           </div>
        </div>

        {/* Lyrics Section - Immersive */}
        {showLyrics && (
           <div 
                ref={lyricContainerRef}
                className="w-full md:w-[60%] h-full overflow-y-auto no-scrollbar flex flex-col gap-6 text-left px-4 py-[50%] md:py-32 mask-image-b transition-all duration-500"
                style={{
                    // Use a softer gradient for the mask to avoid abrupt cut-offs
                    maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)'
                }}
           >
              {isLoadingLyrics ? (
                  <div className="flex items-center justify-center h-full">
                      <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  </div>
              ) : lyrics.map((line, i) => (
                  <p 
                    key={i} 
                    className={`transition-all duration-500 ease-out cursor-pointer origin-left
                        ${i === activeLyricIndex 
                            ? `${getLyricActiveSize()} text-white font-bold opacity-100 scale-105 filter-none shadow-lg` 
                            : `${getLyricInactiveSize()} text-white/40 font-medium blur-[0.5px] hover:text-white/70 hover:blur-none`
                        }
                    `}
                    onClick={() => onSeek(line.time)}
                  >
                      {line.text}
                  </p>
              ))}
           </div>
        )}
      </div>

      {/* 4. Controls Section */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-8 md:px-12 pb-12 pt-8">
        
        {/* Track Info & Toggles */}
        <div className="flex items-center justify-between mb-8">
           <div className="flex flex-col gap-1 overflow-hidden pr-4">
             <h2 className="text-2xl md:text-3xl font-bold truncate leading-tight">{currentTrack.name}</h2>
             <p className="text-lg md:text-xl text-white/60 truncate font-medium cursor-pointer hover:underline hover:text-white/80 transition-colors">
                {artistName}
                <span className="mx-2 opacity-50">•</span>
                <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded text-white/80">Lossless</span>
             </p>
           </div>
           
           <div className="flex items-center gap-3 shrink-0">
               <button 
                onClick={() => setShowLyrics(!showLyrics)}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all duration-300 ${showLyrics ? 'bg-white text-rose-500 shadow-lg scale-110' : 'bg-white/10 text-white hover:bg-white/20'}`}
               >
                 <Quote className="w-5 h-5 fill-current" />
               </button>
               <button className="p-2.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md">
                 <MoreHorizontal className="w-5 h-5" />
               </button>
           </div>
        </div>

        {/* Apple Style Progress Bar */}
        <div className="mb-10 group relative h-4 flex items-center">
           {/* Background Track */}
           <div className="absolute w-full h-1 bg-white/20 rounded-full overflow-hidden group-hover:h-2 transition-all duration-300">
               {/* Progress Fill */}
               <div 
                  className="h-full bg-white/80 rounded-full relative" 
                  style={{ width: `${(progress / (duration || 1)) * 100}%` }}
               ></div>
           </div>
           
           {/* Input slider (Invisible but interactive) */}
           <input
              type="range"
              min="0"
              max={duration || 100}
              value={progress}
              onChange={(e) => onSeek(Number(e.target.value))}
              className="absolute w-full h-full opacity-0 cursor-pointer z-10"
           />

            {/* Thumb (Only visible on group hover) */}
           <div 
             className="absolute w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
             style={{ left: `${(progress / (duration || 1)) * 100}%`, transform: 'translateX(-50%)' }}
           />

           <div className="absolute top-4 w-full flex justify-between text-xs font-medium text-white/40 group-hover:text-white/60 transition-colors mt-1">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
           </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between mb-8">
           <button className="text-white/40 hover:text-white transition-colors hover:bg-white/10 p-2 rounded-full">
              <Shuffle className="w-6 h-6" />
           </button>
           
           <div className="flex items-center gap-8 md:gap-12">
              <button onClick={onPrev} className="text-white hover:text-white/60 transition-colors active:scale-90 transform duration-150">
                <SkipBack className="w-10 h-10 fill-current" />
              </button>
              
              <button 
                onClick={onTogglePlay}
                className="w-20 h-20 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95 shadow-lg"
              >
                 {isPlaying ? (
                    <Pause className="w-10 h-10 fill-current" />
                 ) : (
                    <Play className="w-10 h-10 fill-current ml-1" />
                 )}
              </button>
              
              <button onClick={onNext} className="text-white hover:text-white/60 transition-colors active:scale-90 transform duration-150">
                <SkipForward className="w-10 h-10 fill-current" />
              </button>
           </div>

           <button className="text-white/40 hover:text-white transition-colors hover:bg-white/10 p-2 rounded-full">
              <Repeat className="w-6 h-6" />
           </button>
        </div>

        {/* Volume */}
        <div className="flex items-center gap-4 px-4 md:px-12 group">
           <Volume2 className="w-4 h-4 text-white/50" />
           <div className="flex-1 h-1 bg-white/20 rounded-full relative overflow-hidden">
             <div 
                className="h-full bg-white rounded-full"
                style={{ width: `${volume * 100}%` }}
             />
             <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
             />
           </div>
           <Volume2 className="w-5 h-5 text-white/80" />
        </div>
      </div>

      <style>{`
        .animate-pulse-slow {
            animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse-slow {
            0%, 100% { opacity: 0.5; transform: scale(1.1); }
            50% { opacity: 0.8; transform: scale(1.2); }
        }
        .cubic-bezier {
            transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
        }
      `}</style>
    </div>
  );
};
