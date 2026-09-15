import React, { useState, useEffect } from 'react';
import { X, Gift, Sparkles, Heart, Check, Calendar, Phone, AtSign, User, ShieldCheck } from 'lucide-react';
import { Client } from '../types';

interface ClientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentClient?: Client;
  onClientUpdated: (updatedClient: Client) => void;
  isFirstTime?: boolean;
}

const STYLE_OPTIONS = [
  { id: 'натуральный', label: 'Натуральный', desc: 'Мягкий и незаметный' },
  { id: 'выразительный', label: 'Выразительный', desc: 'Аккуратный объём' },
  { id: 'лисий', label: 'Лисий эффект', desc: 'Удлинение к уголкам' },
  { id: 'мокрый', label: 'Мокрый эффект', desc: 'Трендовые лучики' },
  { id: 'ламинирование', label: 'Ламинирование', desc: 'Свои ресницы + изгиб' },
];

export const ClientRegistrationModal: React.FC<ClientRegistrationModalProps> = ({
  isOpen,
  onClose,
  currentClient,
  onClientUpdated,
  isFirstTime = false,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [preferredStyle, setPreferredStyle] = useState('натуральный');
  const [preferences, setPreferences] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (currentClient) {
      setName(currentClient.name === 'Гость' ? '' : currentClient.name || '');
      setPhone(currentClient.phone || '');
      setUsername(currentClient.username || '');
      setBirthday(currentClient.birthday || '');
      setPreferredStyle(currentClient.preferredStyle || currentClient.aiMemory?.preferred_result || 'натуральный');
      setPreferences(currentClient.preferences || '');
    }
  }, [currentClient, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Пожалуйста, введите ваше имя');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      if (currentClient && currentClient.id && currentClient.id !== 'new') {
        // Update existing client
        const res = await fetch(`/api/clients/${currentClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            username: username.trim().replace(/^@/, ''),
            birthday: birthday || undefined,
            preferredStyle,
            preferences: preferences.trim() || undefined,
            isRegistered: true,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          onClientUpdated(data.client);
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            onClose();
          }, 1500);
        } else {
          const err = await res.json();
          setErrorMessage(err.error || 'Ошибка при сохранении');
        }
      } else {
        // Register new client
        const res = await fetch('/api/clients/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim(),
            username: username.trim().replace(/^@/, ''),
            birthday: birthday || undefined,
            preferredStyle,
            preferences: preferences.trim() || undefined,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          onClientUpdated(data.client);
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            onClose();
          }, 1500);
        } else {
          const err = await res.json();
          setErrorMessage(err.error || 'Ошибка при регистрации');
        }
      }
    } catch (e) {
      console.error('Registration failed:', e);
      setErrorMessage('Не удалось связаться с сервером');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        id="client-registration-modal-card"
        className="bg-[#FAF7F2] w-full max-w-md rounded-3xl border border-[#D9CEBF] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#E8DFC8] bg-[#F5EFEB] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E2D6C6] flex items-center justify-center text-[#232120] font-serif font-bold text-sm">
              LA
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#201B17] tracking-tight">
                {isFirstTime ? 'Регистрация клиента' : 'Профиль клиента'}
              </h2>
              <p className="text-xs text-[#7D7571]">
                {isFirstTime ? 'Студия Lashm.anya' : 'Персонализация и скидки'}
              </p>
            </div>
          </div>
          <button
            id="close-registration-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#7D7571] hover:text-[#201B17] hover:bg-[#E8DFC8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Birthday Discount Promotion Banner */}
          <div className="p-3.5 rounded-2xl bg-[#F5EFEB] border border-[#DFCFC0] shadow-2xs flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E2D6C6] flex items-center justify-center text-[#201B17] shrink-0 mt-0.5">
              <Gift className="w-4 h-4 text-[#7A5A35]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#7A5A35]">
                  Подарок ко Дню рождения
                </h4>
                <span className="px-1.5 py-0.5 rounded-md bg-[#7A5A35] text-white text-[10px] font-bold">
                  -20%
                </span>
              </div>
              <p className="text-xs text-[#544D48] mt-1 leading-relaxed">
                Укажите дату рождения, и мы подарим вам персональную скидку <strong>20% (промокод BIRTHDAY20)</strong> на любую процедуру!
              </p>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {errorMessage}
            </div>
          )}

          {showSuccess ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#E2D6C6] text-[#201B17] flex items-center justify-center shadow-inner">
                <Check className="w-7 h-7 stroke-[2.5]" />
              </div>
              <h3 className="text-lg font-serif font-medium text-[#201B17]">
                Приятно познакомиться, {name}!
              </h3>
              <p className="text-xs text-[#7D7571] max-w-xs mx-auto">
                Ваш профиль сохранён. Мастер и ассистент студии будут обращаться к вам по имени и вовремя поздравлять со скидками.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name field */}
              <div>
                <label className="block text-xs font-medium text-[#544D48] mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#7A5A35]" />
                  <span>Ваше имя <span className="text-red-500">*</span></span>
                </label>
                <input
                  id="client-name-input"
                  type="text"
                  required
                  placeholder="Например: Анна"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CEBF] bg-white text-[#201B17] text-sm focus:outline-none focus:ring-2 focus:ring-[#7A5A35]/30 focus:border-[#7A5A35] placeholder-[#A89F99]"
                />
              </div>

              {/* Birthday field */}
              <div>
                <label className="block text-xs font-medium text-[#544D48] mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#7A5A35]" />
                    <span>День рождения</span>
                  </span>
                  <span className="text-[11px] text-[#7A5A35] font-semibold flex items-center gap-1">
                    Скидка 20%
                  </span>
                </label>
                <input
                  id="client-birthday-input"
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CEBF] bg-white text-[#201B17] text-sm focus:outline-none focus:ring-2 focus:ring-[#7A5A35]/30 focus:border-[#7A5A35]"
                />
              </div>

              {/* Phone field */}
              <div>
                <label className="block text-xs font-medium text-[#544D48] mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#7A5A35]" />
                  <span>Телефон для связи</span>
                </label>
                <input
                  id="client-phone-input"
                  type="tel"
                  placeholder="+7 (913) 000-00-00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CEBF] bg-white text-[#201B17] text-sm focus:outline-none focus:ring-2 focus:ring-[#7A5A35]/30 focus:border-[#7A5A35] placeholder-[#A89F99]"
                />
              </div>

              {/* Telegram Username */}
              <div>
                <label className="block text-xs font-medium text-[#544D48] mb-1.5 flex items-center gap-1.5">
                  <AtSign className="w-3.5 h-3.5 text-[#7A5A35]" />
                  <span>Telegram никнейм (без @)</span>
                </label>
                <input
                  id="client-username-input"
                  type="text"
                  placeholder="anna_nsk"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CEBF] bg-white text-[#201B17] text-sm focus:outline-none focus:ring-2 focus:ring-[#7A5A35]/30 focus:border-[#7A5A35] placeholder-[#A89F99]"
                />
              </div>

              {/* Preferred Style */}
              <div>
                <label className="block text-xs font-medium text-[#544D48] mb-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-[#7A5A35]" />
                  <span>Любимый эффект взгляда</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_OPTIONS.map((opt) => {
                    const isSelected = preferredStyle.toLowerCase().includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPreferredStyle(opt.id)}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#201B17] text-[#FAF7F2] border-[#201B17] shadow-sm'
                            : 'bg-white text-[#544D48] border-[#D9CEBF] hover:border-[#7A5A35]'
                        }`}
                      >
                        <div className="text-xs font-medium">{opt.label}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-[#D9CEBF]' : 'text-[#8C847E]'}`}>
                          {opt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special notes / allergies */}
              <div>
                <label className="block text-xs font-medium text-[#544D48] mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#7A5A35]" />
                  <span>Особенности (линзы, чувствительные глаза)</span>
                </label>
                <input
                  id="client-notes-input"
                  type="text"
                  placeholder="Например: ношу линзы, чувствительность к яркому свету"
                  value={preferences}
                  onChange={(e) => setPreferences(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#D9CEBF] bg-white text-[#201B17] text-sm focus:outline-none focus:ring-2 focus:ring-[#7A5A35]/30 focus:border-[#7A5A35] placeholder-[#A89F99]"
                />
              </div>

              <div className="pt-2">
                <button
                  id="save-client-registration-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-[#201B17] text-[#FAF7F2] font-medium text-sm hover:bg-[#342D27] active:scale-[0.99] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    'Сохранение...'
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Сохранить профиль</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
