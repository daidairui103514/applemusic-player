import React, { useState } from 'react';
import { X, Server, CheckCircle2, AlertTriangle, Loader2, Type, Info, Sliders } from 'lucide-react';
import { neteaseService } from '../services/neteaseService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'general' | 'api' | 'about';

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<Tab>('api');
  
  // API State
  const [url, setUrl] = useState(neteaseService.getApiUrl());
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  // General State (Mock for now, normally would use Context)
  const [lyricSize, setLyricSize] = useState('medium');

  if (!isOpen) return null;

  const handleSaveApi = async () => {
    let cleanUrl = url.trim();
    if (!cleanUrl) {
        setErrorMsg("API 地址不能为空");
        setStatus('error');
        return;
    }
    
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
        cleanUrl = `https://${cleanUrl}`;
        setUrl(cleanUrl);
    }

    setStatus('testing');
    setErrorMsg('');

    try {
        const isConnected = await neteaseService.checkConnection(cleanUrl);
        if (isConnected) {
            neteaseService.setBaseUrl(cleanUrl);
            setStatus('success');
            setTimeout(() => {
                window.location.reload(); 
            }, 1000);
        } else {
            setStatus('error');
            setErrorMsg('无法连接到 API，请检查地址或 CORS 设置');
        }
    } catch (e) {
        setStatus('error');
        setErrorMsg('连接出错，请检查网络');
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: Tab, label: string, icon: any }) => (
      <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === id ? 'bg-rose-500 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
      >
          <Icon className="w-4 h-4" />
          {label}
      </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#2c2c2e] rounded-xl shadow-2xl overflow-hidden border border-white/10 flex flex-col h-[500px]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
            <h2 className="text-xl font-bold">设置</h2>
            <button 
                onClick={onClose}
                className="text-white/40 hover:text-white transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Tabs */}
            <div className="w-48 bg-black/20 p-4 space-y-2 border-r border-white/5 flex flex-col">
                <TabButton id="general" label="通用设置" icon={Sliders} />
                <TabButton id="api" label="API 服务" icon={Server} />
                <TabButton id="about" label="关于" icon={Info} />
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-y-auto">
                {activeTab === 'api' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                                <Server className="w-5 h-5 text-rose-500" />
                                网易云 API 设置
                            </h3>
                            <p className="text-white/40 text-sm mb-4">
                                Muse Music 需要连接到 NeteaseCloudMusicApi 才能工作。请填入您的 API 地址。
                            </p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-white/60 mb-1">服务器地址</label>
                                    <input 
                                    type="text" 
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value);
                                        setStatus('idle');
                                        setErrorMsg('');
                                    }}
                                    className={`w-full bg-[#1c1c1e] border rounded-lg px-4 py-3 text-white focus:outline-none transition-colors placeholder:text-white/20 text-sm font-mono ${status === 'error' ? 'border-red-500/50 focus:border-red-500' : 'border-white/5 focus:border-rose-500'}`}
                                    placeholder="https://your-api.vercel.app"
                                    />
                                    {status === 'error' && (
                                        <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
                                            <AlertTriangle className="w-3 h-3" />
                                            <span>{errorMsg}</span>
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={handleSaveApi}
                                    disabled={status === 'testing' || status === 'success'}
                                    className={`px-6 py-2 rounded-lg font-bold text-sm text-white transition-all flex items-center gap-2 
                                        ${status === 'success' ? 'bg-green-500' : 'bg-rose-500 hover:bg-rose-600 disabled:opacity-70'}`}
                                >
                                    {status === 'testing' && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {status === 'success' && <CheckCircle2 className="w-4 h-4" />}
                                    {status === 'testing' ? "测试中..." : (status === 'success' ? "已保存，正在重启" : "测试并保存")}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                            <Type className="w-5 h-5 text-rose-500" />
                            显示设置
                        </h3>
                        
                        <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                            <label className="block text-sm font-medium text-white mb-3">歌词字体大小</label>
                            <div className="flex gap-4">
                                {['small', 'medium', 'large'].map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setLyricSize(size)}
                                        className={`px-4 py-2 rounded border text-xs capitalize transition-colors ${lyricSize === size ? 'bg-rose-500 border-rose-500 text-white' : 'border-white/10 hover:bg-white/10'}`}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                            <p className="mt-3 text-white/30 text-xs">调整全屏播放页面的歌词显示大小。</p>
                        </div>
                    </div>
                )}

                {activeTab === 'about' && (
                    <div className="space-y-4 text-center py-10">
                        <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-orange-500 rounded-2xl mx-auto flex items-center justify-center shadow-xl">
                            <Server className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold">Muse Music</h2>
                        <p className="text-white/40">v1.0.2 Beta</p>
                        <div className="pt-6 border-t border-white/5 w-full">
                            <p className="text-white/30 text-sm">
                                Designed for Netease Cloud Music<br/>
                                <span className="text-xs">Based on React & Tailwind</span>
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
