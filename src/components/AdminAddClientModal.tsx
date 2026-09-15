import React, { useState } from 'react';
import { Users, X, Check, Sparkles, UserPlus } from 'lucide-react';
import { Client } from '../types.ts';

interface AdminAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (client: Client) => void;
}

export const AdminAddClientModal: React.FC<AdminAddClientModalProps> = ({
  isOpen,
  onClose,
  onClientAdded,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState('');
  const [preferredStyle, setPreferredStyle] = useState('натуральный');
  const [initialNote, setInitialNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Пожалуйста, введите имя клиентки');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          username: username.trim().replace(/^@/, '') || undefined,
          birthday: birthday.trim() || undefined,
          preferredStyle: preferredStyle.trim() || undefined,
          notes: initialNote.trim() || undefined,
          telegramId: username.trim().replace(/^@/, '') || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onClientAdded(data.client);
        onClose();
      } else {
        alert('Ошибка при добавлении клиента');
      }
    } catch (e) {
      console.error('Failed to add client:', e);
      alert('Ошибка при добавлении клиента');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
        
        <div className="flex justify-between items-center border-b border-[#E8E3DA] pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#8C6D3F]" />
            <h3 className="font-serif text-xl font-medium text-[#232120]">
              Новый клиент в базу
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-[#8C827A] hover:text-[#232120] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="text-[#232120] font-semibold block mb-1">Имя клиентки *:</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Анастасия"
              className="w-full bg-white border border-[#E5E0D8] rounded-xl px-3.5 py-2 text-xs text-[#232120] focus:outline-none focus:border-[#483F38]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[#6E6259] block mb-1">Телефон:</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className="w-full bg-white border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
              />
            </div>
            <div>
              <label className="text-[#6E6259] block mb-1">Telegram username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                className="w-full bg-white border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[#6E6259] block mb-1">Дата рождения:</label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                className="w-full bg-white border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
              />
            </div>
            <div>
              <label className="text-[#6E6259] block mb-1">Предпочтение:</label>
              <select
                value={preferredStyle}
                onChange={(e) => setPreferredStyle(e.target.value)}
                className="w-full bg-white border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120]"
              >
                <option value="натуральный">Натуральный (Изгиб C)</option>
                <option value="выразительный">Выразительный (2D / Изгиб D)</option>
                <option value="лисий эффект">Лисий эффект (Изгиб L/M)</option>
                <option value="мокрый эффект">Мокрый эффект</option>
                <option value="ламинирование">Ламинирование ресниц</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[#6E6259] block mb-1">Начальная заметка мастера (AI-память):</label>
            <textarea
              rows={2}
              value={initialNote}
              onChange={(e) => setInitialNote(e.target.value)}
              placeholder="Чувствительность глаз, ношение линз, любимый изгиб..."
              className="w-full bg-white border border-[#E5E0D8] rounded-xl p-2.5 text-xs text-[#232120]"
            />
          </div>

          <div className="flex gap-2 pt-2 border-t border-[#E8E3DA]">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#483F38] hover:bg-[#232120] text-white py-2.5 rounded-xl font-medium cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Добавление...' : 'Добавить клиентку'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white border border-[#D8CEC4] text-[#232120] py-2.5 rounded-xl font-medium cursor-pointer hover:bg-[#EFECE6]"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
