import React, { useState } from 'react';
import { 
  X, 
  Tag, 
  Sparkles, 
  Calendar, 
  Users, 
  Check, 
  AlertCircle,
  Percent,
  Coins,
  Send,
  Layers
} from 'lucide-react';
import { DiscountCampaign, Client, Service } from '../types.ts';

interface AdminCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: DiscountCampaign | null; // if provided, we are editing; else creating
  clients: Client[];
  services: Service[];
  onSaved: (campaign: DiscountCampaign) => void;
}

export const AdminCampaignModal: React.FC<AdminCampaignModalProps> = ({
  isOpen,
  onClose,
  campaign,
  clients,
  services,
  onSaved,
}) => {
  const isEditing = !!campaign;

  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>(
    campaign?.discountAmount ? 'fixed' : 'percent'
  );
  const [title, setTitle] = useState(campaign?.title || '');
  const [description, setDescription] = useState(campaign?.description || '');
  const [discountPercent, setDiscountPercent] = useState<number>(campaign?.discountPercent || 15);
  const [discountAmount, setDiscountAmount] = useState<number>(campaign?.discountAmount || 500);
  const [code, setCode] = useState(campaign?.code || '');
  const [targetAudience, setTargetAudience] = useState<DiscountCampaign['targetAudience']>(
    campaign?.targetAudience || 'all'
  );
  const [targetClientId, setTargetClientId] = useState<string>(campaign?.targetClientId || '');
  const [serviceId, setServiceId] = useState<string>(campaign?.serviceId || '');
  const [validUntil, setValidUntil] = useState<string>(
    campaign?.validUntil || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [maxUses, setMaxUses] = useState<string>(campaign?.maxUses ? String(campaign?.maxUses) : '');
  const [isActive, setIsActive] = useState<boolean>(campaign?.isActive !== undefined ? campaign.isActive : true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const generatePromoCode = () => {
    const prefixes = ['LASH', 'BEAUTY', 'GLAM', 'CARE', 'LASHM'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = discountType === 'percent' ? discountPercent : (discountAmount >= 1000 ? `${discountAmount / 1000}K` : discountAmount);
    setCode(`${prefix}${num}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Укажите название акции');
      return;
    }
    if (!code.trim()) {
      setError('Укажите промокод');
      return;
    }
    if (discountType === 'percent' && (discountPercent <= 0 || discountPercent > 100)) {
      setError('Процент скидки должен быть от 1 до 100%');
      return;
    }
    if (discountType === 'fixed' && discountAmount <= 0) {
      setError('Сумма скидки должна быть больше 0 ₽');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      discountPercent: discountType === 'percent' ? Number(discountPercent) : 0,
      discountAmount: discountType === 'fixed' ? Number(discountAmount) : null,
      code: code.trim().toUpperCase(),
      targetAudience,
      targetClientId: targetAudience === 'specific_client' ? targetClientId : undefined,
      serviceId: serviceId || undefined,
      validUntil,
      maxUses: maxUses ? parseInt(maxUses, 10) : undefined,
      isActive,
    };

    try {
      const url = isEditing ? `/api/discounts/${campaign.id}` : '/api/discounts';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Ошибка при сохранении акции');
      }

      const savedItem = isEditing ? data.campaign : data;
      onSaved(savedItem);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Не удалось сохранить акцию');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-[#FFFFFF] border border-[#E5E0D8] rounded-3xl w-full max-w-xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 relative text-[#232120]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#EFECE6]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF6F0] border border-[#E8DCCF] flex items-center justify-center text-[#B08D57]">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-medium text-[#232120]">
                {isEditing ? 'Редактировать акцию / промокод' : 'Новая акция или промокод'}
              </h3>
              <p className="text-xs text-[#6E6259] mt-0.5">
                {isEditing ? 'Обновите условия, размер скидки или срок' : 'Создайте спецпредложение для Telegram-рассылок и онлайн-записи'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-[#EFECE6] flex items-center justify-center text-[#8C827A] hover:text-[#232120] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#483F38] uppercase tracking-wider mb-1.5">
              Название акции *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="например: Скидка 15% на повторный визит"
              className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs text-[#232120] focus:outline-none focus:border-[#483F38] focus:bg-white"
              required
            />
          </div>

          {/* Discount Type and Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#483F38] uppercase tracking-wider mb-1.5">
                Тип скидки
              </label>
              <div className="grid grid-cols-2 gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#E5E0D8]">
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    discountType === 'percent'
                      ? 'bg-white text-[#232120] shadow-xs border border-[#E0D7CD]'
                      : 'text-[#6E6259] hover:text-[#232120]'
                  }`}
                >
                  <Percent className="w-3.5 h-3.5 text-[#B08D57]" />
                  <span>Процент (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('fixed')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    discountType === 'fixed'
                      ? 'bg-white text-[#232120] shadow-xs border border-[#E0D7CD]'
                      : 'text-[#6E6259] hover:text-[#232120]'
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-[#B08D57]" />
                  <span>Фиксир. (₽)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#483F38] uppercase tracking-wider mb-1.5">
                {discountType === 'percent' ? 'Размер скидки (%) *' : 'Сумма скидки (₽) *'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={discountType === 'percent' ? 100 : 50000}
                  value={discountType === 'percent' ? discountPercent : discountAmount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (discountType === 'percent') setDiscountPercent(val);
                    else setDiscountAmount(val);
                  }}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs text-[#232120] font-medium focus:outline-none focus:border-[#483F38] focus:bg-white"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-[#8C827A] font-semibold">
                  {discountType === 'percent' ? '%' : '₽'}
                </span>
              </div>
            </div>
          </div>

          {/* Promo Code with Auto-generator */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#483F38] uppercase tracking-wider">
                Промокод (код купона) *
              </label>
              <button
                type="button"
                onClick={generatePromoCode}
                className="text-[11px] text-[#B08D57] hover:text-[#785E3A] font-medium cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Сгенерировать код</span>
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="например: REPEAT15, SPRING2026, VIP10"
                className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3.5 py-2.5 text-xs font-mono font-semibold tracking-wider text-[#232120] focus:outline-none focus:border-[#483F38] focus:bg-white uppercase"
                required
              />
            </div>
          </div>

          {/* Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#483F38] uppercase tracking-wider mb-1.5">
                Целевая аудитория
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2.5 text-xs text-[#232120] focus:outline-none focus:border-[#483F38] focus:bg-white cursor-pointer"
              >
                <option value="all">Все клиентки студии</option>
                <option value="repeat_needed">Постоянные (прошло более 3-4 недель)</option>
                <option value="new_clients">Новые клиентки (первый визит)</option>
                <option value="inactive_30_days">Не посещали более 30 дней</option>
                <option value="specific_client">Персонально для конкретной клиентки</option>
              </select>
            </div>

            {targetAudience === 'specific_client' ? (
              <div>
                <label className="block text-xs font-semibold text-[#483F38] uppercase tracking-wider mb-1.5">
                  Выберите клиентку
                </label>
                <select
                  value={targetClientId}
                  onChange={(e) => setTargetClientId(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2.5 text-xs text-[#232120] focus:outline-none focus:border-[#483F38] focus:bg-white cursor-pointer"
                  required
                >
                  <option value="">-- Выберите из базы --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone || c.username || c.id})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-[#483F38] uppercase tracking-wider mb-1.5">
                  Привязать к услуге (необязательно)
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2.5 text-xs text-[#232120] focus:outline-none focus:border-[#483F38] focus:bg-white cursor-pointer"
                >
                  <option value="">Любая услуга студии</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Valid until and max uses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#483F38] uppercase tracking-wider mb-1.5">
                Действует до
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#232120] focus:outline-none focus:border-[#483F38] focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#483F38] uppercase tracking-wider mb-1.5">
                Лимит использований (опц.)
              </label>
              <input
                type="number"
                min="1"
                placeholder="Без ограничений"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2.5 text-xs text-[#232120] focus:outline-none focus:border-[#483F38] focus:bg-white"
              />
            </div>
          </div>

          {/* Description / Message for Client */}
          <div>
            <label className="block text-xs font-semibold text-[#483F38] uppercase tracking-wider mb-1.5">
              Описание / Текст для Telegram-уведомления
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Специальное предложение от студии Lashm.anya: скидка на обновление ресниц..."
              className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs text-[#232120] focus:outline-none focus:border-[#483F38] focus:bg-white leading-relaxed resize-none"
            />
          </div>

          {/* Active status checkbox */}
          <div className="flex items-center gap-3 pt-1">
            <label className="flex items-center gap-2 text-xs text-[#483F38] font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-[#D4C8B8] text-[#483F38] focus:ring-[#483F38] cursor-pointer"
              />
              <span>Акция активна (промокод доступен для применения)</span>
            </label>
          </div>

          {/* Live Preview of the Offer Card */}
          <div className="pt-2">
            <span className="block text-[11px] font-semibold text-[#8C827A] uppercase tracking-wider mb-1.5">
              Предпросмотр карточки акции:
            </span>
            <div className="bg-[#FAF6F0] border border-[#E8DCCF] rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-[#8C6D3F] border border-[#E2D8CC] shadow-2xs">
                  {discountType === 'percent' ? `Скидка -${discountPercent}%` : `Скидка -${discountAmount} ₽`}
                </span>
                <span className="text-[10px] text-[#8C827A]">до {validUntil}</span>
              </div>
              <h4 className="font-serif text-sm font-semibold text-[#232120]">
                {title || 'Название акции'}
              </h4>
              <p className="text-[11px] text-[#6E6259] line-clamp-2">
                {description || 'Описание акции и условия применения для клиенток.'}
              </p>
              <div className="bg-white border border-[#E5E0D8] px-3 py-1.5 rounded-xl flex items-center justify-between text-xs">
                <span className="text-[10px] text-[#8C827A] uppercase">Промокод:</span>
                <span className="font-mono font-bold text-[#483F38]">{code || 'LASH15'}</span>
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex gap-2 justify-end border-t border-[#EFECE6]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#6E6259] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-[#483F38] hover:bg-[#232120] text-white px-5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Сохранение...' : isEditing ? 'Сохранить изменения' : 'Создать акцию'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
