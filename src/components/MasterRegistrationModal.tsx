import React, { useState } from 'react';
import { 
  Sparkles, 
  Store, 
  User, 
  MapPin, 
  Phone, 
  Send, 
  CheckCircle, 
  X, 
  Bot, 
  Check, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Tag
} from 'lucide-react';
import { BusinessSettings, SalonTenant, SubscriptionPlanId } from '../types.ts';

interface MasterRegistrationModalProps {
  onClose: () => void;
  onSuccess: (newSalon: SalonTenant) => void;
}

export const MasterRegistrationModal: React.FC<MasterRegistrationModalProps> = ({
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [salonName, setSalonName] = useState('');
  const [masterName, setMasterName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [office, setOffice] = useState('');
  const [floor, setFloor] = useState('');
  const [phone, setPhone] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramId, setTelegramId] = useState('');
  const [specialization, setSpecialization] = useState('Топ-лэшмейкер и ламимейкер');
  const [botName, setBotName] = useState('');
  const [themePreset, setThemePreset] = useState<BusinessSettings['themePreset']>('warm_wood');
  const [planId, setPlanId] = useState<SubscriptionPlanId>('pro');

  const [service1Name, setService1Name] = useState('Наращивание ресниц (Классика / 2D)');
  const [service1Price, setService1Price] = useState('2500');
  const [service2Name, setService2Name] = useState('Ламинирование ресниц + Botox');
  const [service2Price, setService2Price] = useState('2000');

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      if (!salonName.trim() || !masterName.trim()) {
        setError('Пожалуйста, введите название салона и имя мастера');
        return;
      }
      if (!botName) {
        setBotName(`@${salonName.replace(/[^a-zA-Z0-9]/g, '') || 'Beauty'}Bot`);
      }
      setStep(2);
    } else if (step === 2) {
      if (!city.trim() || !phone.trim()) {
        setError('Пожалуйста, укажите город и номер телефона');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      salonName: salonName.trim(),
      masterName: masterName.trim(),
      city: city.trim(),
      address: address.trim() || `г. ${city.trim()}`,
      office: office.trim() || 'кабинет',
      floor: floor.trim() || '1 этаж',
      phone: phone.trim(),
      telegramUsername: telegramUsername.trim().replace(/^@/, ''),
      telegramId: telegramId.trim().replace(/^@/, ''),
      specialization: specialization.trim(),
      botName: botName.trim(),
      themePreset,
      planId,
      services: [
        {
          name: service1Name.trim(),
          price: parseInt(service1Price, 10) || 2500,
          durationMinutes: 120,
        },
        {
          name: service2Name.trim(),
          price: parseInt(service2Price, 10) || 2000,
          durationMinutes: 90,
        },
      ],
    };

    try {
      const res = await fetch('/api/masters/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ошибка при регистрации салона');
      }

      onSuccess(data.salon);
    } catch (err: any) {
      setError(err.message || 'Не удалось зарегистрировать салон');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Progress Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Онбординг мастера • Шаг {step} из 4
            </span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {step === 1 && '1. Название салона и мастер'}
            {step === 2 && '2. Город, адрес и контакты'}
            {step === 3 && '3. Прайс-лист и стиль'}
            {step === 4 && '4. Бот и Telegram ID мастера'}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {step === 1 && 'Введите бренд вашей студии и имя мастера для онлайн-записи.'}
            {step === 2 && 'Укажите геолокацию салона и контактные данные для клиенток.'}
            {step === 3 && 'Стартовые услуги и цветовая палитра для вашего Telegram Mini App.'}
            {step === 4 && 'Привязка вашего Telegram ID к персональной админке.'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Step 1: Studio & Master Details */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Название салона / студии <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={salonName}
                  onChange={(e) => setSalonName(e.target.value)}
                  placeholder="Например: Lash Couture, Studio Anya, Brow & Glow"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Имя ведущего мастера <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={masterName}
                  onChange={(e) => setMasterName(e.target.value)}
                  placeholder="Например: Анна, Екатерина Смирнова"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Специализация студии
              </label>
              <input
                type="text"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                placeholder="Топ-лэшмейкер, ламимейкер, LED-наращивание"
                className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>
        )}

        {/* Step 2: Location & Phone */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Город <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Новосибирск, Москва, Санкт-Петербург, Казань..."
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Адрес студии
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ул. Ленина, 10 / ТЦ / БЦ"
                className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Офис / Кабинет
                </label>
                <input
                  type="text"
                  value={office}
                  onChange={(e) => setOffice(e.target.value)}
                  placeholder="офис 48"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1.5">
                  Этаж
                </label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="4 этаж"
                  className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Контактный телефон <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (913) 000-00-00"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Services & Theme */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-3.5 rounded-2xl bg-stone-800/60 border border-stone-700/60 space-y-3">
              <div className="text-xs font-semibold text-amber-300">Стартовый прайс-лист:</div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={service1Name}
                  onChange={(e) => setService1Name(e.target.value)}
                  className="col-span-2 px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white"
                  placeholder="Название услуги 1"
                />
                <input
                  type="number"
                  value={service1Price}
                  onChange={(e) => setService1Price(e.target.value)}
                  className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white"
                  placeholder="₽"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={service2Name}
                  onChange={(e) => setService2Name(e.target.value)}
                  className="col-span-2 px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white"
                  placeholder="Название услуги 2"
                />
                <input
                  type="number"
                  value={service2Price}
                  onChange={(e) => setService2Price(e.target.value)}
                  className="px-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white"
                  placeholder="₽"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-2">
                Цветовая эстетика Mini App:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'warm_wood', name: 'Warm Wood', desc: 'Теплый крафт и орех', bg: 'bg-[#2A2421]' },
                  { id: 'dark_luxury', name: 'Dark Luxury', desc: 'Премиум графит и золото', bg: 'bg-[#18181B]' },
                  { id: 'powder_rose', name: 'Powder Rose', desc: 'Нежная пудра и розовый', bg: 'bg-[#4A2830]' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemePreset(t.id as any)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      themePreset === t.id
                        ? 'border-amber-400 bg-stone-800'
                        : 'border-stone-700 bg-stone-800/40 hover:border-stone-600'
                    }`}
                  >
                    <div className={`w-full h-4 rounded-md ${t.bg} mb-1.5 border border-white/10`} />
                    <div className="text-xs font-medium text-white">{t.name}</div>
                    <div className="text-[10px] text-stone-400">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-2">
                Тарифный план:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPlanId('pro')}
                  className={`p-3 rounded-xl border text-left transition ${
                    planId === 'pro'
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-stone-700 bg-stone-800/40 hover:border-stone-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">PRO Мастер</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">790 ₽/мес</span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">AI-память, бот 24/7 и авто-напоминания</div>
                </button>
                <button
                  type="button"
                  onClick={() => setPlanId('free')}
                  className={`p-3 rounded-xl border text-left transition ${
                    planId === 'free'
                      ? 'border-amber-400 bg-amber-500/10'
                      : 'border-stone-700 bg-stone-800/40 hover:border-stone-600'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Free Trial</span>
                    <span className="text-[10px] bg-stone-700 text-stone-300 px-1.5 py-0.5 rounded">0 ₽</span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1">Базовая запись до 20 клиенток</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Master Telegram & Bot Setup */}
        {step === 4 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-stone-300 space-y-1">
              <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Авторизация и привязка к админке
              </div>
              <p className="text-stone-400 leading-relaxed">
                Укажите ваш Telegram, чтобы главный администратор платформы привязал ваш ID к личной CRM-системе студии.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Ваш Telegram Username (@username)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-stone-500 text-sm">@</span>
                <input
                  type="text"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="anya_lashes"
                  className="w-full pl-8 pr-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Ваш Telegram ID (цифровой ID, если известен):
              </label>
              <input
                type="text"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Например: 700011122 (можно узнать в боте @userinfobot)"
                className="w-full px-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
              <p className="mt-1 text-[11px] text-stone-500">
                Если не знаете свой цифровой ID — оставьте пустым, администратор привяжет его позже.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1.5">
                Желаемое имя вашего клиентского бота:
              </label>
              <div className="relative">
                <Bot className="w-4 h-4 text-stone-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  placeholder="@MyStudioBot"
                  className="w-full pl-10 pr-4 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-stone-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((step - 1) as any)}
              className="py-2.5 px-4 rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800 text-xs font-medium transition"
            >
              ← Назад
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition"
            >
              <span>Далее</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Создание студии...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Создать салон и запустить бота</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
