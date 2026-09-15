import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Calendar, 
  Clock, 
  Tag, 
  Sparkles, 
  Check, 
  Copy, 
  ShieldCheck, 
  ChevronRight,
  Heart,
  ExternalLink
} from 'lucide-react';
import { AppNotification } from '../types.ts';
import { SalonLogo } from './SalonLogo.tsx';

interface ClientNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  clientName: string;
  onConfirmAppointment: (notificationId: string) => void;
  onOpenBookingWithDiscount?: (discountCode: string) => void;
  onOpenChat: () => void;
}

export const ClientNotificationsModal: React.FC<ClientNotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  clientName,
  onConfirmAppointment,
  onOpenBookingWithDiscount,
  onOpenChat,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [confirmedIds, setConfirmedIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleConfirm = (id: string) => {
    setConfirmedIds(prev => ({ ...prev, [id]: true }));
    onConfirmAppointment(id);
  };

  const reminders = notifications.filter(n => 
    n.type === 'appointment_reminder' || n.type === 'repeat_visit_reminder' || n.type === 'booking_confirmation'
  );
  const discounts = notifications.filter(n => n.type === 'discount_offer');
  const otherNotifs = notifications.filter(n => 
    n.type !== 'appointment_reminder' && n.type !== 'repeat_visit_reminder' && n.type !== 'booking_confirmation' && n.type !== 'discount_offer'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#232120]/40 backdrop-blur-xs animate-fadeIn">
      <div 
        id="client-notifications-modal"
        className="bg-[#FAF8F5] border border-[#E8E0D5] rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8E0D5] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FAF6F0] border border-[#EADFD5] flex items-center justify-center text-[#B08D57]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-[#232120] leading-none">
                Уведомления
              </h3>
              <p className="text-[11px] text-[#7A6E66] mt-0.5">
                Напоминания о записи и персональные скидки
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C827A] hover:bg-[#F2ECE4] hover:text-[#232120] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {notifications.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-[#F2ECE4] mx-auto flex items-center justify-center text-[#8C827A]">
                <Bell className="w-6 h-6 opacity-60" />
              </div>
              <p className="font-serif text-base text-[#483F38]">У вас пока нет новых уведомлений</p>
              <p className="text-xs text-[#8C827A] max-w-xs mx-auto">
                Здесь будут появляться напоминания о предстоящих записях, персональные скидки и памятки по уходу 🤍
              </p>
            </div>
          ) : (
            <>
              {/* Reminders Section */}
              {reminders.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#483F38] uppercase tracking-wider px-1">
                    <Clock className="w-3.5 h-3.5 text-[#B08D57]" />
                    <span>Напоминания о записи</span>
                  </div>

                  {reminders.map((notif) => {
                    const isConfirmed = confirmedIds[notif.id] || notif.status === 'confirmed';
                    return (
                      <div
                        key={notif.id}
                        className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF6F0] text-[#7A6E66] border border-[#EADFD5]">
                              {notif.type === 'appointment_reminder' ? '⏰ Напоминание' : notif.type === 'repeat_visit_reminder' ? '🌸 Повторный визит' : '🤍 Подтверждение'}
                            </span>
                            <h4 className="font-serif text-base font-medium text-[#232120] pt-1">
                              {notif.title}
                            </h4>
                          </div>
                          {isConfirmed ? (
                            <span className="flex items-center gap-1 text-[11px] text-[#483F38] bg-[#FAF6F0] px-2 py-0.5 rounded-full border border-[#DFCFC0] font-medium">
                              <Check className="w-3 h-3 text-[#B08D57]" />
                              <span>Подтверждено</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#A0958C]">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#524942] leading-relaxed whitespace-pre-line">
                          {notif.text}
                        </p>

                        {/* Interactive Buttons */}
                        {notif.type === 'appointment_reminder' && !isConfirmed && (
                          <div className="pt-1 flex items-center gap-2">
                            <button
                              onClick={() => handleConfirm(notif.id)}
                              className="flex-1 bg-[#483F38] hover:bg-[#232120] text-white text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Подтверждаю визит</span>
                            </button>
                            <button
                              onClick={() => {
                                onClose();
                                onOpenChat();
                              }}
                              className="bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#483F38] border border-[#E2D6C8] text-xs font-medium py-2 px-3 rounded-xl transition-colors cursor-pointer"
                            >
                              Перенести
                            </button>
                          </div>
                        )}

                        {notif.type === 'repeat_visit_reminder' && (
                          <div className="pt-1">
                            <button
                              onClick={() => {
                                onClose();
                                onOpenBookingWithDiscount?.('');
                              }}
                              className="w-full bg-[#483F38] hover:bg-[#232120] text-white text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Записаться на обновление</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Discounts & Offers Section */}
              {discounts.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#483F38] uppercase tracking-wider px-1">
                    <Tag className="w-3.5 h-3.5 text-[#B08D57]" />
                    <span>Скидки и персональные предложения</span>
                  </div>

                  {discounts.map((notif) => (
                    <div
                      key={notif.id}
                      className="bg-gradient-to-br from-[#FFFDF9] to-[#FAF5EE] border border-[#EADFD5] rounded-2xl p-4 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF0E6] text-[#8C6D3F] border border-[#E8D6C0]">
                            🎁 Персональная скидка {notif.discountPercent ? `-${notif.discountPercent}%` : ''}
                          </span>
                          <h4 className="font-serif text-base font-medium text-[#232120] pt-1">
                            {notif.title}
                          </h4>
                        </div>
                      </div>

                      <p className="text-xs text-[#524942] leading-relaxed">
                        {notif.text}
                      </p>

                      {notif.discountCode && (
                        <div className="bg-white border border-[#E2D8CC] rounded-xl p-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#8C827A] uppercase">Промокод:</span>
                            <span className="font-mono text-sm font-semibold tracking-wider text-[#3D342E]">
                              {notif.discountCode}
                            </span>
                          </div>
                          <button
                            onClick={() => handleCopy(notif.discountCode!)}
                            className="flex items-center gap-1 text-xs text-[#483F38] hover:text-[#232120] px-2 py-1 bg-[#FAF6F0] rounded-lg border border-[#E5DACD] transition-colors cursor-pointer"
                          >
                            {copiedCode === notif.discountCode ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-emerald-700 font-medium">Скопировано</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Скопировать</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      <div className="pt-1">
                        <button
                          onClick={() => {
                            onClose();
                            onOpenBookingWithDiscount?.(notif.discountCode || '');
                          }}
                          className="w-full bg-[#483F38] hover:bg-[#232120] text-white text-xs font-medium py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#E5DACD]" />
                          <span>Записаться с этой скидкой</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Aftercare & Info Section */}
              {otherNotifs.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#483F38] uppercase tracking-wider px-1">
                    <Heart className="w-3.5 h-3.5 text-[#B08D57]" />
                    <span>Памятка по уходу и рекомендации</span>
                  </div>

                  {otherNotifs.map((notif) => (
                    <div
                      key={notif.id}
                      className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-2xs space-y-2"
                    >
                      <h4 className="font-serif text-base font-medium text-[#232120]">
                        {notif.title}
                      </h4>
                      <p className="text-xs text-[#524942] leading-relaxed whitespace-pre-line">
                        {notif.text}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E8E0D5] bg-[#FAF6F0] flex items-center justify-between text-xs text-[#7A6E66]">
          <div className="flex items-center gap-1.5">
            <SalonLogo size="xs" showBorder={false} />
            <span>Lashm.anya AI Bot</span>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenChat();
            }}
            className="text-[#483F38] hover:text-[#232120] font-medium underline underline-offset-2 cursor-pointer"
          >
            Написать в чат 🤍
          </button>
        </div>
      </div>
    </div>
  );
};
