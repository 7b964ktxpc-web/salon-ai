import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Check, 
  ShieldCheck, 
  Zap, 
  CreditCard, 
  Calendar, 
  Receipt, 
  Clock, 
  TrendingUp, 
  Users, 
  Bot, 
  BellRing, 
  Percent, 
  ChevronRight,
  ArrowUpRight,
  Download,
  AlertCircle
} from 'lucide-react';
import { MasterSubscription, SubscriptionPlan, SubscriptionInvoice, SubscriptionPlanId } from '../types.ts';
import { AdminSubscriptionModal } from './AdminSubscriptionModal.tsx';

interface AdminSubscriptionTabProps {
  onDataChanged: () => void;
}

export const AdminSubscriptionTab: React.FC<AdminSubscriptionTabProps> = ({ onDataChanged }) => {
  const [subscription, setSubscription] = useState<MasterSubscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanForModal, setSelectedPlanForModal] = useState<SubscriptionPlan | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<SubscriptionInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/subscription');
      const data = await res.json();
      setSubscription(data.subscription);
      setPlans(data.plans || []);
      setActivePlan(data.activePlan || null);
      if (data.subscription?.billingCycle) {
        setBillingCycle(data.subscription.billingCycle);
      }
    } catch (e) {
      console.error('Error fetching subscription:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const handleOpenUpgrade = (plan: SubscriptionPlan) => {
    setSelectedPlanForModal(plan);
    setShowModal(true);
  };

  const handleToggleAutoRenew = async () => {
    if (!subscription) return;
    try {
      const nextState = !subscription.autoRenew;
      const res = await fetch('/api/subscription/autorenew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRenew: nextState }),
      });
      const data = await res.json();
      if (data.success) {
        setSubscription(data.subscription);
        onDataChanged();
      }
    } catch (e) {
      console.error('Error updating autorenew:', e);
    }
  };

  const currentPlanId = subscription?.planId || 'pro';

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* Top Banner: Master Monetization Overview */}
      <div className="bg-gradient-to-br from-[#3D352E] via-[#2F2722] to-[#1E1916] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#B08D57]/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold uppercase tracking-wider bg-white/15 text-[#F2EAE0] px-3 py-1 rounded-full border border-white/20">
                Тариф платформы
              </span>
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Подписка активна до {subscription?.validUntil || '15.10.2026'}
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl font-medium tracking-tight text-[#FAF7F2]">
              Текущий тариф: <span className="text-[#E8D4BE]">{activePlan?.name || 'PRO Мастер'}</span>
            </h2>
            
            <p className="text-xs sm:text-sm text-[#D8CEBF] leading-relaxed">
              Все инструменты для автоматизации бьюти-мастера: умный AI-бот в Telegram 24/7, авто-напоминания клиентам, промокоды и онлайн-запись.
            </p>
          </div>

          {/* Quick Action & Autorenew */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 text-xs space-y-3 w-full lg:w-auto min-w-[260px] shadow-lg">
            <div className="flex justify-between items-center text-[#D8CEBF]">
              <span>Период оплаты:</span>
              <span className="font-medium text-white">
                {subscription?.billingCycle === 'yearly' ? 'Годовой (со скидкой 25%)' : 'Ежемесячно'}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-[#D8CEBF]">
              <span>Автопродление:</span>
              <button
                id="btn-toggle-autorenew"
                onClick={handleToggleAutoRenew}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  subscription?.autoRenew
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    : 'bg-white/10 text-[#D8CEBF] border border-white/20'
                }`}
              >
                {subscription?.autoRenew ? 'Включено ✓' : 'Отключено'}
              </button>
            </div>

            <div className="pt-2 border-t border-white/10">
              <button
                id="btn-change-subscription-plan"
                onClick={() => {
                  const target = plans.find(p => p.id === 'studio') || plans[1];
                  handleOpenUpgrade(target);
                }}
                className="w-full bg-[#B08D57] hover:bg-[#C29E68] text-white py-2.5 rounded-xl font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Сменить тариф / Продлить</span>
              </button>
            </div>
          </div>
        </div>

        {/* Feature status badges */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="block font-medium text-white">AI-ассистент 24/7</span>
              <span className="text-[10px] text-emerald-300">Работает без сбоев</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <span className="block font-medium text-white">Telegram Push</span>
              <span className="text-[10px] text-amber-300">За 24ч и 2ч</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <span className="block font-medium text-white">База клиенток</span>
              <span className="text-[10px] text-blue-300">Без ограничений</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Percent className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <span className="block font-medium text-white">Акции & Промо</span>
              <span className="text-[10px] text-purple-300">Включены</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Selection Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl font-medium text-[#232120]">Тарифные планы для мастеров</h3>
            <p className="text-xs text-[#6E6259]">
              Выберите оптимальный тариф для частного мастера или бьюти-студии
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center gap-2 bg-[#EFECE6] p-1 rounded-2xl self-start sm:self-auto shadow-2xs border border-[#E0D9CE]">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white text-[#232120] shadow-xs'
                  : 'text-[#6E6259] hover:text-[#232120]'
              }`}
            >
              Ежемесячно
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-[#483F38] text-white shadow-xs'
                  : 'text-[#6E6259] hover:text-[#232120]'
              }`}
            >
              <span>На 1 год</span>
              <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                -25%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
            const monthlyEquivalent = billingCycle === 'yearly' && plan.priceYearly > 0
              ? Math.round(plan.priceYearly / 12)
              : null;

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 ${
                  plan.isPopular
                    ? 'border-2 border-[#483F38] shadow-xl ring-4 ring-[#483F38]/10'
                    : 'border border-[#E5E0D8] shadow-xs hover:shadow-md'
                }`}
              >
                {/* Popular or Current Badge */}
                <div className="flex justify-between items-center mb-3">
                  {plan.badge ? (
                    <span className="text-[11px] font-bold uppercase tracking-wider bg-[#B08D57] text-white px-3 py-0.5 rounded-full shadow-2xs">
                      {plan.badge}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-[#8C827A] uppercase tracking-wider">
                      {plan.id === 'free' ? 'Базовый' : 'VIP'}
                    </span>
                  )}

                  {isCurrent && (
                    <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      Текущий тариф
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-serif text-2xl font-medium text-[#232120]">
                    {plan.name}
                  </h4>
                  <p className="text-xs text-[#6E6259] mt-1 min-h-[34px]">
                    {plan.tagline}
                  </p>

                  {/* Price */}
                  <div className="mt-5 pb-5 border-b border-[#EFECE6]">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-serif text-4xl font-bold text-[#232120] tracking-tight">
                        {price === 0 ? '0 ₽' : `${price.toLocaleString('ru-RU')} ₽`}
                      </span>
                      <span className="text-xs text-[#8C827A]">
                        {billingCycle === 'yearly' ? '/ год' : '/ месяц'}
                      </span>
                    </div>

                    {monthlyEquivalent && (
                      <p className="text-[11px] text-emerald-700 font-medium mt-1">
                        Всего {monthlyEquivalent.toLocaleString('ru-RU')} ₽ в месяц при оплате за год
                      </p>
                    )}
                  </div>

                  {/* Features List */}
                  <div className="py-5 space-y-3">
                    <span className="text-[11px] font-semibold text-[#6E6259] uppercase tracking-wider block">
                      В тариф включено:
                    </span>
                    {plan.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-[#332A24]">
                        <div className="w-4 h-4 rounded-full bg-[#FAF3EA] text-[#B08D57] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer Button */}
                <div className="pt-4 mt-auto">
                  <button
                    id={`btn-plan-${plan.id}`}
                    onClick={() => handleOpenUpgrade(plan)}
                    className={`w-full py-3 rounded-2xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      isCurrent
                        ? 'bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#483F38] border border-[#DFCFC0]'
                        : plan.isPopular
                        ? 'bg-[#483F38] hover:bg-[#232120] text-white shadow-md hover:shadow-lg'
                        : 'bg-white hover:bg-[#FAF8F5] text-[#232120] border border-[#D5C9BC] shadow-2xs'
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <span>Продлить тариф</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Выбрать «{plan.name}»</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ROI & Master Value Proposition */}
      <div className="bg-[#FAF7F2] border border-[#E0D6C8] rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h4 className="font-serif text-2xl font-medium text-[#232120]">
              Почему подписка окупается с первой же клиентки?
            </h4>
            <p className="text-xs text-[#6E6259] leading-relaxed">
              Средний чек на наращивание ресниц составляет <strong>2 500 ₽</strong>. 
              Стоимость тарифа PRO — всего <strong>790 ₽ в месяц</strong>. 
              AI-ассистент возвращает 3–5 забывших записаться клиенток в месяц и предотвращает опоздания благодаря умным Telegram-напоминаниям.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto shrink-0">
            <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] text-center shadow-2xs">
              <span className="font-serif text-2xl font-bold text-[#483F38] block">+23%</span>
              <span className="text-[11px] text-[#6E6259]">Повторных визитов</span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#E5E0D8] text-center shadow-2xs">
              <span className="font-serif text-2xl font-bold text-[#483F38] block">~18 ч</span>
              <span className="text-[11px] text-[#6E6259]">Экономии времени</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment History & Receipts Table */}
      <div className="bg-white border border-[#E5E0D8] rounded-3xl p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-serif text-xl font-medium text-[#232120]">История списаний и чеки</h4>
            <p className="text-xs text-[#6E6259]">
              Все фискальные чеки и квитанции за обслуживание платформы
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#332A24]">
            <thead>
              <tr className="border-b border-[#EFECE6] text-[#8C827A] font-medium">
                <th className="py-3 px-2">Дата</th>
                <th className="py-3 px-2">Тариф</th>
                <th className="py-3 px-2">Сумма</th>
                <th className="py-3 px-2">Способ оплаты</th>
                <th className="py-3 px-2">Статус</th>
                <th className="py-3 px-2 text-right">Фискальный чек</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#FAF7F2]">
              {(subscription?.invoices || []).map((inv) => (
                <tr key={inv.id} className="hover:bg-[#FAF8F5] transition-colors">
                  <td className="py-3.5 px-2 font-mono text-[#6E6259]">{inv.date}</td>
                  <td className="py-3.5 px-2 font-medium text-[#232120]">{inv.planName}</td>
                  <td className="py-3.5 px-2 font-semibold text-[#232120]">{inv.amount} ₽</td>
                  <td className="py-3.5 px-2 text-[#6E6259]">{inv.paymentMethod}</td>
                  <td className="py-3.5 px-2">
                    <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md font-medium text-[11px]">
                      <Check className="w-3 h-3" />
                      Оплачено
                    </span>
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <button
                      onClick={() => setSelectedReceipt(inv)}
                      className="inline-flex items-center gap-1 text-[#483F38] hover:text-[#232120] font-medium hover:underline cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>{inv.receiptNumber}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Upgrade Checkout */}
      {selectedPlanForModal && (
        <AdminSubscriptionModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          targetPlan={selectedPlanForModal}
          billingCycle={billingCycle}
          currentSubscription={subscription || undefined}
          onSuccess={() => {
            setShowModal(false);
            fetchSubscriptionData();
            onDataChanged();
          }}
        />
      )}

      {/* Modal: Receipt View */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white border border-[#E5E0D8] rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-serif text-xl font-medium text-[#232120]">Фискальный чек</h4>
                <p className="text-xs font-mono text-[#8C827A] mt-0.5">{selectedReceipt.receiptNumber}</p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-[#8C827A] hover:text-[#232120] p-1 rounded-full cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#FAF8F5] border border-[#E8E3DA] rounded-2xl p-4 text-xs space-y-2 font-mono">
              <div className="flex justify-between text-[#6E6259]">
                <span>Услуга:</span>
                <span className="text-[#232120] font-semibold text-right">{selectedReceipt.planName}</span>
              </div>
              <div className="flex justify-between text-[#6E6259]">
                <span>Дата платежа:</span>
                <span className="text-[#232120]">{selectedReceipt.date}</span>
              </div>
              <div className="flex justify-between text-[#6E6259]">
                <span>Способ:</span>
                <span className="text-[#232120]">{selectedReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-[#6E6259] pt-2 border-t border-[#DFCFC0]">
                <span className="font-bold text-[#232120]">Итого:</span>
                <span className="font-bold text-[#232120] text-sm">{selectedReceipt.amount} ₽ (НДС 0%)</span>
              </div>
            </div>

            <div className="text-[11px] text-[#6E6259] text-center">
              Платеж успешно фискализирован в соответствии с 54-ФЗ РФ.
            </div>

            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-full bg-[#483F38] hover:bg-[#232120] text-white py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Закрыть квитанцию
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
