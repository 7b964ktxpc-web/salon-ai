import React, { useState } from 'react';
import { 
  Lock, 
  ShieldAlert, 
  ArrowLeft, 
  CheckCircle2, 
  UserCheck, 
  KeyRound, 
  Crown, 
  Store, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { SalonLogo } from './SalonLogo.tsx';
import { installAuthenticatedFetch, setAccessToken } from '../api-auth.ts';

installAuthenticatedFetch();

interface AdminAuthModalProps {
  onSuccess: (adminTelegramId: string, isSuperAdmin?: boolean) => void;
  onCancel: () => void;
  initialTab?: 'master' | 'superadmin';
  activeSalonName?: string;
  activeSalonMaster?: string;
  activeSalonId?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ 
  onSuccess, 
  onCancel, 
  initialTab = 'master',
  activeSalonName = 'Lashm.anya',
  activeSalonMaster = 'Анна',
  activeSalonId,
}) => {
  const [authTab, setAuthTab] = useState<'master' | 'superadmin'>(initialTab);
  const [telegramId, setTelegramId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId.trim()) {
      setErrorMessage(
        authTab === 'superadmin' 
          ? 'Пожалуйста, введите Telegram ID или ключ Главного Администратора' 
          : 'Пожалуйста, введите Telegram ID мастера'
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          telegramId: telegramId.trim(),
          salonId: authTab === 'master' ? activeSalonId : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (data.accessToken) setAccessToken(data.accessToken);
        if (data.isSuperAdmin) {
          sessionStorage.setItem('lashm_anya_is_super_admin', 'true');
          sessionStorage.setItem('lashm_anya_admin_auth', telegramId.trim());
          onSuccess(telegramId.trim(), true);
        } else {
          if (authTab === 'superadmin') {
            setErrorMessage('Этот аккаунт является мастером салона, но не Главным администратором платформы. Переключитесь на вкладку «Мастер салона».');
            setLoading(false);
            return;
          }
          sessionStorage.setItem('lashm_anya_is_super_admin', 'false');
          sessionStorage.setItem('lashm_anya_admin_auth', telegramId.trim());
          onSuccess(telegramId.trim(), false);
        }
      } else {
        setErrorMessage(
          data.error || 'Доступ отклонён: указанный Telegram ID не найден или не привязан к системе.'
        );
      }
    } catch (err) {
      setErrorMessage('Не удалось связаться с сервером авторизации');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMasterFill = () => {
    setTelegramId('lashm_anya');
    setErrorMessage(null);
  };

  const handleQuickOwnerFill = () => {
    setTelegramId('me.savin13');
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#232120]/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="admin-auth-card"
        className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-[24px] max-w-md w-full p-6 sm:p-8 shadow-2xl text-[#232120] relative space-y-5 animate-fadeIn"
      >
        <button id="btn-admin-auth-back" onClick={onCancel} className="inline-flex items-center gap-1.5 text-xs text-[#6E6259] hover:text-[#232120] transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /><span>Вернуться к просмотру</span>
        </button>
        <div className="flex rounded-xl bg-[#EDE7DF] p-1 text-xs">
          <button type="button" onClick={() => { setAuthTab('master'); setTelegramId(''); setErrorMessage(null); }} className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition ${authTab === 'master' ? 'bg-white text-[#232120] shadow-xs font-semibold' : 'text-[#6E6259] hover:text-[#232120]'}`}>
            <Store className="w-3.5 h-3.5 text-[#B08D57]" /><span>Мастер салона</span>
          </button>
          <button type="button" onClick={() => { setAuthTab('superadmin'); setTelegramId(''); setErrorMessage(null); }} className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition ${authTab === 'superadmin' ? 'bg-amber-600 text-white shadow-xs font-semibold' : 'text-[#6E6259] hover:text-amber-800'}`}>
            <Crown className="w-3.5 h-3.5" /><span>Главный админ (Вы)</span>
          </button>
        </div>
        {authTab === 'master' ? (
          <div className="text-center space-y-1.5">
            <div className="relative inline-block mx-auto mb-1"><SalonLogo size="lg" /><div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#483F38] text-white flex items-center justify-center border-2 border-[#FAF8F5] shadow-2xs"><Lock className="w-3 h-3 text-[#E2D8CC]" /></div></div>
            <h2 className="font-serif text-2xl font-medium text-[#232120] tracking-tight">Кабинет студии «{activeSalonName}»</h2>
            <p className="text-xs text-[#6E6259] max-w-xs mx-auto leading-relaxed">Изолированный CRM-кабинет мастера <strong className="text-[#232120]">{activeSalonMaster}</strong>. Доступ защищён по Telegram ID.</p>
          </div>
        ) : (
          <div className="text-center space-y-1.5">
            <div className="relative inline-block mx-auto mb-1"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shadow-md"><Crown className="w-7 h-7 text-amber-100" /></div><div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#232120] text-amber-300 flex items-center justify-center border-2 border-[#FAF8F5] shadow-2xs"><ShieldCheck className="w-3 h-3 text-amber-400" /></div></div>
            <h2 className="font-serif text-2xl font-medium text-[#232120] tracking-tight">Главная админка платформы</h2>
            <p className="text-xs text-[#6E6259] max-w-xs mx-auto leading-relaxed">Только для владельца SaaS платформы. Полное управление всеми студиями, привязка Telegram ID, тарифы и рассылки.</p>
          </div>
        )}
        {errorMessage && <div id="admin-auth-error" className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-red-800 animate-shake"><ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" /><div><p className="font-medium">Доступ отклонён</p><p className="mt-0.5 text-red-700">{errorMessage}</p></div></div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-[#6E6259] flex items-center justify-between"><span>{authTab === 'superadmin' ? 'ID или логин Главного Администратора' : 'Telegram ID мастера'}</span><span className="text-[11px] font-normal text-[#8C827A] lowercase">@username или ID</span></label>
            <div className="relative"><input id="input-admin-telegram-id" type="text" value={telegramId} onChange={(e) => { setTelegramId(e.target.value); setErrorMessage(null); }} placeholder={authTab === 'superadmin' ? 'me.savin13 или lashm_anya_owner' : 'например: lashm_anya'} className="w-full bg-white border border-[#D8CEC4] rounded-xl px-3.5 py-2.5 text-sm text-[#232120] placeholder-[#A89F96] focus:outline-none focus:border-[#483F38] focus:ring-1 focus:ring-[#483F38]" autoFocus /><KeyRound className="w-4 h-4 text-[#A89F96] absolute right-3.5 top-3" /></div>
          </div>
          {authTab === 'master' ? (
            <div className="bg-[#FAF6F0] border border-[#E8E0D5] rounded-xl p-3 text-xs space-y-1.5"><div className="flex items-center justify-between text-[#6E6259]"><span className="font-medium flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-[#B08D57]" /><span>Мастер {activeSalonName}:</span></span><span className="text-[#232120] font-mono font-medium">@lashm_anya</span></div><p className="text-[11px] text-[#8C827A]">Мастер видит исключительно свои записи, клиенток и настройки своего Telegram-бота.</p><button id="btn-quick-fill-master" type="button" onClick={handleQuickMasterFill} className="text-[11px] text-[#483F38] font-medium hover:underline cursor-pointer flex items-center gap-1 pt-0.5"><span>Вставить Telegram ID мастера</span><span className="font-mono bg-white px-1.5 py-0.2 rounded border border-[#D8CEC4]">lashm_anya</span></button></div>
          ) : (
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs space-y-1.5"><div className="flex items-center justify-between text-amber-900"><span className="font-medium flex items-center gap-1"><Crown className="w-3.5 h-3.5 text-amber-600" /><span>Владелец платформы:</span></span><span className="text-amber-950 font-mono font-bold">me.savin13</span></div><p className="text-[11px] text-amber-800/80">Главный админ получает доступ ко всем салонам, одобрению Telegram ID, тарифам и MRR.</p><button id="btn-quick-fill-owner" type="button" onClick={handleQuickOwnerFill} className="text-[11px] text-amber-900 font-semibold hover:underline cursor-pointer flex items-center gap-1 pt-0.5"><span>Войти как Главный Администратор</span><span className="font-mono bg-white px-1.5 py-0.2 rounded border border-amber-300">me.savin13</span></button></div>
          )}
          <div className="space-y-2 pt-1">
            <button id="btn-submit-admin-auth" type="submit" disabled={loading} className={`w-full py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 text-white ${authTab === 'superadmin' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#483F38] hover:bg-[#232120]'}`}>
              {loading ? <span>Проверка доступа...</span> : authTab === 'superadmin' ? <><Crown className="w-4 h-4 text-amber-200" /><span>Войти в Главную админку</span></> : <><CheckCircle2 className="w-4 h-4 text-[#D8CEC4]" /><span>Войти в кабинет мастера</span></>}
            </button>
            <button id="btn-cancel-admin-auth" type="button" onClick={onCancel} className="w-full bg-transparent hover:bg-[#EFECE6] text-[#6E6259] py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
};
