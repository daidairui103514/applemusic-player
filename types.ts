export interface User {
  userId: number;
  nickname: string;
  avatarUrl: string;
  signature?: string;
  backgroundUrl?: string;
  vipType?: number;
}

export interface Artist {
  id: number;
  name: string;
}

export interface Album {
  id: number;
  name: string;
  picUrl: string;
}

export interface Track {
  id: number;
  name: string;
  ar: Artist[]; 
  al: Album;    
  dt: number;   
  url?: string; 
}

export interface Playlist {
  id: number;
  name: string;
  coverImgUrl: string;
  trackCount: number;
  playCount: number;
  description?: string;
  creator?: User;
  updateFrequency?: string;
}

export enum LoginStatus {
  LOGGED_OUT,
  LOGGING_IN,
  LOGGED_IN,
  ERROR
}

export interface QrCheckResult {
  code: number;
  message: string;
  cookie?: string;
}

// Added new view types for Sidebar items
export type ViewType = 'home' | 'playlist' | 'search' | 'library' | 'daily' | 'toplist' | 'fm' | 'history' | 'radio';
