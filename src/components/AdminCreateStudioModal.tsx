import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Palette, 
  Check, 
  Zap,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { BusinessSettings, SubscriptionPlanId } from '../types.ts';

interface AdminCreateStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newSettings: BusinessSettings) => void;
}

export const AdminCreateStudioModal: React.FC<AdminCreateStudioModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [salonName, setSalonName] = useState('');
  const [masterName, setMasterName] = useState('');
  const [specialization, setSpecialization] = useState('Топ-лэшмейкер и ламимейкер');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [office, setOffice] = useState('кабинет 12');
  const [floor, setFloor] = useState('2 этаж');
  const [phone, setPhone] = useState('+7 (9');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [themePreset, setThemePreset] = useState<BusinessSettings['themePreset']>('warm_wood');
  const [planId, setPlanId] = useState<SubscriptionPlanId>('pro');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salonName.trim() || !masterName.trim() || !city.trim() || !address.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/masters/create-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salonName,
          masterName,
          specialization,
          city,
          address,
          office,
          floor,
          phone,
          telegramUsername,
          themePreset,
          planId,
          services: [
            {
              name: `Наращивание ресниц (${masterName})`,
              price: 2500,
              durationMinutes: 120,
              description: 'Индивидуальный подбор изгиба и эффекта под особенности вашего взгляда.',
            },
            {
              name: `Ламинирование ресниц + Botox`,
              price: 2000,
              durationMinutes: 90,
              description: 'Уход, выразительный завиток и питание натуральных ресниц.',
            },
          ],
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.settings);
        onClose();
      }
    } catch (e) {
      console.error('Failed to create studio:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FAF7F2] border border-[#D8CEBF] rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3D352E] to-[#251E19] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#D5C9BC] hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider bg-white/15 text-[#F2EAE0] px-2.5 py-0.5 rounded-full border border-white/20">
              Мастер & Студия
            </span>
            <span className="text-[11px] font-semibold bg-[#B08D57] text-white px-2 py-0.5 rounded-full">
              Запуск за 2 минуты
            </span>
          </div>

          <h3 className="font-serif text-2xl font-medium text-[#FAF7F2]">
            Создать свой салон / Кабинет мастера
          </h3>
          <p className="text-xs text-[#D8CEBF] mt-1">
            Введите свои данные, и система автоматически создаст персональный Telegram Mini App и онлайн-запись.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          
          {step === 1 ? (
            <div className="space-y-4">
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 space-y-3 shadow-2xs">
                <span className="text-[11px] font-semibold text-[#6E6259] uppercase tracking-wider block">
                  1. Бренд и мастер
                </span>

                <div>
                  <label className="text-[#332A24] font-medium block mb-1">
                    Название салона / бренда студии *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Например: Velvet Eyes Studio, Lash Room"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#332A24] font-medium block mb-1">
                      Имя мастера *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Например: Алина, Екатерина"
                      value={masterName}
                      onChange={(e) => setMasterName(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                    />
                  </div>

                  <div>
                    <label className="text-[#332A24] font-medium block mb-1">
                      Специализация
                    </label>
                    <input
                      type="text"
                      placeholder="Топ-лэшмейкер, бровист"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 space-y-3 shadow-2xs">
                <span className="text-[11px] font-semibold text-[#6E6259] uppercase tracking-wider block">
                  2. Геолокация и контакты
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#332A24] font-medium block mb-1">
                      Город *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Москва, Новосибирск, Казань"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                    />
                  </div>

                  <div>
                    <label className="text-[#332A24] font-medium block mb-1">
                      Телефон для связи *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+7 (999) 000-00-00"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#332A24] font-medium block mb-1">
                    Улица и дом *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ул. Ленина, 15"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#332A24] font-medium block mb-1">Офис / кабинет</label>
                    <input
                      type="text"
                      placeholder="офис 304"
                      value={office}
                      onChange={(e) => setOffice(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                    />
                  </div>
                  <div>
                    <label className="text-[#332A24] font-medium block mb-1">Этаж</label>
                    <input
                      type="text"
                      placeholder="3 этаж"
                      value={floor}
                      onChange={(e) => setFloor(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[#332A24] font-medium block mb-1">
                    Telegram аккаунт мастера (без @)
                  </label>
                  <input
                    type="text"
                    placeholder="master_beauty"
                    value={telegramUsername}
                    onChange={(e) => setTelegramUsername(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (salonName.trim() && masterName.trim() && city.trim() && address.trim()) {
                    setStep(2);
                  }
                }}
                disabled={!salonName.trim() || !masterName.trim() || !city.trim() || !address.trim()}
                className="w-full bg-[#483F38] hover:bg-[#232120] text-white py-3 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>Далее: Выбор темы и тарифа</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Step 2: Visual Style & Subscription Plan */}
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 space-y-3 shadow-2xs">
                <span className="text-[11px] font-semibold text-[#6E6259] uppercase tracking-wider block">
                  3. Фирменный стиль студии
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setThemePreset('warm_wood')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      themePreset === 'warm_wood'
                        ? 'border-[#483F38] bg-[#FAF3EA] ring-2 ring-[#483F38]/20 font-medium'
                        : 'border-[#E5E0D8] bg-white'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-[#483F38] mb-1"></div>
                    <span className="text-xs text-[#232120] block">Тёплый кашемир</span>
                    <span className="text-[10px] text-[#8C827A]">Спокойные натуральные тона</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThemePreset('powder_rose')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      themePreset === 'powder_rose'
                        ? 'border-[#B08D57] bg-[#FDF7F4] ring-2 ring-[#B08D57]/20 font-medium'
                        : 'border-[#E5E0D8] bg-white'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-[#D4A373] mb-1"></div>
                    <span className="text-xs text-[#232120] block">Пудровая роза</span>
                    <span className="text-[10px] text-[#8C827A]">Нежная женственная палитра</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThemePreset('dark_luxury')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      themePreset === 'dark_luxury'
                        ? 'border-[#232120] bg-[#F2F0ED] ring-2 ring-[#232120]/20 font-medium'
                        : 'border-[#E5E0D8] bg-white'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-[#1A1A1A] mb-1"></div>
                    <span className="text-xs text-[#232120] block">Тёмный люкс</span>
                    <span className="text-[10px] text-[#8C827A]">Премиальная эстетика</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setThemePreset('emerald_chic')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      themePreset === 'emerald_chic'
                        ? 'border-emerald-700 bg-emerald-50 ring-2 ring-emerald-700/20 font-medium'
                        : 'border-[#E5E0D8] bg-white'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-emerald-800 mb-1"></div>
                    <span className="text-xs text-[#232120] block">Изумрудный шик</span>
                    <span className="text-[10px] text-[#8C827A]">Свежий современный стиль</span>
                  </button>
                </div>
              </div>

              {/* Subscription Tier Choice */}
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 space-y-3 shadow-2xs">
                <span className="text-[11px] font-semibold text-[#6E6259] uppercase tracking-wider block">
                  4. Стартовый тариф подписки
                </span>

                <div className="space-y-2">
                  <label
                    onClick={() => setPlanId('pro')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      planId === 'pro'
                        ? 'border-[#483F38] bg-[#FAF3EA] ring-2 ring-[#483F38]/20'
                        : 'border-[#E5E0D8] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#B08D57] flex items-center justify-center text-white">
                        {planId === 'pro' && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <span className="font-semibold text-[#232120] block">PRO Мастер (Рекомендуется)</span>
                        <span className="text-[11px] text-[#6E6259]">AI-ассистент 24/7, авто-напоминания и промокоды</span>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-[#232120]">790 ₽/мес</span>
                  </label>

                  <label
                    onClick={() => setPlanId('free')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      planId === 'free'
                        ? 'border-[#483F38] bg-[#FAF3EA] ring-2 ring-[#483F38]/20'
                        : 'border-[#E5E0D8] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#8C827A] flex items-center justify-center text-white">
                        {planId === 'free' && <Check className="w-3 h-3" />}
                      </div>
                      <div>
                        <span className="font-semibold text-[#232120] block">Старт (Free Trial)</span>
                        <span className="text-[11px] text-[#6E6259]">Базовая запись до 20 клиенток</span>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-[#232120]">0 ₽</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 bg-white hover:bg-[#FAF8F5] text-[#483F38] border border-[#D5C9BC] py-3 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Назад
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 bg-gradient-to-r from-[#483F38] to-[#251E19] hover:from-[#332A24] hover:to-[#1A1512] text-white py-3 rounded-xl text-xs font-semibold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Создание студии...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Запустить студию</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};
