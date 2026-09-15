import React, { useState } from 'react';
import { 
  Bot, 
  Copy, 
  Check, 
  ExternalLink, 
  QrCode, 
  Sparkles, 
  X, 
  Share2, 
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { BusinessSettings, SalonTenant } from '../types.ts';

interface MasterBotLinkModalProps {
  settings: BusinessSettings;
  salon?: SalonTenant;
  onClose: () => void;
}

export const MasterBotLinkModal: React.FC<MasterBotLinkModalProps> = ({
  settings,
  salon,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState(false);
  const [copiedBotUser, setCopiedBotUser] = useState(false);

  const botHandle = salon?.botUsername || settings.telegramBotName || '@LashmAnyaBot';
  const cleanBotHandle = botHandle.replace(/^@/, '');
  const slug = salon?.slug || settings.name.toLowerCase().replace(/[^a-zа-я0-9]/gi, '-');

  const miniAppUrl = `https://t.me/${cleanBotHandle}/app?startapp=${slug}`;
  const webAppUrl = `${window.location.origin}/?salon=${slug}`;

  const promoCaption = `✨ Записывайтесь ко мне на реснички и ламинирование 24/7!\n\nУмный онлайн-бот подберет удобное время, покажет свободные окна и напомнит о визите:\n👉 ${miniAppUrl}\n\nСтудия ${settings.name} (${settings.city}, ${settings.address})`;

  const handleCopy = (text: string, type: 'link' | 'promo' | 'bot') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else if (type === 'promo') {
      setCopiedPromo(true);
      setTimeout(() => setCopiedPromo(false), 2000);
    } else if (type === 'bot') {
      setCopiedBotUser(true);
      setTimeout(() => setCopiedBotUser(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Ссылка на вашего Telegram-бота</h3>
            <p className="text-xs text-stone-400">Для передачи клиенткам и размещения в соцсетях</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Card 1: Telegram Bot Link */}
          <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5" /> Прямая ссылка на Telegram Mini App
              </span>
              <button
                onClick={() => handleCopy(miniAppUrl, 'link')}
                className="text-xs text-stone-300 hover:text-white flex items-center gap-1 bg-stone-700 hover:bg-stone-600 px-2.5 py-1 rounded-lg transition"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Копировать</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-2.5 bg-stone-950 rounded-xl font-mono text-xs text-stone-300 break-all select-all border border-stone-800">
              {miniAppUrl}
            </div>
            <p className="mt-2 text-[11px] text-stone-400">
              При переходе по ссылке у клиентки мгновенно открывается онлайн-запись в Telegram.
            </p>
          </div>

          {/* Card 2: Bot Username */}
          <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-sm">
                @
              </div>
              <div>
                <div className="text-xs text-stone-400">Имя вашего бота в Telegram:</div>
                <div className="font-semibold text-white text-sm">{botHandle}</div>
              </div>
            </div>
            <button
              onClick={() => handleCopy(botHandle, 'bot')}
              className="p-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 transition"
              title="Скопировать юзернейм"
            >
              {copiedBotUser ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Card 3: Ready Promo Post for Instagram / VK */}
          <div className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Готовый текст для шапки профиля или сторис
              </span>
              <button
                onClick={() => handleCopy(promoCaption, 'promo')}
                className="text-xs text-stone-300 hover:text-white flex items-center gap-1 bg-stone-700 hover:bg-stone-600 px-2.5 py-1 rounded-lg transition"
              >
                {copiedPromo ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Скопировать текст</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-3 bg-stone-950 rounded-xl text-xs text-stone-300 whitespace-pre-line border border-stone-800 leading-relaxed">
              {promoCaption}
            </div>
          </div>

          {/* QR Code hint */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-xs text-stone-300">
            <QrCode className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-300">Печать QR-кодов в салоне</div>
              <p className="mt-0.5 text-stone-400 leading-relaxed">
                Разместите QR-код со ссылкой на бота на рабочем столике, зеркале или визитках. Клиентки смогут записаться повторно за 15 секунд без сообщений в Direct.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-sm font-medium transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
