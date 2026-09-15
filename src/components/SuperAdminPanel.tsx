import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Crown, 
  Store, 
  Users, 
  Calendar, 
  CreditCard, 
  Key, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  Bot, 
  Smartphone, 
  Send, 
  Sparkles, 
  Eye, 
  Edit3, 
  Trash2, 
  TrendingUp, 
  Filter, 
  Radio, 
  Sliders, 
  Check, 
  X, 
  RefreshCw,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  Share2
} from 'lucide-react';
import { 
  SalonTenant, 
  PlatformOwnerStats, 
  PlatformBroadcastMessage, 
  SubscriptionPlan,
  SubscriptionPlanId,
  MasterAccountStatus
} from '../types.ts';
import { LinkTelegramIdModal } from './LinkTelegramIdModal.tsx';
import { MasterRegistrationModal } from './MasterRegistrationModal.tsx';
import { MasterAdminInviteModal } from './MasterAdminInviteModal.tsx';

interface SuperAdminPanelProps {
  onSwitchToMasterAdmin: (salonId: string) => void;
  onSwitchToMiniApp: (salonId: string) => void;
  onLogout?: () => void;
}

type SuperAdminTab = 'salons' | 'pending' | 'broadcasts' | 'pricing';

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({
  onSwitchToMasterAdmin,
  onSwitchToMiniApp,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('salons');
  const [salons, setSalons] = useState<SalonTenant[]>([]);
  const [stats, setStats] = useState<PlatformOwnerStats | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [broadcasts, setBroadcasts] = useState<PlatformBroadcastMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'pro' | 'trial'>('all');

  // Modal states
  const [selectedSalonForIdLink, setSelectedSalonForIdLink] = useState<SalonTenant | null>(null);
  const [selectedSalonForInvite, setSelectedSalonForInvite] = useState<SalonTenant | null>(null);
  const [showAddMasterModal, setShowAddMasterModal] = useState(false);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all_masters' | 'pro_masters' | 'trial_masters'>('all_masters');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Plan editing modal
  const [editingPlanSalon, setEditingPlanSalon] = useState<SalonTenant | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanId>('pro');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, salonsRes, bcRes] = await Promise.all([
        fetch('/api/platform/stats'),
        fetch('/api/platform/salons'),
        fetch('/api/platform/broadcasts'),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (salonsRes.ok) {
        const data = await salonsRes.json();
        setSalons(data.salons || []);
        setPlans(data.plans || []);
      }
      if (bcRes.ok) {
        const data = await bcRes.json();
        setBroadcasts(data.broadcasts || []);
      }
    } catch (e) {
      console.error('Failed to load Super Admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIdLinkSuccess = (updatedSalon: SalonTenant) => {
    setSelectedSalonForIdLink(null);
    setSalons(prev => prev.map(s => s.id === updatedSalon.id ? updatedSalon : s));
    setSuccessAlert(`Telegram ID успешно привязан к «${updatedSalon.settings.name}» (${updatedSalon.ownerName})!`);
    fetchData();
    setTimeout(() => setSuccessAlert(null), 4000);
  };

  const handleRegisterSuccess = (newSalon: SalonTenant) => {
    setShowAddMasterModal(false);
    setSalons(prev => [newSalon, ...prev]);
    setSuccessAlert(`Новый салон «${newSalon.settings.name}» успешно создан!`);
    fetchData();
    setTimeout(() => setSuccessAlert(null), 4000);
  };

  const handleUpdateStatus = async (salonId: string, newStatus: MasterAccountStatus) => {
    try {
      const res = await fetch(`/api/platform/salons/${salonId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setSalons(prev => prev.map(s => s.id === salonId ? data.salon : s));
        setSuccessAlert(`Статус салона обновлен на ${newStatus}`);
        setTimeout(() => setSuccessAlert(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlanSalon) return;
    try {
      const res = await fetch(`/api/platform/salons/${editingPlanSalon.id}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlanId }),
      });
      if (res.ok) {
        const data = await res.json();
        setSalons(prev => prev.map(s => s.id === editingPlanSalon.id ? data.salon : s));
        setEditingPlanSalon(null);
        setSuccessAlert(`Тариф для «${data.salon.settings.name}» обновлен на ${selectedPlanId.toUpperCase()}`);
        fetchData();
        setTimeout(() => setSuccessAlert(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSalon = async (salonId: string, salonName: string) => {
    if (!window.confirm(`Вы действительно хотите удалить салон «${salonName}»?`)) return;
    try {
      const res = await fetch(`/api/platform/salons/${salonId}`, { method: 'DELETE' });
      if (res.ok) {
        setSalons(prev => prev.filter(s => s.id !== salonId));
        setSuccessAlert(`Салон «${salonName}» удалён`);
        fetchData();
        setTimeout(() => setSuccessAlert(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastText.trim()) return;

    setSendingBroadcast(true);
    try {
      const res = await fetch('/api/platform/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          text: broadcastText.trim(),
          target: broadcastTarget,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(prev => [data.broadcast, ...prev]);
        setBroadcastTitle('');
        setBroadcastText('');
        setSuccessAlert('Рассылка успешно отправлена во все админки мастеров!');
        setTimeout(() => setSuccessAlert(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Filter salons
  const filteredSalons = salons.filter(s => {
    const matchesSearch = 
      s.settings.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.settings.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.ownerTelegramUsername && s.ownerTelegramUsername.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.ownerTelegramId && s.ownerTelegramId.includes(searchQuery));

    if (!matchesSearch) return false;

    if (statusFilter === 'pending') {
      return s.status === 'pending_id_link' || !s.isIdVerified;
    }
    if (statusFilter === 'pro') {
      return s.subscription.planId === 'pro' || s.subscription.planId === 'studio';
    }
    if (statusFilter === 'trial') {
      return s.subscription.planId === 'free' || s.status === 'trial';
    }
    return true;
  });

  const pendingSalons = salons.filter(s => s.status === 'pending_id_link' || !s.isIdVerified);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-stone-900/90 backdrop-blur-md border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 shadow-lg shadow-amber-500/20">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-white">Главная Админка Платформы</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Управление мастерами, привязка Telegram ID, мониторинг SaaS подписок
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddMasterModal(true)}
              className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Подключить мастера</span>
            </button>

            <button
              onClick={fetchData}
              className="p-2 rounded-xl border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-white transition"
              title="Обновить данные"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="py-2 px-3 rounded-xl border border-stone-800 hover:bg-stone-800 text-stone-400 hover:text-white text-xs transition"
              >
                Выйти
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Success Alert */}
        {successAlert && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{successAlert}</span>
            </div>
            <button onClick={() => setSuccessAlert(null)} className="text-emerald-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Global SaaS Metric KPI Cards */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-medium">Всего салонов</span>
              <Store className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats?.totalSalons || salons.length}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <span>{stats?.activeMasters || 3} активных</span>
            </div>
          </div>

          <div 
            onClick={() => { setActiveTab('pending'); setStatusFilter('pending'); }}
            className={`p-4 rounded-2xl border transition cursor-pointer ${
              pendingSalons.length > 0 
                ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-400/50' 
                : 'bg-stone-900 border-stone-800'
            }`}
          >
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-medium">Ожидают ID</span>
              <Key className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-300">{pendingSalons.length}</div>
            <div className="text-[11px] text-amber-400/80 mt-1">
              {pendingSalons.length > 0 ? '⚠️ Требует привязки' : 'Все привязаны'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-medium">SaaS Выручка (MRR)</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats?.mrrRub ? `${stats.mrrRub.toLocaleString('ru-RU')} ₽` : '2 280 ₽'}</div>
            <div className="text-[11px] text-stone-400 mt-1">в месяц по подписке</div>
          </div>

          <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-medium">Клиенток на платформе</span>
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats?.totalClientsAcrossPlatform || 6}</div>
            <div className="text-[11px] text-stone-400 mt-1">в базах мастеров</div>
          </div>

          <div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-stone-900 border border-stone-800">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-xs font-medium">Записей через ботов</span>
              <Calendar className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats?.totalAppointmentsAcrossPlatform || 5}</div>
            <div className="text-[11px] text-stone-400 mt-1">онлайн-бронирований</div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-800 pb-3 overflow-x-auto">
          {[
            { id: 'salons', label: `Все мастера и студии (${salons.length})`, icon: Store },
            { id: 'pending', label: `Очередь привязки ID (${pendingSalons.length})`, icon: Key, badge: pendingSalons.length > 0 },
            { id: 'broadcasts', label: `Глобальная рассылка (${broadcasts.length})`, icon: Send },
            { id: 'pricing', label: 'Тарифы и монетизация', icon: CreditCard },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`py-2 px-4 rounded-xl text-xs font-medium flex items-center gap-2 transition whitespace-nowrap ${
                  active
                    ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.badge && !active && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: All Salons & Masters */}
        {activeTab === 'salons' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск по студии, мастеру, городу или ID..."
                  className="w-full pl-10 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: `Все (${salons.length})` },
                  { id: 'pending', label: `Ожидают ID (${pendingSalons.length})` },
                  { id: 'pro', label: 'PRO / Studio' },
                  { id: 'trial', label: 'Trial / Free' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id as any)}
                    className={`py-1.5 px-3 rounded-lg text-xs transition whitespace-nowrap ${
                      statusFilter === f.id
                        ? 'bg-stone-800 text-amber-300 font-semibold border border-amber-500/30'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Salons List */}
            <div className="space-y-3">
              {filteredSalons.map((salon) => {
                const isPro = salon.subscription.planId === 'pro';
                const isStudio = salon.subscription.planId === 'studio';
                const isFree = salon.subscription.planId === 'free';
                const isPending = salon.status === 'pending_id_link' || !salon.isIdVerified;

                return (
                  <div
                    key={salon.id}
                    className="p-5 rounded-3xl bg-stone-900 border border-stone-800/80 hover:border-stone-700 transition space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Studio Info */}
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 text-lg font-bold shrink-0">
                          {salon.settings.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-bold text-white">{salon.settings.name}</h3>
                            
                            {/* Subscription Plan Badge */}
                            {isStudio && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                STUDIO VIP
                              </span>
                            )}
                            {isPro && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                                PRO Мастер
                              </span>
                            )}
                            {isFree && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-800 text-stone-400 border border-stone-700">
                                Free Trial
                              </span>
                            )}

                            {/* ID Link Status */}
                            {isPending ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> ID не привязан
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> ID привязан
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-xs text-stone-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-stone-500" />
                              Мастер: <strong className="text-stone-200">{salon.ownerName}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-stone-500" />
                              {salon.settings.city}, {salon.settings.address}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-stone-500" />
                              {salon.ownerPhone}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick KPI Counters */}
                      <div className="flex items-center gap-4 text-xs bg-stone-950/60 p-3 rounded-2xl border border-stone-800/60 shrink-0">
                        <div>
                          <div className="text-[10px] text-stone-500 uppercase">Клиенток</div>
                          <div className="text-sm font-bold text-white">{salon.clients.length}</div>
                        </div>
                        <div className="w-px h-6 bg-stone-800" />
                        <div>
                          <div className="text-[10px] text-stone-500 uppercase">Записей</div>
                          <div className="text-sm font-bold text-white">{salon.appointments.length}</div>
                        </div>
                        <div className="w-px h-6 bg-stone-800" />
                        <div>
                          <div className="text-[10px] text-stone-500 uppercase">Услуг</div>
                          <div className="text-sm font-bold text-white">{salon.services.length}</div>
                        </div>
                      </div>
                    </div>

                    {/* Middle Telegram ID info & Bot handle */}
                    <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-stone-300">
                          <Key className="w-3.5 h-3.5 text-amber-400" />
                          <span>Telegram ID:</span>
                          {salon.ownerTelegramId ? (
                            <code className="px-2 py-0.5 rounded bg-stone-800 text-amber-300 font-mono text-[11px]">
                              {salon.ownerTelegramId}
                            </code>
                          ) : (
                            <span className="text-rose-400 italic font-medium">не привязан</span>
                          )}
                          {salon.ownerTelegramUsername && (
                            <span className="text-stone-400">(@{salon.ownerTelegramUsername})</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-stone-300">
                          <Bot className="w-3.5 h-3.5 text-sky-400" />
                          <span>Бот клиенток:</span>
                          <span className="text-sky-300 font-mono">{salon.botUsername || salon.settings.telegramBotName}</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setSelectedSalonForInvite(salon)}
                          className="py-1.5 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
                          title="Скопировать персональную ссылку на админку для мастера студии"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>🔗 Ссылка для мастера</span>
                        </button>

                        <button
                          onClick={() => setSelectedSalonForIdLink(salon)}
                          className="py-1.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Key className="w-3 h-3" />
                          <span>{salon.ownerTelegramId ? 'Изменить ID' : 'Привязать Telegram ID'}</span>
                        </button>

                        <button
                          onClick={() => onSwitchToMasterAdmin(salon.id)}
                          className="py-1.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1 transition"
                          title="Войти в личную CRM админку мастера"
                        >
                          <Eye className="w-3 h-3 text-amber-400" />
                          <span>Войти в CRM мастера</span>
                        </button>

                        <button
                          onClick={() => onSwitchToMiniApp(salon.id)}
                          className="py-1.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1 transition"
                          title="Открыть клиентский Mini App для этого салона"
                        >
                          <Smartphone className="w-3 h-3 text-sky-400" />
                          <span>Бот клиенток</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingPlanSalon(salon);
                            setSelectedPlanId(salon.subscription.planId);
                          }}
                          className="py-1.5 px-2.5 rounded-xl border border-stone-700 hover:bg-stone-800 text-stone-300 text-xs transition"
                          title="Изменить тариф подписки"
                        >
                          ⭐ Тариф
                        </button>

                        {salons.length > 1 && (
                          <button
                            onClick={() => handleDeleteSalon(salon.id, salon.settings.name)}
                            className="p-1.5 rounded-xl border border-stone-800 hover:bg-rose-500/20 text-stone-500 hover:text-rose-400 transition"
                            title="Удалить салон"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredSalons.length === 0 && (
                <div className="p-12 text-center rounded-3xl bg-stone-900 border border-stone-800 text-stone-400 space-y-3">
                  <Store className="w-8 h-8 text-stone-600 mx-auto" />
                  <div className="text-sm font-semibold text-stone-300">Салоны не найдены</div>
                  <p className="text-xs text-stone-500">Попробуйте изменить поисковый запрос или фильтры</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Dedicated Pending Linkage Queue */}
        {activeTab === 'pending' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-stone-300 space-y-1">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Key className="w-4 h-4" /> Очередь привязки Telegram ID
              </div>
              <p className="text-stone-400 leading-relaxed">
                Когда новый мастер регистрирует салон, он отправляет заявку. Вы, как главный администратор, привязываете его цифровой Telegram ID или @username, после чего мастер получает полный доступ к своей админке.
              </p>
            </div>

            {pendingSalons.length > 0 ? (
              <div className="space-y-3">
                {pendingSalons.map((salon) => (
                  <div
                    key={salon.id}
                    className="p-5 rounded-3xl bg-stone-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-white">{salon.settings.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          ЖДЁТ ПРИВЯЗКИ ID
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 mt-1 space-y-0.5">
                        <div>Мастер: <strong className="text-stone-200">{salon.ownerName}</strong> ({salon.ownerPhone})</div>
                        <div>Город: {salon.settings.city}, {salon.settings.address}</div>
                        <div>Указанный Telegram: <span className="text-amber-300 font-mono">@{salon.ownerTelegramUsername || 'не указан'}</span></div>
                        {salon.ownerTelegramId && (
                          <div>ID: <code className="text-amber-300 font-mono">{salon.ownerTelegramId}</code></div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedSalonForIdLink(salon)}
                        className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
                      >
                        <Key className="w-4 h-4" />
                        <span>Привязать Telegram ID и открыть доступ</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center rounded-3xl bg-stone-900 border border-stone-800 text-stone-400 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <div className="text-sm font-semibold text-stone-200">Все мастера успешно авторизованы!</div>
                <p className="text-xs text-stone-500">Нет ожидающих заявок на привязку Telegram ID.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Global Broadcast to All Masters */}
        {activeTab === 'broadcasts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
            {/* Form */}
            <div className="p-6 rounded-3xl bg-stone-900 border border-stone-800 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Отправить оповещение всем мастерам</h3>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Сообщение мгновенно появится в админке каждого мастера на платформе (новости, советы, обновления AI).
              </p>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Заголовок новости / оповещения:
                  </label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="🎉 Новая функция: AI-анализ фото ресниц!"
                    className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Текст сообщения:
                  </label>
                  <textarea
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    rows={4}
                    placeholder="Уважаемые мастера! Мы добавили возможность..."
                    className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1.5">
                    Получатели:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'all_masters', label: 'Все мастера' },
                      { id: 'pro_masters', label: 'Только PRO / Studio' },
                      { id: 'trial_masters', label: 'Только Free Trial' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setBroadcastTarget(t.id as any)}
                        className={`p-2 rounded-xl border text-center text-xs transition ${
                          broadcastTarget === t.id
                            ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-semibold'
                            : 'border-stone-700 text-stone-400 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={sendingBroadcast}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingBroadcast ? 'Отправка...' : 'Опубликовать рассылку'}</span>
                </button>
              </form>
            </div>

            {/* Sent Broadcasts History */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>История рассылок платформы</span>
                <span className="text-xs text-stone-500">({broadcasts.length})</span>
              </h3>

              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {broadcasts.map((bc) => (
                  <div key={bc.id} className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{bc.title}</h4>
                      <span className="text-[10px] text-stone-500">{bc.date}</span>
                    </div>
                    <p className="text-xs text-stone-300 leading-relaxed whitespace-pre-line">{bc.text}</p>
                    <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-stone-800/60">
                      <span>Автор: {bc.author}</span>
                      <span className="text-amber-400/80">
                        {bc.target === 'all_masters' ? 'Всем мастерам' : bc.target}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Platform Pricing & Monetization */}
        {activeTab === 'pricing' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={`p-6 rounded-3xl border flex flex-col justify-between ${
                    p.id === 'pro'
                      ? 'bg-gradient-to-b from-amber-500/10 to-stone-900 border-amber-500/40 shadow-xl'
                      : p.id === 'studio'
                      ? 'bg-stone-900 border-stone-700'
                      : 'bg-stone-900/60 border-stone-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">{p.name}</span>
                      {p.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950">
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-white">{p.priceMonthly} ₽</span>
                      <span className="text-xs text-stone-400">/ месяц</span>
                    </div>
                    <p className="text-xs text-stone-400">{p.tagline}</p>

                    <div className="pt-3 border-t border-stone-800 space-y-2 text-xs text-stone-300">
                      {p.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-stone-800/60 text-xs text-stone-400 text-center">
                    Годовой тариф: <strong className="text-white">{p.priceYearly} ₽</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedSalonForInvite && (
        <MasterAdminInviteModal
          salon={selectedSalonForInvite}
          onClose={() => setSelectedSalonForInvite(null)}
          onOpenIdLink={() => {
            const s = selectedSalonForInvite;
            setSelectedSalonForInvite(null);
            setSelectedSalonForIdLink(s);
          }}
          onOpenMasterAdmin={() => {
            const sId = selectedSalonForInvite.id;
            setSelectedSalonForInvite(null);
            onSwitchToMasterAdmin(sId);
          }}
        />
      )}

      {selectedSalonForIdLink && (
        <LinkTelegramIdModal
          salon={selectedSalonForIdLink}
          onClose={() => setSelectedSalonForIdLink(null)}
          onSuccess={handleIdLinkSuccess}
        />
      )}

      {showAddMasterModal && (
        <MasterRegistrationModal
          onClose={() => setShowAddMasterModal(false)}
          onSuccess={handleRegisterSuccess}
        />
      )}

      {/* Plan Switch Modal */}
      {editingPlanSalon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl text-stone-100">
            <button
              onClick={() => setEditingPlanSalon(null)}
              className="absolute top-5 right-5 p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">Смена тарифа для мастера</h3>
            <p className="text-xs text-stone-400 mb-4">Студия «{editingPlanSalon.settings.name}» ({editingPlanSalon.ownerName})</p>

            <div className="space-y-3 mb-6">
              {[
                { id: 'free', name: 'Free Trial', price: '0 ₽', desc: 'Базовая запись до 20 клиенток' },
                { id: 'pro', name: 'PRO Мастер', price: '790 ₽/мес', desc: 'AI-память, авто-напоминания, акции' },
                { id: 'studio', name: 'STUDIO VIP', price: '1490 ₽/мес', desc: 'Мульти-мастера, домен, VIP-поддержка' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlanId(p.id as any)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition ${
                    selectedPlanId === p.id
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-stone-800 bg-stone-800/40 hover:border-stone-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-white">{p.name}</span>
                    <span className="text-xs font-semibold text-amber-300">{p.price}</span>
                  </div>
                  <div className="text-xs text-stone-400">{p.desc}</div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditingPlanSalon(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800 text-xs font-medium transition"
              >
                Отмена
              </button>
              <button
                onClick={handleUpdatePlan}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition shadow-lg shadow-amber-500/20"
              >
                Применить тариф
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
