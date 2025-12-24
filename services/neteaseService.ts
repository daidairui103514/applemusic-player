import { STORAGE_KEY_API_URL, STORAGE_KEY_COOKIE, STORAGE_KEY_USER, DEFAULT_API_URL } from '../constants';
import { Playlist, Track, User, QrCheckResult } from '../types';

class NeteaseService {
  private baseUrl: string;
  private cookie: string;

  constructor() {
    const storedUrl = localStorage.getItem(STORAGE_KEY_API_URL);
    this.baseUrl = storedUrl || DEFAULT_API_URL;
    
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }

    this.cookie = localStorage.getItem(STORAGE_KEY_COOKIE) || '';
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
    localStorage.removeItem(STORAGE_KEY_USER);
  }

  saveUserProfile(user: User) {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }

  getCachedUserProfile(): User | null {
    const json = localStorage.getItem(STORAGE_KEY_USER);
    if (!json) return null;
    try {
        return JSON.parse(json);
    } catch (e) {
        return null;
    }
  }

  async checkConnection(testUrl: string): Promise<boolean> {
    const url = testUrl.endsWith('/') ? testUrl.slice(0, -1) : testUrl;
    try {
        // Must add realIP here too, otherwise check might fail on Vercel
        const res = await fetch(`${url}/search?keywords=test&limit=1&realIP=116.25.146.177`, { method: 'GET' });
        return res.ok;
    } catch (e) {
        return false;
    }
  }

  private async request(path: string, options: RequestInit = {}) {
    const urlObj = new URL(`${this.baseUrl}${path}`);
    
    // 1. Add Timestamp to prevent caching
    urlObj.searchParams.append('timestamp', Date.now().toString());
    
    // 2. CRITICAL FIX: Add realIP to bypass Netease region check on Vercel/Foreign servers
    // Using the IP from your screenshot which is a valid CN IP
    urlObj.searchParams.append('realIP', '116.25.146.177');
    
    // 3. Append cookie to URL params (most robust method for cross-origin APIs)
    if (this.cookie) {
      urlObj.searchParams.append('cookie', this.cookie);
    }

    let res;
    try {
        res = await fetch(urlObj.toString(), {
          ...options,
          // 'omit' prevents the browser from sending its own cookies (CORS safety), 
          // since we are passing the cookie manually in the query string above.
          credentials: 'omit' 
        });
    } catch (networkError) {
        console.warn("Network Request Failed:", networkError);
        throw new Error('网络请求失败，请检查 API 地址');
    }

    if (!res.ok) {
        // Try to get error message from body
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.msg || errData.message || `请求失败: ${res.status}`);
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
        this.saveUserProfile(statusData.data.profile);
        return statusData.data.profile;
    } 
    if (statusData.profile) {
         this.saveUserProfile(statusData.profile);
         return statusData.profile;
    }
    throw new Error("Session expired");
  }

  private handleLoginSuccess(data: any) {
    if (data.cookie) {
      this.saveCookie(data.cookie);
    }
    if (data.profile) {
      this.saveUserProfile(data.profile);
    }
  }

  private saveCookie(cookieStr: string) {
    this.cookie = cookieStr;
    localStorage.setItem(STORAGE_KEY_COOKIE, cookieStr);
  }

  // --- Core Data (REAL DATA ONLY) ---

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
    try {
        // Standard endpoint
        const data = await this.request(`/song/url?id=${id}`);
        if (data.data?.[0]?.url) return data.data[0].url;
    } catch (e) { /* ignore */ }
    
    // Fallback V1 endpoint (often needed for higher quality/unblock)
    const dataV1 = await this.request(`/song/url/v1?id=${id}&level=exhigh`);
    return dataV1.data?.[0]?.url || "";
  }
  
  async getDailyRecommendSongs(): Promise<Track[]> {
    const data = await this.request('/recommend/songs');
    return data.data?.dailySongs || [];
  }

  async getRecommendResource(): Promise<Playlist[]> {
    const data = await this.request('/recommend/resource');
    return data.recommend || [];
  }

  async getPersonalized(): Promise<Playlist[]> {
    const data = await this.request('/personalized?limit=15');
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
    const songData = await this.request(`/search?keywords=${encodeURIComponent(keywords)}&type=1&limit=30`);
    const playlistData = await this.request(`/search?keywords=${encodeURIComponent(keywords)}&type=1000&limit=30`);
    
    return {
        songs: songData.result?.songs || [],
        playlists: playlistData.result?.playlists || []
    };
  }
}

export const neteaseService = new NeteaseService();
