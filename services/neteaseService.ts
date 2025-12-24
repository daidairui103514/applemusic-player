import { STORAGE_KEY_API_URL, STORAGE_KEY_COOKIE, DEFAULT_API_URL } from '../constants';
import { Playlist, Track, User, QrCheckResult } from '../types';

class NeteaseService {
  private baseUrl: string;
  private cookie: string;

  constructor() {
    let storedUrl = localStorage.getItem(STORAGE_KEY_API_URL);
    if (storedUrl === 'http://localhost:3000' || !storedUrl) {
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
        if (!res.ok) return false;
        const data = await res.json();
        return data.code === 200;
    } catch (e) {
        console.error("Connection check failed:", e);
        return false;
    }
  }

  private async request(path: string, options: RequestInit = {}) {
    const urlObj = new URL(`${this.baseUrl}${path}`);
    urlObj.searchParams.append('timestamp', Date.now().toString());
    
    // Some APIs require realip for overseas usage, but we can't easily fake it in browser.
    // relying on cookie primarily.
    if (this.cookie) {
      urlObj.searchParams.append('cookie', this.cookie);
    }

    // Add CORS mode
    const res = await fetch(urlObj.toString(), {
      ...options,
      credentials: 'include' 
    });

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

  // Get User Playlists
  async getUserPlaylists(uid: number): Promise<Playlist[]> {
    if (!uid) return [];
    const data = await this.request(`/user/playlist?uid=${uid}`);
    return data.playlist || [];
  }

  // Get Playlist Detail (Info only)
  async getPlaylistDetail(id: number): Promise<Playlist> {
    const data = await this.request(`/playlist/detail?id=${id}`);
    return data.playlist;
  }

  // Get All Tracks in Playlist
  async getPlaylistTracks(id: number): Promise<Track[]> {
    // API limitation: playlist/detail only returns limited tracks.
    // Use /playlist/track/all to get everything.
    const data = await this.request(`/playlist/track/all?id=${id}&limit=1000&offset=0`);
    return data.songs || [];
  }

  // Get Song URL (New Version V1)
  async getSongUrl(id: number): Promise<string> {
    // level: standard, higher, exhigh, lossless, hires
    const data = await this.request(`/song/url/v1?id=${id}&level=exhigh`);
    return data.data?.[0]?.url || "";
  }
  
  // Daily Recommend Songs (Requires Login)
  async getDailyRecommendSongs(): Promise<Track[]> {
    try {
        const data = await this.request('/recommend/songs');
        return data.data?.dailySongs || [];
    } catch(e) {
        console.error("Daily songs failed", e);
        return [];
    }
  }

  // Daily Recommend Playlists
  async getRecommendResource(): Promise<Playlist[]> {
    try {
      const data = await this.request('/recommend/resource');
      return data.recommend || [];
    } catch (e) {
      return [];
    }
  }

  // Personal FM (Private Roaming)
  async getPersonalFM(): Promise<Track[]> {
    const data = await this.request('/personal_fm');
    return data.data || [];
  }

  // Top Lists (Charts)
  async getTopList(): Promise<Playlist[]> {
    const data = await this.request('/toplist');
    return data.list || [];
  }

  // High Quality / Top Playlists
  async getTopPlaylists(): Promise<Playlist[]> {
    const data = await this.request('/top/playlist?limit=30&order=hot');
    return data.playlists || [];
  }

  // User Play History / Record
  async getUserRecord(uid: number): Promise<Track[]> {
    // type=1 for week data, 0 for all time
    const data = await this.request(`/user/record?uid=${uid}&type=1`);
    if (data.weekData) {
        return data.weekData.map((item: any) => item.song);
    }
    return [];
  }

  // Hot Radios
  async getHotRadios(): Promise<any[]> {
    const data = await this.request('/dj/hot?limit=20');
    return data.djRadios || [];
  }

  // Search (Using Cloudsearch for better results)
  async search(keywords: string): Promise<{ songs: Track[], playlists: Playlist[] }> {
    // 1 (song), 1000 (playlist)
    // Cloudsearch is recommended over standard search
    const songData = await this.request(`/cloudsearch?keywords=${encodeURIComponent(keywords)}&type=1&limit=30`);
    const playlistData = await this.request(`/cloudsearch?keywords=${encodeURIComponent(keywords)}&type=1000&limit=30`);
    
    return {
        songs: songData.result?.songs || [],
        playlists: playlistData.result?.playlists || []
    };
  }

  // helper to ensure tracks have album info if searching via other means
  async getSongDetails(ids: number[]): Promise<Track[]> {
    if (ids.length === 0) return [];
    // Batch request, max 50 usually safe
    const chunk = ids.slice(0, 50); 
    const idsStr = chunk.join(',');
    const data = await this.request(`/song/detail?ids=${idsStr}`);
    return data.songs || [];
  }
}

export const neteaseService = new NeteaseService();