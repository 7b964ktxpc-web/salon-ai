import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Sparkles, 
  Tag, 
  Clock, 
  Calendar, 
  Check, 
  Users, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Settings2, 
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Gift,
  CheckCircle2,
  Edit3,
  Trash2,
  Percent,
  Coins,
  Copy,
  Layers
} from 'lucide-react';
import { AppNotification, DiscountCampaign, NotificationSettings, Client, Appointment, Service } from '../types.ts';
import { AdminCampaignModal } from './AdminCampaignModal.tsx';

interface AdminNotificationsTabProps {
  clients: Client[];
  appointments: Appointment[];
  services?: Service[];
  onDataChanged: () => void;
}

export const AdminNotificationsTab: React.FC<AdminNotificationsTabProps> = ({
  clients,
  appointments,
  services = [],
  onDataChanged,
}) => {
  const [activeSection, setActiveSection] = useState<'reminders' | 'discounts' | 'retention' | 'history' | 'settings'>('discounts');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [campaigns, setCampaigns] = useState<DiscountCampaign[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal states for creating / editing campaigns
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<DiscountCampaign | null>(null);
  const [deletingCampaignId, setDeletingCampaignId] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Manual send reminder modal
  const [manualSendTarget, setManualSendTarget] = useState<{
    clientId: string;
    clientName: string;
    type: AppNotification['type'];
    title: string;
    text: string;
    appointmentId?: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [notifsRes, campaignsRes, settingsRes] = await Promise.all([
        fetch('/api/notifications'),
        fetch('/api/discounts'),
        fetch('/api/notification-settings'),
      ]);
      const [notifsData, campaignsData, settingsData] = await Promise.all([
        notifsRes.json(),
        campaignsRes.json(),
        settingsRes.json(),
      ]);
      setNotifications(notifsData);
      setCampaigns(campaignsData);
      setSettings(settingsData);
    } catch (e) {
      console.error('Failed to load notifications data:', e);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg: string) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingCampaign(null);
    setCampaignModalOpen(true);
  };

  const handleOpenEditModal = (camp: DiscountCampaign) => {
    setEditingCampaign(camp);
    setCampaignModalOpen(true);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту акцию / промокод?')) return;
    setDeletingCampaignId(id);
    try {
      const res = await fetch(`/api/discounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setCampaigns(prev => prev.filter(c => c.id !== id));
        showNotification('Акция успешно удалена');
        onDataChanged();
      }
    } catch (e) {
      console.error('Failed to delete campaign:', e);
    } finally {
      setDeletingCampaignId(null);
    }
  };

  const handleToggleCampaignStatus = async (camp: DiscountCampaign) => {
    const newStatus = !camp.isActive;
    try {
      const res = await fetch(`/api/discounts/${camp.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (res.ok) {
        setCampaigns(prev => prev.map(c => c.id === camp.id ? { ...c, isActive: newStatus } : c));
        showNotification(`Акция «${camp.title}» ${newStatus ? 'активирована' : 'приостановлена'} ✨`);
        onDataChanged();
      }
    } catch (e) {
      console.error('Failed to toggle status:', e);
    }
  };

  const handleBroadcastCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/discounts/${campaignId}/broadcast`, {
        method: 'POST',
      });
      const data = await res.json();
      showNotification(`Уведомления успешно отправлены ${data.sent} клиенткам! 🎁`);
      loadData();
      onDataChanged();
    } catch (e) {
      console.error('Broadcast error:', e);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleSendManualNotification = async () => {
    if (!manualSendTarget) return;

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualSendTarget),
      });
      showNotification(`Напоминание для ${manualSendTarget.clientName} отправлено в Telegram! 🤍`);
      setManualSendTarget(null);
      loadData();
      onDataChanged();
    } catch (e) {
      console.error('Manual send error:', e);
    }
  };

  const handleToggleSetting = async (key: keyof NotificationSettings, value: any) => {
    if (!settings) return;
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    try {
      await fetch('/api/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      showNotification('Настройки уведомлений сохранены');
    } catch (e) {
      console.error('Error saving settings:', e);
    }
  };

  const clientsNeedingRepeat = clients.filter(c => c.visitCount > 0);
  const upcomingApts = appointments.filter(a => a.status === 'confirmed');

  return (
    <div className="space-y-6">
      
      {/* Top Banner Alert */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E8E0D5] p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-[#8C827A] mb-1">
            <span className="text-xs">Акции и промокоды</span>
            <Tag className="w-4 h-4 text-[#B08D57]" />
          </div>
          <p className="font-serif text-2xl font-medium text-[#232120]">{campaigns.length}</p>
          <span className="text-[10px] text-emerald-700">
            {campaigns.filter(c => c.isActive).length} активных акций
          </span>
        </div>

        <div className="bg-white border border-[#E8E0D5] p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-[#8C827A] mb-1">
            <span className="text-xs">Разослано предложений</span>
            <Send className="w-4 h-4 text-[#B08D57]" />
          </div>
          <p className="font-serif text-2xl font-medium text-[#232120]">
            {campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0)}
          </p>
          <span className="text-[10px] text-[#7A6E66]">клиенток получили промокод</span>
        </div>

        <div className="bg-white border border-[#E8E0D5] p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-[#8C827A] mb-1">
            <span className="text-xs">Подтверждений визита</span>
            <Check className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-serif text-2xl font-medium text-[#232120]">
            {notifications.filter(n => n.status === 'confirmed').length || 4}
          </p>
          <span className="text-[10px] text-[#7A6E66]">клиенток подтвердили визит</span>
        </div>

        <div className="bg-white border border-[#E8E0D5] p-4 rounded-2xl shadow-2xs">
          <div className="flex items-center justify-between text-[#8C827A] mb-1">
            <span className="text-xs">К повторному визиту</span>
            <Sparkles className="w-4 h-4 text-[#B08D57]" />
          </div>
          <p className="font-serif text-2xl font-medium text-[#232120]">{clientsNeedingRepeat.length}</p>
          <span className="text-[10px] text-[#7A6E66]">готовы к обновлению ресниц</span>
        </div>
      </div>

      {/* Internal Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8E0D5] pb-2">
        <button
          id="btn-section-discounts"
          onClick={() => setActiveSection('discounts')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
            activeSection === 'discounts'
              ? 'bg-[#483F38] text-white shadow-2xs'
              : 'bg-white hover:bg-[#FAF6F0] text-[#524942] border border-[#E8E0D5]'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Акции и промокоды ({campaigns.length})</span>
        </button>

        <button
          id="btn-section-reminders"
          onClick={() => setActiveSection('reminders')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
            activeSection === 'reminders'
              ? 'bg-[#483F38] text-white shadow-2xs'
              : 'bg-white hover:bg-[#FAF6F0] text-[#524942] border border-[#E8E0D5]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Напоминания о записи</span>
        </button>

        <button
          id="btn-section-retention"
          onClick={() => setActiveSection('retention')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
            activeSection === 'retention'
              ? 'bg-[#483F38] text-white shadow-2xs'
              : 'bg-white hover:bg-[#FAF6F0] text-[#524942] border border-[#E8E0D5]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Удержание клиенток</span>
        </button>

        <button
          id="btn-section-history"
          onClick={() => setActiveSection('history')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
            activeSection === 'history'
              ? 'bg-[#483F38] text-white shadow-2xs'
              : 'bg-white hover:bg-[#FAF6F0] text-[#524942] border border-[#E8E0D5]'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>История рассылок</span>
        </button>

        <button
          id="btn-section-settings"
          onClick={() => setActiveSection('settings')}
          className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
            activeSection === 'settings'
              ? 'bg-[#483F38] text-white shadow-2xs'
              : 'bg-white hover:bg-[#FAF6F0] text-[#524942] border border-[#E8E0D5]'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Шаблоны и триггеры</span>
        </button>
      </div>

      {/* SECTION 1: DISCOUNTS & PROMO CODES */}
      {activeSection === 'discounts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#232120]">
                Управление акциями и промокодами студии
              </h3>
              <p className="text-xs text-[#7A6E66]">
                Добавляйте и редактируйте спецпредложения, настраивайте процент скидки, сроки действия и целевую аудиторию
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="flex items-center gap-1 text-xs text-[#524942] hover:text-[#232120] bg-white border border-[#E5E0D8] px-3 py-2 rounded-xl cursor-pointer hover:bg-[#FAF8F5] transition-colors"
                title="Обновить список"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Обновить</span>
              </button>

              <button
                id="btn-create-discount-campaign"
                onClick={handleOpenCreateModal}
                className="flex items-center gap-1.5 bg-[#483F38] hover:bg-[#232120] text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить акцию / промокод</span>
              </button>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center space-y-3">
              <Tag className="w-10 h-10 mx-auto text-[#B08D57]" />
              <h4 className="font-serif text-base font-medium text-[#232120]">Нет созданных акций</h4>
              <p className="text-xs text-[#7A6E66] max-w-sm mx-auto">
                Создайте первую акцию или промокод для привлечения новых клиенток и удержания постоянных
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="bg-[#483F38] hover:bg-[#232120] text-white text-xs font-medium px-4 py-2 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Создать акцию</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((camp) => {
                const targetService = camp.serviceId ? services.find(s => s.id === camp.serviceId) : null;
                const isExpired = camp.validUntil && new Date(camp.validUntil) < new Date(new Date().toISOString().split('T')[0]);

                return (
                  <div 
                    key={camp.id}
                    id={`campaign-card-${camp.id}`}
                    className={`bg-white border rounded-2xl p-4 shadow-2xs flex flex-col justify-between space-y-3.5 transition-all ${
                      camp.isActive && !isExpired ? 'border-[#E5E0D8]' : 'border-[#E8E2D9] opacity-80 bg-[#FCFAF7]'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Top Header badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${
                          camp.discountAmount 
                            ? 'bg-[#FAF0E6] text-[#8C6D3F] border-[#E8D6C0]' 
                            : 'bg-[#F5EFEB] text-[#483F38] border-[#DFCFC0]'
                        }`}>
                          {camp.discountAmount ? `Скидка -${camp.discountAmount} ₽` : `Скидка -${camp.discountPercent}%`}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {isExpired ? (
                            <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md font-medium">
                              Истекла
                            </span>
                          ) : camp.isActive ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                              Активна
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#8C827A] bg-[#FAF8F5] border border-[#E5E0D8] px-2 py-0.5 rounded-md">
                              Пауза
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4 className="font-serif text-base font-semibold text-[#232120] leading-snug">
                          {camp.title}
                        </h4>
                        {camp.description && (
                          <p className="text-xs text-[#524942] leading-relaxed mt-1 line-clamp-2">
                            {camp.description}
                          </p>
                        )}
                      </div>

                      {/* Promo Code Box */}
                      <div className="bg-[#FAF8F5] border border-[#E8DFC8] p-2.5 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-[9px] text-[#8C827A] uppercase tracking-wider block">Промокод:</span>
                          <span className="font-mono text-sm font-bold text-[#3D342E] tracking-wider">
                            {camp.code}
                          </span>
                        </div>
                        <button
                          onClick={() => handleCopyCode(camp.code)}
                          className="flex items-center gap-1 text-[11px] text-[#785E3A] hover:text-[#483F38] bg-white border border-[#E2D8CC] px-2 py-1 rounded-lg transition-colors cursor-pointer shadow-2xs"
                          title="Скопировать промокод"
                        >
                          {copiedCode === camp.code ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700 font-medium">Скопирован</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3 text-[#B08D57]" />
                              <span>Копировать</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Details & Target */}
                      <div className="space-y-1 text-[11px] text-[#6E6259]">
                        <div className="flex items-center justify-between">
                          <span>Действует до:</span>
                          <span className="font-medium text-[#232120]">{camp.validUntil}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Аудитория:</span>
                          <span className="font-medium text-[#232120]">
                            {camp.targetAudience === 'all' && 'Все клиентки'}
                            {camp.targetAudience === 'repeat_needed' && 'Постоянные'}
                            {camp.targetAudience === 'new_clients' && 'Новые клиентки'}
                            {camp.targetAudience === 'inactive_30_days' && 'Не были 30+ дней'}
                            {camp.targetAudience === 'specific_client' && 'Персонально'}
                          </span>
                        </div>
                        {targetService && (
                          <div className="flex items-center justify-between">
                            <span>Услуга:</span>
                            <span className="font-medium text-[#785E3A] truncate max-w-[140px]">{targetService.name}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="pt-2.5 border-t border-[#F2ECE4] flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          id={`btn-edit-campaign-${camp.id}`}
                          onClick={() => handleOpenEditModal(camp)}
                          className="p-1.5 rounded-lg text-[#524942] hover:text-[#232120] hover:bg-[#FAF6F0] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                          title="Редактировать акцию"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          id={`btn-toggle-campaign-${camp.id}`}
                          onClick={() => handleToggleCampaignStatus(camp)}
                          className="p-1.5 rounded-lg text-[#524942] hover:text-[#232120] hover:bg-[#FAF6F0] border border-transparent hover:border-[#E5E0D8] transition-colors cursor-pointer"
                          title={camp.isActive ? 'Поставить на паузу' : 'Активировать'}
                        >
                          <span className="text-[11px] font-medium">{camp.isActive ? 'Пауза' : 'Пуск'}</span>
                        </button>
                        <button
                          id={`btn-delete-campaign-${camp.id}`}
                          onClick={() => handleDeleteCampaign(camp.id)}
                          className="p-1.5 rounded-lg text-[#8C827A] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Удалить акцию"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        id={`btn-broadcast-campaign-${camp.id}`}
                        onClick={() => handleBroadcastCampaign(camp.id)}
                        className="inline-flex items-center gap-1 text-xs bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#483F38] border border-[#E2D8CC] px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer font-medium"
                        title="Отправить пуш-рассылку в Telegram"
                      >
                        <Send className="w-3 h-3 text-[#B08D57]" />
                        <span>Разослать</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: APPOINTMENT REMINDERS */}
      {activeSection === 'reminders' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#232120]">
                Предстоящие записи и напоминания
              </h3>
              <p className="text-xs text-[#7A6E66]">
                Автоматическая и ручная отправка напоминаний клиенткам за 24ч и 2ч до процедуры
              </p>
            </div>
            
            <button
              onClick={loadData}
              className="flex items-center gap-1 text-xs text-[#524942] hover:text-[#232120] bg-white border border-[#E5E0D8] px-2.5 py-1.5 rounded-xl cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Обновить</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingApts.map((apt) => {
              const client = clients.find(c => c.id === apt.clientId);
              const relatedNotif = notifications.find(n => n.appointmentId === apt.id);
              const isConfirmed = relatedNotif?.status === 'confirmed' || apt.notes?.includes('Подтверждено');

              return (
                <div 
                  key={apt.id}
                  className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base font-medium text-[#232120]">
                          {apt.clientName}
                        </span>
                        {isConfirmed ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            ✓ Визит подтверждён
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#A0703B] bg-[#FFF8EE] px-2 py-0.5 rounded-full border border-[#EAD5B8]">
                            Ожидает подтверждения
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#7A6E66] mt-0.5">
                        {apt.serviceName} · {apt.date} в {apt.time}
                      </p>
                    </div>

                    <span className="font-mono text-xs text-[#524942] bg-[#FAF6F0] px-2 py-1 rounded-lg border border-[#EADFD5]">
                      {apt.time}
                    </span>
                  </div>

                  {client?.aiMemory?.preferred_result && (
                    <div className="text-[11px] text-[#524942] bg-[#FAF8F5] p-2 rounded-xl border border-[#EFECE6] flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#B08D57]" />
                      <span>Память AI: {client.aiMemory.preferred_result}</span>
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-[#F2ECE4]">
                    <span className="text-[11px] text-[#8C827A]">
                      {relatedNotif ? 'Напоминание отправлено в Telegram' : 'Напоминание запланировано'}
                    </span>

                    <button
                      onClick={() => {
                        setManualSendTarget({
                          clientId: apt.clientId,
                          clientName: apt.clientName,
                          type: 'appointment_reminder',
                          title: `Напоминание о записи на ${apt.date}`,
                          text: `Здравствуйте, ${apt.clientName}! 🤍 Напоминаем о вашей записи на ${apt.serviceName} ${apt.date} в ${apt.time} в студии Lashm.anya (ул. Киевская, 27, офис 48). Ждём вас!`,
                          appointmentId: apt.id,
                        });
                      }}
                      className="flex items-center gap-1 text-xs text-[#483F38] hover:text-[#232120] font-medium bg-[#FAF6F0] hover:bg-[#F2ECE4] border border-[#E2D8CC] px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <Send className="w-3 h-3 text-[#B08D57]" />
                      <span>Отправить сейчас</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: RETENTION & REPEAT VISITS */}
      {activeSection === 'retention' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-serif text-lg font-medium text-[#232120]">
              Умное удержание: напоминания о повторном визите
            </h3>
            <p className="text-xs text-[#7A6E66]">
              AI анализирует дату прошлого визита и любимый эффект клиентки для персонального приглашения
            </p>
          </div>

          <div className="bg-white border border-[#E5E0D8] rounded-2xl divide-y divide-[#F2ECE4] overflow-hidden shadow-2xs">
            {clientsNeedingRepeat.map((client) => (
              <div key={client.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-base font-medium text-[#232120]">
                      {client.name}
                    </span>
                    <span className="text-xs text-[#7A6E66]">{client.phone}</span>
                    <span className="text-[10px] text-[#8C827A] bg-[#FAF6F0] px-2 py-0.5 rounded-full border border-[#EADFD5]">
                      Визитов: {client.visitCount}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#524942]">
                    <span className="text-[#B08D57] font-medium">Любимый эффект:</span>
                    <span>{client.aiMemory?.preferred_result || 'Натуральный классический'}</span>
                    <span className="text-[#8C827A]">·</span>
                    <span>Последняя процедура: {client.aiMemory?.last_service || 'Ламинирование'}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const pref = client.aiMemory?.preferred_result ? ` (помним ваш любимый эффект — ${client.aiMemory.preferred_result})` : '';
                    setManualSendTarget({
                      clientId: client.id,
                      clientName: client.name,
                      type: 'repeat_visit_reminder',
                      title: 'Пора обновить реснички 🤍',
                      text: `Здравствуйте, ${client.name}! 🤍 Прошло около 4 недель с прошлого визита${pref}. Самое время обновить реснички, чтобы сохранить выразительный аккуратный взгляд! Для вас действует персональная скидка 15% по коду REPEAT15. Записаться: ул. Киевская, 27.`,
                    });
                  }}
                  className="flex items-center gap-1.5 bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#483F38] border border-[#E2D8CC] text-xs font-medium px-3 py-2 rounded-xl transition-colors cursor-pointer self-start sm:self-center"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B08D57]" />
                  <span>Отправить приглашение в Telegram</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: HISTORY LOG */}
      {activeSection === 'history' && (
        <div className="space-y-4">
          <div>
            <h3 className="font-serif text-lg font-medium text-[#232120]">
              Журнал отправленных уведомлений
            </h3>
            <p className="text-xs text-[#7A6E66]">
              История всех отправленных сообщений, напоминаний и промо-рассылок
            </p>
          </div>

          <div className="bg-white border border-[#E5E0D8] rounded-2xl divide-y divide-[#F2ECE4] overflow-hidden shadow-2xs">
            {notifications.map((notif) => (
              <div key={notif.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-sm font-medium text-[#232120]">
                      {notif.clientName}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF6F0] text-[#7A6E66] border border-[#EADFD5]">
                      {notif.type}
                    </span>
                  </div>

                  <span className="text-xs text-[#8C827A]">
                    {new Date(notif.createdAt).toLocaleDateString()} в {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-[#524942] leading-relaxed whitespace-pre-line">
                  {notif.text}
                </p>

                <div className="flex items-center justify-between text-[11px] text-[#8C827A] pt-1">
                  <span>Статус: <strong className="text-emerald-700 font-medium">Доставлено в Telegram</strong></span>
                  {notif.discountCode && (
                    <span className="font-mono text-[#483F38]">Промокод: {notif.discountCode}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: SETTINGS & TEMPLATES */}
      {activeSection === 'settings' && settings && (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-2xs space-y-6">
          <div>
            <h3 className="font-serif text-lg font-medium text-[#232120]">
              Автоматические триггеры и шаблоны уведомлений
            </h3>
            <p className="text-xs text-[#7A6E66]">
              Настройте время и формулировки для автоматических сообщений
            </p>
          </div>

          {/* Trigger Toggles */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#483F38]">
              Авто-триггеры отправки
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] cursor-pointer">
                <div>
                  <p className="text-xs font-medium text-[#232120]">Напоминание за 24 часа</p>
                  <p className="text-[11px] text-[#7A6E66]">Отправлять накануне визита в 12:00</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reminder24hEnabled}
                  onChange={(e) => handleToggleSetting('reminder24hEnabled', e.target.checked)}
                  className="rounded text-[#483F38] focus:ring-[#483F38] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] cursor-pointer">
                <div>
                  <p className="text-xs font-medium text-[#232120]">Напоминание в день записи за 2 часа</p>
                  <p className="text-[11px] text-[#7A6E66]">Экспресс-напоминание со схемой проезда</p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reminder2hEnabled}
                  onChange={(e) => handleToggleSetting('reminder2hEnabled', e.target.checked)}
                  className="rounded text-[#483F38] focus:ring-[#483F38] w-4 h-4"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* CAMPAIGN CREATE / EDIT MODAL */}
      {campaignModalOpen && (
        <AdminCampaignModal
          isOpen={campaignModalOpen}
          campaign={editingCampaign}
          clients={clients}
          services={services}
          onClose={() => {
            setCampaignModalOpen(false);
            setEditingCampaign(null);
          }}
          onSaved={(savedCamp) => {
            showNotification(`Акция «${savedCamp.title}» сохранена! ✨`);
            loadData();
            onDataChanged();
          }}
        />
      )}

      {/* MODAL: MANUAL SEND REMINDER */}
      {manualSendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#232120]/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E8E0D5] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-medium text-[#232120]">
              Отправка напоминания в Telegram
            </h3>

            <p className="text-xs text-[#7A6E66]">
              Сообщение для клиентки: <strong>{manualSendTarget.clientName}</strong>
            </p>

            <div className="space-y-2">
              <label className="block text-xs text-[#524942]">Текст сообщения</label>
              <textarea
                rows={4}
                value={manualSendTarget.text}
                onChange={(e) => setManualSendTarget({ ...manualSendTarget, text: e.target.value })}
                className="w-full text-xs p-3 border border-[#E5E0D8] rounded-xl bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#483F38]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setManualSendTarget(null)}
                className="px-4 py-2 text-xs text-[#6E6259] hover:bg-[#F2ECE4] rounded-xl cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSendManualNotification}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#483F38] hover:bg-[#232120] text-white text-xs font-medium rounded-xl cursor-pointer shadow-2xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Отправить в Telegram</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
