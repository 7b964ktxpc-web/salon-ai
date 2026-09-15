import React, { useState } from 'react';
import { 
  Sparkles, 
  Upload, 
  X, 
  Check, 
  RotateCcw, 
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { BusinessSettings } from '../types.ts';
import { SalonLogo } from './SalonLogo.tsx';

interface AdminLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: BusinessSettings | null;
  onLogoUpdated: (newLogoUrl?: string) => void;
}

export const AdminLogoModal: React.FC<AdminLogoModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  onLogoUpdated,
}) => {
  const [logoInputUrl, setLogoInputUrl] = useState<string>(currentSettings?.logoUrl || '/assets/lashmanya_logo.jpg');
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets = [
    {
      name: 'Фирменный Lashm.anya',
      desc: 'Оригинальный фото-логотип студии с мягким нюдовым фоном',
      url: '/assets/lashmanya_logo.jpg',
    },
    {
      name: 'Элегантный золотой монохром',
      desc: 'Премиальный минималистичный стиль с акцентом на ресницы',
      url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=400&q=80',
    },
    {
      name: 'Бархатный теплый беж',
      desc: 'Мягкий эстетический акцент взгляда студии',
      url: 'https://images.unsplash.com/photo-1512290900672-1f55a73e4499?auto=format&fit=crop&w=400&q=80',
    },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Пожалуйста, выберите изображение до 5 МБ');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoInputUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            logoUrl: logoInputUrl,
          },
        }),
      });

      if (res.ok) {
        setSuccessMessage('Логотип студии успешно обновлен! ✨');
        onLogoUpdated(logoInputUrl);
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1200);
      }
    } catch (e) {
      console.error('Failed to update logo:', e);
      alert('Ошибка при сохранении логотипа');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setLogoInputUrl('/assets/lashmanya_logo.jpg');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-[#E8E3DA] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8C6D3F]" />
            <h3 className="font-serif text-xl font-medium text-[#232120]">
              Смена логотипа студии
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#8C827A] hover:text-[#232120] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 shadow-2xs animate-slideDown">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
        )}

        {/* Live Multi-Size Preview Bar */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 space-y-3">
          <span className="text-xs font-semibold text-[#8C6D3F] uppercase tracking-wider block">
            Живой предпросмотр логотипа
          </span>

          <div className="flex items-center justify-around py-3 bg-[#FAF8F5] rounded-xl border border-[#F0EBE4] px-2">
            <div className="text-center space-y-1">
              <SalonLogo size="xs" logoUrl={logoInputUrl} />
              <span className="text-[10px] text-[#8C827A] block">24px</span>
            </div>
            <div className="text-center space-y-1">
              <SalonLogo size="sm" logoUrl={logoInputUrl} />
              <span className="text-[10px] text-[#8C827A] block">32px</span>
            </div>
            <div className="text-center space-y-1">
              <SalonLogo size="md" logoUrl={logoInputUrl} />
              <span className="text-[10px] text-[#8C827A] block font-semibold text-[#232120]">Шапка (40px)</span>
            </div>
            <div className="text-center space-y-1">
              <SalonLogo size="lg" logoUrl={logoInputUrl} />
              <span className="text-[10px] text-[#8C827A] block">48px</span>
            </div>
            <div className="text-center space-y-1">
              <SalonLogo size="xl" logoUrl={logoInputUrl} />
              <span className="text-[10px] text-[#8C827A] block">56px</span>
            </div>
          </div>

          {/* Mini Header Simulation */}
          <div className="p-3 bg-[#FAF7F2] border border-[#D8CEBF] rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <SalonLogo size="sm" logoUrl={logoInputUrl} />
              <div>
                <span className="font-serif text-sm font-medium text-[#1F1B18] block leading-none">Lashm.anya</span>
                <span className="text-[9px] text-[#5C5046]">Взгляд без лишнего · Киевская, 27</span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full border border-[#D0C5B6] bg-white text-[#4A3F36]">Студия</span>
          </div>
        </div>

        {/* Upload & Link Controls */}
        <div className="space-y-3 text-xs">
          
          {/* File upload */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#232120] block">
              1. Загрузить файл с устройства:
            </label>
            <div className="flex items-center gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-[#FAF6F0] text-[#483F38] border border-[#DFCFC0] px-4 py-2.5 rounded-xl font-medium cursor-pointer shadow-2xs transition-colors">
                <Upload className="w-4 h-4 text-[#8C6D3F]" />
                <span>Выбрать изображение (PNG, JPG, SVG, WEBP)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Direct URL */}
          <div className="space-y-1.5">
            <label className="font-semibold text-[#232120] block">
              2. Или введите прямую ссылку на картинку:
            </label>
            <input
              type="url"
              value={logoInputUrl}
              onChange={(e) => setLogoInputUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-white border border-[#E5E0D8] rounded-xl px-3.5 py-2 text-xs text-[#232120] focus:outline-none focus:border-[#483F38]"
            />
          </div>

          {/* Presets */}
          <div className="space-y-2 pt-1">
            <label className="font-semibold text-[#232120] block">
              3. Либо выберите готовый фирменный стиль:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {presets.map((p, idx) => (
                <div
                  key={idx}
                  onClick={() => setLogoInputUrl(p.url)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                    logoInputUrl === p.url
                      ? 'bg-white border-[#8C6D3F] ring-1 ring-[#8C6D3F]'
                      : 'bg-white border-[#E5E0D8] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <SalonLogo size="sm" logoUrl={p.url} />
                    <div>
                      <span className="font-medium text-[#232120] block">{p.name}</span>
                      <span className="text-[10px] text-[#8C827A]">{p.desc}</span>
                    </div>
                  </div>
                  {logoInputUrl === p.url && (
                    <Check className="w-4 h-4 text-[#8C6D3F]" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#E8E3DA]">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-[#483F38] hover:bg-[#232120] text-white py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
          >
            {isSaving ? 'Сохранение...' : 'Сохранить и применить логотип'}
          </button>
          
          <button
            onClick={handleResetToDefault}
            className="flex items-center justify-center gap-1.5 bg-white border border-[#D8CEC4] text-[#6E6259] hover:text-[#232120] hover:bg-[#FAF8F5] py-2.5 px-3 rounded-xl text-xs font-medium cursor-pointer"
            title="Восстановить исходный логотип"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить</span>
          </button>

          <button
            onClick={onClose}
            className="bg-white border border-[#D8CEC4] text-[#232120] py-2.5 px-4 rounded-xl text-xs font-medium hover:bg-[#EFECE6] transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
