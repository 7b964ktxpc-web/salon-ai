import React, { useState } from 'react';
import { 
  Bell, 
  X, 
  Send, 
  Check, 
  Sparkles, 
  Calendar, 
  Clock, 
  Tag, 
  Heart, 
  Users, 
  MessageSquare,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Client, Appointment, AppNotification } from '../types.ts';
import { SalonLogo } from './SalonLogo.tsx';

interface AdminSendPushModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  appointments: Appointment[];
  preselectedClientId?: string;
  preselectedAppointment?: Appointment;
  onSuccess: (notification: AppNotification) => void;
}

type PushTemplateKey = 
  | 'confirmation'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'aftercare'
  | 'repeat_discount'
  | 'reschedule'
  | 'custom';

export const AdminSendPushModal: React.FC<AdminSendPushModalProps> = ({
  isOpen,
  onClose,
  clients,
  appointments,
  preselectedClientId,
  preselectedAppointment,
  onSuccess,
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>(
    preselectedClientId || preselectedAppointment?.clientId || clients[0]?.id || ''
  );
  const [selectedTemplate, setSelectedTemplate] = useState<PushTemplateKey>(
    preselectedAppointment ? 'confirmation' : 'confirmation'
  );
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [discountCode, setDiscountCode] = useState('LASH15');
  const [discountPercent, setDiscountPercent] = useState<number>(15);
  const [sending, setSending] = useState(false);
  const [successSent, setSuccessSent] = useState(false);

  if (!isOpen) return null;

  const currentClient = clients.find(c => c.id === selectedClientId) || clients[0];
  const clientAppointments = appointments.filter(
    a => a.clientId === selectedClientId && a.status === 'confirmed'
  );
  const latestApt = preselectedAppointment || clientAppointments[0];

  const aptDate = latestApt?.date || 'завтра';
  const aptTime = latestApt?.time || '12:00';
  const aptService = latestApt?.serviceName || 'процедуру';

  // Get active title & text based on template
  const getTemplateContent = (template: PushTemplateKey) => {
    const name = currentClient?.name || 'Клиент';
    switch (template) {
      case 'confirmation':
        return {
          type: 'booking_confirmation' as AppNotification['type'],
          title: 'Ваша запись подтверждена 🤍',
          text: `Здравствуйте, ${name}! Ваша запись на ${aptService} на ${aptDate} в ${aptTime} успешно подтверждена мастером.\n\nЖдём вас в студии Lashm.anya: ул. Киевская, 27, офис 48 (4 этаж) 🤍`,
        };
      case 'reminder_24h':
        return {
          type: 'appointment_reminder' as AppNotification['type'],
          title: 'Напоминание о визите завтра ⏰',
          text: `Здравствуйте, ${name}! Напоминаем о вашей записи на ${aptService} ${aptDate} в ${aptTime}.\n\nПожалуйста, подтвердите визит или напишите нам, если потребуется перенести время 🤍`,
        };
      case 'reminder_2h':
        return {
          type: 'appointment_reminder' as AppNotification['type'],
          title: 'Ждём вас через 2 часа! 🌸',
          text: `${name}, мастер Аня уже готовит студию к вашему визиту на ${aptTime}.\n\nАдрес: ул. Киевская, 27, оф. 48. До встречи 🤍`,
        };
      case 'aftercare':
        return {
          type: 'aftercare_memo' as AppNotification['type'],
          title: 'Памятка по уходу за ресницами 🤍',
          text: `${name}, спасибо за ваш визит в Lashm.anya! 🤍\n\nНебольшие правила ухода:\n• Первые 24 часа не мочите ресницы водой и не посещайте сауну\n• Расчёсывайте щёточкой только сухие ресницы от середины к кончикам\n• Не используйте масляные средства в зоне вокруг глаз.`,
        };
      case 'repeat_discount':
        return {
          type: 'discount_offer' as AppNotification['type'],
          title: 'Пора обновить реснички? Скидка 15% 🎁',
          text: `${name}, прошло время с вашего прошлого визита! Дарим вам промокод ${discountCode} на скидку 15% на любое наращивание или ламинирование при записи на этой неделе 🤍`,
        };
      case 'reschedule':
        return {
          type: 'appointment_reminder' as AppNotification['type'],
          title: 'Время вашей записи обновлено 📅',
          text: `Здравствуйте, ${name}! Ваша запись перенесена на ${aptDate} в ${aptTime}. Если возникнут вопросы, мы всегда на связи 🤍`,
        };
      case 'custom':
        return {
          type: 'master_direct_message' as AppNotification['type'],
          title: customTitle || 'Сообщение от мастера Lashm.anya',
          text: customText || `Здравствуйте, ${name}! Пишет мастер Аня 🤍`,
        };
    }
  };

  const currentContent = getTemplateContent(selectedTemplate);

  const handleSendPush = async () => {
    if (!selectedClientId) return;
    setSending(true);

    try {
      const payload = {
        clientId: selectedClientId,
        type: currentContent.type,
        title: currentContent.title,
        text: currentContent.text,
        appointmentId: latestApt?.id,
        appointmentDate: latestApt?.date,
        appointmentTime: latestApt?.time,
        discountCode: selectedTemplate === 'repeat_discount' ? discountCode : undefined,
        discountPercent: selectedTemplate === 'repeat_discount' ? discountPercent : undefined,
        actionLabel: selectedTemplate === 'repeat_discount' ? 'Записаться со скидкой' : 'Подтвердить визит',
      };

      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const createdNotification = await res.json();
        setSuccessSent(true);
        setTimeout(() => {
          onSuccess(createdNotification);
          onClose();
        }, 1200);
      }
    } catch (e) {
      console.error('Error sending push:', e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div 
        id="admin-send-push-modal"
        className="bg-white border border-[#D8CEBF] rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8E0D5] bg-[#FAF6F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#332A24] text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4 text-[#B08D57]" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#1F1B18] leading-none">
                Отправить пуш клиенту
              </h3>
              <p className="text-[11px] text-[#5C5046] mt-0.5 font-medium">
                Telegram-уведомление от студии Lashm.anya
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#8C827A] hover:bg-[#EFE8DF] hover:text-[#1F1B18] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {successSent ? (
            <div className="py-10 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif text-xl font-bold text-[#1F1B18]">Пуш успешно отправлен!</h4>
              <p className="text-xs text-[#5C5046] max-w-xs mx-auto">
                Уведомление доставлено клиентке <span className="font-semibold text-[#1F1B18]">{currentClient?.name}</span> в Telegram и отобразится в её приложении.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Client Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5C5046] block">
                  1. Получатель
                </label>
                <select
                  id="select-push-client"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#DDD3C5] rounded-xl px-3.5 py-2.5 text-xs text-[#1F1B18] font-medium focus:outline-none focus:border-[#332A24]"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.username ? `@${c.username}` : c.phone || 'Telegram'}) · визитов: {c.visitCount}
                    </option>
                  ))}
                </select>
                {latestApt && (
                  <p className="text-[11px] text-[#8C6D3F] font-medium pl-1">
                    Актуальная запись: {latestApt.date} в {latestApt.time} ({latestApt.serviceName})
                  </p>
                )}
              </div>

              {/* 2. Push Template Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5C5046] block">
                  2. Выберите тип пуша
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('confirmation')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedTemplate === 'confirmation'
                        ? 'bg-[#332A24] text-white border-[#332A24] shadow-xs'
                        : 'bg-white border-[#DDD3C5] text-[#1F1B18] hover:border-[#B08D57]'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>✅</span>
                      <span>Подтверждение</span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${selectedTemplate === 'confirmation' ? 'text-[#DDD3C5]' : 'text-[#73675E]'}`}>
                      Запись подтверждена мастером
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('reminder_24h')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedTemplate === 'reminder_24h'
                        ? 'bg-[#332A24] text-white border-[#332A24] shadow-xs'
                        : 'bg-white border-[#DDD3C5] text-[#1F1B18] hover:border-[#B08D57]'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>⏰</span>
                      <span>Напоминание (24ч)</span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${selectedTemplate === 'reminder_24h' ? 'text-[#DDD3C5]' : 'text-[#73675E]'}`}>
                      Напоминание за день до визита
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('reminder_2h')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedTemplate === 'reminder_2h'
                        ? 'bg-[#332A24] text-white border-[#332A24] shadow-xs'
                        : 'bg-white border-[#DDD3C5] text-[#1F1B18] hover:border-[#B08D57]'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🌸</span>
                      <span>Ждём через 2ч</span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${selectedTemplate === 'reminder_2h' ? 'text-[#DDD3C5]' : 'text-[#73675E]'}`}>
                      Экспресс-пуш перед визитом
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('aftercare')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedTemplate === 'aftercare'
                        ? 'bg-[#332A24] text-white border-[#332A24] shadow-xs'
                        : 'bg-white border-[#DDD3C5] text-[#1F1B18] hover:border-[#B08D57]'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🧴</span>
                      <span>Памятка по уходу</span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${selectedTemplate === 'aftercare' ? 'text-[#DDD3C5]' : 'text-[#73675E]'}`}>
                      Инструкция после наращивания
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('repeat_discount')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedTemplate === 'repeat_discount'
                        ? 'bg-[#332A24] text-white border-[#332A24] shadow-xs'
                        : 'bg-white border-[#DDD3C5] text-[#1F1B18] hover:border-[#B08D57]'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>🎁</span>
                      <span>Скидка на повтор</span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${selectedTemplate === 'repeat_discount' ? 'text-[#DDD3C5]' : 'text-[#73675E]'}`}>
                      Спецпредложение 15%
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedTemplate('custom')}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      selectedTemplate === 'custom'
                        ? 'bg-[#332A24] text-white border-[#332A24] shadow-xs'
                        : 'bg-white border-[#DDD3C5] text-[#1F1B18] hover:border-[#B08D57]'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5">
                      <span>💬</span>
                      <span>Своё сообщение</span>
                    </div>
                    <div className={`text-[10px] mt-0.5 ${selectedTemplate === 'custom' ? 'text-[#DDD3C5]' : 'text-[#73675E]'}`}>
                      Индивидуальный текст
                    </div>
                  </button>
                </div>
              </div>

              {/* Custom message fields if template is custom or promo */}
              {selectedTemplate === 'custom' && (
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-[#5C5046]">Заголовок пуша:</label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder="Например: Важное уточнение по записи 🤍"
                      className="w-full mt-1 bg-[#FAF8F5] border border-[#DDD3C5] rounded-xl px-3 py-2 text-xs text-[#1F1B18]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#5C5046]">Текст пуша:</label>
                    <textarea
                      rows={3}
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Напишите сообщение для клиентки..."
                      className="w-full mt-1 bg-[#FAF8F5] border border-[#DDD3C5] rounded-xl p-3 text-xs text-[#1F1B18]"
                    />
                  </div>
                </div>
              )}

              {/* 3. Live Telegram Push Preview */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#5C5046] block">
                  3. Предпросмотр пуша в Telegram
                </label>
                <div className="bg-[#FAF4EB] border border-[#DDD3C5] rounded-2xl p-3.5 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-[#DDD3C5] flex items-center justify-center shrink-0">
                      <SalonLogo size="sm" showBorder={false} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#1F1B18]">Lashm.anya Bot</span>
                        <span className="text-[10px] text-[#8C827A]">сейчас</span>
                      </div>
                      <p className="text-xs font-bold text-[#1F1B18] mt-0.5">
                        {currentContent.title}
                      </p>
                      <p className="text-[11px] text-[#5C5046] mt-1 leading-relaxed whitespace-pre-line">
                        {currentContent.text}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        {!successSent && (
          <div className="p-4 bg-[#FAF6F0] border-t border-[#E8E0D5] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#5C5046] hover:bg-white border border-transparent hover:border-[#DDD3C5] transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              id="btn-send-push-confirm"
              type="button"
              onClick={handleSendPush}
              disabled={sending}
              className="bg-[#332A24] hover:bg-[#1E1814] text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>{sending ? 'Отправка в Telegram...' : 'Отправить пуш клиенту'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
