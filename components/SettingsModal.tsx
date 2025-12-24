import React, { useState } from 'react';
import { X, Server, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { neteaseService } from '../services/neteaseService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const [url, setUrl] = useState(neteaseService.getApiUrl());
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    let cleanUrl = url.trim();
    if (!cleanUrl) {
        setErrorMsg("API 地址不能为空");
        setStatus('error');
        return;
    }
    
    // Auto append protocol if missing
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
                onClose();
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#2c2c2e] rounded-xl shadow-2xl overflow-hidden border border-white/10 relative p-6">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
             <Server className="w-6 h-6 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold">服务器设置</h2>
          <p className="text-white/50 text-xs mt-1">配置您的 NeteaseCloudMusicApi 地址</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1">API 地址</label>
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
            
            <p className="mt-2 text-[10px] text-white/30 leading-relaxed">
               请输入您部署在 Vercel 或本地的 API 地址。<br/>
               推荐使用 HTTPS 以避免混合内容错误。
            </p>
          </div>

          <button 
            onClick={handleSave}
            disabled={status === 'testing' || status === 'success'}
            className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 
                ${status === 'success' ? 'bg-green-500' : 'bg-rose-500 hover:bg-rose-600 disabled:opacity-70 disabled:cursor-not-allowed'}`}
          >
            {status === 'testing' && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {status === 'testing' ? "测试连接中..." : (status === 'success' ? "保存成功" : "测试并保存")}
          </button>
        </div>
      </div>
    </div>
  );
};