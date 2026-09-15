import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, MapPin, Star, Check, CheckCircle2, AlertCircle, Phone, Sparkles, ExternalLink, MessageCircle, Bell, Lock, Tag, Home, CalendarPlus, CalendarCheck, Info, Images, ArrowRight, Gift, User, Edit3 } from 'lucide-react';
import { Service, Appointment, Client, BusinessSettings } from '../types.ts';
import { SalonLogo } from './SalonLogo.tsx';
import { PortfolioView } from './PortfolioView.tsx';
import { PORTFOLIO_WORKS } from '../data/portfolioData.ts';

interface MiniAppViewProps {
  currentClient: Client;
  businessSettings: BusinessSettings;
  onRefreshData: () => void;
  onOpenBot: () => void;
  onSwitchToAdmin?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  unreadNotificationsCount?: number;
  initialDiscountCode?: string | null;
}

type MiniAppTab = 'home' | 'portfolio' | 'booking' | 'appointments' | 'services' | 'about';

export const MiniAppView: React.FC<MiniAppViewProps> = ({
  currentClient,
  businessSettings,
  onRefreshData,
  onOpenBot,
  onSwitchToAdmin,
  onOpenNotifications,
  onOpenProfile,
  unreadNotificationsCount = 0,
  initialDiscountCode,
}) => {
  const [currentTab, setCurrentTab] = useState<MiniAppTab>('home');
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<Appointment | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [confirmCancelModal, setConfirmCancelModal] = useState<Appointment | null>(null);
  const [justConfirmedVisit, setJustConfirmedVisit] = useState(false);
  const [activeDiscountCode, setActiveDiscountCode] = useState<string | null>(initialDiscountCode || null);

  // Load services and client appointments
  useEffect(() => {
    loadData();
  }, [currentClient.id]);

  const loadData = async () => {
    try {
      const [srvRes, aptRes] = await Promise.all([
        fetch('/api/services'),
        fetch(`/api/appointments?clientId=${currentClient.id}`),
      ]);
      const srvData = await srvRes.json();
      const aptData = await aptRes.json();
      setServices(srvData);
      setAppointments(aptData);
    } catch (e) {
      console.error('Failed to load Mini App data:', e);
    }
  };

  // When date is selected, load real slots from backend availability check
  useEffect(() => {
    if (selectedDate) {
      loadSlotsForDate(selectedDate);
    }
  }, [selectedDate]);

  const loadSlotsForDate = async (dateStr: string) => {
    setLoadingSlots(true);
    setSelectedSlot('');
    setBookingError(null);
    try {
      const res = await fetch(`/api/availability?date=${dateStr}`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCreateBooking = async () => {
    if (!selectedService || !selectedDate || !selectedSlot) {
      setBookingError('Пожалуйста, выберите дату и время');
      return;
    }

    setIsSubmitting(true);
    setBookingError(null);

    try {
      if (rescheduleTarget) {
        // Reschedule existing
        const res = await fetch(`/api/appointments/${rescheduleTarget.id}/reschedule`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: selectedDate,
            time: selectedSlot,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Ошибка переноса записи');
        }
        setRescheduleTarget(null);
        setBookingSuccess(data);
      } else {
        // Create new
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientId: currentClient.id,
            serviceId: selectedService.id,
            date: selectedDate,
            time: selectedSlot,
            clientName: currentClient.name,
            clientPhone: currentClient.phone,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Ошибка создания записи');
        }
        setBookingSuccess(data);
      }

      await loadData();
      onRefreshData();
    } catch (e: any) {
      setBookingError(e.message || 'Произошла ошибка при бронировании');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAppointment = async (aptId: string) => {
    try {
      const res = await fetch(`/api/appointments/${aptId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Отменено клиентом в Telegram' }),
      });
      if (res.ok) {
        setConfirmCancelModal(null);
        await loadData();
        onRefreshData();
      }
    } catch (e) {
      console.error('Error cancelling appointment:', e);
    }
  };

  // Next 7 days generator
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
    const dayNumber = d.getDate();
    const monthName = d.toLocaleDateString('ru-RU', { month: 'short' });
    return { dateStr, dayName, dayNumber, monthName };
  });

  const upcomingAppointments = appointments.filter(a => a.status === 'confirmed');

  const handleBookFromPortfolio = (serviceId?: string, _noteTitle?: string) => {
    if (serviceId) {
      const match = services.find(s => s.id === serviceId);
      if (match) {
        setSelectedService(match);
      } else if (services.length > 0) {
        setSelectedService(services[0]);
      }
    } else if (services.length > 0) {
      setSelectedService(services[0]);
    }
    setSelectedDate('');
    setSelectedSlot('');
    setBookingSuccess(null);
    setRescheduleTarget(null);
    setCurrentTab('booking');
  };

  return (
    <div className="w-full max-w-[420px] mx-auto py-2 sm:py-6 px-2 sm:px-0">
      {/* Phone Screen Container - Realistic tactile mobile bezel */}
      <div className="bg-[#F6F2EB] border-2 border-[#D4C8B8] rounded-[32px] sm:rounded-[40px] shadow-[0_24px_50px_-12px_rgba(40,30,20,0.18)] ring-1 ring-black/5 overflow-hidden h-[calc(100vh-5.5rem)] sm:h-[780px] max-h-[850px] flex flex-col relative text-[#201B17]">
        
        {/* Subtle top speaker / notch bar for mobile realism */}
        <div className="hidden sm:flex justify-center pt-2 pb-1 bg-white border-b border-[#EAE3D9]">
          <div className="w-14 h-1 bg-[#D8CEC0] rounded-full"></div>
        </div>

        {/* Telegram Mini App Top Bar */}
        <div className="bg-white/95 backdrop-blur-md px-5 py-3 border-b border-[#DDD3C5] flex items-center justify-between shadow-2xs">
          {currentTab !== 'home' ? (
            <button
              id="miniapp-back-btn"
              onClick={() => {
                if (bookingSuccess) {
                  setBookingSuccess(null);
                  setCurrentTab('home');
                } else if (selectedSlot) {
                  setSelectedSlot('');
                } else if (selectedDate) {
                  setSelectedDate('');
                } else if (selectedService) {
                  setSelectedService(null);
                } else {
                  setCurrentTab('home');
                }
              }}
              className="flex items-center gap-1 text-xs text-[#52463C] hover:text-[#201B17] font-medium cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57]"></span>
              <span className="text-[11px] tracking-wide text-[#52463C] font-semibold">
                {businessSettings.name} · {businessSettings.address.split(',')[0]}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            {onOpenNotifications && (
              <button
                id="btn-miniapp-notifications"
                onClick={onOpenNotifications}
                className="relative flex items-center justify-center w-7 h-7 rounded-full bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#3A3028] border border-[#DDD2C4] transition-colors cursor-pointer shadow-2xs"
                title="Уведомления и скидки"
              >
                <Bell className="w-3.5 h-3.5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#B08D57] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            <button
              id="btn-switch-to-bot"
              onClick={onOpenBot}
              className="flex items-center gap-1.5 text-[11px] bg-white hover:bg-[#FAF6F0] text-[#332A24] border border-[#DDD2C4] px-2.5 py-1 rounded-full transition-colors cursor-pointer shadow-2xs font-medium"
            >
              <SalonLogo size="xs" showBorder={false} logoUrl={businessSettings.logoUrl} />
              <span>Чат с AI</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-[#F6F2EB]">

          {/* 1. HOME SCREEN */}
          {currentTab === 'home' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Studio Brand Intro */}
              <div className="text-center pt-1 space-y-1">
                <h1 className="font-serif text-3xl font-medium text-[#1F1B18] tracking-tight">
                  {businessSettings.name}
                </h1>
                <p className="font-serif italic text-base text-[#5C5046]">
                  {businessSettings.tagline || 'Взгляд без лишнего.'}
                </p>
                <div className="w-8 h-[1.5px] bg-[#B08D57] mx-auto my-1.5" />
                <p className="text-[11px] text-[#73675E] max-w-xs mx-auto leading-relaxed">
                  {businessSettings.subtitle || `${businessSettings.city}, ${businessSettings.address}`}
                </p>
              </div>

              {/* Personalized Client Greeting & Profile Card */}
              <div 
                id="client-welcome-profile-card"
                className="p-4 rounded-2xl bg-white border border-[#D8CEBF] shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#EFE8DE] border border-[#D8CEBF] flex items-center justify-center text-[#3D332A] font-serif font-semibold text-sm">
                      {currentClient.name ? currentClient.name.charAt(0).toUpperCase() : 'L'}
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-[#1F1B18] tracking-tight">
                        Здравствуйте, {currentClient.name || 'Гость'}!
                      </h2>
                      <p className="text-xs text-[#73675E]">
                        {currentClient.preferredStyle 
                          ? `Любимый эффект: ${currentClient.preferredStyle}` 
                          : 'Рады видеть вас в студии Lashm.anya'}
                      </p>
                    </div>
                  </div>

                  {onOpenProfile && (
                    <button
                      id="btn-edit-profile-home"
                      onClick={onOpenProfile}
                      className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-[#F2ECE4] text-[#3D332A] border border-[#D5C9BC] text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <User className="w-3.5 h-3.5 text-[#6E6259]" />
                      <span>{currentClient.birthday ? 'Профиль' : 'Указать ДР'}</span>
                    </button>
                  )}
                </div>

                {/* Birthday Gift Status */}
                {currentClient.birthday ? (
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#D8CEBF] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#EFE8DE] flex items-center justify-center text-[#544D48] shrink-0">
                        <Gift className="w-4 h-4 text-[#7A5A35]" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-semibold text-[#3D332A] flex items-center gap-1.5">
                          <span>День рождения: {currentClient.birthday.slice(5).replace('-', '.')}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#7A5A35] text-white rounded-md font-semibold">-20%</span>
                        </div>
                        <p className="text-[11px] text-[#73675E] mt-0.5">
                          Промокод <strong>BIRTHDAY20</strong> на скидку 20%
                        </p>
                      </div>
                    </div>
                    <button
                      id="btn-apply-birthday-discount"
                      onClick={() => {
                        setSelectedService(services[0] || null);
                        setCurrentTab('booking');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#232120] text-[#FAF8F5] text-xs font-medium hover:bg-[#3D332A] transition-all shadow-2xs shrink-0 cursor-pointer"
                    >
                      Применить
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={onOpenProfile}
                    className="p-3 rounded-xl bg-[#FAF8F5] border border-dashed border-[#C9BDB0] flex items-center justify-between gap-2 cursor-pointer hover:bg-[#F2ECE4] transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Gift className="w-4 h-4 text-[#7A5A35] shrink-0" />
                      <span className="text-xs text-[#5C5046]">
                        Укажите дату рождения для <strong>скидки 20%</strong> на праздники
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-[#7A5A35] shrink-0" />
                  </div>
                )}
              </div>

              {/* 
                PROMINENT INTERACTIVE APPOINTMENT REMINDER WIDGET
                Replaces static logo with active appointment reminder icon & status
              */}
              {upcomingAppointments.length > 0 ? (
                <div 
                  id="hero-appointment-reminder-card"
                  className="bg-white border border-[#D8CEBF] rounded-2xl p-4 shadow-xs space-y-3 relative overflow-hidden animate-fadeIn"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Animated Gentle Reminder Icon with Ring */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#F7F1E8] border border-[#DDD2C4] flex items-center justify-center text-[#8C6D3F] shadow-2xs">
                        <Bell className="w-6 h-6 animate-pulse" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#B08D57] rounded-full border-2 border-white flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8C6D3F] uppercase tracking-wider">
                        <span>Напоминание о записи 🤍</span>
                      </div>
                      <h3 className="font-serif text-lg font-medium text-[#1F1B18] mt-0.5 leading-snug">
                        {upcomingAppointments[0].serviceName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-xs text-[#4A413A] mt-1.5">
                        <span className="font-medium bg-[#FAF6F0] px-2 py-0.5 rounded-md border border-[#DDD2C4] flex items-center gap-1 shadow-2xs">
                          <CalendarIcon className="w-3 h-3 text-[#B08D57]" />
                          <span>{upcomingAppointments[0].date}</span>
                        </span>
                        <span className="font-medium bg-[#FAF6F0] px-2 py-0.5 rounded-md border border-[#DDD2C4] flex items-center gap-1 shadow-2xs">
                          <Clock className="w-3 h-3 text-[#B08D57]" />
                          <span>{upcomingAppointments[0].time}</span>
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6E6359] mt-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#B08D57] shrink-0" />
                        <span>ул. Киевская, 27, офис 48 (4 этаж)</span>
                      </p>
                    </div>
                  </div>

                  {/* Confirmation & Reschedule Action Buttons */}
                  <div className="pt-2 border-t border-[#EFE8DF] flex gap-2">
                    {justConfirmedVisit ? (
                      <div className="flex-1 py-2 px-3 rounded-xl bg-[#FAF6F0] text-[#332A24] border border-[#DDD2C4] text-xs font-medium flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#B08D57]" />
                        <span>Визит подтверждён! Ждём вас 🤍</span>
                      </div>
                    ) : (
                      <button
                        id="btn-reminder-confirm"
                        type="button"
                        onClick={() => setJustConfirmedVisit(true)}
                        className="flex-1 bg-[#332A24] hover:bg-[#1E1916] text-white py-2.5 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5 text-[#B08D57]" />
                        <span>Подтверждаю визит</span>
                      </button>
                    )}

                    <button
                      id="btn-reminder-reschedule"
                      type="button"
                      onClick={() => {
                        setRescheduleTarget(upcomingAppointments[0]);
                        setCurrentTab('booking');
                      }}
                      className="bg-white hover:bg-[#FAF6F0] text-[#332A24] border border-[#D5C9BC] py-2 px-3 rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                    >
                      Перенести
                    </button>
                  </div>
                </div>
              ) : (
                /* Smart Reminder Icon when no upcoming booking */
                <div
                  id="hero-appointment-reminder-invite"
                  onClick={() => {
                    setSelectedService(null);
                    setSelectedDate('');
                    setSelectedSlot('');
                    setBookingSuccess(null);
                    setRescheduleTarget(null);
                    setCurrentTab('booking');
                  }}
                  className="bg-white border border-[#D8CEBF] rounded-2xl p-4 shadow-xs space-y-2.5 cursor-pointer hover:border-[#B08D57] transition-all group animate-fadeIn"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#FAF1E6] border border-[#DDD2C4] flex items-center justify-center text-[#8C6D3F] shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8C6D3F] uppercase tracking-wider">
                        <span>Напоминание студии 🤍</span>
                      </div>
                      <h3 className="font-serif text-base font-medium text-[#1F1B18] mt-0.5">
                        Пора обновить реснички?
                      </h3>
                      <p className="text-[11px] text-[#6E6359] mt-0.5 leading-relaxed">
                        Рекомендуемый интервал — 3–4 недели. Забронируйте удобное окно заранее.
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#EFE8DF] flex justify-between items-center text-xs font-medium text-[#332A24]">
                    <span>Выбрать дату и время визита</span>
                    <span className="font-serif text-[#B08D57] font-semibold">Онлайн-запись →</span>
                  </div>
                </div>
              )}

              {/* Returning Client Memory Badge */}
              {currentClient.aiMemory?.preferred_result && (
                <div className="bg-white border border-[#D8CEBF] rounded-2xl p-3.5 flex items-start gap-2.5 shadow-2xs">
                  <Sparkles className="w-4 h-4 text-[#B08D57] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-medium text-[#1F1B18]">Рады видеть вас снова, {currentClient.name} 🤍</p>
                    <p className="text-[#5C5046] mt-0.5 text-[11px]">
                      Помним ваши пожелания: {currentClient.aiMemory.preferred_result} результат ({currentClient.aiMemory.last_service || 'ламинирование'}).
                    </p>
                  </div>
                </div>
              )}

              {/* Gentle In-App AI Chat Invitation Card with Animation */}
              <div 
                id="home-ai-chat-card"
                onClick={onOpenBot}
                className="relative overflow-hidden bg-gradient-to-r from-white via-[#FAF8F5] to-white border border-[#D8CEBF] hover:border-[#8C6D46] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs transition-all duration-300 cursor-pointer group hover:shadow-md"
              >
                {/* Ambient Shimmer sweep */}
                <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#DFCFC0]/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />

                <div className="flex items-center gap-3 relative z-10">
                  <div className="relative">
                    <SalonLogo size="md" />
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B08D57] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8C6D46]"></span>
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-serif text-base font-semibold text-[#1F1B18] group-hover:text-[#8C6D46] transition-colors">
                        Спросить мастера
                      </h4>
                      <Sparkles className="w-3.5 h-3.5 text-[#8C6D46] group-hover:rotate-45 transition-transform duration-300" />
                    </div>
                    <p className="text-[11px] text-[#6E6359]">
                      Подбор эффекта, свободные окна или вопрос по уходу
                    </p>
                  </div>
                </div>

                <div className="relative z-10 text-xs text-[#232120] font-medium flex items-center gap-1.5 bg-[#F5EFEB] group-hover:bg-[#232120] group-hover:text-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#D9CEBF] shadow-2xs transition-all duration-300">
                  <span>Спросить</span>
                  <MessageCircle className="w-3.5 h-3.5 text-[#8C6D46] group-hover:text-[#DFCFC0]" />
                </div>
              </div>

              {/* Notifications & Special Offers Banner */}
              {onOpenNotifications && (
                <div
                  id="home-notifications-card"
                  onClick={onOpenNotifications}
                  className="bg-white border border-[#D8CEBF] rounded-2xl p-3.5 flex items-center justify-between shadow-2xs hover:border-[#B08D57] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#FAF4EB] border border-[#DDD2C4] flex items-center justify-center text-[#B08D57]">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[#1F1B18] flex items-center gap-1.5">
                        <span>Напоминания и скидки</span>
                        {unreadNotificationsCount > 0 && (
                          <span className="text-[10px] bg-[#FAF0E6] text-[#8C6D3F] px-1.5 py-0.2 rounded-full border border-[#E8D6C0] font-bold">
                            +{unreadNotificationsCount}
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-[#6E6359]">
                        Персональные промокоды и статус записи
                      </p>
                    </div>
                  </div>
                  <Tag className="w-4 h-4 text-[#B08D57]" />
                </div>
              )}

              {/* Studio Highlights & Trust Badges */}
              <div className="bg-white border border-[#D8CEBF] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-medium text-[#1F1B18]">Преимущества студии</span>
                  <span className="text-[10px] text-[#8C6D3F] font-semibold uppercase tracking-wider">Lashm.anya</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#4A413A]">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#FAF7F2] border border-[#E5DACD]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57]"></span>
                    <span className="text-[11px] font-medium">Носка от 4-6 недель</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#FAF7F2] border border-[#E5DACD]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57]"></span>
                    <span className="text-[11px] font-medium">100% стерильность</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#FAF7F2] border border-[#E5DACD]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57]"></span>
                    <span className="text-[11px] font-medium">Анатомическая кушетка</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#FAF7F2] border border-[#E5DACD]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57]"></span>
                    <span className="text-[11px] font-medium">2ГИС 5.0 ★ рейтинг</span>
                  </div>
                </div>
              </div>

              {/* Featured Portfolio Carousel / Showcase Card */}
              <div className="bg-white border border-[#D8CEBF] rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Images className="w-4 h-4 text-[#B08D57]" />
                    <span className="text-xs font-serif font-medium text-[#1F1B18]">Портфолио работ</span>
                  </div>
                  <button
                    id="btn-home-view-all-portfolio"
                    onClick={() => setCurrentTab('portfolio')}
                    className="text-[11px] text-[#8C6D3F] hover:text-[#332A24] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Все работы ({PORTFOLIO_WORKS.length})</span>
                    <ArrowRight className="w-3 h-3 text-[#B08D57]" />
                  </button>
                </div>

                {/* Horizontal Scroll of Studio Works */}
                <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
                  {PORTFOLIO_WORKS.slice(0, 4).map((work) => (
                    <div
                      key={work.id}
                      onClick={() => setCurrentTab('portfolio')}
                      className="shrink-0 w-36 bg-[#FAF7F2] border border-[#E0D5C7] rounded-xl overflow-hidden cursor-pointer group hover:border-[#B08D57] transition-all shadow-2xs"
                    >
                      <div className="aspect-4/3 relative overflow-hidden bg-[#232120]">
                        <img
                          src={work.imageUrl}
                          alt={work.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] px-1.5 py-0.5 rounded backdrop-blur-xs font-medium">
                          {work.curl || work.categoryLabel}
                        </span>
                      </div>
                      <div className="p-2">
                        <p className="font-serif text-[11px] font-medium text-[#1F1B18] line-clamp-1">
                          {work.title}
                        </p>
                        <p className="text-[9px] text-[#6E6359] mt-0.5">
                          {work.volume || work.categoryLabel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtle Studio Footer Note */}
              <div className="pt-2 text-center">
                <p className="text-[11px] text-[#73675E]">
                  ул. Киевская, 27, офис 48 · Предварительная запись
                </p>
              </div>
            </div>
          )}

          {/* 2. PORTFOLIO TAB */}
          {currentTab === 'portfolio' && (
            <PortfolioView
              onBookWork={handleBookFromPortfolio}
              onOpenBot={onOpenBot}
            />
          )}

          {/* 3. BOOKING FLOW */}
          {currentTab === 'booking' && (
            <div className="space-y-4 animate-fadeIn">
              {bookingSuccess ? (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 rounded-full bg-white border border-[#DDD3C5] text-[#1F1B18] flex items-center justify-center mx-auto shadow-xs">
                    <Check className="w-6 h-6 text-[#B08D57]" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif text-2xl font-medium text-[#1F1B18]">Готово 🤍</h3>
                    <p className="text-sm font-semibold text-[#1F1B18]">Вы записаны на {bookingSuccess.time}</p>
                    <p className="text-xs text-[#5C5046]">Дата: {bookingSuccess.date}</p>
                    <p className="text-xs text-[#5C5046]">Процедура: {bookingSuccess.serviceName}</p>
                  </div>
                  <div className="p-4 bg-white border border-[#D8CEBF] rounded-2xl text-left text-xs text-[#5C5046] space-y-1.5 mt-4 shadow-xs">
                    <p className="font-semibold text-[#1F1B18]">Адрес студии:</p>
                    <p>ул. Киевская, 27, офис 48 (4 этаж)</p>
                    <p className="text-[11px] text-[#73675E]">Напоминание придёт вам в Telegram за 24 часа 🤍</p>
                  </div>
                  <div className="pt-4 space-y-2">
                    <button
                      id="btn-goto-appointments"
                      onClick={() => {
                        setBookingSuccess(null);
                        setCurrentTab('appointments');
                      }}
                      className="w-full bg-[#332A24] text-white py-3 rounded-xl text-sm font-semibold cursor-pointer hover:bg-[#1E1814] transition-colors shadow-xs"
                    >
                      Посмотреть мои записи
                    </button>
                    <button
                      id="btn-goto-home"
                      onClick={() => {
                        setBookingSuccess(null);
                        setCurrentTab('home');
                      }}
                      className="w-full text-xs text-[#5C5046] py-2 hover:text-[#1F1B18] cursor-pointer font-medium"
                    >
                      На главную
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <h2 className="font-serif text-2xl text-[#1F1B18] font-medium">
                      {rescheduleTarget ? 'Перенос записи' : 'Онлайн-запись'}
                    </h2>
                    <p className="text-xs text-[#5C5046]">
                      {rescheduleTarget ? `Текущая: ${rescheduleTarget.date} в ${rescheduleTarget.time}` : 'Выберите услугу, удобный день и время'}
                    </p>
                  </div>

                  {/* Step 1: Select Service */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-[#5C5046]">
                      1. Процедура
                    </label>
                    <div className="space-y-2">
                      {services.map((s) => {
                        const isSelected = selectedService?.id === s.id;
                        return (
                          <div
                            key={s.id}
                            id={`service-select-${s.id}`}
                            onClick={() => setSelectedService(s)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-white border-[#332A24] shadow-xs ring-2 ring-[#332A24]'
                                : 'bg-white border-[#DDD3C5] hover:border-[#B08D57] shadow-2xs'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-semibold text-[#1F1B18]">{s.name}</h4>
                              <span className="text-xs font-serif font-semibold text-[#332A24]">
                                {s.price !== null ? `${s.price} ₽` : 'Стоимость уточняется при записи 🤍'}
                              </span>
                            </div>
                            <p className="text-xs text-[#5C5046] mt-1 leading-relaxed">
                              {s.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 2: Select Date */}
                  {selectedService && (
                    <div className="space-y-2 pt-2 animate-fadeIn">
                      <label className="text-xs font-semibold uppercase tracking-wider text-[#5C5046]">
                        2. Дата визита
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {availableDates.map((item) => {
                          const isSelected = selectedDate === item.dateStr;
                          return (
                            <button
                              key={item.dateStr}
                              id={`date-btn-${item.dateStr}`}
                              type="button"
                              onClick={() => setSelectedDate(item.dateStr)}
                              className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-[#332A24] text-white border-[#332A24] shadow-xs'
                                  : 'bg-white border-[#DDD3C5] text-[#1F1B18] hover:border-[#B08D57] shadow-2xs'
                              }`}
                            >
                              <div className="text-[10px] uppercase tracking-wider opacity-75">{item.dayName}</div>
                              <div className="text-base font-serif font-bold">{item.dayNumber}</div>
                              <div className="text-[10px] opacity-75">{item.monthName}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Select Time Slot (Server-Checked Real Availability) */}
                  {selectedDate && (
                    <div className="space-y-2 pt-2 animate-fadeIn">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-[#5C5046]">
                          3. Свободные окна ({selectedDate})
                        </label>
                        {loadingSlots && (
                          <span className="text-[11px] text-[#73675E]">Проверяем календарь...</span>
                        )}
                      </div>

                      {loadingSlots ? (
                        <div className="py-6 text-center text-xs text-[#73675E]">Загрузка расписания мастера...</div>
                      ) : availableSlots.length === 0 ? (
                        <div className="p-3 bg-white border border-[#DDD3C5] rounded-xl text-center text-xs text-[#73675E] shadow-2xs">
                          На эту дату свободных окон нет 🤍 Пожалуйста, выберите другой день.
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((slot) => {
                            const isSelected = selectedSlot === slot;
                            return (
                              <button
                                key={slot}
                                id={`slot-btn-${slot.replace(':', '-')}`}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#332A24] text-white border-[#332A24] shadow-xs'
                                    : 'bg-white border-[#DDD3C5] text-[#1F1B18] hover:border-[#B08D57] shadow-2xs'
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error Notification */}
                  {bookingError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  {selectedSlot && (
                    <div className="pt-4 animate-fadeIn">
                      <button
                        id="btn-confirm-booking-miniapp"
                        onClick={handleCreateBooking}
                        disabled={isSubmitting}
                        className="w-full bg-[#332A24] hover:bg-[#1E1814] text-white py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isSubmitting ? 'Проверка и запись...' : `Подтвердить запись на ${selectedSlot}`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 3. MY APPOINTMENTS */}
          {currentTab === 'appointments' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="font-serif text-2xl text-[#1F1B18] font-medium">Мои записи</h2>
                <p className="text-xs text-[#5C5046]">Управление актуальными записями в студию</p>
              </div>

              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-12 space-y-3 bg-white border border-[#D8CEBF] rounded-2xl p-6 shadow-xs">
                  <CalendarIcon className="w-8 h-8 mx-auto text-[#B08D57]" />
                  <p className="text-sm font-semibold text-[#1F1B18]">У вас пока нет предстоящих записей</p>
                  <p className="text-xs text-[#5C5046]">
                    Будем рады подобрать для вас идеальное время 🤍
                  </p>
                  <button
                    id="btn-empty-book"
                    onClick={() => {
                      setSelectedService(null);
                      setSelectedDate('');
                      setSelectedSlot('');
                      setRescheduleTarget(null);
                      setCurrentTab('booking');
                    }}
                    className="text-xs bg-[#332A24] text-white px-4 py-2.5 rounded-xl hover:bg-[#1E1814] transition-colors cursor-pointer mt-2 font-semibold shadow-xs"
                  >
                    Записаться
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-white border border-[#D8CEBF] rounded-2xl p-4 space-y-3 shadow-xs"
                    >
                      <div className="border-b border-[#EFE8DF] pb-2.5 flex justify-between items-start">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-[#8C6D3F] font-semibold block">
                            Предстоящая запись
                          </span>
                          <h4 className="font-serif text-lg text-[#1F1B18] font-medium mt-0.5">
                            {apt.date} · {apt.time}
                          </h4>
                        </div>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF4EB] text-[#8C6D3F] border border-[#E8DACB] font-semibold">
                          Подтверждена
                        </span>
                      </div>

                      <div className="text-xs text-[#5C5046] space-y-1">
                        <p className="font-semibold text-[#1F1B18]">{apt.serviceName}</p>
                        <p>Lashm.anya · ул. Киевская, 27, офис 48</p>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          id={`btn-reschedule-${apt.id}`}
                          onClick={() => {
                            setRescheduleTarget(apt);
                            const foundSrv = services.find(s => s.id === apt.serviceId || s.name === apt.serviceName) || services[0];
                            setSelectedService(foundSrv);
                            setSelectedDate('');
                            setSelectedSlot('');
                            setCurrentTab('booking');
                          }}
                          className="flex-1 bg-white hover:bg-[#FAF6F0] text-[#332A24] border border-[#D5C9BC] py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                        >
                          Перенести
                        </button>
                        <button
                          id={`btn-cancel-${apt.id}`}
                          onClick={() => setConfirmCancelModal(apt)}
                          className="flex-1 bg-white hover:bg-red-50 text-red-700 border border-red-200 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                        >
                          Отменить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. SERVICES TAB */}
          {currentTab === 'services' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="font-serif text-2xl text-[#1F1B18] font-medium">Услуги</h2>
                <p className="text-xs text-[#5C5046]">Подтверждённые процедуры студии Lashm.anya</p>
              </div>

              <div className="space-y-3">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white border border-[#D8CEBF] rounded-2xl p-4 space-y-2 shadow-xs hover:border-[#B08D57] transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="font-serif text-lg font-medium text-[#1F1B18]">{s.name}</h3>
                      <span className="text-xs font-serif font-semibold text-[#332A24] pt-1">
                        {s.price !== null ? `${s.price} ₽` : 'Стоимость уточняется при записи 🤍'}
                      </span>
                    </div>
                    <p className="text-xs text-[#5C5046] leading-relaxed">
                      {s.description}
                    </p>
                    <div className="pt-2 flex justify-between items-center text-xs text-[#73675E] border-t border-[#F2ECE4]">
                      <span>Длительность: ~{s.durationMinutes} мин</span>
                      <button
                        id={`btn-book-service-${s.id}`}
                        onClick={() => {
                          setSelectedService(s);
                          setSelectedDate('');
                          setSelectedSlot('');
                          setCurrentTab('booking');
                        }}
                        className="text-xs text-[#B08D57] font-semibold hover:underline cursor-pointer flex items-center gap-1"
                      >
                        <span>Выбрать дату</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. ABOUT STUDIO TAB */}
          {currentTab === 'about' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <h2 className="font-serif text-2xl text-[#1F1B18] font-medium">О студии</h2>
                <p className="text-xs text-[#5C5046]">{businessSettings.name} — {businessSettings.subtitle || `${businessSettings.city}, ${businessSettings.address}`}</p>
              </div>

              <div className="bg-white border border-[#D8CEBF] rounded-2xl p-5 space-y-4 shadow-xs text-xs text-[#5C5046]">
                <div className="space-y-1">
                  <span className="font-serif text-lg text-[#1F1B18] font-medium block">
                    {businessSettings.name}
                  </span>
                  <p className="italic font-serif text-sm text-[#332A24]">«{businessSettings.tagline || 'Взгляд без лишнего.'}»</p>
                </div>

                <div className="border-t border-[#EFE8DF] pt-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-[#B08D57] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1F1B18]">Адрес:</p>
                      <p>{businessSettings.city}, {businessSettings.address}</p>
                      {businessSettings.office && <p className="text-[#73675E]">{businessSettings.office}{businessSettings.floor ? `, ${businessSettings.floor}` : ''}</p>}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <Clock className="w-4 h-4 text-[#B08D57] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1F1B18]">Режим работы:</p>
                      <p>{businessSettings.workingHoursDescription || 'По предварительной записи 🤍'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <Star className="w-4 h-4 text-[#B08D57] fill-[#B08D57] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1F1B18]">Рейтинг в картах:</p>
                      <p className="font-medium text-[#1F1B18]">{businessSettings.rating || '5.0'} ★ ({businessSettings.reviewCount || 14} отзывов)</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    id="link-2gis-miniapp"
                    href={businessSettings.twoGisUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#1F1B18] border border-[#DDD2C4] py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 font-semibold transition-colors shadow-2xs"
                  >
                    <span>Смотреть отзывы в 2ГИС ↗</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#B08D57]" />
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Cancellation Confirmation Modal */}
        {confirmCancelModal && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-[#D8CEBF] rounded-2xl p-5 max-w-xs w-full space-y-4 shadow-xl text-center">
              <h4 className="font-serif text-lg font-medium text-[#1F1B18]">Отменить запись?</h4>
              <p className="text-xs text-[#5C5046]">
                Отменить запись на {confirmCancelModal.date} в {confirmCancelModal.time} ({confirmCancelModal.serviceName})?
              </p>
              <div className="flex gap-2">
                <button
                  id="btn-confirm-cancel-yes"
                  onClick={() => handleCancelAppointment(confirmCancelModal.id)}
                  className="flex-1 bg-red-700 text-white py-2 rounded-xl text-xs font-semibold hover:bg-red-800 transition-colors cursor-pointer shadow-xs"
                >
                  Отменить
                </button>
                <button
                  id="btn-confirm-cancel-no"
                  onClick={() => setConfirmCancelModal(null)}
                  className="flex-1 bg-white border border-[#D5C9BC] text-[#1F1B18] py-2 rounded-xl text-xs font-medium hover:bg-[#FAF6F0] transition-colors cursor-pointer shadow-2xs"
                >
                  Оставить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Studio Bottom Navigation Bar */}
        <nav
          id="miniapp-bottom-bar"
          aria-label="Нижняя навигация"
          className="bg-white/95 backdrop-blur-md border-t border-[#DDD3C5] px-2 py-2 shrink-0 z-30 shadow-[0_-6px_20px_rgba(35,25,18,0.06)]"
        >
          <div className="grid grid-cols-5 items-center max-w-sm mx-auto">
            {/* 1. Главная */}
            <button
              id="bottom-nav-home"
              type="button"
              onClick={() => {
                if (bookingSuccess) setBookingSuccess(null);
                setCurrentTab('home');
              }}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
                currentTab === 'home'
                  ? 'text-[#1F1B18] font-semibold'
                  : 'text-[#73675E] hover:text-[#1F1B18]'
              }`}
            >
              <div className={`relative p-1 rounded-lg transition-colors ${currentTab === 'home' ? 'bg-[#332A24] text-white shadow-2xs' : ''}`}>
                <Home className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap tracking-tight">Главная</span>
            </button>

            {/* 2. Портфолио */}
            <button
              id="bottom-nav-portfolio"
              type="button"
              onClick={() => {
                if (bookingSuccess) setBookingSuccess(null);
                setCurrentTab('portfolio');
              }}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
                currentTab === 'portfolio'
                  ? 'text-[#1F1B18] font-semibold'
                  : 'text-[#73675E] hover:text-[#1F1B18]'
              }`}
            >
              <div className={`relative p-1 rounded-lg transition-colors ${currentTab === 'portfolio' ? 'bg-[#332A24] text-white shadow-2xs' : ''}`}>
                <Images className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap tracking-tight">Работы</span>
            </button>

            {/* 3. Запись (Акцентная центральная кнопка) */}
            <button
              id="bottom-nav-booking"
              type="button"
              onClick={() => {
                setSelectedService(null);
                setSelectedDate('');
                setSelectedSlot('');
                setBookingSuccess(null);
                setRescheduleTarget(null);
                setCurrentTab('booking');
              }}
              className="flex flex-col items-center justify-center py-0.5 px-1 rounded-xl transition-all cursor-pointer group"
            >
              <div className={`w-10 h-10 -mt-2 rounded-2xl flex items-center justify-center shadow-xs transition-transform group-hover:scale-105 ${
                currentTab === 'booking'
                  ? 'bg-[#332A24] text-white ring-2 ring-[#B08D57]'
                  : 'bg-[#B08D57] text-white hover:bg-[#9B7A48]'
              }`}>
                <CalendarPlus className="w-5 h-5" />
              </div>
              <span className={`text-[10px] mt-0.5 whitespace-nowrap tracking-tight font-semibold ${
                currentTab === 'booking' ? 'text-[#1F1B18]' : 'text-[#73675E]'
              }`}>
                Запись
              </span>
            </button>

            {/* 4. Услуги */}
            <button
              id="bottom-nav-services"
              type="button"
              onClick={() => {
                if (bookingSuccess) setBookingSuccess(null);
                setCurrentTab('services');
              }}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
                currentTab === 'services'
                  ? 'text-[#1F1B18] font-semibold'
                  : 'text-[#73675E] hover:text-[#1F1B18]'
              }`}
            >
              <div className={`relative p-1 rounded-lg transition-colors ${currentTab === 'services' ? 'bg-[#332A24] text-white shadow-2xs' : ''}`}>
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap tracking-tight">Услуги</span>
            </button>

            {/* 5. Мои записи */}
            <button
              id="bottom-nav-appointments"
              type="button"
              onClick={() => {
                if (bookingSuccess) setBookingSuccess(null);
                setCurrentTab('appointments');
              }}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer relative ${
                currentTab === 'appointments'
                  ? 'text-[#1F1B18] font-semibold'
                  : 'text-[#73675E] hover:text-[#1F1B18]'
              }`}
            >
              <div className={`relative p-1 rounded-lg transition-colors ${currentTab === 'appointments' ? 'bg-[#332A24] text-white shadow-2xs' : ''}`}>
                <CalendarCheck className="w-5 h-5" />
                {upcomingAppointments.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B08D57] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                    {upcomingAppointments.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap tracking-tight">Записи</span>
            </button>
          </div>
        </nav>

        {/* Discreet Master Admin Entry Point */}
        {onSwitchToAdmin && (
          <div className="py-2 bg-[#FAF4EB] border-t border-[#DDD2C4] text-center">
            <button
              id="btn-master-login-discreet"
              onClick={onSwitchToAdmin}
              className="inline-flex items-center gap-1.5 text-[11px] text-[#73675E] hover:text-[#1F1B18] transition-colors cursor-pointer font-medium"
            >
              <Lock className="w-3 h-3 text-[#B08D57]" />
              <span>Кабинет мастера (вход по Telegram ID)</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
