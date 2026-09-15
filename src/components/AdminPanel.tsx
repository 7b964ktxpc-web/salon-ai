import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  Users, 
  MessageSquare, 
  Sparkles, 
  Clock, 
  Search, 
  Plus, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Send, 
  Bell, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ShieldCheck,
  Cloud,
  Tag,
  ArrowLeft,
  TrendingUp,
  Image as ImageIcon,
  UserPlus,
  Gift
} from 'lucide-react';
import { Appointment, Client, Service, AIConversation, ClientMemoryData, BusinessSettings, AppNotification, PortfolioItem } from '../types.ts';
import { AdminNotificationsTab } from './AdminNotificationsTab.tsx';
import { AdminSendPushModal } from './AdminSendPushModal.tsx';
import { AdminDashboardTab } from './AdminDashboardTab.tsx';
import { AdminPortfolioTab } from './AdminPortfolioTab.tsx';
import { AdminLogoModal } from './AdminLogoModal.tsx';
import { AdminAddClientModal } from './AdminAddClientModal.tsx';
import { AdminSubscriptionTab } from './AdminSubscriptionTab.tsx';
import { AdminStudioBrandingTab } from './AdminStudioBrandingTab.tsx';
import { SalonLogo } from './SalonLogo.tsx';

interface AdminPanelProps {
  onDataChanged: () => void;
  onSwitchToMiniApp?: () => void;
  onSwitchToSuperAdmin?: () => void;
  onOpenBotLinkModal?: () => void;
  onLogout?: () => void;
  adminTelegramId?: string;
  isSuperAdmin?: boolean;
}

type AdminTab = 'dashboard' | 'today' | 'calendar' | 'clients' | 'portfolio' | 'notifications' | 'dialogs' | 'services' | 'subscription' | 'studio_branding' | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onDataChanged, 
  onSwitchToMiniApp,
  onSwitchToSuperAdmin,
  onOpenBotLinkModal,
  onLogout,
  adminTelegramId,
  isSuperAdmin = false,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [calendarView, setCalendarView] = useState<'day' | 'week'>('day');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [portfolioWorks, setPortfolioWorks] = useState<PortfolioItem[]>([]);
  const [yandexStatus, setYandexStatus] = useState<any>(null);
  
  // Push Notification state
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushTargetClientId, setPushTargetClientId] = useState<string | undefined>();
  const [pushTargetAppointment, setPushTargetAppointment] = useState<Appointment | undefined>();
  const [pushSuccessAlert, setPushSuccessAlert] = useState<string | null>(null);

  // Logo & Client modals state
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // Client selection and search & category filter
  const [clientSearch, setClientSearch] = useState('');
  const [clientCategoryFilter, setClientCategoryFilter] = useState<'all' | 'repeat' | 'new' | 'birthday'>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  // Modals & form states
  const [showAddAptModal, setShowAddAptModal] = useState(false);
  const [newAptData, setNewAptData] = useState({ clientId: '', serviceId: '', date: '', time: '10:00' });
  
  const [editingPriceService, setEditingPriceService] = useState<Service | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<string>('');
  
  const [selectedDialog, setSelectedDialog] = useState<AIConversation | null>(null);
  const [masterReplyText, setMasterReplyText] = useState('');

  // AI Memory modification modal
  const [editingMemory, setEditingMemory] = useState<Client | null>(null);
  const [memoryForm, setMemoryForm] = useState<Partial<ClientMemoryData>>({});
  
  // Master post-visit note input (YandexGPT extraction test!)
  const [postVisitNote, setPostVisitNote] = useState('');
  const [extractingMemory, setExtractingMemory] = useState(false);
  const [extractionAlert, setExtractionAlert] = useState<string | null>(null);

  // Available slots for calendar day
  const [daySlots, setDaySlots] = useState<{ slots: string[]; blockedSlots: string[] }>({ slots: [], blockedSlots: [] });

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    fetchSlotsForCalendarDate(selectedCalendarDate);
  }, [selectedCalendarDate]);

  const fetchAll = async () => {
    try {
      const [aptsRes, clientsRes, srvRes, convRes, settingsRes, portRes] = await Promise.all([
        fetch('/api/appointments'),
        fetch('/api/clients'),
        fetch('/api/services'),
        fetch('/api/dialogs'),
        fetch('/api/settings'),
        fetch('/api/portfolio'),
      ]);

      const [apts, cls, srvs, convs, stg, port] = await Promise.all([
        aptsRes.json(),
        clientsRes.json(),
        srvRes.json(),
        convRes.json(),
        settingsRes.json(),
        portRes.json(),
      ]);

      setAppointments(apts);
      setClients(cls);
      setServices(srvs);
      setConversations(convs);
      setSettings(stg.settings);
      setPortfolioWorks(Array.isArray(port) ? port : []);
      setYandexStatus(stg.yandexStatus);

      if (!selectedClient && cls.length > 0) {
        setSelectedClient(cls[0]);
      }
      if (!selectedDialog && convs.length > 0) {
        setSelectedDialog(convs[0]);
      }
    } catch (e) {
      console.error('Error fetching admin data:', e);
    }
  };

  const fetchSlotsForCalendarDate = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/availability?date=${dateStr}`);
      const data = await res.json();
      setDaySlots({
        slots: data.slots || [],
        blockedSlots: data.blockedSlots || [],
      });
    } catch (e) {
      console.error('Failed to fetch availability slots:', e);
    }
  };

  // Toggle master slot open/block
  const handleToggleSlotBlock = async (time: string) => {
    try {
      await fetch('/api/availability/toggle-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedCalendarDate, time }),
      });
      fetchSlotsForCalendarDate(selectedCalendarDate);
      onDataChanged();
    } catch (e) {
      console.error('Failed to toggle slot:', e);
    }
  };

  // Update Service Price
  const handleSavePrice = async (serviceId: string) => {
    const numeric = newPriceValue.trim() === '' ? null : Number(newPriceValue);
    try {
      await fetch(`/api/services/${serviceId}/price`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price: numeric }),
      });
      setEditingPriceService(null);
      setNewPriceValue('');
      fetchAll();
      onDataChanged();
    } catch (e) {
      console.error('Failed to save price:', e);
    }
  };

  // Master sends reply in AI conversation
  const handleSendMasterReply = async () => {
    if (!selectedDialog || !masterReplyText.trim()) return;
    try {
      await fetch(`/api/dialogs/${selectedDialog.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: masterReplyText }),
      });
      setMasterReplyText('');
      fetchAll();
      onDataChanged();
    } catch (e) {
      console.error('Failed to send master reply:', e);
    }
  };

  // Master post-visit note -> YandexGPT memory learning
  const handleSavePostVisitNote = async () => {
    if (!selectedClient || !postVisitNote.trim()) return;
    setExtractingMemory(true);
    setExtractionAlert(null);
    try {
      const res = await fetch(`/api/clients/${selectedClient.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: postVisitNote }),
      });
      const data = await res.json();
      if (res.ok) {
        setPostVisitNote('');
        setExtractionAlert(`YandexGPT успешно обновил память: ${data.extractedMemory?.preferred_result || 'новые факты зафиксированы'} 🤍`);
        fetchAll();
        // Update selected client
        if (data.client) setSelectedClient(data.client);
        onDataChanged();
      }
    } catch (e: any) {
      setExtractionAlert(`Ошибка обновления: ${e.message}`);
    } finally {
      setExtractingMemory(false);
    }
  };

  // Save manual memory updates
  const handleSaveMemoryDirectly = async () => {
    if (!editingMemory) return;
    try {
      const res = await fetch(`/api/clients/${editingMemory.id}/memory`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memory: memoryForm }),
      });
      if (res.ok) {
        setEditingMemory(null);
        fetchAll();
        onDataChanged();
      }
    } catch (e) {
      console.error('Error updating memory:', e);
    }
  };

  // Delete client
  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Вы уверены, что хотите удалить данные клиента?')) return;
    try {
      await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      setSelectedClient(null);
      fetchAll();
      onDataChanged();
    } catch (e) {
      console.error('Failed to delete client:', e);
    }
  };

  // Quick 1-click Push: "Ваша запись подтверждена 🤍"
  const handleQuickSendConfirmPush = async (apt: Appointment) => {
    try {
      const client = clients.find(c => c.id === apt.clientId);
      const name = client?.name || apt.clientName || 'Клиент';
      const text = `Здравствуйте, ${name}! Ваша запись на ${apt.serviceName} на ${apt.date} в ${apt.time} успешно подтверждена мастером.\n\nЖдём вас в студии Lashm.anya: ул. Киевская, 27, офис 48 (4 этаж) 🤍`;

      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: apt.clientId,
          type: 'booking_confirmation',
          title: 'Ваша запись подтверждена 🤍',
          text,
          appointmentId: apt.id,
          appointmentDate: apt.date,
          appointmentTime: apt.time,
          actionLabel: 'Подтвердить визит',
        }),
      });

      if (res.ok) {
        setPushSuccessAlert(`Пуш «Ваша запись подтверждена» отправлен клиентке ${name}! 🔔`);
        setTimeout(() => setPushSuccessAlert(null), 4500);
        onDataChanged();
      }
    } catch (e) {
      console.error('Failed to send quick confirm push:', e);
    }
  };

  // Filtered clients for search & category filter
  const currentMonthNum = new Date().getMonth() + 1;
  const filteredClients = clients.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(clientSearch)) ||
      (c.username && c.username.toLowerCase().includes(clientSearch.toLowerCase()));
    if (!matchesSearch) return false;

    if (clientCategoryFilter === 'repeat') return c.visitCount > 1;
    if (clientCategoryFilter === 'new') return c.visitCount <= 1;
    if (clientCategoryFilter === 'birthday') {
      if (!c.birthday) return false;
      const parts = c.birthday.split(/[-.]/);
      if (parts.length >= 2) {
        const monthPart = parts.length === 3 && parts[0].length === 4 ? parseInt(parts[1], 10) : parseInt(parts[1], 10);
        return monthPart === currentMonthNum;
      }
      return false;
    }
    return true;
  });

  // Today's appointments (format matching specification #25)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments
    .filter(a => a.date === todayStr && a.status === 'confirmed')
    .sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      
      {/* Top Push Success Notification Banner */}
      {pushSuccessAlert && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-3 rounded-2xl flex items-center justify-between shadow-xs animate-slideDown">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{pushSuccessAlert}</span>
          </div>
          <button 
            onClick={() => setPushSuccessAlert(null)}
            className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Admin Top Dashboard Bar */}
      <div className="border-b border-[#E5E0D8] pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-3xl font-medium text-[#232120]">
              {settings?.name || 'Lashm.anya'}
            </h1>
            <span className="text-xs bg-[#EFECE6] text-[#483F38] px-2 py-0.5 rounded font-mono">
              CRM Мастера
            </span>
          </div>
          <p className="text-xs text-[#6E6259] mt-1">
            Мастер: <strong className="text-[#232120]">{settings?.masterName || 'Анна'}</strong> • {settings?.city || 'Новосибирск'}, {settings?.address || 'Киевская, 27'}
          </p>
        </div>

        {/* Master Identity, Return & Status */}
        <div className="flex flex-wrap items-center gap-2.5">
          {adminTelegramId && (
            <div className="flex items-center gap-1.5 bg-[#FAF6F0] border border-[#DFCFC0] px-2.5 py-1.5 rounded-lg text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-[#6E6259]">Telegram ID:</span>
              <span className="font-mono font-medium text-[#232120]">@{adminTelegramId}</span>
            </div>
          )}

          {onOpenBotLinkModal && (
            <button
              onClick={onOpenBotLinkModal}
              className="flex items-center gap-1.5 bg-[#F0F7FF] hover:bg-[#E0EFFF] text-[#0066CC] border border-[#BCD9FF] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              title="Получить персональную ссылку на Telegram-бота для клиенток"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Ссылка на бота для клиенток</span>
            </button>
          )}

          {isSuperAdmin && onSwitchToSuperAdmin && (
            <button
              onClick={onSwitchToSuperAdmin}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border border-amber-600 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
              title="Вернуться в Главную админку платформы"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-100" />
              <span>👑 В Главную админку</span>
            </button>
          )}

          {onSwitchToMiniApp && (
            <button
              id="btn-admin-return-studio"
              onClick={onSwitchToMiniApp}
              className="flex items-center gap-1.5 bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#483F38] border border-[#E2D8CC] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Клиентский Mini App</span>
            </button>
          )}

          {onLogout && (
            <button
              id="btn-admin-logout"
              onClick={onLogout}
              className="flex items-center gap-1 bg-white hover:bg-[#F5F2EC] text-[#8C827A] hover:text-[#232120] border border-[#E5E0D8] px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
              title="Выйти из кабинета мастера"
            >
              <span>Выйти</span>
            </button>
          )}

          <div className="flex items-center gap-2 bg-[#FFFFFF] border border-[#E5E0D8] px-3 py-1.5 rounded-lg text-xs">
            <Cloud className="w-3.5 h-3.5 text-[#483F38]" />
            <span className="text-[#6E6259]">AI-модель:</span>
            <span className="font-medium text-[#232120]">YandexGPT</span>
            {yandexStatus?.configured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Yandex Cloud API подключен"></span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" title="Активен встроенный semantic NLU движок"></span>
            )}
          </div>
        </div>
      </div>

      {/* Admin Sub-Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 mb-6 border-b border-[#EFECE6] text-sm">
        <button
          id="tab-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-[#483F38] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#EFECE6] hover:text-[#232120]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Дашборд & Аналитика</span>
        </button>

        <button
          id="tab-today"
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'today'
              ? 'bg-[#483F38] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#EFECE6] hover:text-[#232120]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Сегодня ({todayAppointments.length})</span>
        </button>

        <button
          id="tab-calendar"
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'calendar'
              ? 'bg-[#483F38] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#EFECE6] hover:text-[#232120]'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Календарь мастера</span>
        </button>

        <button
          id="tab-clients"
          onClick={() => setActiveTab('clients')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'clients'
              ? 'bg-[#483F38] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#EFECE6] hover:text-[#232120]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Клиенты и AI-память ({clients.length})</span>
        </button>

        <button
          id="tab-portfolio"
          onClick={() => setActiveTab('portfolio')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'portfolio'
              ? 'bg-[#483F38] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#EFECE6] hover:text-[#232120]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Портфолио ({portfolioWorks.length})</span>
        </button>

        <button
          id="tab-notifications"
          onClick={() => setActiveTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'notifications'
              ? 'bg-[#483F38] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#EFECE6] hover:text-[#232120]'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Уведомления и скидки</span>
        </button>

        <button
          id="tab-dialogs"
          onClick={() => setActiveTab('dialogs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'dialogs'
              ? 'bg-[#483F38] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#EFECE6] hover:text-[#232120]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>AI-Диалоги ({conversations.length})</span>
        </button>

        <button
          id="tab-services"
          onClick={() => setActiveTab('services')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'services'
              ? 'bg-[#483F38] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#EFECE6] hover:text-[#232120]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Услуги и цены</span>
        </button>

        <button
          id="tab-subscription"
          onClick={() => setActiveTab('subscription')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'subscription'
              ? 'bg-[#B08D57] text-white shadow-xs'
              : 'text-[#B08D57] bg-[#FAF3EA] hover:bg-[#F5EAD9]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>⭐ Подписка & Тарифы</span>
        </button>

        <button
          id="tab-studio-branding"
          onClick={() => setActiveTab('studio_branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'studio_branding'
              ? 'bg-[#483F38] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#EFECE6] hover:text-[#232120]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>🏢 Моя студия & Брендинг</span>
        </button>

        <button
          id="tab-settings"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'settings'
              ? 'bg-[#483F38] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#EFECE6] hover:text-[#232120]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Настройки</span>
        </button>
      </div>

      {/* 0. DASHBOARD & STUDIO ANALYTICS */}
      {activeTab === 'dashboard' && (
        <AdminDashboardTab
          appointments={appointments}
          clients={clients}
          services={services}
          portfolioWorks={portfolioWorks}
          logoUrl={settings?.logoUrl}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenAddApt={() => setShowAddAptModal(true)}
          onOpenAddClient={() => setShowAddClientModal(true)}
          onOpenAddPortfolio={() => setActiveTab('portfolio')}
          onOpenLogoSettings={() => setShowLogoModal(true)}
          onOpenSendPush={(cl) => {
            setPushTargetClientId(cl?.id);
            setPushTargetAppointment(undefined);
            setShowPushModal(true);
          }}
        />
      )}

      {/* 1. TODAY'S SCHEDULE (#25 Specification) */}
      {activeTab === 'today' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl text-[#232120] font-medium">Сегодня</h2>
              <p className="text-xs text-[#6E6259]">
                {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {todayAppointments.length} записей
              </p>
            </div>
            <button
              id="btn-add-apt-today"
              onClick={() => {
                setNewAptData({
                  clientId: clients[0]?.id || '',
                  serviceId: services[0]?.id || '',
                  date: todayStr,
                  time: '10:00',
                });
                setShowAddAptModal(true);
              }}
              className="bg-[#483F38] hover:bg-[#232120] text-white px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Записать клиента</span>
            </button>
          </div>

          {/* Today Timeline List */}
          <div className="bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl divide-y divide-[#EFECE6] overflow-hidden shadow-2xs">
            {todayAppointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#8C827A]">
                На сегодня записей нет. Свободные окна открыты для онлайн-бронирования 🤍
              </div>
            ) : (
              todayAppointments.map((apt) => (
                <div key={apt.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5] transition-colors">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="w-16 font-serif text-xl font-medium text-[#232120] shrink-0">
                      {apt.time}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-[#232120] text-sm">{apt.clientName}</h4>
                        {apt.clientPhone && (
                          <span className="text-xs text-[#8C827A]">{apt.clientPhone}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#6E6259]">{apt.serviceName}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    {/* 1-Click Push: Ваша запись подтверждена */}
                    <button
                      id={`btn-today-quick-push-${apt.id}`}
                      onClick={() => handleQuickSendConfirmPush(apt)}
                      className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Отправить пуш: «Ваша запись подтверждена» в Telegram"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Подтвердить пушем</span>
                    </button>

                    {/* Open Push Modal for customizable templates (reminder, promo, aftercare) */}
                    <button
                      id={`btn-today-open-push-${apt.id}`}
                      onClick={() => {
                        setPushTargetClientId(apt.clientId);
                        setPushTargetAppointment(apt);
                        setShowPushModal(true);
                      }}
                      className="text-xs bg-[#FAF6F0] hover:bg-[#EFE8DF] text-[#332A24] border border-[#DDD2C4] font-medium px-2.5 py-1.5 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Выбрать шаблон пуша или написать сообщение"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#B08D57]" />
                      <span>Пуш...</span>
                    </button>

                    <button
                      id={`btn-today-cancel-${apt.id}`}
                      onClick={async () => {
                        await fetch(`/api/appointments/${apt.id}/cancel`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ reason: 'Отменено мастером' }),
                        });
                        fetchAll();
                        onDataChanged();
                      }}
                      className="text-xs text-[#8C827A] hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      title="Отменить запись"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 2. MASTER CALENDAR (#26 Specification) */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-[#232120] font-medium">Календарь мастера</h2>
              <p className="text-xs text-[#6E6259]">
                Просмотр записей, ручное открытие и закрытие окон, управление расписанием
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="calendar-date-picker"
                type="date"
                value={selectedCalendarDate}
                onChange={(e) => setSelectedCalendarDate(e.target.value)}
                className="bg-white border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-xs text-[#232120] focus:outline-none focus:border-[#483F38]"
              />
              <button
                id="btn-calendar-add"
                onClick={() => {
                  setNewAptData({
                    clientId: clients[0]?.id || '',
                    serviceId: services[0]?.id || '',
                    date: selectedCalendarDate,
                    time: '12:00',
                  });
                  setShowAddAptModal(true);
                }}
                className="bg-[#483F38] hover:bg-[#232120] text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Добавить запись</span>
              </button>
            </div>
          </div>

          {/* Slots & Appointments Grid */}
          <div className="bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-[#EFECE6] pb-3">
              <span className="text-xs uppercase tracking-wider text-[#8C827A] font-medium">
                Расписание на {selectedCalendarDate}
              </span>
              <span className="text-xs text-[#6E6259]">
                Кликните на слот, чтобы закрыть/открыть окно для AI
              </span>
            </div>

            {/* Hours Timeline 10:00 - 19:00 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-2">
              {['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'].map((time) => {
                const booked = appointments.find(
                  a => a.date === selectedCalendarDate && a.time === time && a.status === 'confirmed'
                );
                const isBlocked = daySlots.blockedSlots.includes(time);

                return (
                  <div
                    key={time}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between min-h-[90px] ${
                      booked
                        ? 'bg-[#EFECE6] border-[#D8CEC4] text-[#232120]'
                        : isBlocked
                        ? 'bg-stone-100 border-stone-200 text-stone-400'
                        : 'bg-[#FAF8F5] border-[#E5E0D8] text-[#232120] hover:border-[#483F38]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-serif font-medium text-sm">{time}</span>
                      {booked ? (
                        <span className="text-[10px] bg-[#483F38] text-white px-1.5 py-0.2 rounded">Занято</span>
                      ) : isBlocked ? (
                        <span className="text-[10px] bg-stone-300 text-stone-700 px-1.5 py-0.2 rounded">Закрыто</span>
                      ) : (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">Свободно</span>
                      )}
                    </div>

                    <div className="text-xs mt-2">
                      {booked ? (
                        <div>
                          <p className="font-semibold text-[#1F1B18] truncate">{booked.clientName}</p>
                          <p className="text-[10px] text-[#6E6259] truncate">{booked.serviceName}</p>
                          <div className="mt-1.5 flex items-center justify-between">
                            <button
                              onClick={() => {
                                setPushTargetClientId(booked.clientId);
                                setPushTargetAppointment(booked);
                                setShowPushModal(true);
                              }}
                              className="text-[10px] bg-white border border-[#DDD3C5] hover:border-[#B08D57] text-[#332A24] px-1.5 py-0.5 rounded font-medium flex items-center gap-1 cursor-pointer"
                              title="Отправить пуш клиенту"
                            >
                              <Bell className="w-2.5 h-2.5 text-[#B08D57]" />
                              <span>Пуш</span>
                            </button>
                            <button
                              onClick={() => handleQuickSendConfirmPush(booked)}
                              className="text-[10px] text-emerald-700 hover:text-emerald-900 font-medium cursor-pointer"
                              title="Быстро отправить подтверждение"
                            >
                              ✅ Подтвердить
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          id={`toggle-slot-${time.replace(':', '-')}`}
                          onClick={() => handleToggleSlotBlock(time)}
                          className="text-[10px] text-[#6E6259] hover:text-[#232120] underline cursor-pointer"
                        >
                          {isBlocked ? 'Открыть слот' : 'Закрыть окно'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. CLIENTS CRM & AI MEMORY (#27 & #28 Specifications) */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-[#232120] font-medium">Клиенты и AI-память</h2>
              <p className="text-xs text-[#6E6259]">
                База клиенток, история посещений, заметки мастера и цифровой профиль
              </p>
            </div>
            <button
              id="btn-add-client-manual"
              onClick={() => setShowAddClientModal(true)}
              className="inline-flex items-center gap-2 bg-[#483F38] hover:bg-[#232120] text-white px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Добавить клиентку</span>
            </button>
          </div>

          {/* Client Category Filter Pills */}
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              onClick={() => setClientCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                clientCategoryFilter === 'all'
                  ? 'bg-[#483F38] text-white'
                  : 'bg-white border border-[#E5E0D8] text-[#6E6259] hover:bg-[#FAF8F5]'
              }`}
            >
              Все клиентки ({clients.length})
            </button>
            <button
              onClick={() => setClientCategoryFilter('repeat')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                clientCategoryFilter === 'repeat'
                  ? 'bg-[#483F38] text-white'
                  : 'bg-white border border-[#E5E0D8] text-[#6E6259] hover:bg-[#FAF8F5]'
              }`}
            >
              Постоянные ({clients.filter(c => c.visitCount > 1).length})
            </button>
            <button
              onClick={() => setClientCategoryFilter('new')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                clientCategoryFilter === 'new'
                  ? 'bg-[#483F38] text-white'
                  : 'bg-white border border-[#E5E0D8] text-[#6E6259] hover:bg-[#FAF8F5]'
              }`}
            >
              Новые ({clients.filter(c => c.visitCount <= 1).length})
            </button>
            <button
              onClick={() => setClientCategoryFilter('birthday')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                clientCategoryFilter === 'birthday'
                  ? 'bg-[#483F38] text-white'
                  : 'bg-white border border-[#E5E0D8] text-[#6E6259] hover:bg-[#FAF8F5]'
              }`}
            >
              <Gift className="w-3 h-3 text-[#B08D57]" />
              <span>Дни рождения в этом месяце</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            {/* Left Column: Client List with Search */}
            <div className="lg:col-span-4 space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-[#8C827A]" />
                <input
                  id="search-clients-input"
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Поиск: имя, телефон, telegram..."
                  className="w-full bg-white border border-[#E5E0D8] rounded-xl pl-9 pr-4 py-2.5 text-xs text-[#232120] focus:outline-none focus:border-[#483F38]"
                />
              </div>

              <div className="bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl divide-y divide-[#EFECE6] overflow-hidden shadow-2xs max-h-[640px] overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8C827A]">
                    Клиентки не найдены
                  </div>
                ) : (
                  filteredClients.map((c) => {
                    const isSelected = selectedClient?.id === c.id;
                    return (
                      <div
                        key={c.id}
                        id={`client-card-${c.id}`}
                        onClick={() => setSelectedClient(c)}
                        className={`p-3.5 cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#FAF8F5] border-l-3 border-[#483F38]' : 'hover:bg-[#FCFAF8]'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium text-[#232120]">{c.name}</h4>
                          <span className="text-[10px] bg-[#EFECE6] text-[#483F38] px-1.5 py-0.5 rounded">
                            {c.visitCount} визита
                          </span>
                        </div>
                        <p className="text-xs text-[#8C827A] mt-0.5">
                          {c.phone || (c.username ? `@${c.username}` : c.telegramId)}
                        </p>
                        {c.aiMemory?.preferred_result && (
                          <p className="text-[11px] text-[#B08D57] mt-1 flex items-center gap-1 truncate">
                            <Sparkles className="w-3 h-3 shrink-0" />
                            <span>{c.aiMemory.preferred_result}</span>
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          {/* Right Column: Detailed Client Profile & AI Memory Block */}
          <div className="lg:col-span-8 space-y-5">
            {selectedClient ? (
              <div className="bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl p-6 space-y-6 shadow-2xs">
                
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EFECE6] pb-4 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-serif text-2xl font-bold text-[#1F1B18]">{selectedClient.name}</h3>
                      {selectedClient.birthday && (
                        <span className="text-[11px] bg-[#FAF6F0] text-[#7A5A35] border border-[#DFCFC0] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          🎂 {selectedClient.birthday.slice(5).replace('-', '.')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#6E6259] mt-1 font-medium">
                      {selectedClient.username && <span>Telegram: @{selectedClient.username}</span>}
                      {selectedClient.phone && <span>Телефон: {selectedClient.phone}</span>}
                      <span>Визитов: {selectedClient.visitCount}</span>
                      {selectedClient.preferredStyle && (
                        <span>Эффект: <strong>{selectedClient.preferredStyle}</strong></span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    {/* 1-Click Birthday Congratulation & 20% Discount */}
                    <button
                      id="btn-send-birthday-push"
                      onClick={async () => {
                        try {
                          const res = await fetch(`/api/clients/${selectedClient.id}/birthday-discount`, {
                            method: 'POST',
                          });
                          if (res.ok) {
                            setPushSuccessAlert(`🎂 Поздравление с Днём рождения и скидка 20% отправлены клиентке ${selectedClient.name}!`);
                            fetchAll();
                            onDataChanged();
                          }
                        } catch (e) {
                          console.error('Failed to send birthday push:', e);
                        }
                      }}
                      className="bg-[#F5EFEB] hover:bg-[#EAE0D4] text-[#7A5A35] border border-[#DFCFC0] px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Поздравить с днем рождения и выдать скидку 20%"
                    >
                      <span>🎂 Поздравить с ДР</span>
                    </button>

                    <button
                      id="btn-client-send-push"
                      onClick={() => {
                        setPushTargetClientId(selectedClient.id);
                        setPushTargetAppointment(undefined);
                        setShowPushModal(true);
                      }}
                      className="bg-[#332A24] hover:bg-[#1F1B18] text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#B08D57]" />
                      <span>Отправить пуш в Telegram</span>
                    </button>
                    <button
                      id="btn-delete-client"
                      onClick={() => handleDeleteClient(selectedClient.id)}
                      className="text-xs text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 flex items-center gap-1 transition-colors cursor-pointer"
                      title="Удалить профиль"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* AI-ПАМЯТЬ В АДМИНКЕ (#28 Specification) */}
                <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#B08D57]" />
                      <h4 className="font-serif text-lg font-medium text-[#232120]">Что AI помнит</h4>
                    </div>
                    <button
                      id="btn-edit-memory"
                      onClick={() => {
                        setEditingMemory(selectedClient);
                        setMemoryForm(selectedClient.aiMemory || {});
                      }}
                      className="text-xs text-[#483F38] hover:text-[#232120] flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Изменить память</span>
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-[#483F38]">
                    {selectedClient.aiMemory?.preferred_result ? (
                      <div className="space-y-1.5">
                        <p className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57]"></span>
                          <span>Предпочитает результат: <strong>{selectedClient.aiMemory.preferred_result}</strong></span>
                        </p>
                        {selectedClient.aiMemory.last_service && (
                          <p className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57]"></span>
                            <span>Последняя процедура — <strong>{selectedClient.aiMemory.last_service}</strong></span>
                          </p>
                        )}
                        {selectedClient.aiMemory.next_visit_preference && (
                          <p className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#B08D57]"></span>
                            <span>Пожелание на следующий раз: <em>«{selectedClient.aiMemory.next_visit_preference}»</em></span>
                          </p>
                        )}
                        {selectedClient.aiMemory.important_notes && selectedClient.aiMemory.important_notes.length > 0 && (
                          <div className="pt-2 border-t border-[#E8E3DA]">
                            <span className="text-[11px] text-[#8C827A] uppercase tracking-wider block mb-1">
                              Важные заметки:
                            </span>
                            <ul className="list-disc list-inside space-y-1 text-[#6E6259]">
                              {selectedClient.aiMemory.important_notes.map((note, idx) => (
                                <li key={idx}>{note}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[#8C827A] italic">
                        Память пока пуста. Оставьте заметку после визита ниже, и YandexGPT автоматически извлечёт предпочтения 🤍
                      </p>
                    )}
                  </div>

                  {/* Add Post-Visit Note with YandexGPT Extraction (#12 Specification) */}
                  <div className="border-t border-[#E8E3DA] pt-4 space-y-2">
                    <label className="text-xs font-medium text-[#232120] block">
                      Добавить заметку мастера после визита (YandexGPT преобразует её в память):
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="input-post-visit-note"
                        type="text"
                        value={postVisitNote}
                        onChange={(e) => setPostVisitNote(e.target.value)}
                        placeholder="Например: Клиентке понравился натуральный результат, в следующий раз хочет выразительнее"
                        className="flex-1 bg-white border border-[#E5E0D8] rounded-xl px-3.5 py-2 text-xs text-[#232120] focus:outline-none focus:border-[#483F38]"
                      />
                      <button
                        id="btn-save-post-visit-note"
                        onClick={handleSavePostVisitNote}
                        disabled={extractingMemory || !postVisitNote.trim()}
                        className="bg-[#483F38] hover:bg-[#232120] text-white px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors disabled:opacity-50 whitespace-nowrap"
                      >
                        {extractingMemory ? 'Анализ...' : 'Обучить AI 🤍'}
                      </button>
                    </div>
                    {extractionAlert && (
                      <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                        {extractionAlert}
                      </p>
                    )}
                  </div>
                </div>

                {/* Client Appointments History */}
                <div className="space-y-3">
                  <h4 className="font-serif text-lg font-medium text-[#232120]">История записей</h4>
                  <div className="space-y-2">
                    {appointments.filter(a => a.clientId === selectedClient.id).map(apt => (
                      <div key={apt.id} className="border border-[#E5E0D8] rounded-xl p-3 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-medium text-[#232120]">{apt.date} в {apt.time}</span>
                          <p className="text-[#6E6259]">{apt.serviceName}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          apt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'
                        }`}>
                          {apt.status === 'confirmed' ? 'Активна' : 'Отменена'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="p-12 text-center text-xs text-[#8C827A] bg-white border border-[#E5E0D8] rounded-2xl">
                Выберите клиента из списка слева для просмотра карточки и AI-памяти
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* 4. AI-DIALOGS & MASTER HANDOFF (#29 & #30 Specifications) */}
      {activeTab === 'dialogs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Dialog List */}
          <div className="lg:col-span-5 space-y-3">
            <h3 className="font-serif text-lg font-medium text-[#232120]">Активные диалоги</h3>
            <div className="bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl divide-y divide-[#EFECE6] overflow-hidden shadow-2xs">
              {conversations.map((conv) => {
                const isSelected = selectedDialog?.id === conv.id;
                const lastMsg = conv.messages[conv.messages.length - 1];
                const needsHandoff = conv.status === 'handoff_to_master';

                return (
                  <div
                    key={conv.id}
                    id={`dialog-item-${conv.id}`}
                    onClick={() => setSelectedDialog(conv)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-[#FAF8F5] border-l-3 border-[#483F38]' : 'hover:bg-[#FCFAF8]'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-sm font-medium text-[#232120]">{conv.clientName}</h4>
                      {needsHandoff ? (
                        <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Нужен ответ мастера
                        </span>
                      ) : (
                        <span className="text-[10px] bg-[#EFECE6] text-[#6E6259] px-2 py-0.5 rounded-full">
                          {conv.status === 'booking_created' ? 'Запись создана' : 'В процессе'}
                        </span>
                      )}
                    </div>
                    {lastMsg && (
                      <p className="text-xs text-[#6E6259] mt-1 line-clamp-1">
                        <span className="font-medium">{lastMsg.sender === 'client' ? 'Клиент:' : 'AI:'} </span>
                        {lastMsg.text}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dialog Chat View & Manual Master Reply */}
          <div className="lg:col-span-7">
            {selectedDialog ? (
              <div className="bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl shadow-2xs flex flex-col h-[560px]">
                {/* Header */}
                <div className="p-4 border-b border-[#E5E0D8] flex justify-between items-center bg-[#FAF8F5]">
                  <div>
                    <h4 className="font-serif text-lg font-medium text-[#232120]">{selectedDialog.clientName}</h4>
                    <span className="text-xs text-[#8C827A]">Telegram ID: {selectedDialog.telegramId}</span>
                  </div>
                  {selectedDialog.status === 'handoff_to_master' && (
                    <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
                      Требуется ответ мастера
                    </span>
                  )}
                </div>

                {/* Messages stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FCFAF8]">
                  {selectedDialog.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.sender === 'client' ? 'items-start' : 'items-end'}`}
                    >
                      <span className="text-[10px] text-[#8C827A] mb-0.5 px-1">
                        {m.sender === 'client' ? selectedDialog.clientName : m.sender === 'master' ? 'Мастер (Вы)' : 'Lashm.anya AI'}
                      </span>
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 text-xs leading-relaxed ${
                          m.sender === 'client'
                            ? 'bg-white border border-[#E5E0D8] text-[#232120]'
                            : m.sender === 'master'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-[#483F38] text-white'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Master manual reply input (#30 Specification) */}
                <div className="p-3 border-t border-[#E5E0D8] bg-white">
                  <div className="flex gap-2">
                    <input
                      id="input-master-reply"
                      type="text"
                      value={masterReplyText}
                      onChange={(e) => setMasterReplyText(e.target.value)}
                      placeholder="Ответить клиенту вручную от имени мастера..."
                      className="flex-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-2 text-xs text-[#232120] focus:outline-none focus:border-[#483F38]"
                    />
                    <button
                      id="btn-send-master-reply"
                      onClick={handleSendMasterReply}
                      disabled={!masterReplyText.trim()}
                      className="bg-[#483F38] text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-[#232120] transition-colors cursor-pointer disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-[#8C827A] bg-white border border-[#E5E0D8] rounded-2xl">
                Выберите диалог для просмотра истории и ручного ответа
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. SERVICES & PRICES (#31 Specification) */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-serif text-2xl text-[#232120] font-medium">Услуги и цены</h2>
            <p className="text-xs text-[#6E6259]">
              При изменении цены AI моментально начинает использовать её в ответах клиентам
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((s) => (
              <div key={s.id} className="bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl p-5 space-y-4 shadow-2xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-serif text-xl font-medium text-[#232120]">{s.name}</h3>
                    <p className="text-xs text-[#8C827A] mt-1 leading-relaxed">{s.description}</p>
                  </div>
                </div>

                <div className="border-t border-[#EFECE6] pt-3 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8C827A] block">Цена в базе:</span>
                    <span className="font-serif text-lg text-[#483F38]">
                      {s.price !== null ? `${s.price} ₽` : '— (не указана)'}
                    </span>
                  </div>

                  <button
                    id={`btn-edit-price-${s.id}`}
                    onClick={() => {
                      setEditingPriceService(s);
                      setNewPriceValue(s.price !== null ? s.price.toString() : '');
                    }}
                    className="text-xs bg-[#FAF8F5] hover:bg-[#EFECE6] text-[#232120] border border-[#D8CEC4] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Изменить цену
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Edit Price Modal */}
          {editingPriceService && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
              <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
                <h4 className="font-serif text-xl font-medium text-[#232120]">
                  Изменить цену: {editingPriceService.name}
                </h4>
                <p className="text-xs text-[#6E6259]">
                  Оставьте поле пустым, чтобы цена не отображалась (AI будет отвечать: «Стоимость уточняется при записи 🤍»).
                </p>
                <div>
                  <input
                    id="input-new-price"
                    type="number"
                    value={newPriceValue}
                    onChange={(e) => setNewPriceValue(e.target.value)}
                    placeholder="Например: 2500"
                    className="w-full bg-white border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#232120] focus:outline-none focus:border-[#483F38]"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    id="btn-save-price-confirm"
                    onClick={() => handleSavePrice(editingPriceService.id)}
                    className="flex-1 bg-[#483F38] text-white py-2.5 rounded-xl text-xs font-medium hover:bg-[#232120] transition-colors cursor-pointer"
                  >
                    Сохранить
                  </button>
                  <button
                    id="btn-save-price-cancel"
                    onClick={() => setEditingPriceService(null)}
                    className="flex-1 bg-white border border-[#D8CEC4] text-[#232120] py-2.5 rounded-xl text-xs font-medium hover:bg-[#EFECE6] transition-colors cursor-pointer"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. PORTFOLIO MANAGEMENT TAB */}
      {activeTab === 'portfolio' && (
        <AdminPortfolioTab
          portfolioWorks={portfolioWorks}
          services={services}
          onDataChanged={() => {
            fetchAll();
            onDataChanged();
          }}
        />
      )}

      {/* 6. REMINDERS, LOGO & BUSINESS SETTINGS */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-[#232120] font-medium">Логотип и настройки студии</h2>
              <p className="text-xs text-[#6E6259]">
                Фирменный стиль, логотип Lashm.anya, координаты и шаблоны Telegram
              </p>
            </div>
            <button
              id="btn-settings-change-logo"
              onClick={() => setShowLogoModal(true)}
              className="inline-flex items-center gap-2 bg-[#483F38] hover:bg-[#232120] text-white px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Сменить логотип студии</span>
            </button>
          </div>

          {/* Logo & Visual Identity Card */}
          <div className="bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl p-5 shadow-2xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <SalonLogo logoUrl={settings?.logoUrl} size="lg" className="shadow-xs" />
                <div>
                  <h3 className="font-serif text-lg font-medium text-[#232120]">Фирменный знак Lashm.anya</h3>
                  <p className="text-xs text-[#6E6259] mt-0.5">
                    {settings?.logoUrl ? 'Установлен собственный логотип / фото' : 'Используется каноничный SVG-логотип студии'}
                  </p>
                  <span className="inline-block text-[11px] bg-[#FAF6F0] text-[#785E3A] border border-[#EADFCF] px-2 py-0.5 rounded-md mt-1.5 font-medium">
                    Отображается в шапке, меню и на визитке
                  </span>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => setShowLogoModal(true)}
                  className="flex-1 md:flex-initial bg-[#FAF6F0] hover:bg-[#F2EAE0] text-[#483F38] border border-[#DFCFC0] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Изменить / Загрузить
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Automatic Messages Templates */}
            <div className="bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl p-5 space-y-4 shadow-2xs">
              <h3 className="font-serif text-lg font-medium text-[#232120]">Автоматические сообщения</h3>
              
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl">
                  <span className="font-medium text-[#232120] block mb-1">1. Сразу после записи:</span>
                  <p className="text-[#6E6259] italic">«Вы записаны в Lashm.anya 🤍»</p>
                </div>

                <div className="p-3 bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl">
                  <span className="font-medium text-[#232120] block mb-1">2. Перед визитом (за 24 часа):</span>
                  <p className="text-[#6E6259] italic">«Напоминаем о вашей записи завтра в 14:00 🤍»</p>
                </div>

                <div className="p-3 bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl">
                  <span className="font-medium text-[#232120] block mb-1">3. После визита:</span>
                  <p className="text-[#6E6259] italic">«Спасибо, что были у нас 🤍»</p>
                </div>

                <div className="p-3 bg-[#FAF8F5] border border-[#E8E3DA] rounded-xl">
                  <span className="font-medium text-[#232120] block mb-1">4. Возврат клиентов (через 28 дней):</span>
                  <p className="text-[#6E6259] italic">«Если захотите повторить процедуру, я могу подобрать удобное время 🤍»</p>
                </div>
              </div>
            </div>

            {/* Verified Studio Coordinates */}
            <div className="bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl p-5 space-y-3 shadow-2xs text-xs text-[#6E6259]">
              <h3 className="font-serif text-lg font-medium text-[#232120]">Подтверждённые данные</h3>
              <p><strong>Студия:</strong> Lashm.anya</p>
              <p><strong>Город:</strong> Новосибирск</p>
              <p><strong>Адрес:</strong> ул. Киевская, 27, офис 48, 4 этаж</p>
              <p><strong>Рейтинг:</strong> 5.0 · 14 оценок в 2ГИС</p>
              <p><strong>Правило:</strong> Работа строго по предварительной записи</p>
              <div className="pt-2">
                <a
                  href="https://2gis.ru/novosibirsk/firm/70000001110562714"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#483F38] underline font-medium"
                >
                  Открыть карточку фирмы в 2ГИС ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Notifications & Reminders & Discounts Tab */}
      {activeTab === 'notifications' && (
        <AdminNotificationsTab
          clients={clients}
          appointments={appointments}
          services={services}
          onDataChanged={() => {
            fetchAll();
            onDataChanged();
          }}
        />
      )}

      {/* 8. Master Subscription & Monetization Tab */}
      {activeTab === 'subscription' && (
        <AdminSubscriptionTab
          onDataChanged={() => {
            fetchAll();
            onDataChanged();
          }}
        />
      )}

      {/* 9. Studio & Master Branding Customizer Tab */}
      {activeTab === 'studio_branding' && (
        <AdminStudioBrandingTab
          settings={settings}
          onDataChanged={() => {
            fetchAll();
            onDataChanged();
          }}
          onOpenLogoModal={() => setShowLogoModal(true)}
        />
      )}

      {/* Manual Booking Modal for Master */}
      {showAddAptModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h4 className="font-serif text-xl font-medium text-[#232120]">Добавить запись вручную</h4>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#6E6259] block mb-1">Клиент:</label>
                <select
                  value={newAptData.clientId}
                  onChange={(e) => setNewAptData({ ...newAptData, clientId: e.target.value })}
                  className="w-full bg-white border border-[#E5E0D8] rounded-lg p-2 text-xs"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone || c.username})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[#6E6259] block mb-1">Услуга:</label>
                <select
                  value={newAptData.serviceId}
                  onChange={(e) => setNewAptData({ ...newAptData, serviceId: e.target.value })}
                  className="w-full bg-white border border-[#E5E0D8] rounded-lg p-2 text-xs"
                >
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[#6E6259] block mb-1">Дата:</label>
                  <input
                    type="date"
                    value={newAptData.date}
                    onChange={(e) => setNewAptData({ ...newAptData, date: e.target.value })}
                    className="w-full bg-white border border-[#E5E0D8] rounded-lg p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[#6E6259] block mb-1">Время:</label>
                  <input
                    type="time"
                    value={newAptData.time}
                    onChange={(e) => setNewAptData({ ...newAptData, time: e.target.value })}
                    className="w-full bg-white border border-[#E5E0D8] rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={async () => {
                  const client = clients.find(c => c.id === newAptData.clientId);
                  await fetch('/api/appointments', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      clientId: newAptData.clientId,
                      serviceId: newAptData.serviceId,
                      date: newAptData.date,
                      time: newAptData.time,
                      clientName: client?.name || 'Клиент',
                      clientPhone: client?.phone,
                    }),
                  });
                  setShowAddAptModal(false);
                  fetchAll();
                  onDataChanged();
                }}
                className="flex-1 bg-[#483F38] text-white py-2.5 rounded-xl text-xs font-medium hover:bg-[#232120] cursor-pointer"
              >
                Создать запись
              </button>
              <button
                onClick={() => setShowAddAptModal(false)}
                className="flex-1 bg-white border border-[#D8CEC4] text-[#232120] py-2.5 rounded-xl text-xs font-medium cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Direct Memory Edit Modal */}
      {editingMemory && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <h4 className="font-serif text-xl font-medium text-[#232120]">Редактирование памяти: {editingMemory.name}</h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#6E6259] block mb-1">Предпочтительный результат:</label>
                <input
                  type="text"
                  value={memoryForm.preferred_result || ''}
                  onChange={(e) => setMemoryForm({ ...memoryForm, preferred_result: e.target.value })}
                  placeholder="натуральный / выразительный"
                  className="w-full bg-white border border-[#E5E0D8] rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[#6E6259] block mb-1">Пожелание к следующему визиту:</label>
                <input
                  type="text"
                  value={memoryForm.next_visit_preference || ''}
                  onChange={(e) => setMemoryForm({ ...memoryForm, next_visit_preference: e.target.value })}
                  placeholder="немного выразительнее"
                  className="w-full bg-white border border-[#E5E0D8] rounded-lg p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[#6E6259] block mb-1">Прошлая процедура:</label>
                <input
                  type="text"
                  value={memoryForm.last_service || ''}
                  onChange={(e) => setMemoryForm({ ...memoryForm, last_service: e.target.value })}
                  placeholder="Ламинирование ресниц"
                  className="w-full bg-white border border-[#E5E0D8] rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSaveMemoryDirectly}
                className="flex-1 bg-[#483F38] text-white py-2.5 rounded-xl text-xs font-medium cursor-pointer"
              >
                Сохранить память
              </button>
              <button
                onClick={() => setEditingMemory(null)}
                className="flex-1 bg-white border border-[#D8CEC4] text-[#232120] py-2.5 rounded-xl text-xs font-medium cursor-pointer"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Send Push Notification Modal */}
      {showPushModal && (
        <AdminSendPushModal
          isOpen={showPushModal}
          onClose={() => setShowPushModal(false)}
          clients={clients}
          appointments={appointments}
          preselectedClientId={pushTargetClientId}
          preselectedAppointment={pushTargetAppointment}
          onSuccess={(createdNotif) => {
            setPushSuccessAlert(`Пуш «${createdNotif.title}» успешно отправлен клиентке ${createdNotif.clientName}! 🔔`);
            setTimeout(() => setPushSuccessAlert(null), 5000);
            fetchAll();
            onDataChanged();
          }}
        />
      )}

      {/* Admin Logo Manager Modal */}
      {showLogoModal && (
        <AdminLogoModal
          isOpen={showLogoModal}
          onClose={() => setShowLogoModal(false)}
          currentLogoUrl={settings?.logoUrl}
          onSaved={(newLogoUrl) => {
            setPushSuccessAlert('Логотип студии успешно обновлён! ✨');
            setTimeout(() => setPushSuccessAlert(null), 4000);
            fetchAll();
            onDataChanged();
          }}
        />
      )}

      {/* Admin Manual Client Add Modal */}
      {showAddClientModal && (
        <AdminAddClientModal
          isOpen={showAddClientModal}
          onClose={() => setShowAddClientModal(false)}
          onCreated={(newClient) => {
            setPushSuccessAlert(`Клиентка ${newClient.name} успешно добавлена в базу! 🌸`);
            setTimeout(() => setPushSuccessAlert(null), 4000);
            fetchAll();
            setSelectedClient(newClient);
            onDataChanged();
          }}
        />
      )}
    </div>
  );
};
