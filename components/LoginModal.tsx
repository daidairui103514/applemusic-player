import React, { useState, useEffect, useRef } from 'react';
import { X, Loader2, Smartphone, Mail, QrCode } from 'lucide-react';
import { neteaseService } from '../services/neteaseService';
import { User } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

type LoginMethod = 'phone' | 'email' | 'qr';

export const LoginModal = ({ isOpen, onClose, onLoginSuccess }: LoginModalProps) => {
  const [method, setMethod] = useState<LoginMethod>('phone');
  const [input1, setInput1] = useState(''); // Phone or Email
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // QR State
  const [qrImg, setQrImg] = useState('');
  const [qrKey, setQrKey] = useState('');
  const [qrStatus, setQrStatus] = useState('等待扫码...');
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen && method === 'qr') {
      initQrCode();
    } else {
      stopQrCheck();
    }
    return () => stopQrCheck();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, method]);

  const stopQrCheck = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const initQrCode = async () => {
    try {
      setLoading(true);
      setError('');
      const key = await neteaseService.getQrKey();
      setQrKey(key);
      const img = await neteaseService.createQr(key);
      setQrImg(img);
      setLoading(false);
      setQrStatus('请使用网易云音乐APP扫码');
      
      // Start polling
      timerRef.current = window.setInterval(async () => {
        try {
          const res = await neteaseService.checkQr(key);
          if (res.code === 800) {
            setQrStatus('二维码已过期，请刷新');
            stopQrCheck();
          } else if (res.code === 803) {
            // Success
            stopQrCheck();
            setQrStatus('授权成功，正在跳转...');
            const user = await neteaseService.getUserProfile(); // Or get from status
            onLoginSuccess(user);
            onClose();
          }
        } catch (e) {
          console.error(e);
        }
      }, 3000);

    } catch (e) {
      setLoading(false);
      setError('无法加载二维码，请检查网络或 API 地址设置');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let user: User;
      if (method === 'phone') {
        user = await neteaseService.loginCellphone(input1, password);
      } else {
        user = await neteaseService.loginEmail(input1, password);
      }
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setError(err.message || '登录失败，请检查账号密码或API服务');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#2c2c2e] rounded-xl shadow-2xl overflow-hidden border border-white/10 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 pb-4 text-center">
          <h2 className="text-2xl font-bold mb-1">登录网易云音乐</h2>
          <p className="text-white/50 text-xs">解锁完整音乐体验</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 px-6 gap-6 justify-center">
           <button 
             onClick={() => setMethod('phone')}
             className={`pb-3 text-sm font-medium transition-colors relative ${method === 'phone' ? 'text-rose-500' : 'text-white/40 hover:text-white/70'}`}
           >
             <Smartphone className="w-5 h-5 mx-auto mb-1" />
             手机号
             {method === 'phone' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 rounded-t-full" />}
           </button>
           <button 
             onClick={() => setMethod('email')}
             className={`pb-3 text-sm font-medium transition-colors relative ${method === 'email' ? 'text-rose-500' : 'text-white/40 hover:text-white/70'}`}
           >
             <Mail className="w-5 h-5 mx-auto mb-1" />
             邮箱
             {method === 'email' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 rounded-t-full" />}
           </button>
           <button 
             onClick={() => setMethod('qr')}
             className={`pb-3 text-sm font-medium transition-colors relative ${method === 'qr' ? 'text-rose-500' : 'text-white/40 hover:text-white/70'}`}
           >
             <QrCode className="w-5 h-5 mx-auto mb-1" />
             二维码
             {method === 'qr' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-rose-500 rounded-t-full" />}
           </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg text-center">
              {error}
            </div>
          )}

          {method === 'qr' ? (
            <div className="flex flex-col items-center justify-center py-4">
              {loading ? (
                <div className="w-40 h-40 flex items-center justify-center bg-white/5 rounded-lg">
                    <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                </div>
              ) : (
                <div className="bg-white p-2 rounded-lg">
                   {qrImg && <img src={qrImg} alt="QR Login" className="w-40 h-40" />}
                </div>
              )}
              <p className="mt-4 text-sm text-white/70">{qrStatus}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">
                  {method === 'phone' ? '手机号码' : '网易邮箱'}
                </label>
                <input 
                  type="text" 
                  value={input1}
                  onChange={(e) => setInput1(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-white/5 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors placeholder:text-white/20"
                  placeholder={method === 'phone' ? '请输入手机号' : 'example@163.com'}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1">密码</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#1c1c1e] border border-white/5 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-rose-500 transition-colors placeholder:text-white/20"
                  placeholder="••••••••"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-rose-500 hover:bg-rose-600 rounded-lg font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center shadow-lg shadow-rose-500/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "立即登录"}
              </button>
            </form>
          )}
          
          <p className="mt-6 text-center text-[10px] text-white/20">
             请确保您已在侧边栏设置中配置了正确的 API 地址。
          </p>
        </div>
      </div>
    </div>
  );
};