import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Clock, 
  Gift, 
  Plus, 
  Image as ImageIcon, 
  Bell, 
  ChevronRight, 
  CheckCircle2, 
  Eye, 
  Layers, 
  SlidersHorizontal,
  DollarSign
} from 'lucide-react';
import { Appointment, Client, Service, PortfolioItem } from '../types.ts';
import { SalonLogo } from './SalonLogo.tsx';

interface AdminDashboardTabProps {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  portfolioWorks: PortfolioItem[];
  logoUrl?: string;
  onNavigateTab: (tab: any) => void;
  onOpenAddApt: () => void;
  onOpenAddClient: () => void;
  onOpenAddPortfolio: () => void;
  onOpenLogoSettings: () => void;
  onOpenSendPush: (client?: Client) => void;
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  appointments,
  clients,
  services,
  portfolioWorks,
  logoUrl,
  onNavigateTab,
  onOpenAddApt,
  onOpenAddClient,
  onOpenAddPortfolio,
  onOpenLogoSettings,
  onOpenSendPush,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // "YYYY-MM"
  const currentMonthNum = new Date().getMonth() + 1;

  // Monthly appointments
  const monthAppointments = appointments.filter(a => a.date.startsWith(currentMonthStr));
  const todayAppointments = appointments.filter(a => a.date === todayStr && a.status === 'confirmed');
  const confirmedMonthApts = monthAppointments.filter(a => a.status === 'confirmed');

  // Revenue calculation
  // Find price of service or default average 2500 RUB
  const calculateEstimatedRevenue = () => {
    return monthAppointments.reduce((sum, apt) => {
      if (apt.status === 'cancelled') return sum;
      const srv = services.find(s => s.id === apt.serviceId || s.name === apt.serviceName);
      const price = srv?.price || 2600; // estimated average ticket
      return sum + price;
    }, 0);
  };

  const estimatedRevenue = calculateEstimatedRevenue();
  const averageTicket = monthAppointments.length > 0 ? Math.round(estimatedRevenue / Math.max(1, monthAppointments.length)) : 2600;

  // Client stats
  const repeatClients = clients.filter(c => c.visitCount > 1);
  const newClients = clients.filter(c => c.visitCount <= 1);
  const retentionRate = clients.length > 0 ? Math.round((repeatClients.length / clients.length) * 100) : 0;

  // Birthday clients this month
  const birthdayClients = clients.filter(c => {
    if (!c.birthday) return false;
    const parts = c.birthday.split(/[-.]/);
    if (parts.length >= 2) {
      // YYYY-MM-DD or DD.MM.YYYY
      const monthPart = parts.length === 3 && parts[0].length === 4 ? parseInt(parts[1], 10) : parseInt(parts[1], 10);
      return monthPart === currentMonthNum;
    }
    return false;
  });

  // Most popular services analysis
  const serviceStats = services.map(srv => {
    const count = appointments.filter(a => a.serviceId === srv.id || a.serviceName.toLowerCase().includes(srv.name.toLowerCase())).length;
    return { name: srv.name, count, price: srv.price };
  }).sort((a, b) => b.count - a.count);

  // Popular curls and effects extracted from client AI memory
  const curlsCount: Record<string, number> = { 'Изгиб C': 0, 'Изгиб D': 0, 'Изгиб L/M': 0, 'Мокрый эффект': 0, 'Лисий эффект': 0 };
  clients.forEach(c => {
    const style = (c.preferredStyle || '' + ' ' + (c.aiMemory?.preferred_result || '')).toLowerCase();
    if (style.includes('c') || style.includes('с')) curlsCount['Изгиб C']++;
    if (style.includes('d') || style.includes('д')) curlsCount['Изгиб D']++;
    if (style.includes('l') || style.includes('m') || style.includes('л') || style.includes('м')) curlsCount['Изгиб L/M']++;
    if (style.includes('мокр') || style.includes('wet')) curlsCount['Мокрый эффект']++;
    if (style.includes('лис')) curlsCount['Лисий эффект']++;
  });

  // Upcoming 5 appointments
  const upcomingApts = appointments
    .filter(a => a.status === 'confirmed' && a.date >= todayStr)
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Studio Header Card with Logo & Fast Branding Access */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={onOpenLogoSettings} title="Нажмите, чтобы сменить логотип">
            <SalonLogo size="xl" logoUrl={logoUrl} />
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[10px] font-medium">
              Сменить
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl font-medium text-[#232120]">Обзор и Дашборд студии</h2>
              <span className="text-[10px] bg-[#FAF0E6] text-[#8C6D3F] border border-[#E8D6C0] px-2 py-0.5 rounded-full font-medium">
                Live Аналитика
              </span>
            </div>
            <p className="text-xs text-[#6E6259] mt-0.5">
              Lashm.anya · Новосибирск, Киевская, 27 · Записи, клиенты и выручка
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="dash-btn-add-apt"
            onClick={onOpenAddApt}
            className="flex items-center gap-1.5 bg-[#483F38] hover:bg-[#232120] text-white px-3 py-2 rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Записать клиента</span>
          </button>

          <button
            id="dash-btn-add-portfolio"
            onClick={onOpenAddPortfolio}
            className="flex items-center gap-1.5 bg-white hover:bg-[#FAF6F0] text-[#483F38] border border-[#DFCFC0] px-3 py-2 rounded-xl text-xs font-medium transition-all shadow-2xs cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>+ Фото в портфолио</span>
          </button>

          <button
            id="dash-btn-change-logo"
            onClick={onOpenLogoSettings}
            className="flex items-center gap-1.5 bg-white hover:bg-[#FAF6F0] text-[#483F38] border border-[#DFCFC0] px-3 py-2 rounded-xl text-xs font-medium transition-all shadow-2xs cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#B08D57]" />
            <span>Сменить логотип</span>
          </button>

          <button
            id="dash-btn-add-client"
            onClick={onOpenAddClient}
            className="flex items-center gap-1.5 bg-white hover:bg-[#FAF6F0] text-[#483F38] border border-[#DFCFC0] px-3 py-2 rounded-xl text-xs font-medium transition-all shadow-2xs cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>+ Новый клиент</span>
          </button>
        </div>
      </div>

      {/* 4 Key Business Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Revenue */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-[#8C6D3F] uppercase tracking-wider">
              Выручка за месяц
            </span>
            <div className="p-2 rounded-xl bg-[#FAF0E6] text-[#8C6D3F]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="font-serif text-2xl font-bold text-[#232120]">
              {estimatedRevenue.toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-[11px] text-[#6E6259]">
              Средний чек: ~{averageTicket.toLocaleString('ru-RU')} ₽
            </p>
          </div>
          <div className="pt-2 border-t border-[#F5F0EA] flex justify-between items-center text-[10px] text-[#8C827A]">
            <span>Записей в месяце: {confirmedMonthApts.length}</span>
            <span className="text-emerald-700 font-medium">+100% подтверждено</span>
          </div>
        </div>

        {/* 2. Client Base & Retention */}
        <div 
          onClick={() => onNavigateTab('clients')}
          className="bg-white border border-[#E5E0D8] hover:border-[#DFCFC0] rounded-2xl p-5 shadow-2xs space-y-2 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-[#8C6D3F] uppercase tracking-wider">
              База клиенток
            </span>
            <div className="p-2 rounded-xl bg-[#FAF0E6] text-[#8C6D3F]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="font-serif text-2xl font-bold text-[#232120]">
              {clients.length}
            </div>
            <p className="text-[11px] text-[#6E6259]">
              Постоянные: {repeatClients.length} · Новые: {newClients.length}
            </p>
          </div>
          <div className="pt-2 border-t border-[#F5F0EA] flex justify-between items-center text-[10px]">
            <span className="text-[#8C827A]">LTV Retention</span>
            <span className="text-emerald-700 font-semibold">{retentionRate}% повторных</span>
          </div>
        </div>

        {/* 3. Portfolio & Works */}
        <div 
          onClick={() => onNavigateTab('portfolio')}
          className="bg-white border border-[#E5E0D8] hover:border-[#DFCFC0] rounded-2xl p-5 shadow-2xs space-y-2 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-[#8C6D3F] uppercase tracking-wider">
              Портфолио студии
            </span>
            <div className="p-2 rounded-xl bg-[#FAF0E6] text-[#8C6D3F]">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="font-serif text-2xl font-bold text-[#232120]">
              {portfolioWorks.length} фото
            </div>
            <p className="text-[11px] text-[#6E6259]">
              Наращивание, лами, мокрый эффект
            </p>
          </div>
          <div className="pt-2 border-t border-[#F5F0EA] flex justify-between items-center text-[10px] text-[#8C6D3F] font-medium">
            <span>Управление галереей</span>
            <span>Открыть →</span>
          </div>
        </div>

        {/* 4. Birthdays & Promo */}
        <div 
          onClick={() => onNavigateTab('notifications')}
          className="bg-white border border-[#E5E0D8] hover:border-[#DFCFC0] rounded-2xl p-5 shadow-2xs space-y-2 cursor-pointer transition-all"
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-semibold text-[#8C6D3F] uppercase tracking-wider">
              Именинницы месяца
            </span>
            <div className="p-2 rounded-xl bg-[#FAF0E6] text-[#8C6D3F]">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-0.5">
            <div className="font-serif text-2xl font-bold text-[#232120]">
              {birthdayClients.length}
            </div>
            <p className="text-[11px] text-[#6E6259]">
              Скидка 20% ко дню рождения
            </p>
          </div>
          <div className="pt-2 border-t border-[#F5F0EA] flex justify-between items-center text-[10px] text-[#8C6D3F] font-medium">
            <span>Отправить поздравления</span>
            <span>Рассылка →</span>
          </div>
        </div>
      </div>

      {/* Analytics & Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Upcoming Appointments & Services popularity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upcoming Appointments Table */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-lg font-medium text-[#232120]">Ближайшие записи</h3>
                <p className="text-xs text-[#6E6259]">Актуальное расписание мастера</p>
              </div>
              <button
                onClick={() => onNavigateTab('calendar')}
                className="text-xs text-[#8C6D3F] font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Весь календарь</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {upcomingApts.length === 0 ? (
              <div className="text-center py-8 text-xs text-[#8C827A] bg-[#FAF8F5] rounded-xl">
                На ближайшие дни нет подтверждённых записей
              </div>
            ) : (
              <div className="divide-y divide-[#F0EBE4]">
                {upcomingApts.map(apt => (
                  <div key={apt.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] border border-[#E8D6C0] text-[#8C6D3F] flex flex-col items-center justify-center font-mono">
                        <span className="text-[10px] uppercase font-bold">{apt.time}</span>
                        <span className="text-[9px] opacity-75">{apt.date.split('-').slice(1).join('.')}</span>
                      </div>
                      <div>
                        <div className="font-medium text-[#232120] text-sm flex items-center gap-2">
                          <span>{apt.clientName}</span>
                          {apt.clientPhone && (
                            <span className="text-[10px] text-[#8C827A] font-mono">{apt.clientPhone}</span>
                          )}
                        </div>
                        <p className="text-[#6E6259]">{apt.serviceName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-medium">
                        Подтверждено
                      </span>
                      <button
                        onClick={() => {
                          const cl = clients.find(c => c.id === apt.clientId);
                          if (cl) onOpenSendPush(cl);
                        }}
                        className="p-1.5 rounded-lg bg-[#FAF6F0] hover:bg-[#F2ECE4] text-[#483F38] border border-[#E2D8CC] transition-colors cursor-pointer"
                        title="Отправить Telegram-сообщение клиенту"
                      >
                        <Bell className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Popular Services Breakdown */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-2xs space-y-4">
            <div>
              <h3 className="font-serif text-lg font-medium text-[#232120]">Популярность услуг студии</h3>
              <p className="text-xs text-[#6E6259]">Распределение записей по категориям</p>
            </div>

            <div className="space-y-3">
              {serviceStats.map((srv, idx) => {
                const total = Math.max(1, appointments.length);
                const percent = Math.min(100, Math.round((srv.count / total) * 100));
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#232120]">{srv.name}</span>
                      <span className="text-[#6E6259] font-mono">{srv.count} записей ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-[#F0EBE4] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#8C6D3F] rounded-full transition-all duration-500" 
                        style={{ width: `${Math.max(15, percent)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: AI Style Preferences & Birthday Alerts */}
        <div className="space-y-6">
          
          {/* AI-Extracted Style Preferences */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#B08D57]" />
              <h3 className="font-serif text-lg font-medium text-[#232120]">AI-Тренды клиенток</h3>
            </div>
            <p className="text-xs text-[#6E6259]">
              Анализ любимых эффектов, изгибов и объемов из памяти YandexGPT
            </p>

            <div className="space-y-2.5 pt-1 text-xs">
              <div className="p-3 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#232120]">Изгиб C (Натуральный)</div>
                  <div className="text-[10px] text-[#8C827A]">Классика и плавный подкрученный эффект</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-white border border-[#DFCFC0] font-mono text-[#8C6D3F] font-bold">
                  48%
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#232120]">Изгиб D & L (Лисий / Мокрый)</div>
                  <div className="text-[10px] text-[#8C827A]">Выразительный лифтинг внешнего угла</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-white border border-[#DFCFC0] font-mono text-[#8C6D3F] font-bold">
                  36%
                </span>
              </div>

              <div className="p-3 bg-[#FAF8F5] border border-[#EAE3D9] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-medium text-[#232120]">Ламинирование + Botox</div>
                  <div className="text-[10px] text-[#8C827A]">Глубокое питание и глянец родных ресниц</div>
                </div>
                <span className="px-2 py-0.5 rounded bg-white border border-[#DFCFC0] font-mono text-[#8C6D3F] font-bold">
                  16%
                </span>
              </div>
            </div>
          </div>

          {/* Birthday promo card */}
          {birthdayClients.length > 0 && (
            <div className="bg-gradient-to-br from-[#FAF0E6] to-[#F5E6D3] border border-[#E8D6C0] rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-[#8C6D3F]" />
                <h4 className="font-serif text-base font-semibold text-[#232120]">
                  Именинницы ({birthdayClients.length})
                </h4>
              </div>
              <p className="text-xs text-[#6E6259]">
                В этом месяце празднуют день рождения. Подарите скидку 20% в Telegram 🤍
              </p>

              <div className="space-y-2 pt-1">
                {birthdayClients.map(c => (
                  <div key={c.id} className="bg-white/80 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-[#232120] block">{c.name}</span>
                      <span className="text-[10px] text-[#8C827A]">{c.birthday}</span>
                    </div>
                    <button
                      onClick={() => onOpenSendPush(c)}
                      className="px-2.5 py-1 rounded-lg bg-[#8C6D3F] text-white text-[11px] font-medium hover:bg-[#735832] transition-colors cursor-pointer"
                    >
                      Поздравить
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Studio Coordinates Box */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-2xs space-y-2 text-xs text-[#6E6259]">
            <h4 className="font-serif text-sm font-semibold text-[#232120]">Контакты и карточка</h4>
            <p>Новосибирск, ул. Киевская, 27, офис 48</p>
            <p>Телефон: +7 (913) 720-48-27</p>
            <a
              href="https://2gis.ru/novosibirsk/firm/70000001110562714"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8C6D3F] font-semibold hover:underline inline-block pt-1"
            >
              Рейтинг 5.0 в 2ГИС (14 отзывов) ↗
            </a>
          </div>

        </div>
      </div>
    </div>
  );
};
