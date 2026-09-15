import React, { useEffect, useState } from 'react';
import { Bell, Check, Sparkles, X, ChevronRight, MessageSquare, Calendar, ShieldCheck } from 'lucide-react';
import { AppNotification } from '../types.ts';
import { SalonLogo } from './SalonLogo.tsx';

interface TelegramPushBannerProps {
  notification: AppNotification | null;
  onDismiss: () => void;
  onOpenNotification: (notification: AppNotification) => void;
}

export const TelegramPushBanner: React.FC<TelegramPushBannerProps> = ({
  notification,
  onDismiss,
  onOpenNotification,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300);
      }, 7000); // 7s auto-dismiss
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [notification]);

  if (!notification || !isVisible) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'booking_confirmation':
        return <Check className="w-4 h-4 text-emerald-600" />;
      case 'appointment_reminder':
        return <Calendar className="w-4 h-4 text-[#B08D57]" />;
      case 'discount_offer':
        return <Sparkles className="w-4 h-4 text-[#B08D57]" />;
      default:
        return <Bell className="w-4 h-4 text-[#B08D57]" />;
    }
  };

  const getBadgeColor = () => {
    if (notification.type === 'booking_confirmation') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (notification.type === 'discount_offer') return 'bg-amber-50 text-amber-800 border-amber-200';
    return 'bg-[#FAF4EB] text-[#8C6D3F] border-[#E8DACB]';
  };

  return (
    <div
      id="telegram-push-banner"
      role="alert"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-50 w-[calc(100vw-1.5rem)] max-w-md animate-slideDown shadow-[0_12px_36px_rgba(25,20,15,0.18)]"
    >
      <div 
        onClick={() => onOpenNotification(notification)}
        className="bg-white/95 backdrop-blur-md border border-[#D8CEBF] rounded-2xl p-3.5 flex items-start gap-3 cursor-pointer hover:bg-white transition-all group ring-1 ring-black/5"
      >
        {/* Telegram Studio Avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#DDD3C5] bg-[#FAF6F0] flex items-center justify-center shadow-xs">
            <SalonLogo size="sm" showBorder={false} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white flex items-center justify-center shadow-xs border border-[#DDD3C5]">
            {getIcon()}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center justify-between gap-1.5 mb-0.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-serif font-bold text-xs text-[#1F1B18] truncate">
                Lashm.anya
              </span>
              <span className="text-[10px] text-[#8C6D3F] font-medium shrink-0">· Telegram Bot</span>
            </div>
            <span className="text-[10px] text-[#8C827A] shrink-0 font-medium">сейчас</span>
          </div>

          <p className="text-xs font-semibold text-[#1F1B18] leading-tight line-clamp-1">
            {notification.title}
          </p>
          <p className="text-[11px] text-[#5C5046] mt-0.5 line-clamp-2 leading-relaxed">
            {notification.text}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getBadgeColor()}`}>
              Нажмите, чтобы открыть 🤍
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8C827A] group-hover:text-[#1F1B18] group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Close Button */}
        <button
          id="btn-close-push-banner"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="text-[#8C827A] hover:text-[#1F1B18] p-1 rounded-lg hover:bg-[#FAF6F0] transition-colors shrink-0 cursor-pointer"
          title="Скрыть"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
