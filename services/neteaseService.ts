import { STORAGE_KEY_API_URL, STORAGE_KEY_COOKIE, DEFAULT_API_URL } from '../constants';
import { Playlist, Track, User, QrCheckResult } from '../types';

class NeteaseService {
  private baseUrl: string;
  private cookie: string;

  constructor() {
    let storedUrl = localStorage.getItem(STORAGE_KEY_API_URL);
    
    // Fix: Reset if it's the old broken default or localhost
    if (!storedUrl || storedUrl === 'http://localhost:3000' || storedUrl === 'https://api-enhanced-six-ebon.vercel.app') {
        storedUrl = DEFAULT_API_URL;
        localStorage.setItem(STORAGE_KEY_API_URL, storedUrl);
    }
    
    this.baseUrl = storedUrl;
    this.cookie = localStorage.getItem(STORAGE_KEY_COOKIE) || '';
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    localStorage.setItem(STORAGE_KEY_API_URL, this.baseUrl);
  }

  getApiUrl() {
    return this.baseUrl;
  }

  logout() {
    this.cookie = '';
    localStorage.removeItem(STORAGE_KEY_COOKIE);
  }

  async checkConnection(testUrl: string): Promise<boolean> {
    const url = testUrl.endsWith('/') ? testUrl.slice(0, -1) : testUrl;
    try {
        const res = await fetch(`${url}/search?keywords=test&limit=1`, { method: 'GET' });
        // Some APIs return 200 even on error, but usually data structure confirms it
        return res.ok;
    } catch (e) {
        console.error("Connection check failed:", e);
        return false;
    }
  }

  private async request(path: string, options: RequestInit = {}) {
    const urlObj = new URL(`${this.baseUrl}${path}`);
    urlObj.searchParams.append('timestamp', Date.now().toString());
    
    if (this.cookie) {
      urlObj.searchParams.append('cookie', this.cookie);
    }

    // Add realIP for Vercel deployed instances to avoid anti-scraping (best effort)
    // urlObj.searchParams.append('realIP', '116.25.146.177'); 

    const res = await fetch(urlObj.toString(), {
      ...options,
      credentials: 'omit' // 'include' causes CORS issues with some public APIs if wildcard origin is used
    });

    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data;
  }

  // --- Login ---

  async loginCellphone(phone: string, password: string): Promise<User> {
    const data = await this.request('/login/cellphone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    if (data.code !== 200) throw new Error(data.msg || '登录失败');
    this.handleLoginSuccess(data);
    return data.profile;
  }

  async loginEmail(email: string, password: string): Promise<User> {
    const data = await this.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (data.code !== 200) throw new Error(data.msg || '登录失败');
    this.handleLoginSuccess(data);
    return data.profile;
  }

  async getQrKey(): Promise<string> {
    const data = await this.request('/login/qr/key');
    return data.data.unikey;
  }

  async createQr(key: string): Promise<string> {
    const data = await this.request(`/login/qr/create?key=${key}&qrimg=true`);
    return data.data.qrimg;
  }

  async checkQr(key: string): Promise<QrCheckResult> {
    const data = await this.request(`/login/qr/check?key=${key}`);
    if (data.code === 803) {
      this.saveCookie(data.cookie);
    }
    return data; 
  }

  async getUserProfile(): Promise<User> {
    if (!this.cookie) throw new Error("Not logged in");
    const statusData = await this.request('/login/status');
    if (statusData.data && statusData.data.profile) {
        return statusData.data.profile;
    } 
    throw new Error("Session expired");
  }

  private handleLoginSuccess(data: any) {
    if (data.cookie) {
      this.saveCookie(data.cookie);
    }
  }

  private saveCookie(cookieStr: string) {
    this.cookie = cookieStr;
    localStorage.setItem(STORAGE_KEY_COOKIE, cookieStr);
  }

  // --- Core Data ---

  async getUserPlaylists(uid: number): Promise<Playlist[]> {
    if (!uid) return [];
    const data = await this.request(`/user/playlist?uid=${uid}`);
    return data.playlist || [];
  }

  async getPlaylistDetail(id: number): Promise<Playlist> {
    const data = await this.request(`/playlist/detail?id=${id}`);
    return data.playlist;
  }

  async getPlaylistTracks(id: number): Promise<Track[]> {
    const data = await this.request(`/playlist/track/all?id=${id}&limit=1000&offset=0`);
    return data.songs || [];
  }

  async getSongUrl(id: number): Promise<string> {
    // Try standard endpoint first as it's more stable on public APIs
    try {
        const data = await this.request(`/song/url?id=${id}`);
        if (data.data?.[0]?.url) return data.data[0].url;
    } catch (e) {
        console.warn("Standard song url failed, trying v1");
    }
    
    // Fallback to v1
    const dataV1 = await this.request(`/song/url/v1?id=${id}&level=exhigh`);
    return dataV1.data?.[0]?.url || "";
  }
  
  async getDailyRecommendSongs(): Promise<Track[]> {
    try {
        const data = await this.request('/recommend/songs');
        return data.data?.dailySongs || [];
    } catch(e) {
        console.error("Daily songs failed", e);
        return [];
    }
  }

  async getRecommendResource(): Promise<Playlist[]> {
    try {
      const data = await this.request('/recommend/resource');
      return data.recommend || [];
    } catch (e) {
      return [];
    }
  }

  // Guest Mode: Personalized Playlists (No login required)
  async getPersonalized(): Promise<Playlist[]> {
    const data = await this.request('/personalized?limit=15');
    // Map 'picUrl' to 'coverImgUrl' to match Playlist interface
    return (data.result || []).map((item: any) => ({
        ...item,
        coverImgUrl: item.picUrl, 
        creator: { nickname: '推荐' }
    }));
  }

  async getPersonalFM(): Promise<Track[]> {
    const data = await this.request('/personal_fm');
    return data.data || [];
  }

  async getTopList(): Promise<Playlist[]> {
    const data = await this.request('/toplist');
    return data.list || [];
  }

  async getTopPlaylists(): Promise<Playlist[]> {
    const data = await this.request('/top/playlist?limit=30&order=hot');
    return data.playlists || [];
  }

  async getUserRecord(uid: number): Promise<Track[]> {
    const data = await this.request(`/user/record?uid=${uid}&type=1`);
    if (data.weekData) {
        return data.weekData.map((item: any) => item.song);
    }
    return [];
  }

  async getHotRadios(): Promise<any[]> {
    const data = await this.request('/dj/hot?limit=20');
    return data.djRadios || [];
  }

  async search(keywords: string): Promise<{ songs: Track[], playlists: Playlist[] }> {
    // Use standard search which is more reliable for guests
    // type: 1: song, 1000: playlist
    const songData = await this.request(`/search?keywords=${encodeURIComponent(keywords)}&type=1&limit=30`);
    const playlistData = await this.request(`/search?keywords=${encodeURIComponent(keywords)}&type=1000&limit=30`);
    
    return {
        songs: songData.result?.songs || [],
        playlists: playlistData.result?.playlists || []
    };
  }
}

export const neteaseService = new NeteaseService();
