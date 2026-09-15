/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { NavigationHeader, AppMode } from './components/NavigationHeader.tsx';
import { MiniAppView } from './components/MiniAppView.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { SuperAdminPanel } from './components/SuperAdminPanel.tsx';
import { GentleChatWidget } from './components/GentleChatWidget.tsx';
import { ClientNotificationsModal } from './components/ClientNotificationsModal.tsx';
import { ClientRegistrationModal } from './components/ClientRegistrationModal.tsx';
import { MasterRegistrationModal } from './components/MasterRegistrationModal.tsx';
import { MasterBotLinkModal } from './components/MasterBotLinkModal.tsx';
import { AdminAuthModal } from './components/AdminAuthModal.tsx';
import { TelegramPushBanner } from './components/TelegramPushBanner.tsx';
import { SalonLogo } from './components/SalonLogo.tsx';
import { Client, BusinessSettings, AppNotification, SalonTenant } from './types.ts';

const defaultSettings: BusinessSettings = {
  name: 'Lashm.anya',
  tagline: 'Взгляд без лишнего.',
  subtitle: 'Студия наращивания и ламинирования ресниц на Киевской',
  city: 'Новосибирск',
  address: 'Новосибирск, ул. Киевская, 27',
  office: 'офис 48',
  floor: '4 этаж',
  phone: '+7 (913) 000-00-00',
  twoGisUrl: 'https://2gis.ru/novosibirsk/firm/70000001110562714',
  rating: '5.0',
  reviewCount: 14,
  preBookingOnly: true,
  workingHoursDescription: 'Ежедневно с 10:00 до 20:00 по предварительной записи',
  reminderHoursBefore: 24,
  repeatReminderDays: 28,
};

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('miniapp');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('c-1');
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [appliedDiscountCode, setAppliedDiscountCode] = useState<string | null>(null);
  const [activePushNotification, setActivePushNotification] = useState<AppNotification | null>(null);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isFirstTimeReg, setIsFirstTimeReg] = useState(false);
  const seenNotificationIdsRef = useRef<Set<string>>(new Set());
  const initialMountRef = useRef<boolean>(true);

  // Multi-Tenant Platform State
  const [salons, setSalons] = useState<SalonTenant[]>([]);
  const [activeSalonId, setActiveSalonId] = useState<string>('salon-1');
  const [showMasterRegModal, setShowMasterRegModal] = useState<boolean>(false);
  const [showBotLinkModal, setShowBotLinkModal] = useState<boolean>(false);

  // Master / Super Admin Authentication by Telegram ID
  const [adminAuthUser, setAdminAuthUser] = useState<string | null>(() => {
    return sessionStorage.getItem('lashm_anya_admin_auth');
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    return sessionStorage.getItem('lashm_anya_is_super_admin') === 'true';
  });
  const [showAdminAuthModal, setShowAdminAuthModal] = useState<boolean>(false);
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'master' | 'superadmin'>('master');
  const [pendingModeSwitch, setPendingModeSwitch] = useState<AppMode | null>(null);

  // URL route sync: #admin, #superadmin, or ?salon=...
  useEffect(() => {
    const handleUrlRoute = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);
      const urlSalon = params.get('salon');

      if (urlSalon) {
        // Will be matched when salons load
      }

      if (hash === '#superadmin' || hash === '#super-admin' || params.get('mode') === 'superadmin') {
        const storedIsSuper = sessionStorage.getItem('lashm_anya_is_super_admin') === 'true';
        if (storedIsSuper) {
          setCurrentMode('super_admin');
        } else {
          setAuthModalInitialTab('superadmin');
          setPendingModeSwitch('super_admin');
          setShowAdminAuthModal(true);
        }
      } else if (hash === '#admin' || hash === '#master' || params.get('mode') === 'admin') {
        const storedAuth = sessionStorage.getItem('lashm_anya_admin_auth');
        if (storedAuth) {
          setCurrentMode('master_admin');
        } else {
          setAuthModalInitialTab('master');
          setPendingModeSwitch('master_admin');
          setShowAdminAuthModal(true);
        }
      } else {
        setCurrentMode('miniapp');
      }
    };

    handleUrlRoute();
    window.addEventListener('hashchange', handleUrlRoute);
    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('hashchange', handleUrlRoute);
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, []);

  // Fetch initial data & salons list
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchNotifications();
    
    // Regular polling for real-time push notifications from Admin Panel
    const interval = setInterval(() => {
      fetchNotifications();
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedClientId, activeSalonId]);

  const fetchInitialData = async (targetSalonId?: string) => {
    try {
      // First fetch all salons to know available tenants
      const salonsRes = await fetch('/api/platform/salons');
      let currentSalons: SalonTenant[] = [];
      if (salonsRes.ok) {
        const data = await salonsRes.json();
        currentSalons = data.salons || [];
        setSalons(currentSalons);
      }

      // Check if URL specifies a salon slug/id
      const params = new URLSearchParams(window.location.search);
      const urlSalon = params.get('salon');
      let effectiveSalonId = targetSalonId || activeSalonId;

      if (urlSalon && currentSalons.length > 0) {
        const matched = currentSalons.find(s => s.slug === urlSalon || s.id === urlSalon);
        if (matched) {
          effectiveSalonId = matched.id;
        }
      }

      // If switching salon
      if (effectiveSalonId && effectiveSalonId !== activeSalonId) {
        setActiveSalonId(effectiveSalonId);
        await fetch('/api/platform/switch-salon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salonId: effectiveSalonId }),
        });
      }

      const [clientsRes, settingsRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/settings'),
      ]);
      
      const clientsData = await clientsRes.json();
      const settingsData = await settingsRes.json();
      
      setClients(clientsData || []);
      if (clientsData && clientsData.length > 0) {
        setSelectedClientId(clientsData[0].id);
      }
      if (settingsData.settings) {
        setBusinessSettings(settingsData.settings);
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchSalon = async (salonId: string) => {
    try {
      setLoading(true);
      setActiveSalonId(salonId);
      const res = await fetch('/api/platform/switch-salon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salonId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.salon) {
          setBusinessSettings(data.salon.settings);
          setClients(data.salon.clients || []);
          if (data.salon.clients && data.salon.clients.length > 0) {
            setSelectedClientId(data.salon.clients[0].id);
          }
        }
      }
      await fetchInitialData(salonId);
    } catch (e) {
      console.error('Failed to switch salon:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMode = (mode: AppMode) => {
    if (mode === 'super_admin') {
      if (isSuperAdmin) {
        setCurrentMode('super_admin');
        window.location.hash = 'superadmin';
      } else {
        setAuthModalInitialTab('superadmin');
        setPendingModeSwitch('super_admin');
        setShowAdminAuthModal(true);
      }
    } else if (mode === 'master_admin') {
      const storedAuth = sessionStorage.getItem('lashm_anya_admin_auth');
      if (storedAuth || isSuperAdmin) {
        if (storedAuth) setAdminAuthUser(storedAuth);
        setCurrentMode('master_admin');
        window.location.hash = 'admin';
      } else {
        setAuthModalInitialTab('master');
        setPendingModeSwitch('master_admin');
        setShowAdminAuthModal(true);
      }
    } else {
      setCurrentMode('miniapp');
      window.location.hash = '';
    }
  };

  const handleAdminAuthSuccess = (masterTelegramId: string, isSuper?: boolean) => {
    setAdminAuthUser(masterTelegramId);
    sessionStorage.setItem('lashm_anya_admin_auth', masterTelegramId);
    if (isSuper) {
      setIsSuperAdmin(true);
      sessionStorage.setItem('lashm_anya_is_super_admin', 'true');
    }
    setShowAdminAuthModal(false);

    if (pendingModeSwitch === 'super_admin' || isSuper) {
      setCurrentMode('super_admin');
      window.location.hash = 'superadmin';
    } else {
      setCurrentMode('master_admin');
      window.location.hash = 'admin';
    }
    setPendingModeSwitch(null);
  };

  const handleAdminAuthCancel = () => {
    setShowAdminAuthModal(false);
    setPendingModeSwitch(null);
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('lashm_anya_admin_auth');
    sessionStorage.removeItem('lashm_anya_is_super_admin');
    setAdminAuthUser(null);
    setIsSuperAdmin(false);
    setCurrentMode('miniapp');
    window.location.hash = '';
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?clientId=${selectedClientId}`);
      if (res.ok) {
        const data: AppNotification[] = await res.json();
        setNotifications(data);

        // Check if there is a newly arrived push notification
        if (!initialMountRef.current && data.length > 0) {
          const newest = data[0];
          if (!seenNotificationIdsRef.current.has(newest.id) && newest.status !== 'confirmed') {
            setActivePushNotification(newest);
          }
        }

        // Update seen IDs
        data.forEach(n => seenNotificationIdsRef.current.add(n.id));
        if (initialMountRef.current) {
          initialMountRef.current = false;
        }
      }
    } catch (e) {
      console.error('Failed to load client notifications:', e);
    }
  };

  const handleConfirmAppointment = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' });
      setActivePushNotification(null);
      fetchNotifications();
      fetchInitialData();
    } catch (e) {
      console.error('Error confirming appointment notification:', e);
    }
  };

  const currentSalon = salons.find(s => s.id === activeSalonId) || salons[0];
  const currentClient = clients.find((c) => c.id === selectedClientId) || clients[0] || {
    id: 'c-1',
    telegramId: 'tg-12345678',
    name: 'Анна',
    username: 'anna_novosib',
    phone: '+7 (913) 987-65-43',
    visitCount: 3,
    lastVisitDate: '2026-08-20',
    aiMemory: {
      preferred_result: 'натуральный',
      last_service: 'Ламинирование ресниц',
      next_visit_preference: 'чуть выразительнее',
      important_notes: ['Чувствительные глаза'],
      extracted_at: '2026-08-20',
    },
    notes: 'Очень аккуратная клиентка',
    createdAt: '2026-06-10',
    updatedAt: '2026-08-20',
  };

  const unreadCount = notifications.filter(n => n.status !== 'confirmed').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center space-y-3">
        <SalonLogo size="xl" className="animate-pulse" />
        <p className="font-serif italic text-base text-[#6E6259]">Lashm.anya AI Platform...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ECE6DD] bg-[radial-gradient(#DFD6CA_1px,transparent_1px)] [background-size:20px_20px] flex flex-col text-[#201B17] selection:bg-[#E2D6C6] selection:text-[#201B17] relative">
      
      {/* Real-Time Telegram Push Banner Overlay */}
      <TelegramPushBanner
        notification={activePushNotification}
        onDismiss={() => setActivePushNotification(null)}
        onClick={() => {
          setIsNotificationsOpen(true);
          setActivePushNotification(null);
        }}
        onConfirm={handleConfirmAppointment}
      />

      {/* Global Navigation Header across all modes */}
      <NavigationHeader
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        selectedClientId={selectedClientId}
        onSelectClient={setSelectedClientId}
        clients={clients}
        activeClient={currentClient}
        isChatOpen={isChatOpen}
        onToggleChat={setIsChatOpen}
        unreadNotificationsCount={unreadCount}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => {
          setIsFirstTimeReg(false);
          setIsRegistrationOpen(true);
        }}
        onOpenNewRegistration={() => {
          setIsFirstTimeReg(true);
          setIsRegistrationOpen(true);
        }}
        onOpenRegisterMaster={() => setShowMasterRegModal(true)}
        onOpenBotLinkModal={() => setShowBotLinkModal(true)}
        logoUrl={businessSettings?.logoUrl}
        settings={businessSettings}
        salons={salons}
        activeSalonId={activeSalonId}
        onSelectSalon={handleSwitchSalon}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {currentMode === 'super_admin' ? (
          <SuperAdminPanel
            onSwitchToMasterAdmin={(salonId) => {
              handleSwitchSalon(salonId);
              setCurrentMode('master_admin');
              window.location.hash = 'admin';
            }}
            onSwitchToMiniApp={(salonId) => {
              handleSwitchSalon(salonId);
              setCurrentMode('miniapp');
              window.location.hash = '';
            }}
            onLogout={handleAdminLogout}
          />
        ) : currentMode === 'master_admin' ? (
          <AdminPanel
            onDataChanged={fetchInitialData}
            onSwitchToMiniApp={() => handleSelectMode('miniapp')}
            onSwitchToSuperAdmin={() => handleSelectMode('super_admin')}
            onOpenBotLinkModal={() => setShowBotLinkModal(true)}
            onLogout={handleAdminLogout}
            adminTelegramId={adminAuthUser || currentSalon?.ownerTelegramUsername || 'anya_lash_master'}
            isSuperAdmin={isSuperAdmin}
          />
        ) : (
          <MiniAppView
            currentClient={currentClient}
            businessSettings={businessSettings}
            onRefreshData={fetchInitialData}
            onOpenBot={() => setIsChatOpen(true)}
            onSwitchToAdmin={() => handleSelectMode('master_admin')}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenProfile={() => {
              setIsFirstTimeReg(false);
              setIsRegistrationOpen(true);
            }}
            unreadNotificationsCount={unreadCount}
            initialDiscountCode={appliedDiscountCode}
          />
        )}
      </main>

      {/* Client Mini Registration & Profile Modal */}
      <ClientRegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
        currentClient={isFirstTimeReg ? undefined : currentClient}
        isFirstTime={isFirstTimeReg}
        onClientUpdated={(updatedClient) => {
          fetchInitialData();
          setSelectedClientId(updatedClient.id);
          fetchNotifications();
        }}
      />

      {/* Master Admin / Super Admin Authorization Modal */}
      {showAdminAuthModal && (
        <AdminAuthModal
          initialTab={authModalInitialTab}
          activeSalonName={currentSalon?.settings.name || 'Lashm.anya'}
          activeSalonMaster={currentSalon?.ownerName || 'Анна'}
          activeSalonId={activeSalonId}
          onSuccess={handleAdminAuthSuccess}
          onCancel={handleAdminAuthCancel}
        />
      )}

      {/* Master Registration Onboarding Modal */}
      {showMasterRegModal && (
        <MasterRegistrationModal
          onClose={() => setShowMasterRegModal(false)}
          onSuccess={(newSalon) => {
            setShowMasterRegModal(false);
            setSalons(prev => [newSalon, ...prev]);
            handleSwitchSalon(newSalon.id);
            setCurrentMode('master_admin');
          }}
        />
      )}

      {/* Master Telegram Bot Link & QR Modal */}
      {showBotLinkModal && (
        <MasterBotLinkModal
          settings={businessSettings}
          salon={currentSalon}
          onClose={() => setShowBotLinkModal(false)}
        />
      )}

      {/* Client Notifications & Reminders & Discounts Modal */}
      <ClientNotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        clientName={currentClient.name}
        onConfirmAppointment={handleConfirmAppointment}
        onOpenBookingWithDiscount={(code) => {
          setAppliedDiscountCode(code);
          setIsNotificationsOpen(false);
        }}
        onOpenChat={() => {
          setIsNotificationsOpen(false);
          setIsChatOpen(true);
        }}
      />

      {/* Integrated In-App Gentle Chat Widget with Salon Logo */}
      <GentleChatWidget
        isOpen={isChatOpen}
        onToggle={setIsChatOpen}
        currentClient={currentClient}
        onRefreshData={fetchInitialData}
        allClients={clients}
        onSelectClient={setSelectedClientId}
        onOpenBookingTab={() => {
          handleSelectMode('miniapp');
        }}
      />
    </div>
  );
}
