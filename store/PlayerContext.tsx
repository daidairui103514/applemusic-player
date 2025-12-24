import React, { createContext, useContext, useState, useRef, useEffect, ReactNode, PropsWithChildren } from 'react';
import { Track } from '../types';
import { neteaseService } from '../services/neteaseService';

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  volume: number;
  progress: number;
  duration: number;
  queue: Track[];
  playTrack: (track: Track, contextQueue?: Track[]) => void;
  togglePlay: () => void;
  setVolume: (val: number) => void;
  seek: (time: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: PropsWithChildren<{}>) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [queue, setQueue] = useState<Track[]>([]);
  
  // Cache song URLs to avoid re-fetching
  const urlCache = useRef<Map<number, string>>(new Map());

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;

    const audio = audioRef.current;

    const updateProgress = () => setProgress(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration || 0);
    const handleEnded = () => nextTrack();
    
    // Add Error Listener
    const handleError = (e: Event) => {
        console.error("Audio playback error:", e);
        setIsPlaying(false);
        // Optional: Auto skip to next track on error
        // nextTrack();
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const playTrack = async (track: Track, contextQueue?: Track[]) => {
    if (contextQueue) setQueue(contextQueue);

    let url = track.url;
    
    // Check Cache first
    if (!url && urlCache.current.has(track.id)) {
        url = urlCache.current.get(track.id);
    }

    // If not in cache and not in object, fetch it
    if (!url) {
      try {
        url = await neteaseService.getSongUrl(track.id);
        if (url) {
            urlCache.current.set(track.id, url);
        } else {
            console.error(`No URL found for track: ${track.name}`);
            return; // Exit if no URL
        }
      } catch (err) {
        console.error("Failed to fetch song URL", err);
        return;
      }
    }

    if (audioRef.current && url) {
      // Don't reload if it's the same url
      if (audioRef.current.src !== url) {
        audioRef.current.src = url;
      }
      
      try {
          await audioRef.current.play();
          setIsPlaying(true);
      } catch (e) {
          console.error("Playback failed", e);
          setIsPlaying(false);
          // If playback fails (e.g., 403 Forbidden), remove from cache so we try fetching again next time
          urlCache.current.delete(track.id);
      }
      
      setCurrentTrack({ ...track, url }); 
    }
  };

  const togglePlay = () => {
    if (audioRef.current && currentTrack) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Play interrupted", error);
                setIsPlaying(false);
            });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const setVolume = (val: number) => {
    setVolumeState(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const nextTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % queue.length;
    playTrack(queue[nextIndex]);
  };

  const prevTrack = () => {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex(t => t.id === currentTrack.id);
    // If we are more than 3 seconds in, restart song. Else go to prev.
    if (audioRef.current && audioRef.current.currentTime > 3) {
      seek(0);
    } else {
      const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
      playTrack(queue[prevIndex]);
    }
  };

  return (
    <PlayerContext.Provider value={{
      currentTrack,
      isPlaying,
      volume,
      progress,
      duration,
      queue,
      playTrack,
      togglePlay,
      setVolume,
      seek,
      nextTrack,
      prevTrack
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer must be used within PlayerProvider");
  return context;
};
