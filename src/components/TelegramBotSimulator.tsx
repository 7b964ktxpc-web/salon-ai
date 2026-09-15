import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, User, RefreshCw, CheckCircle2, ChevronRight, Calendar, AlertCircle } from 'lucide-react';
import { ChatMessage, Client } from '../types.ts';

interface TelegramBotSimulatorProps {
  currentClient: Client;
  onRefreshData: () => void;
  onOpenMiniApp: () => void;
}

export const TelegramBotSimulator: React.FC<TelegramBotSimulatorProps> = ({
  currentClient,
  onRefreshData,
  onOpenMiniApp,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<'active' | 'booking_created' | 'handoff_to_master' | 'resolved'>('active');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Suggested test prompts requested in the specification
  const testPhrases = [
    { label: '👋 /start', text: '/start' },
    { label: '✨ Хочу как в прошлый раз, только чуть натуральнее', text: 'Хочу как в прошлый раз, только чуть натуральнее.' },
    { label: '📅 Хочу ресницы в пятницу вечером', text: 'Хочу ресницы в пятницу вечером.' },
    { label: '🌿 А что лучше сделать, если хочу натурально?', text: 'А что лучше сделать, если хочу натурально?' },
    { label: '💼 Можно на следующей неделе после работы?', text: 'Можно на следующей неделе после работы?' },
    { label: '🔄 Я не смогу прийти завтра, можно перенести?', text: 'Я не смогу прийти завтра, можно перенести?' },
    { label: '❌ Отмените мою запись', text: 'Отмените мою запись.' },
    { label: '❓ Вопрос мастеру (handoff)', text: 'Делаете ли вы наращивание ресниц с цветными перьями?' },
  ];

  // Initial load: start conversation or show /start
  useEffect(() => {
    loadConversation();
  }, [currentClient.id]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadConversation = async () => {
    setLoading(true);
    try {
      // Send initial /start to begin or fetch status
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
            id: 'init-client',
            conversationId: 'c1',
            sender: 'client',
            text: '/start',
            timestamp: new Date().toISOString(),
          },
          data.message,
        ]);
      }
    } catch (e) {
      console.error('Error loading chat:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (textToSend?: string, actionPayload?: Record<string, unknown>) => {
    const text = textToSend !== undefined ? textToSend : inputValue.trim();
    if (!text && !actionPayload) return;

    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
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
        } else if (data.message.text?.includes('Вы записаны')) {
          setDialogStatus('booking_created');
        }
      }
      onRefreshData();
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-4 px-2 sm:px-4">
      {/* Client AI Memory Context banner */}
      <div className="mb-3 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#EFECE6] border border-[#D8CEC4] flex items-center justify-center text-[#483F38]">
            <User className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#232120]">{currentClient.name}</span>
              <span className="text-[11px] text-[#6E6259]">({currentClient.username ? `@${currentClient.username}` : currentClient.phone})</span>
              <span className="text-[10px] bg-[#EFECE6] text-[#6E6259] px-1.5 py-0.5 rounded">
                Визитов: {currentClient.visitCount}
              </span>
            </div>
            {currentClient.aiMemory?.preferred_result ? (
              <p className="text-[11px] text-[#6E6259] mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#B08D57]" />
                <span>AI помнит: <strong>{currentClient.aiMemory.preferred_result}</strong> ({currentClient.aiMemory.last_service || 'ламинирование'})</span>
              </p>
            ) : (
              <p className="text-[11px] text-[#8C827A] mt-0.5">Новый профиль: история и память будут сформированы при записи</p>
            )}
          </div>
        </div>

        <button
          id="btn-open-miniapp-from-bot"
          onClick={onOpenMiniApp}
          className="text-xs bg-[#483F38] text-white px-3 py-1.5 rounded-md hover:bg-[#232120] transition-colors flex items-center gap-1.5 self-end sm:self-auto cursor-pointer"
        >
          <span>Открыть Mini App</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Telegram Chat Container */}
      <div className="bg-[#FFFFFF] border border-[#E5E0D8] rounded-2xl shadow-xs overflow-hidden flex flex-col h-[640px]">
        {/* Telegram Header */}
        <div className="bg-[#FAF8F5] px-4 py-3 border-b border-[#E5E0D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#483F38] text-white flex items-center justify-center font-serif text-lg">
              L
            </div>
            <div>
              <h3 className="font-serif text-base text-[#232120] font-medium leading-tight">Lashm.anya AI</h3>
              <p className="text-[11px] text-[#8C827A] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span>бот-администратор студии · онлайн</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dialogStatus === 'handoff_to_master' && (
              <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Нужен ответ мастера
              </span>
            )}
            <button
              id="btn-reset-chat"
              onClick={loadConversation}
              title="Перезапустить диалог (/start)"
              className="p-1.5 text-[#8C827A] hover:text-[#232120] hover:bg-[#EFECE6] rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

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
                <div className="flex items-end gap-1.5 max-w-[85%]">
                  {!isClient && (
                    <div className="w-6 h-6 rounded-full bg-[#E5E0D8] text-[#483F38] flex items-center justify-center text-[10px] font-serif shrink-0 mb-1">
                      {isMaster ? 'M' : 'AI'}
                    </div>
                  )}

                  <div
                    className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      isClient
                        ? 'bg-[#483F38] text-white rounded-br-xs'
                        : isMaster
                        ? 'bg-amber-50 border border-amber-200 text-[#232120] rounded-bl-xs'
                        : 'bg-white border border-[#E5E0D8] text-[#232120] rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {isMaster && (
                      <span className="text-[10px] block font-medium uppercase tracking-wider text-amber-800 mb-1">
                        Мастер Lashm.anya
                      </span>
                    )}

                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Interactive Quick Replies / Inline Buttons */}
                    {msg.quickReplies && msg.quickReplies.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#EFECE6] flex flex-wrap gap-1.5">
                        {msg.quickReplies.map((btn, idx) => (
                          <button
                            key={idx}
                            id={`quick-reply-${idx}`}
                            onClick={() => handleSendMessage(btn.text, btn.payload ? { action: btn.action, ...btn.payload } : { action: btn.action })}
                            className="text-xs bg-[#FAF8F5] hover:bg-[#EFECE6] text-[#232120] border border-[#D8CEC4] px-2.5 py-1 rounded-md transition-colors cursor-pointer font-medium"
                          >
                            {btn.text}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      className={`text-[10px] mt-1 text-right ${
                        isClient ? 'text-stone-300' : 'text-[#A09890]'
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
            <div className="flex items-center gap-2 text-xs text-[#8C827A] italic ml-8 py-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8C827A] animate-pulse"></span>
              <span>Lashm.anya AI печатает...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Quick Test Prompt Chips Carousel */}
        <div className="px-3 py-2 bg-[#FAF8F5] border-t border-[#E5E0D8] overflow-x-auto flex gap-1.5 text-xs whitespace-nowrap">
          <span className="text-[10px] uppercase tracking-wider text-[#8C827A] self-center mr-1">Тест:</span>
          {testPhrases.map((phrase, idx) => (
            <button
              key={idx}
              id={`test-phrase-${idx}`}
              onClick={() => handleSendMessage(phrase.text)}
              disabled={loading}
              className="text-[11px] bg-white border border-[#E5E0D8] hover:border-[#483F38] text-[#483F38] px-2.5 py-1 rounded-full transition-all cursor-pointer hover:bg-[#FAF8F5]"
            >
              {phrase.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-[#E5E0D8]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="telegram-chat-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Напишите сообщение администратору..."
              disabled={loading}
              className="flex-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-2.5 text-sm text-[#232120] placeholder-[#A09890] focus:outline-none focus:border-[#483F38] transition-colors"
            />
            <button
              id="telegram-chat-send"
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="bg-[#483F38] text-white p-2.5 rounded-xl hover:bg-[#232120] disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
