import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  X, 
  ExternalLink, 
  Send, 
  Store, 
  Key, 
  ShieldCheck, 
  Sparkles, 
  Smartphone,
  Bot,
  QrCode,
  Share2
} from 'lucide-react';
import { SalonTenant } from '../types.ts';

interface MasterAdminInviteModalProps {
  salon: SalonTenant;
  onClose: () => void;
  onOpenIdLink?: () => void;
  onOpenMasterAdmin?: () => void;
}

export const MasterAdminInviteModal: React.FC<MasterAdminInviteModalProps> = ({
  salon,
  onClose,
  onOpenIdLink,
  onOpenMasterAdmin,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);

  const origin = window.location.origin;
  const slug = salon.slug || salon.settings.name.toLowerCase().replace(/[^a-zа-я0-9]/gi, '-');
  
  // Direct admin link for the salon master
  const adminUrl = `${origin}/?salon=${slug}&mode=admin`;
  
  // Client bot link for reference
  const clientBotUrl = `https://t.me/${(salon.botUsername || salon.settings.telegramBotName || '@LashmAnyaBot').replace(/^@/, '')}/app?startapp=${slug}`;

  // Ready-to-send Telegram message for the master
  const telegramInviteMessage = `Здравствуйте, ${salon.ownerName}! 🤍\n\nВаш персональный CRM-кабинет студии «${salon.settings.name}» настроен и готов к работе:\n👉 ${adminUrl}\n\n🔑 Доступ в админку защищён по вашему Telegram: ${salon.ownerTelegramUsername ? `@${salon.ownerTelegramUsername}` : salon.ownerTelegramId || 'ваш Telegram ID'}\n\nВнутри кабинета вы сможете:\n1. Отредактировать прайс-лист, услуги и длительность\n2. Настроить рабочее расписание и выходные\n3. Изменить адрес, контакты и соцсети салона\n4. Получить персональную ссылку на Telegram-бота для онлайн-записи клиенток!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(adminUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(telegramInviteMessage);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleShareTelegram = () => {
    const encoded = encodeURIComponent(telegramInviteMessage);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(adminUrl)}&text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white">Ссылка на админку салона</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ИЗОЛИРОВАННАЯ CRM
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              Студия «<strong className="text-stone-200">{salon.settings.name}</strong>» • Мастер <strong className="text-stone-200">{salon.ownerName}</strong>
            </p>
          </div>
        </div>

        {/* Telegram ID Binding Info */}
        <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800/80 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-stone-400">Привязанный Telegram для входа: </span>
              {salon.ownerTelegramId || salon.ownerTelegramUsername ? (
                <span className="font-mono text-amber-300 font-semibold">
                  {salon.ownerTelegramUsername ? `@${salon.ownerTelegramUsername}` : salon.ownerTelegramId}
                </span>
              ) : (
                <span className="text-rose-400 font-medium italic">не привязан</span>
              )}
            </div>
          </div>
          {onOpenIdLink && (
            <button
              onClick={onOpenIdLink}
              className="text-[11px] text-amber-400 hover:underline shrink-0"
            >
              {salon.ownerTelegramId ? 'Изменить ID' : 'Привязать ID'}
            </button>
          )}
        </div>

        {/* Box 1: Direct Admin Link for Master */}
        <div className="p-4 rounded-2xl bg-stone-800/70 border border-stone-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5" /> Персональная ссылка для мастера
            </span>
            <button
              onClick={handleCopyLink}
              className="py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-stone-950" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копировать ссылку</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-stone-950 rounded-xl font-mono text-xs text-amber-200 break-all select-all border border-stone-800">
            {adminUrl}
          </div>

          <p className="text-[11px] text-stone-400">
            Мастер переходит по этой ссылке, попадает исключительно в свой кабинет и настраивает все параметры студии под себя.
          </p>
        </div>

        {/* Box 2: Ready Invite Message for Telegram */}
        <div className="p-4 rounded-2xl bg-stone-800/70 border border-stone-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-sky-400" /> Готовое сообщение для отправки мастеру в Telegram
            </span>
            <button
              onClick={handleCopyMessage}
              className="py-1 px-2.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-200 text-xs font-medium flex items-center gap-1 transition"
            >
              {copiedMessage ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Скопировано</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Скопировать текст</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3.5 bg-stone-950 rounded-xl text-xs text-stone-300 whitespace-pre-line border border-stone-800 leading-relaxed max-h-48 overflow-y-auto">
            {telegramInviteMessage}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <button
            onClick={handleShareTelegram}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-sky-500/20"
          >
            <Send className="w-4 h-4" />
            <span>Отправить мастеру в Telegram</span>
          </button>

          {onOpenMasterAdmin && (
            <button
              onClick={onOpenMasterAdmin}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              <span>Открыть админку</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-4 rounded-xl border border-stone-800 hover:bg-stone-800 text-stone-400 text-xs transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
