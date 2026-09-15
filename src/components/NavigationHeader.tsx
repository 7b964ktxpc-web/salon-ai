import React, { useState } from 'react';
import { 
  ExternalLink, 
  Bell, 
  User, 
  Sparkles, 
  Crown, 
  Store, 
  Bot, 
  Key, 
  ChevronDown, 
  Plus, 
  Shield, 
  Smartphone,
  Check
} from 'lucide-react';
import { SalonLogo } from './SalonLogo.tsx';
import { Client, BusinessSettings, SalonTenant } from '../types.ts';

export type AppMode = 'miniapp' | 'master_admin' | 'super_admin';

interface NavigationHeaderProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  selectedClientId: string;
  onSelectClient: (clientId: string) => void;
  clients: Client[];
  activeClient?: Client;
  isChatOpen?: boolean;
  onToggleChat?: (open: boolean) => void;
  unreadNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
  onOpenNewRegistration?: () => void;
  onOpenRegisterMaster?: () => void;
  onOpenBotLinkModal?: () => void;
  logoUrl?: string;
  settings?: BusinessSettings | null;
  salons?: SalonTenant[];
  activeSalonId?: string;
  onSelectSalon?: (salonId: string) => void;
  isSuperAdmin?: boolean;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  currentMode,
  onSelectMode,
  selectedClientId,
  onSelectClient,
  clients,
  activeClient,
  isChatOpen,
  onToggleChat,
  unreadNotificationsCount = 2,
  onOpenNotifications,
  onOpenProfile,
  onOpenNewRegistration,
  onOpenRegisterMaster,
  onOpenBotLinkModal,
  logoUrl,
  settings,
  salons = [],
  activeSalonId,
  onSelectSalon,
  isSuperAdmin,
}) => {
  const [salonDropdownOpen, setSalonDropdownOpen] = useState(false);

  const currentClientName = activeClient?.name || clients.find(c => c.id === selectedClientId)?.name || 'Гость';
  const hasBirthday = Boolean(activeClient?.birthday);
  const salonName = settings?.name || 'Lashm.anya';
  const masterName = settings?.masterName ? ` · ${settings.masterName}` : '';
  const locationSubtitle = settings 
    ? `${settings.city || 'Новосибирск'}, ${settings.address || 'ул. Киевская, 27'}`
    : 'Взгляд без лишнего · Новосибирск, Киевская, 27';
  const ratingText = settings?.rating ? `${settings.rating} ★` : '5.0 ★';
  const twoGisLink = settings?.twoGisUrl || '';

  const activeSalon = salons.find(s => s.id === activeSalonId) || salons[0];
  const pendingCount = salons.filter(s => s.status === 'pending_id_link' || !s.isIdVerified).length;

  return (
    <header className="border-b border-[#D8CEBF] bg-[#FAF7F2]/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Control Bar: Multi-Tenant Switcher & Mode Switcher */}
        <div className="py-2 border-b border-[#EBE3D7] flex flex-wrap items-center justify-between gap-2 text-xs">
          
          {/* Left: Active Salon Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSalonDropdownOpen(!salonDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5EFE6] text-[#2C241E] border border-[#D5C9BC] font-medium shadow-2xs transition"
            >
              <Store className="w-3.5 h-3.5 text-[#B08D57]" />
              <span className="font-semibold">{activeSalon ? activeSalon.settings.name : salonName}</span>
              <span className="text-[11px] text-[#7A6E65]">({activeSalon ? activeSalon.settings.city : 'Новосибирск'})</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#8C7E72] transition-transform ${salonDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {salonDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-72 rounded-2xl bg-white border border-[#D5C9BC] shadow-xl p-2 z-50 animate-fadeIn">
                <div className="px-2.5 py-1.5 text-[10px] font-bold text-[#8C7E72] uppercase tracking-wider">
                  Выберите салон / мастера:
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {salons.map((s) => {
                    const isSelected = s.id === (activeSalonId || activeSalon?.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          if (onSelectSalon) onSelectSalon(s.id);
                          setSalonDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                          isSelected ? 'bg-[#F2EAE0] text-[#1F1B18] font-semibold' : 'hover:bg-[#FAF6F0] text-[#4A3F36]'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium flex items-center gap-1.5">
                            <span>{s.settings.name}</span>
                            {s.subscription.planId === 'pro' && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-[#B08D57]/20 text-[#846328] rounded font-bold">PRO</span>
                            )}
                            {s.subscription.planId === 'studio' && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-800 rounded font-bold">VIP</span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#7A6E65]">{s.ownerName} • {s.settings.city}</div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#B08D57]" />}
                      </button>
                    );
                  })}
                </div>

                {onOpenRegisterMaster && (
                  <div className="pt-2 mt-1 border-t border-[#EBE3D7]">
                    <button
                      onClick={() => {
                        onOpenRegisterMaster();
                        setSalonDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#231F1D] text-white hover:bg-[#38322E] text-xs font-semibold transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#E6CA9E]" />
                      <span>+ Подключить новый салон</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Center/Right: App Mode Switchers (Mini App vs Master Admin vs Super Admin) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* 1. Client Mini App Button for this salon */}
            <button
              onClick={() => onSelectMode('miniapp')}
              className={`py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition text-xs font-medium ${
                currentMode === 'miniapp'
                  ? 'bg-[#2E2824] text-white shadow-xs font-semibold'
                  : 'bg-white hover:bg-[#F2EAE0] text-[#4A3F36] border border-[#D5C9BC]'
              }`}
              title="Клиентский Telegram Mini App для клиенток салона"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#C9A96E]" />
              <span>Клиентский Mini App</span>
            </button>

            {/* 2. Master Salon Admin Button */}
            <button
              onClick={() => onSelectMode('master_admin')}
              className={`py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition text-xs font-medium ${
                currentMode === 'master_admin'
                  ? 'bg-[#2E2824] text-white shadow-xs font-semibold'
                  : 'bg-white hover:bg-[#F2EAE0] text-[#4A3F36] border border-[#D5C9BC]'
              }`}
              title="Изолированный CRM-кабинет мастера студии"
            >
              <Store className="w-3.5 h-3.5 text-[#B08D57]" />
              <span>Админка мастера</span>
            </button>

            {/* 3. Platform Super Admin Button (Only for Platform Owner) */}
            <button
              onClick={() => onSelectMode('super_admin')}
              className={`py-1.5 px-3 rounded-xl flex items-center gap-1.5 transition text-xs font-semibold relative ${
                currentMode === 'super_admin'
                  ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-md shadow-amber-600/20'
                  : isSuperAdmin
                    ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border border-amber-500/50'
                    : 'bg-white hover:bg-amber-50 text-amber-900 border border-amber-200/80'
              }`}
              title={isSuperAdmin ? "Главная админка платформы (Супер Админ)" : "Вход только для Главного Администратора (Владельца)"}
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>{isSuperAdmin ? '👑 Главная админка' : 'Главный админ'}</span>
              {pendingCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title={`${pendingCount} заявок на привязку ID`} />
              )}
            </button>

            {/* Link to Master's Bot Modal */}
            {onOpenBotLinkModal && (
              <button
                onClick={onOpenBotLinkModal}
                className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#F2EAE0] text-[#4A3F36] border border-[#D5C9BC] transition text-xs flex items-center gap-1"
                title="Персональная ссылка и QR на Telegram-бота для клиенток этого салона"
              >
                <Bot className="w-3.5 h-3.5 text-sky-600" />
                <span className="hidden md:inline">Бот салона</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Header Brand Row (Visible in Mini App and throughout) */}
        <div className="flex flex-col sm:flex-row items-center justify-between py-2.5 gap-3">
          
          {/* Brand & Salon Logo */}
          <div className="flex items-center gap-3">
            <SalonLogo size="md" logoUrl={logoUrl || settings?.logoUrl} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl tracking-tight text-[#1F1B18] font-medium">{salonName}</span>
                <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full border border-[#D0C5B6] bg-white text-[#4A3F36] font-medium shadow-2xs">
                  {settings?.specialization ? settings.specialization.split(' ')[0] : 'Студия'}
                </span>
              </div>
              <p className="text-xs text-[#5C5046] font-normal hidden sm:block">{locationSubtitle}{masterName}</p>
            </div>
          </div>

          {/* Action Center: Profile, Notifications, 2GIS Link */}
          <div className="flex items-center gap-2 flex-wrap justify-center">

            {/* Client Profile Trigger */}
            {onOpenProfile && (
              <button
                id="btn-header-profile"
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-[#F7F2EA] text-[#232120] border border-[#D5C9BC] transition-all text-xs font-medium shadow-2xs cursor-pointer group"
                title="Личный профиль и скидки"
              >
                <div className="w-5 h-5 rounded-full bg-[#EFE8DE] flex items-center justify-center text-[#544D48] group-hover:text-[#232120]">
                  <User className="w-3.5 h-3.5" />
                </div>
                <span className="max-w-[110px] truncate">{currentClientName}</span>
                {hasBirthday && (
                  <span className="text-[10px] text-[#7A5A35] font-semibold bg-[#F5EFEB] px-1.5 py-0.5 rounded-md border border-[#E2D6C6]">
                    ДР: {activeClient?.birthday?.slice(5).replace('-', '.')}
                  </span>
                )}
              </button>
            )}

            {/* Notification Center Trigger with Badge */}
            {onOpenNotifications && (
              <button
                id="btn-header-notifications"
                onClick={onOpenNotifications}
                className="relative flex items-center justify-center w-8.5 h-8.5 rounded-xl bg-white hover:bg-[#F7F2EA] text-[#332A24] border border-[#D5C9BC] transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                title="Уведомления и скидки"
              >
                <Bell className="w-4 h-4 text-[#483F38]" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#B08D57] text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {twoGisLink && (
              <a
                id="link-2gis"
                href={twoGisLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1 text-xs text-[#6E6259] hover:text-[#232120] transition-colors border-l border-[#E5E0D8] pl-2.5"
              >
                <span>{ratingText}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
