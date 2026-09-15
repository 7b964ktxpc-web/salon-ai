import React, { useState } from 'react';
import { Key, CheckCircle, X, Shield, Sparkles, User, AlertCircle } from 'lucide-react';
import { SalonTenant } from '../types.ts';

interface LinkTelegramIdModalProps {
  salon: SalonTenant;
  onClose: () => void;
  onSuccess: (updatedSalon: SalonTenant) => void;
}

export const LinkTelegramIdModal: React.FC<LinkTelegramIdModalProps> = ({
  salon,
  onClose,
  onSuccess,
}) => {
  const [telegramId, setTelegramId] = useState(salon.ownerTelegramId || salon.ownerTelegramUsername || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telegramId.trim()) {
      setError('Пожалуйста, введите Telegram ID или username мастера');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/platform/salons/${salon.id}/link-telegram-id`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId: telegramId.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка привязки ID');
      }

      onSuccess(data.salon);
    } catch (err: any) {
      setError(err.message || 'Не удалось привязать Telegram ID');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl text-stone-100">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Привязка Telegram ID мастера</h3>
            <p className="text-xs text-stone-400">Главная админка платформы</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-800/70 border border-stone-700/60 mb-5 text-xs text-stone-300 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-stone-400">Студия:</span>
            <span className="font-medium text-white">{salon.settings.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Мастер:</span>
            <span className="font-medium text-white">{salon.ownerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Город:</span>
            <span className="font-medium text-white">{salon.settings.city}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-400">Телефон:</span>
            <span className="font-medium text-white">{salon.ownerPhone}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-300 mb-1.5">
              Telegram ID или @username мастера:
            </label>
            <div className="relative">
              <input
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Например: 700011122 или @lashm_anya"
                className="w-full pl-4 pr-10 py-3 bg-stone-800 border border-stone-700 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                autoFocus
              />
              <Shield className="w-4 h-4 text-stone-500 absolute right-3.5 top-3.5" />
            </div>
            <p className="mt-1.5 text-[11px] text-stone-400 leading-relaxed">
              💡 После привязки мастер сможет входить в свою персональную админку студии <span className="text-amber-300">«{salon.settings.name}»</span>, используя этот Telegram ID.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800 text-sm font-medium transition"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Сохранение...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Привязать и открыть доступ</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
