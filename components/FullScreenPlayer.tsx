import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, ChevronDown, MessageSquareQuote, MoreHorizontal, ListMusic } from 'lucide-react';
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
  const { lyricSize, enableMotion } = useSettings();
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
  const lyricContainerRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

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

  // Smooth Scroll to Lyric
  useEffect(() => {
      if (lyricContainerRef.current && activeLyricIndex !== -1 && !isScrubbing) {
          const activeEl = lyricContainerRef.current.children[activeLyricIndex] as HTMLElement;
          if (activeEl) {
            // Calculate center position manually for smoother customized behavior
            const container = lyricContainerRef.current;
            const scrollTop = activeEl.offsetTop - container.offsetHeight / 2 + activeEl.offsetHeight / 2;
            
            container.scrollTo({
                top: scrollTop,
                behavior: 'smooth'
            });
          }
      }
  }, [activeLyricIndex, isScrubbing]);

  const picUrl = currentTrack.al?.picUrl;
  const artistName = currentTrack.ar?.map(a => a.name).join(', ') || "未知艺术家";

  // Dynamic Styles
  const getLyricSizeClass = () => {
     switch(lyricSize) {
         case 'small': return 'text-2xl leading-relaxed';
         case 'large': return 'text-5xl leading-tight';
         default: return 'text-4xl leading-snug';
     }
  };

  const effectiveProgress = isScrubbing ? scrubValue : progress;

  // Render nothing if closed (but keep in DOM for transition if needed, though here we use translate)
  const containerClass = isOpen 
    ? "translate-y-0 opacity-100 scale-100 pointer-events-auto" 
    : "translate-y-[40px] opacity-0 scale-95 pointer-events-none";

  return (
    <div className={`fixed inset-0 z-[100] bg-[#1c1c1e] text-white overflow-hidden transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) flex flex-col ${containerClass}`}>
      
      {/* --- BACKGROUND LAYER --- */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
         {/* Solid Base */}
         <div className="absolute inset-0 bg-[#212121]" />
         
         {/* Dynamic Blobs */}
         {picUrl && (
            <div className={`absolute inset-0 transition-opacity duration-1000 ${enableMotion ? 'opacity-100' : 'opacity-40'}`}>
                {/* Primary Blob */}
                <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full opacity-40 blur-[120px] mix-blend-screen animate-blob"
                     style={{ 
                         backgroundImage: `url(${picUrl})`, 
                         backgroundSize: 'cover' 
                     }} 
                />
                {/* Secondary Blob */}
                <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full opacity-30 blur-[120px] mix-blend-screen animate-blob animation-delay-2000"
                     style={{ 
                         backgroundImage: `url(${picUrl})`, 
                         backgroundSize: 'cover' 
                     }} 
                />
                <div className="absolute inset-0 bg-black/30 backdrop-blur-[60px]" />
            </div>
         )}
      </div>

      {/* --- HEADER (Drag Handle / Close) --- */}
      <div className="relative z-20 flex items-center justify-center pt-6 pb-2 shrink-0 md:justify-end md:px-8">
         <div className="md:hidden w-12 h-1.5 bg-white/20 rounded-full mb-4" onClick={onClose} />
         <button 
            onClick={onClose}
            className="hidden md:flex w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full items-center justify-center backdrop-blur-md transition-colors"
         >
             <ChevronDown className="w-6 h-6 text-white" />
         </button>
      </div>

      {/* --- MAIN CONTENT (Split View) --- */}
      <div className="relative z-10 flex-1 flex flex-col md:flex-row gap-8 md:gap-16 px-6 md:px-16 pb-8 max-w-[1600px] mx-auto w-full h-full overflow-hidden">
        
        {/* LEFT COLUMN: Art & Controls */}
        <div className="flex flex-col justify-center w-full md:w-[45%] lg:w-[40%] shrink-0 gap-8 md:gap-10 h-full max-h-[90vh]">
            
            {/* Album Art */}
            <div className="w-full aspect-square max-w-[350px] md:max-w-[480px] mx-auto md:mx-0 relative group">
                <div className={`relative w-full h-full rounded-xl transition-all duration-700 ease-out shadow-[0_20px_60px_-10px_rgba(0,0,0,0.6)]
                    ${isPlaying ? 'scale-100' : 'scale-90 opacity-90'}
                `}>
                    {picUrl ? (
                        <img 
                            src={picUrl} 
                            alt={currentTrack.name} 
                            className="w-full h-full object-cover rounded-xl select-none"
                        />
                    ) : (
                        <div className="w-full h-full bg-white/5 rounded-xl border border-white/10" />
                    )}
                    {/* Gloss Reflection */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none border border-white/5" />
                </div>
            </div>

            {/* Meta & Controls Wrapper */}
            <div className="flex flex-col gap-6 px-2">
                {/* Meta */}
                <div className="flex items-end justify-between">
                    <div className="flex flex-col gap-1 overflow-hidden mr-4">
                        <h2 className="text-2xl md:text-3xl font-bold truncate text-white leading-tight">
                            {currentTrack.name}
                        </h2>
                        <button className="text-lg md:text-xl text-white/60 truncate font-medium hover:text-white/90 hover:underline text-left transition-colors">
                            {artistName}
                        </button>
                    </div>
                    <div className="flex gap-2 shrink-0">
                         <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition-colors">
                             <MoreHorizontal className="w-5 h-5" />
                         </button>
                    </div>
                </div>

                {/* Progress Bar (Apple Style) */}
                <div className="group w-full py-2 cursor-pointer relative"
                     onMouseDown={() => setIsScrubbing(true)}
                     onMouseUp={() => { setIsScrubbing(false); onSeek(scrubValue); }}
                     onMouseLeave={() => setIsScrubbing(false)}
                     onMouseMove={(e) => {
                         if (isScrubbing) {
                             const rect = e.currentTarget.getBoundingClientRect();
                             const percent = Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width;
                             setScrubValue(percent * duration);
                         }
                     }}
                >
                    {/* Track Background */}
                    <div className="w-full h-[3px] bg-white/20 rounded-full overflow-hidden group-hover:h-[5px] transition-all duration-300">
                        {/* Fill */}
                        <div 
                            className="h-full bg-white/80 rounded-full transition-all duration-100 ease-linear"
                            style={{ width: `${(effectiveProgress / (duration || 1)) * 100}%` }}
                        />
                    </div>
                    {/* Range Input (Invisible overlay for interaction) */}
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={effectiveProgress}
                        onChange={(e) => {
                            setScrubValue(Number(e.target.value));
                            if (!isScrubbing) onSeek(Number(e.target.value));
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    {/* Time Tooltips */}
                    <div className="flex justify-between text-xs font-medium text-white/40 mt-2 select-none">
                        <span>{formatTime(effectiveProgress)}</span>
                        <span>-{formatTime(duration - effectiveProgress)}</span>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-center gap-10 md:gap-14">
                    <button className="text-white/40 hover:text-white transition-colors">
                        <Shuffle className="w-6 h-6" />
                    </button>
                    <button onClick={onPrev} className="text-white hover:text-white/60 transition-colors active:scale-95">
                        <SkipBack className="w-10 h-10 fill-current" />
                    </button>
                    <button 
                        onClick={onTogglePlay}
                        className="w-20 h-20 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-md hover:scale-105 active:scale-95 transition-all shadow-lg"
                    >
                        {isPlaying ? (
                            <Pause className="w-10 h-10 fill-white" />
                        ) : (
                            <Play className="w-10 h-10 fill-white ml-1" />
                        )}
                    </button>
                    <button onClick={onNext} className="text-white hover:text-white/60 transition-colors active:scale-95">
                        <SkipForward className="w-10 h-10 fill-current" />
                    </button>
                    <button className="text-white/40 hover:text-white transition-colors">
                        <Repeat className="w-6 h-6" />
                    </button>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-4 mt-2 px-2">
                    <Volume2 className="w-4 h-4 text-white/50" />
                    <div className="flex-1 h-1 bg-white/20 rounded-full relative group cursor-pointer">
                        <div 
                            className="absolute h-full bg-white rounded-full group-hover:bg-white/90"
                            style={{ width: `${volume * 100}%` }}
                        />
                        <input 
                            type="range" min="0" max="1" step="0.01" value={volume}
                            onChange={(e) => onVolumeChange(Number(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </div>
                    <Volume2 className="w-5 h-5 text-white/80" />
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Lyrics */}
        <div className="flex-1 h-full overflow-hidden relative mask-image-lyrics mt-8 md:mt-0">
            <div 
                ref={lyricContainerRef}
                className="h-full overflow-y-auto no-scrollbar scroll-smooth px-2 md:px-8 pb-[50vh] pt-[10vh]"
            >
                {isLoadingLyrics ? (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50 gap-4">
                         <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                         <p className="text-sm">加载歌词中...</p>
                    </div>
                ) : lyrics.map((line, i) => (
                    <div 
                        key={i} 
                        onClick={() => onSeek(line.time)}
                        className={`
                            py-4 md:py-5 transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] 
                            origin-left cursor-pointer select-none
                            ${i === activeLyricIndex 
                                ? `opacity-100 ${getLyricSizeClass()} font-bold text-white scale-100 blur-0` 
                                : `opacity-40 text-3xl font-medium text-white/80 scale-95 blur-[0.8px] hover:opacity-80 hover:blur-0`
                            }
                        `}
                    >
                        {line.text}
                    </div>
                ))}
            </div>
        </div>

      </div>

      <style>{`
        .animate-blob {
            animation: blob 20s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
        .animation-delay-2000 {
            animation-delay: 2s;
        }
        @keyframes blob {
            0% { transform: translate(0px, 0px) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            100% { transform: translate(0px, 0px) scale(1); }
        }
        .mask-image-lyrics {
            mask-image: linear-gradient(to bottom, 
                transparent 0%, 
                black 15%, 
                black 85%, 
                transparent 100%
            );
            -webkit-mask-image: linear-gradient(to bottom, 
                transparent 0%, 
                black 15%, 
                black 85%, 
                transparent 100%
            );
        }
        .no-scrollbar::-webkit-scrollbar {
            display: none;
        }
        .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
