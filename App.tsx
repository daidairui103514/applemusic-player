import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { PlayerBar } from './components/PlayerBar';
import { LoginModal } from './components/LoginModal';
import { SettingsModal } from './components/SettingsModal';
import { PlayerProvider, usePlayer } from './store/PlayerContext';
import { SettingsProvider } from './store/SettingsContext';
import { neteaseService } from './services/neteaseService';
import { Playlist, User, Track, ViewType } from './types';
import { Play, Clock, ChevronRight, Music, Settings, UserCircle, ChevronLeft, AlertCircle } from 'lucide-react';

// --- Sub-components ---

const SectionHeader = ({ title, onClick }: { title: string, onClick?: () => void }) => (
    <div className="flex items-center justify-between mb-4 mt-8 px-10">
        <h2 className="text-2xl font-bold text-white tracking-tight">{title}</h2>
        {onClick && (
            <button onClick={onClick} className="text-sm text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                查看全部 <ChevronRight className="w-4 h-4" />
            </button>
        )}
    </div>
);

const HorizontalScrollList = ({ playlists, onPlaylistClick }: { playlists: Playlist[], onPlaylistClick: (id: number) => void }) => (
    <div className="flex overflow-x-auto gap-6 px-10 pb-6 custom-scrollbar snap-x">
        {playlists.map((playlist) => (
            <div 
                key={playlist.id} 
                className="group flex-shrink-0 w-48 snap-start cursor-pointer"
                onClick={() => onPlaylistClick(playlist.id)}
            >
                <div className="aspect-square rounded-lg overflow-hidden mb-3 relative shadow-lg bg-white/5 flex items-center justify-center">
                    {playlist.coverImgUrl ? (
                        <img 
                            src={playlist.coverImgUrl} 
                            alt={playlist.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                        />
                    ) : (
                        <Music className="w-12 h-12 text-white/20" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center shadow-xl translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                            <Play className="w-6 h-6 fill-white text-white ml-1" />
                        </div>
                    </div>
                </div>
                <h3 className="font-medium text-white truncate mb-1 text-[15px]">{playlist.name}</h3>
                <p className="text-xs text-white/40 line-clamp-1">
                    {playlist.description || playlist.creator?.nickname || playlist.updateFrequency || "精选歌单"}
                </p>
            </div>
        ))}
    </div>
);

const TrackList = ({ tracks, onPlay }: { tracks: Track[], onPlay: (track: Track) => void }) => (
    <div className="space-y-1">
        {tracks.map((track, i) => (
            <div 
                key={track.id}
                onDoubleClick={() => onPlay(track)}
                className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 hover:bg-white/5 rounded-lg group transition-colors cursor-default text-sm text-white/80 items-center select-none"
            >
                {/* Index / Play Button Area */}
                <div className="w-8 flex items-center justify-center" onClick={() => onPlay(track)}>
                    <span className="text-white/40 font-mono group-hover:hidden">{i + 1}</span>
                    <Play className="w-4 h-4 hidden group-hover:block text-white fill-current cursor-pointer" />
                </div>
                
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 rounded object-cover bg-white/5 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {track.al?.picUrl ? (
                            <img src={track.al.picUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <Music className="w-4 h-4 text-white/20" />
                        )}
                    </div>
                    <div className="flex flex-col overflow-hidden justify-center">
                        <span className="truncate font-medium text-white text-[15px]">{track.name}</span>
                        <span className="truncate text-xs text-white/40">{track.ar?.map(a => a.name).join(', ') || "未知艺术家"}</span>
                    </div>
                </div>
                <span className="truncate text-white/40 hover:text-white/80 transition-colors">{track.al?.name || "未知专辑"}</span>
                <span className="w-12 text-center text-white/40 font-mono text-xs">
                    {Math.floor(track.dt / 1000 / 60)}:{(Math.floor(track.dt / 1000) % 60).toString().padStart(2, '0')}
                </span>
            </div>
        ))}
    </div>
);

// --- New Top Bar Component ---
const TopBar = ({ 
    user, 
    onOpenLogin, 
    onOpenSettings,
    canGoBack,
    onBack
}: { 
    user: User | null, 
    onOpenLogin: () => void, 
    onOpenSettings: () => void,
    canGoBack: boolean,
    onBack: () => void
}) => (
    <div className="h-16 w-full flex items-center justify-between px-8 sticky top-0 z-30 bg-[#1c1c1e]/90 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                disabled={!canGoBack}
                className={`w-8 h-8 rounded-full bg-black/20 flex items-center justify-center transition-colors ${canGoBack ? 'text-white hover:bg-white/10' : 'text-white/10 cursor-default'}`}
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={onOpenSettings}
                className="p-2 text-white/50 hover:text-white transition-colors"
                title="设置"
            >
                <Settings className="w-5 h-5" />
            </button>
            
            {user ? (
                <div className="flex items-center gap-3 pl-2 border-l border-white/10">
                     <span className="text-sm font-medium text-white/80">{user.nickname}</span>
                     <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/5">
                        <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
                     </div>
                </div>
            ) : (
                <button 
                    onClick={onOpenLogin}
                    className="flex items-center gap-2 px-4 py-1.5 bg-white text-black rounded-full text-sm font-bold hover:scale-105 transition-transform"
                >
                    <UserCircle className="w-4 h-4" />
                    登录
                </button>
            )}
        </div>
    </div>
);

const PlaylistDetail = ({ id, onBack }: { id: number, onBack: () => void }) => {
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const { playTrack } = usePlayer();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const p = await neteaseService.getPlaylistDetail(id);
                setPlaylist(p);
                // Don't wait for tracks to show header info if possible, but structure prevents it easily here without context
                const t = await neteaseService.getPlaylistTracks(id);
                setTracks(t);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center h-full text-white/50">
            <div className="animate-pulse">正在加载歌单详情...</div>
        </div>
    );
    
    if (!playlist) return <div className="p-10 text-white/50">无法加载歌单，请稍后重试</div>;

    return (
        <div className="flex flex-col min-h-full pb-32">
            <div className="p-10 flex gap-8 items-end bg-gradient-to-b from-white/10 to-[#1c1c1e]">
                <div className="w-52 h-52 rounded-xl overflow-hidden shadow-2xl shrink-0 border border-white/10 bg-white/5 flex items-center justify-center">
                    {playlist.coverImgUrl ? (
                        <img src={playlist.coverImgUrl} className="w-full h-full object-cover" alt={playlist.name} />
                    ) : (
                        <Music className="w-20 h-20 text-white/20" />
                    )}
                </div>
                <div className="flex flex-col gap-4 mb-2">
                    <h5 className="text-xs font-bold text-white/60 uppercase tracking-widest border border-white/20 self-start px-2 py-1 rounded">歌单</h5>
                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">{playlist.name}</h1>
                    <p className="text-white/50 text-sm line-clamp-2 max-w-2xl">{playlist.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                        <button 
                            onClick={() => tracks.length > 0 && playTrack(tracks[0], tracks)}
                            className="px-8 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold flex items-center gap-2 shadow-lg shadow-rose-500/20 transition-all hover:scale-105"
                        >
                            <Play className="w-5 h-5 fill-current" /> 播放全部
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="px-10">
                <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-white/10 text-xs text-white/40 uppercase font-medium tracking-wider mb-2">
                    <span className="w-8 text-center">#</span>
                    <span>标题</span>
                    <span>专辑</span>
                    <span className="w-12 text-center"><Clock className="w-4 h-4 mx-auto" /></span>
                </div>
                <TrackList tracks={tracks} onPlay={(t) => playTrack(t, tracks)} />
            </div>
        </div>
    );
};

// ... [Keep other views like DailyRecommendView, TopListsView, HistoryView, FMView, RadioView, SearchResults AS IS, they don't need changes except ensuring they render correctly in the new structure] ...

const DailyRecommendView = () => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const { playTrack } = usePlayer();

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const t = await neteaseService.getDailyRecommendSongs();
                setTracks(t);
            } catch (e) { console.error(e); } 
            finally { setLoading(false); }
        };
        load();
    }, []);

    if(loading) return <div className="p-10 text-white/50">正在加载每日推荐...</div>;

    const today = new Date().getDate();

    return (
        <div className="flex flex-col min-h-full pb-32">
            <div className="p-10 flex gap-8 items-end bg-gradient-to-b from-rose-900/40 to-[#1c1c1e]">
                 <div className="w-40 h-40 bg-white rounded-xl flex flex-col items-center justify-center text-black">
                     <span className="text-2xl font-bold uppercase text-rose-500">Today</span>
                     <span className="text-7xl font-bold tracking-tighter">{today}</span>
                 </div>
                 <div className="mb-2">
                     <h1 className="text-4xl font-bold mb-2">每日推荐</h1>
                     <p className="text-white/50">根据你的音乐口味生成，每天6:00更新</p>
                     <button 
                        onClick={() => tracks.length > 0 && playTrack(tracks[0], tracks)}
                        className="mt-6 px-8 py-3 bg-white text-black rounded-full font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                        <Play className="w-5 h-5 fill-current" /> 播放全部
                    </button>
                 </div>
            </div>
            <div className="px-10">
                <TrackList tracks={tracks} onPlay={(t) => playTrack(t, tracks)} />
            </div>
        </div>
    );
}

const TopListsView = ({ onPlaylistClick }: { onPlaylistClick: (id: number) => void }) => {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    useEffect(() => {
        neteaseService.getTopList().then(setPlaylists);
    }, []);

    return (
        <div className="p-10 pb-32">
            <h1 className="text-3xl font-bold mb-8">排行榜</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {playlists.map(p => (
                    <div key={p.id} className="group cursor-pointer" onClick={() => onPlaylistClick(p.id)}>
                        <div className="aspect-square rounded-lg overflow-hidden mb-3 relative shadow-lg bg-white/5">
                            <img src={p.coverImgUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                            <div className="absolute top-2 right-2 text-[10px] bg-black/40 px-2 py-1 rounded backdrop-blur-sm">{p.updateFrequency}</div>
                        </div>
                        <h3 className="font-medium text-white truncate text-sm">{p.name}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HistoryView = ({ user }: { user: User }) => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const { playTrack } = usePlayer();

    useEffect(() => {
        if(user) {
            neteaseService.getUserRecord(user.userId).then(setTracks);
        }
    }, [user]);

    return (
        <div className="p-10 pb-32">
            <h1 className="text-3xl font-bold mb-8">最近播放</h1>
            <TrackList tracks={tracks} onPlay={(t) => playTrack(t, tracks)} />
        </div>
    );
};

const FMView = () => {
    const { playTrack, currentTrack, nextTrack } = usePlayer();
    const [loading, setLoading] = useState(false);

    const startFM = async () => {
        setLoading(true);
        const tracks = await neteaseService.getPersonalFM();
        if(tracks.length > 0) {
            playTrack(tracks[0], tracks);
        }
        setLoading(false);
    };

    return (
        <div className="h-full flex flex-col items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-br from-rose-900/20 to-black z-0" />
             <div className="z-10 text-center flex flex-col items-center">
                 <div className="w-72 h-72 rounded-2xl shadow-2xl mb-8 overflow-hidden border border-white/10 relative group">
                     {currentTrack?.al?.picUrl ? (
                         <img src={currentTrack.al.picUrl} className="w-full h-full object-cover" />
                     ) : (
                         <div className="w-full h-full bg-white/5 flex items-center justify-center">
                             <Music className="w-20 h-20 text-white/20" />
                         </div>
                     )}
                 </div>
                 <h2 className="text-3xl font-bold mb-2 max-w-lg truncate">{currentTrack?.name || "私人漫游 FM"}</h2>
                 <p className="text-white/50 text-lg mb-8">{currentTrack?.ar?.map(a => a.name).join(', ') || "探索你的音乐品味"}</p>
                 
                 <div className="flex gap-6">
                     <button onClick={() => nextTrack()} className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <AlertCircle className="w-6 h-6 rotate-45" /> 
                     </button>
                     <button 
                        onClick={startFM}
                        className="w-16 h-16 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-500/30 transition-transform hover:scale-105"
                     >
                        <Play className="w-8 h-8 fill-current text-white ml-1" />
                     </button>
                     <button onClick={nextTrack} className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-8 h-8" />
                     </button>
                 </div>
                 {!currentTrack && <p className="mt-8 text-white/30 text-sm">点击播放开始私人漫游</p>}
             </div>
        </div>
    );
};

const RadioView = () => {
    const [radios, setRadios] = useState<any[]>([]);
    useEffect(() => {
        neteaseService.getHotRadios().then(setRadios);
    }, []);

    return (
        <div className="p-10 pb-32">
            <h1 className="text-3xl font-bold mb-8">热门电台</h1>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {radios.map(r => (
                    <div key={r.id} className="group cursor-pointer">
                        <div className="aspect-square rounded-lg overflow-hidden mb-3 relative shadow-lg">
                            <img src={r.picUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        </div>
                        <h3 className="font-medium text-white truncate text-sm">{r.name}</h3>
                        <p className="text-xs text-white/40">{r.rcmdText}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

const SearchResults = ({ query, onPlaylistClick }: { query: string, onPlaylistClick: (id: number) => void }) => {
    const [songs, setSongs] = useState<Track[]>([]);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [loading, setLoading] = useState(true);
    const { playTrack } = usePlayer();

    useEffect(() => {
        const search = async () => {
            setLoading(true);
            try {
                const res = await neteaseService.search(query);
                setSongs(res.songs);
                setPlaylists(res.playlists);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if(query) search();
    }, [query]);

    if(loading) return <div className="p-10 text-white/50">正在搜索 "{query}"...</div>;

    if(songs.length === 0 && playlists.length === 0) {
        return <div className="p-10 text-white/50">未找到 "{query}" 的相关结果。请检查网络或 API 设置。</div>;
    }

    return (
        <div className="p-10 space-y-10 pb-32">
            {songs.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-white">单曲</h2>
                    <TrackList tracks={songs} onPlay={(t) => playTrack(t, songs)} />
                </div>
            )}

            {playlists.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-white">相关歌单</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {playlists.map((playlist) => (
                            <div 
                                key={playlist.id} 
                                className="group p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
                                onClick={() => onPlaylistClick(playlist.id)}
                            >
                                <div className="aspect-square rounded-lg overflow-hidden mb-4 relative shadow-lg bg-white/5 flex items-center justify-center">
                                    {playlist.coverImgUrl ? (
                                        <img src={playlist.coverImgUrl} alt={playlist.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Music className="w-10 h-10 text-white/20" />
                                    )}
                                </div>
                                <h3 className="font-semibold text-white truncate text-sm">{playlist.name}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- Main Application ---

const AppContent = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [likedPlaylistId, setLikedPlaylistId] = useState<number | undefined>(undefined);
  
  const [currentView, setCurrentView] = useState<ViewType>('home');
  const [viewData, setViewData] = useState<any>(null);

  // Home Data State
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [recPlaylists, setRecPlaylists] = useState<Playlist[]>([]);
  const [topPlaylists, setTopPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Initial Check for Login Status
  useEffect(() => {
     const checkLogin = async () => {
        const cachedUser = neteaseService.getCachedUserProfile();
        if (cachedUser) {
            setUser(cachedUser);
            if (cachedUser.userId) {
                neteaseService.getUserPlaylists(cachedUser.userId).then(pl => {
                    setUserPlaylists(pl);
                    if (pl.length > 0) setLikedPlaylistId(pl[0].id);
                }).catch(() => {});
            }
        }
        try {
           const u = await neteaseService.getUserProfile();
           setUser(u);
           if(u && u.userId) {
             const userPl = await neteaseService.getUserPlaylists(u.userId);
             setUserPlaylists(userPl);
             if (userPl.length > 0) setLikedPlaylistId(userPl[0].id);
           }
        } catch (e) {
           console.log("App: Not logged in or session expired");
        }
     };
     checkLogin();
  }, []);

  // Fetch Home Data
  useEffect(() => {
    const loadHomeData = async () => {
      if (currentView !== 'home') return;
      setLoading(true);
      setError('');
      try {
        const [top] = await Promise.all([
             neteaseService.getTopPlaylists().catch(() => []),
        ]);
        setTopPlaylists(top);

        if (user) {
             const rec = await neteaseService.getRecommendResource().catch(() => []);
             setRecPlaylists(rec);
             if (user.userId && userPlaylists.length === 0) {
                 const userPl = await neteaseService.getUserPlaylists(user.userId);
                 setUserPlaylists(userPl);
                 if (userPl.length > 0) setLikedPlaylistId(userPl[0].id);
             }
        } else {
             const guestRec = await neteaseService.getPersonalized().catch(e => []);
             setRecPlaylists(guestRec);
        }

      } catch (e: any) {
        if (topPlaylists.length === 0) {
            setError(e.message || "连接 API 失败");
        }
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, [user, currentView]);

  const handleNavigate = (view: ViewType, data?: any) => {
    setCurrentView(view);
    setViewData(data);
  };

  const renderHome = () => (
    <>
        <div className="w-full h-96 relative shrink-0">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-900/40 via-[#1c1c1e]/80 to-[#1c1c1e] z-0" />
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-rose-500/10 to-transparent z-0 opacity-50" />
            
            <div className="absolute bottom-0 left-0 p-10 z-10 w-full max-w-4xl">
                <h2 className="text-sm font-bold text-rose-500 mb-3 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                    编辑精选
                </h2>
                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-none">
                    重新发现<br/>你的音乐
                </h1>
                <p className="text-lg text-white/60 max-w-xl mb-8 leading-relaxed">
                    沉浸在高保真的音质中，感受每一个音符的跳动。Muse Music 为您带来最纯粹的聆听体验。
                </p>
                <div className="flex gap-4">
                     <button onClick={() => handleNavigate('search', '周杰伦')} className="px-8 py-3 bg-white text-black rounded-lg font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-xl shadow-white/5">
                        <Play className="w-5 h-5 fill-current" /> 立即收听
                     </button>
                </div>
            </div>
        </div>
        
        <div className="pb-32 -mt-10 relative z-10">
            {user && userPlaylists.length > 0 && (
                <>
                    <SectionHeader title="您的资料库" onClick={() => {}} />
                    <HorizontalScrollList playlists={userPlaylists} onPlaylistClick={(id) => handleNavigate('playlist', id)} />
                </>
            )}

            {recPlaylists.length > 0 && (
                <>
                    <SectionHeader title={user ? "为您推荐" : "推荐歌单"} />
                    <HorizontalScrollList playlists={recPlaylists} onPlaylistClick={(id) => handleNavigate('playlist', id)} />
                </>
            )}

            {topPlaylists.length > 0 && (
                <>
                    <SectionHeader title="热门精选" />
                    <HorizontalScrollList playlists={topPlaylists} onPlaylistClick={(id) => handleNavigate('playlist', id)} />
                </>
            )}
        </div>
    </>
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#1c1c1e] text-white font-sans">
      <Sidebar 
        user={user}
        currentView={currentView}
        likedPlaylistId={likedPlaylistId}
        playlists={userPlaylists}
        onNavigate={handleNavigate}
        // No login/settings handlers needed here anymore
      />
      
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-[#1c1c1e]">
        {/* New Top Bar */}
        <TopBar 
            user={user} 
            onOpenLogin={() => setIsLoginOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            canGoBack={currentView !== 'home'}
            onBack={() => handleNavigate('home')}
        />

        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
            {error && currentView === 'home' && (
                <div className="flex items-center justify-between p-4 bg-red-500/10 border-l-4 border-red-500 text-white/70 mx-10 mt-10 rounded">
                    <span>无法连接到服务器: {error}</span>
                    <button onClick={() => setIsSettingsOpen(true)} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm text-white">
                        配置 API
                    </button>
                </div>
            )}

            {currentView === 'home' && renderHome()}
            {currentView === 'search' && <SearchResults query={viewData} onPlaylistClick={(id) => handleNavigate('playlist', id)} />}
            {currentView === 'playlist' && <PlaylistDetail id={viewData} onBack={() => handleNavigate('home')} />}
            {currentView === 'daily' && <DailyRecommendView />}
            {currentView === 'toplist' && <TopListsView onPlaylistClick={(id) => handleNavigate('playlist', id)} />}
            {currentView === 'fm' && <FMView />}
            {currentView === 'history' && user && <HistoryView user={user} />}
            {currentView === 'radio' && <RadioView />}
        </div>
      </div>

      <PlayerBar />
      
      <LoginModal 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={async (u) => {
             setUser(u);
             if (u && u.userId) {
                const userPl = await neteaseService.getUserPlaylists(u.userId);
                setUserPlaylists(userPl);
                if (userPl.length > 0) setLikedPlaylistId(userPl[0].id);
             }
        }}
      />

      <SettingsModal 
         isOpen={isSettingsOpen}
         onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

const App = () => {
  return (
    <SettingsProvider>
      <PlayerProvider>
        <AppContent />
      </PlayerProvider>
    </SettingsProvider>
  );
};

export default App;