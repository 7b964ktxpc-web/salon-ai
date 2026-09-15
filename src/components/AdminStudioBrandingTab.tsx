import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Sparkles, 
  Palette, 
  Save, 
  QrCode, 
  ExternalLink, 
  Copy, 
  Check, 
  Share2, 
  Bot, 
  Sliders, 
  CheckCircle2, 
  Plus,
  Compass,
  ArrowRight
} from 'lucide-react';
import { BusinessSettings, StudioPreset } from '../types.ts';
import { SalonLogo } from './SalonLogo.tsx';
import { AdminCreateStudioModal } from './AdminCreateStudioModal.tsx';
import { AdminLogoModal } from './AdminLogoModal.tsx';

interface AdminStudioBrandingTabProps {
  settings: BusinessSettings | null;
  onDataChanged: () => void;
  onOpenLogoModal: () => void;
}

export const AdminStudioBrandingTab: React.FC<AdminStudioBrandingTabProps> = ({
  settings,
  onDataChanged,
  onOpenLogoModal,
}) => {
  const [formData, setFormData] = useState<BusinessSettings>(() => settings || {
    name: 'Lashm.anya',
    masterName: 'Анна',
    specialization: 'Топ-лэшмейкер и ламимейкер',
    tagline: 'Взгляд без лишнего.',
    subtitle: 'Наращивание и ламинирование ресниц в Новосибирске.',
    city: 'Новосибирск',
    address: 'ул. Киевская, 27, офис 48, 4 этаж',
    office: 'офис 48',
    floor: '4 этаж',
    rating: '5.0',
    reviewCount: 14,
    twoGisUrl: 'https://2gis.ru/novosibirsk/firm/70000001110562714',
    phone: '+7 (913) 720-48-27',
    telegramUsername: 'lashm_anya',
    telegramBotName: '@LashmAnyaBot',
    themePreset: 'warm_wood',
    preBookingOnly: true,
    workingHoursDescription: 'Пн–Сб с 10:00 до 19:00 по предварительной записи',
    reminderHoursBefore: 24,
    repeatReminderDays: 28,
    aiBotName: 'Gentle AI',
    aiGreetingMessage: 'Здравствуйте! Я онлайн-ассистент студии. Помогу вам выбрать удобное время.',
    aiPersonalityTone: 'friendly_warm',
  });

  const [presets, setPresets] = useState<StudioPreset[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  useEffect(() => {
    fetch('/api/masters/presets')
      .then(res => res.json())
      .then(data => {
        if (data.presets) {
          setPresets(data.presets);
        }
      })
      .catch(err => console.error('Failed to load presets:', err));
  }, []);

  const handleSwitchPreset = async (presetId: string) => {
    try {
      const res = await fetch('/api/masters/switch-preset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId }),
      });
      const data = await res.json();
      if (data.success) {
        setFormData(data.settings);
        onDataChanged();
      }
    } catch (e) {
      console.error('Failed to switch preset:', e);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: formData }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        onDataChanged();
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Failed to save settings:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const salonSlug = formData.name.toLowerCase().replace(/[^a-zа-я0-9]/gi, '-');
  const botClean = (formData.telegramBotName || '@LashmAnyaBot').replace(/^@/, '');
  const telegramMiniAppUrl = `https://t.me/${botClean}/app?startapp=${salonSlug}`;
  const clientWebUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/?salon=${salonSlug}` 
    : `https://t.me/${botClean}`;

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* Top Banner: Studio Presets Multi-tenant Switcher */}
      <div className="bg-[#FAF7F2] border border-[#E0D6C8] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-[#B08D57] text-white px-2.5 py-0.5 rounded-full">
                Универсальная платформа
              </span>
              <span className="text-xs text-[#6E6259]">
                Быстрое переключение студий и мастеров
              </span>
            </div>
            <h3 className="font-serif text-2xl font-medium text-[#232120] mt-1">
              Профили студий & Демо-салоны
            </h3>
          </div>

          <button
            type="button"
            id="btn-open-create-studio-modal"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-[#483F38] hover:bg-[#232120] text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Создать новый салон</span>
          </button>
        </div>

        {/* Preset Cards Carousel / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {presets.map((preset) => {
            const isActive = formData.name === preset.name;
            return (
              <div
                key={preset.id}
                onClick={() => handleSwitchPreset(preset.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                  isActive
                    ? 'border-[#483F38] bg-white ring-2 ring-[#483F38]/20 shadow-sm'
                    : 'border-[#E5E0D8] bg-white/70 hover:bg-white hover:border-[#D5C9BC]'
                }`}
              >
                {isActive && (
                  <span className="absolute top-3 right-3 text-[10px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-200">
                    Активен ✓
                  </span>
                )}

                <h4 className="font-serif text-lg font-medium text-[#232120]">
                  {preset.name}
                </h4>
                <p className="text-[11px] text-[#6E6259]">
                  Мастер: <strong>{preset.masterName}</strong> · {preset.city}
                </p>
                <p className="text-[11px] text-[#8C827A] mt-1 line-clamp-1">
                  {preset.specialization}
                </p>

                <div className="mt-3 pt-2 border-t border-[#FAF7F2] flex items-center justify-between text-[11px]">
                  <span className="text-[#8C827A]">{preset.address.split(',')[0]}</span>
                  <span className="text-[#483F38] font-medium flex items-center gap-0.5">
                    {isActive ? 'Выбрано' : 'Переключить →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Share & QR Code for Clients */}
      <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-16 h-16 bg-[#FAF7F2] border border-[#D5C9BC] rounded-2xl flex items-center justify-center shrink-0 shadow-2xs">
              <QrCode className="w-9 h-9 text-[#3D352E]" />
            </div>
            <div>
              <h4 className="font-serif text-xl font-medium text-[#232120]">
                Ссылка и QR-код для ваших клиенток
              </h4>
              <p className="text-xs text-[#6E6259] mt-0.5 max-w-md">
                Разместите ссылку в шапке профиля или распечатайте QR-код для визиток студии «{formData.name}».
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <input
              type="text"
              readOnly
              value={telegramMiniAppUrl}
              className="bg-[#FAF8F5] border border-[#E5E0D8] text-xs px-3 py-2 rounded-xl text-[#332A24] font-mono flex-1 md:w-72"
            />
            <button
              type="button"
              onClick={() => handleCopyLink(telegramMiniAppUrl)}
              className="bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#483F38] border border-[#DFCFC0] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Скопировано!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Копировать</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Studio Profile Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs px-4 py-3 rounded-2xl flex items-center gap-2 shadow-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">Настройки студии и брендинга успешно сохранены и применены!</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: General & Master Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Salon Identity */}
            <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 space-y-4 shadow-2xs text-xs">
              <h4 className="font-serif text-xl font-medium text-[#232120]">
                Основные данные мастера и студии
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#332A24] font-medium block mb-1">
                    Название салона / бренда студии *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                    placeholder="Lashm.anya, Velvet Eyes..."
                  />
                </div>

                <div>
                  <label className="text-[#332A24] font-medium block mb-1">
                    Имя мастера *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.masterName || ''}
                    onChange={(e) => setFormData({ ...formData, masterName: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                    placeholder="Анна, Екатерина..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#332A24] font-medium block mb-1">
                    Специализация мастера
                  </label>
                  <input
                    type="text"
                    value={formData.specialization || ''}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                    placeholder="Топ-лэшмейкер, бровист, ламимейкер"
                  />
                </div>

                <div>
                  <label className="text-[#332A24] font-medium block mb-1">
                    Контактный телефон студии *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#332A24] font-medium block mb-1">
                  Слоган студии
                </label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  placeholder="Взгляд без лишнего."
                />
              </div>

              <div>
                <label className="text-[#332A24] font-medium block mb-1">
                  Подзаголовок / Описание для клиенток
                </label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  placeholder="Студия наращивания и ламинирования ресниц..."
                />
              </div>
            </div>

            {/* Address & Navigation */}
            <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 space-y-4 shadow-2xs text-xs">
              <h4 className="font-serif text-xl font-medium text-[#232120]">
                Адрес и геолокация студии
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#332A24] font-medium block mb-1">
                    Город *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  />
                </div>

                <div>
                  <label className="text-[#332A24] font-medium block mb-1">
                    Улица, дом *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[#332A24] font-medium block mb-1">Офис / кабинет</label>
                  <input
                    type="text"
                    value={formData.office}
                    onChange={(e) => setFormData({ ...formData, office: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  />
                </div>

                <div>
                  <label className="text-[#332A24] font-medium block mb-1">Этаж</label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  />
                </div>

                <div>
                  <label className="text-[#332A24] font-medium block mb-1">Рейтинг</label>
                  <input
                    type="text"
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[#332A24] font-medium block mb-1">
                  Ссылка на карточку в 2ГИС или Яндекс Картах
                </label>
                <input
                  type="url"
                  value={formData.twoGisUrl}
                  onChange={(e) => setFormData({ ...formData, twoGisUrl: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  placeholder="https://2gis.ru/..."
                />
              </div>

              <div>
                <label className="text-[#332A24] font-medium block mb-1">
                  Режим работы студии
                </label>
                <input
                  type="text"
                  value={formData.workingHoursDescription}
                  onChange={(e) => setFormData({ ...formData, workingHoursDescription: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                />
              </div>
            </div>

            {/* AI Assistant Configuration */}
            <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 space-y-4 shadow-2xs text-xs">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#B08D57]" />
                <h4 className="font-serif text-xl font-medium text-[#232120]">
                  Персонализация AI-ассистента в Telegram
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[#332A24] font-medium block mb-1">
                    Имя AI-помощника для клиенток
                  </label>
                  <input
                    type="text"
                    value={formData.aiBotName || 'Gentle AI'}
                    onChange={(e) => setFormData({ ...formData, aiBotName: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  />
                </div>

                <div>
                  <label className="text-[#332A24] font-medium block mb-1">
                    Тональность общения
                  </label>
                  <select
                    value={formData.aiPersonalityTone || 'friendly_warm'}
                    onChange={(e) => setFormData({ ...formData, aiPersonalityTone: e.target.value as any })}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  >
                    <option value="friendly_warm">Тёплый и эмпатичный (с сердечками 🤍)</option>
                    <option value="luxury_concierge">Премиальный консьерж-сервис</option>
                    <option value="fast_business">Лаконичный и быстрый</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[#332A24] font-medium block mb-1">
                  Приветственное сообщение бота (/start)
                </label>
                <textarea
                  rows={2}
                  value={formData.aiGreetingMessage || ''}
                  onChange={(e) => setFormData({ ...formData, aiGreetingMessage: e.target.value })}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  placeholder="Здравствуйте! Я онлайн-помощник мастера..."
                />
              </div>
            </div>

          </div>

          {/* Right Column: Visual Style & Logo */}
          <div className="space-y-6">
            
            {/* Logo Card */}
            <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 space-y-4 shadow-2xs text-xs">
              <h4 className="font-serif text-xl font-medium text-[#232120]">
                Логотип студии
              </h4>

              <div className="flex flex-col items-center text-center p-4 bg-[#FAF7F2] rounded-2xl border border-[#EAE3D8]">
                <SalonLogo logoUrl={formData.logoUrl} size="lg" className="shadow-xs mb-3" />
                <span className="font-medium text-[#232120]">{formData.name}</span>
                <span className="text-[11px] text-[#6E6259]">
                  {formData.logoUrl ? 'Собственный логотип' : 'Встроенный бьюти-знак'}
                </span>

                <button
                  type="button"
                  onClick={onOpenLogoModal}
                  className="mt-3 bg-[#483F38] hover:bg-[#232120] text-white px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  Сменить / Загрузить
                </button>
              </div>
            </div>

            {/* Color Palette / Theme */}
            <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 space-y-4 shadow-2xs text-xs">
              <h4 className="font-serif text-xl font-medium text-[#232120]">
                Цветовой стиль интерфейса
              </h4>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, themePreset: 'warm_wood' })}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    formData.themePreset === 'warm_wood' || !formData.themePreset
                      ? 'border-[#483F38] bg-[#FAF3EA] ring-2 ring-[#483F38]/20 font-medium'
                      : 'border-[#E5E0D8] bg-white'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#483F38] shrink-0"></div>
                  <div>
                    <span className="text-xs text-[#232120] block font-semibold">Тёплый кашемир</span>
                    <span className="text-[10px] text-[#8C827A]">Спокойные натуральные тона</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, themePreset: 'powder_rose' })}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    formData.themePreset === 'powder_rose'
                      ? 'border-[#B08D57] bg-[#FDF7F4] ring-2 ring-[#B08D57]/20 font-medium'
                      : 'border-[#E5E0D8] bg-white'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#D4A373] shrink-0"></div>
                  <div>
                    <span className="text-xs text-[#232120] block font-semibold">Пудровая роза</span>
                    <span className="text-[10px] text-[#8C827A]">Нежная женственная палитра</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, themePreset: 'dark_luxury' })}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    formData.themePreset === 'dark_luxury'
                      ? 'border-[#232120] bg-[#F2F0ED] ring-2 ring-[#232120]/20 font-medium'
                      : 'border-[#E5E0D8] bg-white'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-[#1A1A1A] shrink-0"></div>
                  <div>
                    <span className="text-xs text-[#232120] block font-semibold">Тёмный люкс</span>
                    <span className="text-[10px] text-[#8C827A]">Премиальная эстетика</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, themePreset: 'emerald_chic' })}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    formData.themePreset === 'emerald_chic'
                      ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-700/20 font-medium'
                      : 'border-[#E5E0D8] bg-white'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-800 shrink-0"></div>
                  <div>
                    <span className="text-xs text-[#232120] block font-semibold">Изумрудный шик</span>
                    <span className="text-[10px] text-[#8C827A]">Свежий современный стиль</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Save Button Card */}
            <div className="bg-[#FAF7F2] border border-[#E0D6C8] rounded-3xl p-6 space-y-3 shadow-2xs">
              <button
                type="submit"
                id="btn-save-studio-branding-settings"
                disabled={isSaving}
                className="w-full bg-[#483F38] hover:bg-[#232120] text-white py-3.5 rounded-2xl text-xs font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <span>Сохранение...</span>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Сохранить настройки студии</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-[#8C827A] text-center">
                Все изменения мгновенно отобразятся в Mini App и Telegram-боте
              </p>
            </div>

          </div>

        </div>

      </form>

      {/* Create New Studio Modal */}
      <AdminCreateStudioModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newStg) => {
          setFormData(newStg);
          onDataChanged();
        }}
      />

    </div>
  );
};
