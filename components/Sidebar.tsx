
import React, { useState } from 'react';
import { Home, Search, Library, Radio, Heart, ListMusic, Disc, Mic2, UserCircle, Settings, Flame, History } from 'lucide-react';
import { User, ViewType } from '../types';

interface SidebarProps {
  user: User | null;
  currentView: ViewType;
  likedPlaylistId?: number; 
  onNavigate: (view: ViewType, data?: any) => void;
  // Methods to open login/settings removed from here as they moved to TopBar
  onOpenLogin?: () => void; 
}

export const Sidebar = ({ 
  user, 
  currentView,
  likedPlaylistId,
  onNavigate,
  onOpenLogin
}: SidebarProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      onNavigate('search', searchQuery);
    }
  };

  const navItemClass = (isActive: boolean) => 
    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer mb-1 ${
      isActive ? 'bg-white/10 text-rose-500 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
    }`;

  return (
    <div className="w-64 h-full bg-[#18181b] flex flex-col p-4 border-r border-white/5 z-20 shrink-0">
      <div className="flex items-center gap-2 mb-8 px-2 cursor-pointer" onClick={() => onNavigate('home')}>
        <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center text-white">
            <Disc className="w-5 h-5 animate-[spin_10s_linear_infinite]" />
        </div>
        <span className="text-xl font-bold tracking-tight">Muse Music</span>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/40" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="搜索音乐、歌单..." 
            className="w-full bg-[#27272a] text-sm text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-1 focus:ring-rose-500/50 placeholder:text-white/20 transition-all"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="mb-8">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-3">发现音乐</h3>
          <div 
            className={navItemClass(currentView === 'home')}
            onClick={() => onNavigate('home')}
          >
            <Home className="w-5 h-5" />
            现在收听
          </div>
          <div 
            className={navItemClass(currentView === 'toplist')}
            onClick={() => onNavigate('toplist')}
          >
            <Mic2 className="w-5 h-5" />
            排行榜
          </div>
          <div 
             className={navItemClass(currentView === 'radio')}
             onClick={() => onNavigate('radio')}
          >
            <Radio className="w-5 h-5" />
            广播电台
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-3">我的资料库</h3>
          {user && likedPlaylistId ? (
            <div 
                className={navItemClass(false)} 
                onClick={() => onNavigate('playlist', likedPlaylistId)} 
            >
                <Heart className="w-5 h-5" />
                我喜欢的音乐
            </div>
          ) : (
             <div className="opacity-50 pointer-events-none px-3 py-2 flex items-center gap-3 text-sm text-white/40">
                 <Heart className="w-5 h-5" />
                 我喜欢的音乐
             </div>
          )}
          
          <div className={navItemClass(currentView === 'history')} onClick={() => user ? onNavigate('history') : onOpenLogin?.()}>
            <History className="w-5 h-5" />
            最近播放
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2 px-3">精选歌单</h3>
          <div className={navItemClass(currentView === 'daily')} onClick={() => user ? onNavigate('daily') : onOpenLogin?.()}>
            <ListMusic className="w-5 h-5" />
            每日推荐
          </div>
          <div className={navItemClass(currentView === 'fm')} onClick={() => user ? onNavigate('fm') : onOpenLogin?.()}>
            <Flame className="w-5 h-5" />
            私人漫游
          </div>
        </div>
      </nav>
      
      {/* Bottom section removed as requested */}
    </div>
  );
};
