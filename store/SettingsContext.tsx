import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';

export type LyricSize = 'small' | 'medium' | 'large';
export type BlurLevel = 'low' | 'medium' | 'high';

interface SettingsContextType {
  lyricSize: LyricSize;
  setLyricSize: (size: LyricSize) => void;
  blurLevel: BlurLevel;
  setBlurLevel: (level: BlurLevel) => void;
  enableMotion: boolean;
  setEnableMotion: (enable: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY_SETTINGS = 'muse_settings';

export const SettingsProvider = ({ children }: PropsWithChildren<{}>) => {
  const [lyricSize, setLyricSize] = useState<LyricSize>('medium');
  const [blurLevel, setBlurLevel] = useState<BlurLevel>('high');
  const [enableMotion, setEnableMotion] = useState<boolean>(true);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.lyricSize) setLyricSize(parsed.lyricSize);
        if (parsed.blurLevel) setBlurLevel(parsed.blurLevel);
        if (parsed.enableMotion !== undefined) setEnableMotion(parsed.enableMotion);
      }
    } catch (e) {
      console.warn("Failed to load settings", e);
    }
  }, []);

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({
      lyricSize,
      blurLevel,
      enableMotion
    }));
  }, [lyricSize, blurLevel, enableMotion]);

  return (
    <SettingsContext.Provider value={{
      lyricSize,
      setLyricSize,
      blurLevel,
      setBlurLevel,
      enableMotion,
      setEnableMotion
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error("useSettings must be used within SettingsProvider");
  return context;
};
