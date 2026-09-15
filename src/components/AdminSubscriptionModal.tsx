import React, { useState } from 'react';
import { 
  X, 
  Check, 
  ShieldCheck, 
  CreditCard, 
  QrCode, 
  Sparkles, 
  Lock, 
  CheckCircle2,
  Calendar,
  Zap,
  Download
} from 'lucide-react';
import { SubscriptionPlan, MasterSubscription } from '../types.ts';

interface AdminSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: SubscriptionPlan;
  billingCycle: 'monthly' | 'yearly';
  currentSubscription?: MasterSubscription;
  onSuccess: () => void;
}

export const AdminSubscriptionModal: React.FC<AdminSubscriptionModalProps> = ({
  isOpen,
  onClose,
  targetPlan,
  billingCycle,
  currentSubscription,
  onSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'sbp' | 'card' | 'tpay'>('sbp');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('•••');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<any>(null);

  if (!isOpen) return null;

  const price = billingCycle === 'yearly' ? targetPlan.priceYearly : targetPlan.priceMonthly;
  const isFreePlan = targetPlan.id === 'free';

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      const paymentMethodName = 
        selectedMethod === 'sbp' ? 'СБП (Система быстрых платежей)' : 
        selectedMethod === 'tpay' ? 'T-Pay / SberPay' : 'Банковская карта РФ (•••• 4242)';

      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: targetPlan.id,
          billingCycle,
          paymentMethod: paymentMethodName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedInvoice(data.subscription.invoices?.[0] || null);
        setPaymentSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1200);
      }
    } catch (e) {
      console.error('Subscription error:', e);
    } finally {
      setIsProcessing(false);
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
              {billingCycle === 'yearly' ? 'Годовой тариф (-25%)' : 'Месячная подписка'}
            </span>
            {targetPlan.badge && (
              <span className="text-[11px] font-semibold bg-[#B08D57] text-white px-2 py-0.5 rounded-full shadow-2xs">
                {targetPlan.badge}
              </span>
            )}
          </div>

          <h3 className="font-serif text-2xl font-medium text-[#FAF7F2]">
            {isFreePlan ? 'Подключение тарифа' : 'Оформление подписки'} «{targetPlan.name}»
          </h3>
          <p className="text-xs text-[#D8CEBF] mt-1">
            {targetPlan.tagline}
          </p>

          <div className="mt-4 flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-white tracking-tight">
              {price === 0 ? '0 ₽' : `${price.toLocaleString('ru-RU')} ₽`}
            </span>
            <span className="text-xs text-[#D8CEBF]">
              {billingCycle === 'yearly' ? '/ в год (всего ' + Math.round(price / 12) + ' ₽/мес)' : '/ месяц'}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {paymentSuccess ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-serif text-2xl font-medium text-[#232120]">Тариф успешно активирован!</h4>
                <p className="text-xs text-[#6E6259] mt-1 max-w-sm mx-auto">
                  Все возможности тарифа «{targetPlan.name}» уже разблокированы в кабинете мастера и вашем Mini App.
                </p>
              </div>

              {generatedInvoice && (
                <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 text-left text-xs space-y-2 shadow-2xs">
                  <div className="flex justify-between text-[#6E6259]">
                    <span>Электронный чек:</span>
                    <span className="font-mono text-[#232120] font-medium">{generatedInvoice.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between text-[#6E6259]">
                    <span>Сумма платежа:</span>
                    <span className="font-semibold text-[#232120]">{generatedInvoice.amount} ₽</span>
                  </div>
                  <div className="flex justify-between text-[#6E6259]">
                    <span>Период действия:</span>
                    <span className="text-[#232120]">до 15.10.2026 (автопродление)</span>
                  </div>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full bg-[#483F38] hover:bg-[#232120] text-white py-3 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
              >
                Перейти к работе
              </button>
            </div>
          ) : (
            <>
              {/* Features Included */}
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 space-y-2.5 shadow-2xs">
                <span className="text-[11px] font-semibold text-[#6E6259] uppercase tracking-wider block mb-1">
                  Что входит в подписку:
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {targetPlan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#332A24]">
                      <div className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!isFreePlan && (
                <>
                  {/* Payment Method Selector */}
                  <div className="space-y-2.5">
                    <label className="text-xs font-semibold text-[#3D352E] block">
                      Способ оплаты:
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedMethod('sbp')}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          selectedMethod === 'sbp'
                            ? 'border-[#483F38] bg-[#FAF3EA] text-[#232120] font-semibold shadow-2xs ring-2 ring-[#483F38]/20'
                            : 'border-[#E5E0D8] bg-white text-[#6E6259] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <QrCode className="w-5 h-5 text-[#B08D57]" />
                        <span className="text-xs">СБП (0% ком.)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod('card')}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          selectedMethod === 'card'
                            ? 'border-[#483F38] bg-[#FAF3EA] text-[#232120] font-semibold shadow-2xs ring-2 ring-[#483F38]/20'
                            : 'border-[#E5E0D8] bg-white text-[#6E6259] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-[#483F38]" />
                        <span className="text-xs">Карта РФ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod('tpay')}
                        className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                          selectedMethod === 'tpay'
                            ? 'border-[#483F38] bg-[#FAF3EA] text-[#232120] font-semibold shadow-2xs ring-2 ring-[#483F38]/20'
                            : 'border-[#E5E0D8] bg-white text-[#6E6259] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <Zap className="w-5 h-5 text-amber-600" />
                        <span className="text-xs">T-Pay / Sber</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Details Container */}
                  {selectedMethod === 'sbp' && (
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 text-center space-y-2 shadow-2xs">
                      <div className="w-24 h-24 bg-[#FAF7F2] border border-[#D5C9BC] rounded-xl flex items-center justify-center mx-auto">
                        <QrCode className="w-16 h-16 text-[#3D352E]" />
                      </div>
                      <p className="text-xs text-[#332A24] font-medium">
                        Отсканируйте QR-код в мобильном приложении любого банка РФ
                      </p>
                      <p className="text-[11px] text-[#8C827A]">
                        Мгновенная активация без ввода реквизитов карты
                      </p>
                    </div>
                  )}

                  {selectedMethod === 'card' && (
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 space-y-3 shadow-2xs text-xs">
                      <div>
                        <label className="text-[#6E6259] block mb-1">Номер банковской карты:</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs font-mono text-[#232120]"
                            placeholder="2200 •••• •••• 4242"
                          />
                          <CreditCard className="w-4 h-4 text-[#8C827A] absolute right-3 top-2.5" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[#6E6259] block mb-1">Срок действия:</label>
                          <input
                            type="text"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs font-mono text-[#232120]"
                            placeholder="ММ/ГГ"
                          />
                        </div>
                        <div>
                          <label className="text-[#6E6259] block mb-1">CVC / CVV:</label>
                          <input
                            type="password"
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value)}
                            maxLength={3}
                            className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs font-mono text-[#232120]"
                            placeholder="•••"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedMethod === 'tpay' && (
                    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 text-center space-y-2 shadow-2xs">
                      <p className="text-xs text-[#332A24] font-medium">
                        Оплата в 1 клик через T-Pay или SberPay на вашем смартфоне
                      </p>
                      <div className="flex justify-center gap-2 pt-1">
                        <span className="px-3 py-1 bg-[#FAF3EA] text-[#483F38] rounded-lg text-xs font-semibold border border-[#DFCFC0]">
                          T-Bank Pay
                        </span>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-semibold border border-emerald-200">
                          SberPay
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[11px] text-[#6E6259] bg-[#FAF8F5] p-3 rounded-xl border border-[#E5E0D8]">
                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Безопасный платёж с фискализацией 54-ФЗ и мгновенным чеком</span>
                  </div>
                </>
              )}

              {/* Submit Action */}
              <div className="pt-2">
                <button
                  type="button"
                  id="btn-confirm-subscription-pay"
                  onClick={handleProcessPayment}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-[#483F38] to-[#251E19] hover:from-[#332A24] hover:to-[#1A1512] text-white py-3.5 rounded-2xl text-xs font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Активация тарифа...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>
                        {isFreePlan 
                          ? 'Активировать бесплатный тариф' 
                          : `Оплатить ${price.toLocaleString('ru-RU')} ₽ и подключить`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
