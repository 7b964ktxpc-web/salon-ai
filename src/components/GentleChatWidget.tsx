import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  X, 
  Minus, 
  RefreshCw, 
  ChevronRight, 
  Calendar, 
  AlertCircle, 
  Clock, 
  Heart,
  MessageCircle,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { ChatMessage, Client } from '../types.ts';
import { SalonLogo } from './SalonLogo.tsx';

interface GentleChatWidgetProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  currentClient: Client;
  onRefreshData: () => void;
  onOpenBookingTab?: () => void;
  allClients?: Client[];
  onSelectClient?: (clientId: string) => void;
}

export const GentleChatWidget: React.FC<GentleChatWidgetProps> = ({
  isOpen,
  onToggle,
  currentClient,
  onRefreshData,
  onOpenBookingTab,
  allClients,
  onSelectClient,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<'active' | 'booking_created' | 'handoff_to_master' | 'resolved'>('active');
  const [showTooltip, setShowTooltip] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Curated gentle prompt chips
  const promptSuggestions = [
    { label: '✨ Как в прошлый раз', text: 'Хочу как в прошлый раз, только чуть натуральнее.' },
    { label: '📅 На пятницу вечер', text: 'Хочу записаться на ресницы в пятницу вечером.' },
    { label: '🌿 Что посоветуете?', text: 'А что лучше сделать, если хочу очень натурально и деликатно?' },
    { label: '💼 После работы на след. неделе', text: 'Можно на следующей неделе после работы?' },
    { label: '🔄 Перенести запись', text: 'Я не смогу прийти вовремя, можно перенести запись?' },
    { label: '❌ Отменить запись', text: 'Отмените мою запись, пожалуйста.' },
    { label: '❓ Вопрос мастеру', text: 'Делаете ли вы индивидуальный подбор изгиба под форму глаз?' },
  ];

  // Auto-scroll when messages change or loading
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Load chat on client change or first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadConversation();
    }
  }, [isOpen, currentClient.id]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: currentClient.telegramId,
          name: currentClient.name,
          username: currentClient.username,
          message: '/start',
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages([
          {
            id: `start-${Date.now()}`,
            conversationId: 'c1',
            sender: 'ai',
            text: data.message.text,
            timestamp: new Date().toISOString(),
            quickReplies: data.message.quickReplies,
          },
        ]);
      }
    } catch (e) {
      console.error('Error loading chat:', e);
      // Fallback greeting
      setMessages([
        {
          id: `init-${Date.now()}`,
          conversationId: 'c1',
          sender: 'ai',
          text: `Здравствуйте, ${currentClient.name}! 🤍\nЯ виртуальный администратор студии Lashm.anya.\n\nПомню ваши предпочтения: ${currentClient.aiMemory?.preferred_result || 'натуральный'} эффект.\n\nЧем я могу помочь вам сегодня? Подобрать удобное окошко для записи или ответить на вопросы?`,
          timestamp: new Date().toISOString(),
          quickReplies: [
            { text: '✨ Хочу как в прошлый раз', action: 'repeat_last' },
            { text: '📅 Записаться на ресницы', action: 'book_new' },
            { text: '📋 Мои записи', action: 'my_appointments' },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string, actionPayload?: Record<string, unknown>) => {
    const text = textToSend !== undefined ? textToSend : inputValue.trim();
    if (!text && !actionPayload) return;

    setHasInteracted(true);
    setShowTooltip(false);

    const userMessage: ChatMessage = {
      id: `client-${Date.now()}`,
      conversationId: 'c1',
      sender: 'client',
      text: text || (actionPayload?.action as string) || '',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramId: currentClient.telegramId,
          name: currentClient.name,
          username: currentClient.username,
          message: text,
          actionPayload,
        }),
      });

      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        if (data.message.text?.includes('Передам вопрос мастеру')) {
          setDialogStatus('handoff_to_master');
        } else if (data.message.text?.includes('Вы успешно записаны') || data.message.text?.includes('Вы записаны')) {
          setDialogStatus('booking_created');
        }
      }
      onRefreshData();
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          conversationId: 'c1',
          sender: 'ai',
          text: 'Прошу прощения, произошла небольшая задержка соединения. Я на связи — повторите, пожалуйста, запрос.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* GENTLE IN-APP CHAT WINDOW */}
      {isOpen && (
        <div
          id="gentle-chat-modal"
          className="fixed bottom-3 right-3 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[410px] h-[calc(100vh-2rem)] sm:h-[630px] max-h-[720px] bg-[#FAF8F5] border border-[#EADFD5] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-[#232120] transition-all duration-200 animate-fadeIn"
          style={{ backdropFilter: 'blur(10px)' }}
        >
          {/* Gentle Header */}
          <div className="bg-gradient-to-b from-[#FAF7F2] to-[#FAF8F5] px-4 py-3.5 border-b border-[#EAE1D7] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              {/* Salon Logo */}
              <div className="relative">
                <SalonLogo size="md" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#B08D57] border-2 border-white rounded-full"></span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif text-lg font-medium text-[#2C2420] leading-tight">
                    Lashm.anya AI
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#EFE9E2] text-[#6E6259] font-sans">
                    Студия
                  </span>
                </div>
                <p className="text-[11px] text-[#7A6E66] font-light">
                  Администратор с памятью · онлайн 🤍
                </p>
              </div>
            </div>

            {/* Header Control Actions */}
            <div className="flex items-center gap-1">
              <button
                id="btn-chat-restart"
                onClick={loadConversation}
                title="Начать диалог сначала"
                className="p-1.5 text-[#8C8077] hover:text-[#232120] hover:bg-[#EFE9E2] rounded-full transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <button
                id="btn-chat-close"
                onClick={() => onToggle(false)}
                title="Свернуть чат"
                className="p-1.5 text-[#8C8077] hover:text-[#232120] hover:bg-[#EFE9E2] rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Client Memory Context Ribbon (Tender design) */}
          <div className="bg-[#F5EFEB] border-b border-[#E8DFD5] px-3.5 py-2 flex items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-5 h-5 rounded-full bg-[#EADFD5] text-[#483F38] flex items-center justify-center shrink-0">
                <Sparkles className="w-3 h-3 text-[#A87948]" />
              </div>
              <div className="truncate">
                <span className="font-medium text-[#3A312B]">{currentClient.name}: </span>
                {currentClient.aiMemory?.preferred_result ? (
                  <span className="text-[#655951]">
                    помнит «{currentClient.aiMemory.preferred_result}» результат ({currentClient.aiMemory.last_service || 'ламинирование'})
                  </span>
                ) : (
                  <span className="text-[#847870]">новый профиль (история сохраняется)</span>
                )}
              </div>
            </div>

            {/* Client switcher if testing with different clients */}
            {allClients && onSelectClient && allClients.length > 1 && (
              <select
                id="chat-client-select"
                value={currentClient.id}
                onChange={(e) => onSelectClient(e.target.value)}
                className="text-[11px] bg-white border border-[#DDD3C7] rounded-md px-1.5 py-0.5 text-[#483F38] focus:outline-none shrink-0"
                title="Сменить тестового клиента"
              >
                {allClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Master Handoff Notice if applicable */}
          {dialogStatus === 'handoff_to_master' && (
            <div className="bg-[#FCF6EE] border-b border-[#F0DFCD] px-3.5 py-2 flex items-center gap-2 text-xs text-[#8A5A2B] shrink-0">
              <AlertCircle className="w-4 h-4 text-[#C98236] shrink-0" />
              <span>Вопрос передан мастеру студии. Мастер ответит вам в ближайшее время.</span>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FCFAF8]">
            {messages.map((msg) => {
              const isClient = msg.sender === 'client';
              const isMaster = msg.sender === 'master';

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isClient ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-end gap-2 max-w-[88%]">
                    {/* Small avatar for salon/master */}
                    {!isClient && (
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 mb-1 ring-1 ring-[#E8DFD5]">
                        <SalonLogo size="xs" showBorder={false} />
                      </div>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed transition-all ${
                        isClient
                          ? 'bg-[#483F38] text-[#FAF8F5] rounded-br-xs shadow-xs'
                          : isMaster
                          ? 'bg-[#FBF4EE] border border-[#EAD9C8] text-[#2C2420] rounded-bl-xs shadow-2xs'
                          : 'bg-white border border-[#EDE6DD] text-[#2C2420] rounded-bl-xs shadow-2xs'
                      }`}
                    >
                      {isMaster && (
                        <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-[#A26C35] mb-1">
                          <Heart className="w-3 h-3 fill-[#A26C35]" />
                          <span>Мастер Lashm.anya</span>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                      {/* Interactive Quick Replies / Inline Buttons */}
                      {msg.quickReplies && msg.quickReplies.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-[#F0EAE1] flex flex-wrap gap-1.5">
                          {msg.quickReplies.map((btn, idx) => (
                            <button
                              key={idx}
                              id={`gentle-reply-${idx}`}
                              onClick={() =>
                                handleSendMessage(
                                  btn.text,
                                  btn.payload ? { action: btn.action, ...btn.payload } : { action: btn.action }
                                )
                              }
                              className="text-xs bg-[#FAF7F2] hover:bg-[#F2EAE0] text-[#3E352F] border border-[#DDD2C5] px-3 py-1.5 rounded-full transition-colors font-medium cursor-pointer shadow-2xs"
                            >
                              {btn.text}
                            </button>
                          ))}
                        </div>
                      )}

                      <div
                        className={`text-[10px] mt-1.5 text-right font-light ${
                          isClient ? 'text-[#D0C7BE]' : 'text-[#A0958C]'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-[#8C8077] italic ml-8 py-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#A8988C] animate-pulse"></span>
                <span>Lashm.anya AI печатает ответ...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Scenario Chips Bar (gentle horizontal scroll) */}
          <div className="px-3 py-2 bg-[#FAF7F2] border-t border-[#EAE1D7] overflow-x-auto flex items-center gap-1.5 text-xs whitespace-nowrap shrink-0">
            <span className="text-[10px] uppercase tracking-wider text-[#8A7E75] mr-1">Подсказки:</span>
            {promptSuggestions.map((item, idx) => (
              <button
                key={idx}
                id={`chip-prompt-${idx}`}
                onClick={() => handleSendMessage(item.text)}
                disabled={loading}
                className="text-[11px] bg-white border border-[#E2D8CC] hover:border-[#483F38] text-[#483F38] px-2.5 py-1 rounded-full transition-all cursor-pointer shadow-2xs hover:bg-[#FAF7F2]"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Convenient Link to Mini App Booking Tab if provided */}
          {onOpenBookingTab && (
            <div className="px-3 py-1.5 bg-[#F5EFEB] border-t border-[#E8DFD5] flex items-center justify-between text-xs shrink-0">
              <span className="text-[11px] text-[#6E6259]">Хотите выбрать время в календаре?</span>
              <button
                id="btn-switch-to-calendar-booking"
                onClick={() => {
                  onToggle(false);
                  onOpenBookingTab();
                }}
                className="text-[11px] font-medium text-[#483F38] hover:text-[#232120] flex items-center gap-1 underline cursor-pointer"
              >
                <span>Открыть календарь</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-[#EAE1D7] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                id="gentle-chat-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Напишите администратору..."
                disabled={loading}
                className="flex-1 bg-[#FAF7F2] border border-[#E2D8CC] rounded-2xl px-4 py-2.5 text-sm text-[#232120] placeholder-[#A0958C] focus:outline-none focus:border-[#483F38] focus:bg-white transition-all font-sans"
              />
              <button
                id="gentle-chat-send"
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="bg-[#483F38] text-white p-2.5 rounded-2xl hover:bg-[#232120] disabled:opacity-40 transition-all cursor-pointer shadow-2xs"
                title="Отправить"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
