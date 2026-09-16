import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db.ts';
import { conversationManager } from './server/conversation.ts';
import { yandexGpt } from './server/yandex-gpt.ts';
import { aiTools } from './server/tools.ts';
import { attachTenantSession, requireSession, requireSuperAdmin } from './server/auth-middleware.ts';
import { createTenantSessionToken } from './server/platform-tenant.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);
  app.use(express.json());
  app.use(attachTenantSession);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'Beauty AI', timestamp: new Date().toISOString(), yandexGpt: yandexGpt.getStatus() }));

  app.get('/api/services', (_req, res) => res.json(db.getServices()));
  app.put('/api/services/:id/price', (req, res) => {
    if (!requireSession(req, res)) return;
    const updated = db.updateServicePrice(req.params.id, req.body.price !== undefined ? req.body.price : null);
    if (!updated) return res.status(404).json({ error: 'Услуга не найдена' });
    res.json(updated);
  });

  app.get('/api/portfolio', (_req, res) => res.json(db.getPortfolio()));
  app.post('/api/portfolio', (req, res) => {
    if (!requireSession(req, res)) return;
    const { title, category, categoryLabel, description, curl, length, volume, duration, serviceId, imageUrl, tags } = req.body;
    if (!title || !imageUrl) return res.status(400).json({ error: 'Пожалуйста, укажите название работы и изображение' });
    const item = db.addPortfolioItem({ title: title.trim(), category: category || 'lashes', categoryLabel: categoryLabel || 'Наращивание', description: description || '', curl: curl || '', length: length || '', volume: volume || '', duration: duration || '', serviceId: serviceId || '', imageUrl: imageUrl.trim(), tags: Array.isArray(tags) ? tags : [] });
    res.status(201).json({ success: true, item });
  });
  app.put('/api/portfolio/:id', (req, res) => {
    if (!requireSession(req, res)) return;
    const item = db.updatePortfolioItem(req.params.id, req.body);
    if (!item) return res.status(404).json({ error: 'Работа в портфолио не найдена' });
    res.json({ success: true, item });
  });
  app.delete('/api/portfolio/:id', (req, res) => {
    if (!requireSession(req, res)) return;
    if (!db.deletePortfolioItem(req.params.id)) return res.status(404).json({ error: 'Работа в портфолио не найдена' });
    res.json({ success: true });
  });

  app.get('/api/settings', (req, res) => {
    if (!requireSession(req, res)) return;
    res.json({ settings: db.businessSettings, workingHours: db.workingHours, subscription: db.getSubscription(), activePlan: db.getActivePlan(), yandexStatus: yandexGpt.getStatus() });
  });
  app.put('/api/settings', (req, res) => {
    if (!requireSession(req, res)) return;
    if (req.body.settings) db.businessSettings = { ...db.businessSettings, ...req.body.settings };
    if (req.body.workingHours) db.workingHours = { ...db.workingHours, ...req.body.workingHours };
    res.json({ success: true, settings: db.businessSettings, workingHours: db.workingHours });
  });

  app.get('/api/subscription', (req, res) => {
    if (!requireSession(req, res)) return;
    res.json({ subscription: db.getSubscription(), activePlan: db.getActivePlan(), plans: db.getSubscriptionPlans() });
  });
  app.post('/api/subscription/upgrade', (req, res) => {
    if (!requireSession(req, res)) return;
    if (!req.body.planId) return res.status(400).json({ error: 'Тарифный план не указан' });
    const result = db.upgradeSubscription(req.body.planId, req.body.billingCycle || 'monthly', req.body.paymentMethod || 'СБП / Карта');
    res.json({ success: true, message: `Тариф «${result.plan.name}» успешно активирован!`, subscription: result.subscription, plan: result.plan });
  });
  app.post('/api/subscription/autorenew', (req, res) => {
    if (!requireSession(req, res)) return;
    res.json({ success: true, subscription: db.toggleSubscriptionAutoRenew(Boolean(req.body.autoRenew)) });
  });

  app.get('/api/platform/stats', (req, res) => { if (!requireSuperAdmin(req, res)) return; res.json(db.getPlatformStats()); });
  app.get('/api/platform/salons', (req, res) => { if (!requireSuperAdmin(req, res)) return; res.json({ salons: db.getAllSalons(), activeSalonId: db.activeSalonId, plans: db.getSubscriptionPlans() }); });
  app.get('/api/salons/:idOrSlug', (req, res) => {
    const salon = db.getSalon(req.params.idOrSlug);
    if (!salon) return res.status(404).json({ error: 'Салон не найден' });
    res.json({ salon });
  });
  app.post('/api/platform/salons/:id/link-telegram-id', (req, res) => {
    if (!requireSuperAdmin(req, res)) return;
    if (!req.body.telegramId?.trim()) return res.status(400).json({ error: 'Укажите Telegram ID или @username мастера' });
    try { const result = db.linkMasterTelegramId(req.params.id, req.body.telegramId); res.json({ success: true, message: `Telegram ID "${req.body.telegramId}" успешно привязан к салону «${result.salon.settings.name}». Доступ в админку открыт!`, salon: result.salon }); }
    catch (e: any) { res.status(400).json({ error: e.message || 'Ошибка привязки ID' }); }
  });
  app.put('/api/platform/salons/:id/status', (req, res) => {
    if (!requireSuperAdmin(req, res)) return;
    if (!req.body.status) return res.status(400).json({ error: 'Статус не указан' });
    res.json({ success: true, salon: db.updateSalonStatus(req.params.id, req.body.status) });
  });
  app.put('/api/platform/salons/:id/plan', (req, res) => {
    if (!requireSuperAdmin(req, res)) return;
    if (!req.body.planId) return res.status(400).json({ error: 'Тариф не указан' });
    res.json({ success: true, salon: db.updateSalonPlan(req.params.id, req.body.planId, req.body.billingCycle || 'monthly') });
  });
  app.delete('/api/platform/salons/:id', (req, res) => {
    if (!requireSuperAdmin(req, res)) return;
    if (!db.deleteSalon(req.params.id)) return res.status(400).json({ error: 'Нельзя удалить единственный салон на платформе' });
    res.json({ success: true, message: 'Салон удалён' });
  });
  app.post('/api/platform/broadcast', (req, res) => {
    if (!requireSuperAdmin(req, res)) return;
    if (!req.body.title || !req.body.text) return res.status(400).json({ error: 'Заполните заголовок и текст сообщения' });
    res.status(201).json({ success: true, broadcast: db.broadcastToMasters(req.body.title, req.body.text, req.body.target || 'all_masters') });
  });
  app.get('/api/platform/broadcasts', (req, res) => { if (!requireSuperAdmin(req, res)) return; res.json({ broadcasts: db.getBroadcasts() }); });
  app.post('/api/platform/switch-salon', (req, res) => {
    if (!requireSuperAdmin(req, res)) return;
    if (!req.body.salonId) return res.status(400).json({ error: 'ID салона не указан' });
    const salon = db.getSalon(req.body.salonId);
    if (!salon) return res.status(404).json({ error: 'Салон не найден' });
    res.json({ success: true, activeSalonId: salon.id, salon, settings: salon.settings, services: salon.services, subscription: salon.subscription, deprecated: true, message: 'Глобальное переключение салона отключено. Используйте salonId из подписанной сессии.' });
  });

  app.post('/api/masters/register', (req, res) => {
    const { salonName, masterName, phone, city } = req.body;
    if (!salonName || !masterName || !phone || !city) return res.status(400).json({ error: 'Пожалуйста, заполните название салона, имя мастера, телефон и город' });
    const tenant = db.registerNewMaster(req.body);
    res.status(201).json({ success: true, message: tenant.isIdVerified ? `Салон «${tenant.settings.name}» успешно создан! Доступ открыт.` : `Заявка на создание салона «${tenant.settings.name}» принята! Главный администратор привяжет ваш Telegram ID.`, salon: tenant });
  });
  app.get('/api/masters/presets', (req, res) => { if (!requireSession(req, res)) return; res.json({ presets: db.getStudioPresets(), currentSettings: db.businessSettings }); });
  app.post('/api/masters/switch-preset', (req, res) => {
    if (!requireSession(req, res)) return;
    if (!req.body.presetId) return res.status(400).json({ error: 'Пресет не указан' });
    const result = db.switchStudioPreset(req.body.presetId);
    if (!result.success) return res.status(404).json({ error: 'Пресет не найден' });
    res.json({ success: true, message: `Салон переключен на «${result.settings.name}» (${result.settings.city})`, settings: result.settings, services: result.services, subscription: result.subscription });
  });
  app.post('/api/masters/create-studio', (req, res) => {
    if (!requireSession(req, res)) return;
    const { salonName, masterName, city, address } = req.body;
    if (!salonName || !masterName || !city || !address) return res.status(400).json({ error: 'Заполните название салона, имя мастера, город и адрес' });
    const result = db.createNewStudio(req.body);
    res.status(201).json({ success: true, message: `Студия «${result.settings.name}» успешно создана! Все настройки и прайс обновлены.`, settings: result.settings, services: result.services, subscription: result.subscription });
  });

  app.get('/api/availability', (req, res) => {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    res.json({ date, slots: db.getAvailableSlots(date), blockedSlots: db.workingHours.blockedSlots?.[date] || [] });
  });
  app.post('/api/availability/toggle-slot', (req, res) => {
    if (!requireSession(req, res)) return;
    if (!req.body.date || !req.body.time) return res.status(400).json({ error: 'Date and time are required' });
    const isBlocked = db.toggleSlotBlock(req.body.date, req.body.time);
    res.json({ date: req.body.date, time: req.body.time, isBlocked, slots: db.getAvailableSlots(req.body.date) });
  });

  app.get('/api/appointments', (req, res) => {
    if (!requireSession(req, res)) return;
    const clientId = req.query.clientId as string | undefined;
    if (clientId) return res.json(db.getClientAppointments(clientId));
    res.json(db.getAppointments());
  });
  app.post('/api/appointments', (req, res) => {
    if (!requireSession(req, res)) return;
    const { clientId, serviceId, date, time, clientName, clientPhone, notes } = req.body;
    if (!clientId || !serviceId || !date || !time) return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
    const result = aiTools.create_appointment({ clientId, serviceId, date, time, clientName: clientName || 'Клиент', clientPhone, notes });
    if (!result.success) return res.status(409).json({ error: result.error });
    res.status(201).json(result.appointment);
  });
  app.put('/api/appointments/:id/reschedule', (req, res) => {
    if (!requireSession(req, res)) return;
    if (!req.body.date || !req.body.time) return res.status(400).json({ error: 'Date and time required' });
    const result = aiTools.reschedule_appointment(req.params.id, req.body.date, req.body.time);
    if (!result.success) return res.status(409).json({ error: result.error });
    res.json(result.appointment);
  });
  app.put('/api/appointments/:id/cancel', (req, res) => {
    if (!requireSession(req, res)) return;
    const result = aiTools.cancel_appointment(req.params.id, req.body.reason);
    if (!result.success) return res.status(404).json({ error: result.error });
    res.json({ success: true, message: 'Запись отменена' });
  });

  app.get('/api/clients', (req, res) => {
    if (!requireSession(req, res)) return;
    const search = ((req.query.q as string) || '').toLowerCase();
    const clients = db.getClients();
    if (!search) return res.json(clients);
    res.json(clients.filter(c => c.name.toLowerCase().includes(search) || (c.phone && c.phone.includes(search)) || (c.username && c.username.toLowerCase().includes(search))));
  });
  app.get('/api/clients/:id', (req, res) => {
    if (!requireSession(req, res)) return;
    const client = db.getClientById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Клиент не найден' });
    res.json({ client, appointments: db.getClientAppointments(client.id) });
  });
  app.post('/api/clients', (req, res) => {
    if (!requireSession(req, res)) return;
    if (!req.body.name?.trim()) return res.status(400).json({ error: 'Имя клиента обязательно' });
    const client = db.registerClient(req.body);
    if (req.body.notes) db.addClientNote(client.id, req.body.notes);
    res.status(201).json({ success: true, client });
  });
  app.post('/api/clients/register', (req, res) => {
    if (!req.body.name || typeof req.body.name !== 'string' || !req.body.name.trim()) return res.status(400).json({ error: 'Пожалуйста, укажите ваше имя' });
    const client = db.registerClient(req.body);
    res.json({ success: true, client, message: `Добро пожаловать в Beauty AI, ${client.name}! 🤍` });
  });
  app.put('/api/clients/:id', (req, res) => {
    if (!requireSession(req, res)) return;
    const updated = db.updateClientProfile(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Клиент не найден' });
    res.json({ success: true, client: updated, message: 'Профиль успешно сохранён' });
  });
  app.post('/api/clients/:id/birthday-discount', (req, res) => {
    if (!requireSession(req, res)) return;
    const client = db.getClientById(req.params.id);
    if (!client) return res.status(404).json({ error: 'Клиент не найден' });
    const notification = db.notifications.find(n => n.clientId === client.id && n.type === 'birthday_greeting') || { id: `notif-bday-${Date.now()}`, clientId: client.id, clientName: client.name, type: 'birthday_greeting' as const, title: 'С днём рождения! 🎂', text: `${client.name}, поздравляем вас с днём рождения! 🤍`, status: 'delivered' as const, createdAt: new Date().toISOString() };
    if (!db.notifications.some(n => n.id === notification.id)) db.notifications.unshift(notification);
    res.json({ success: true, notification });
  });
  app.delete('/api/clients/:id', (req, res) => {
    if (!requireSession(req, res)) return;
    if (!db.deleteClient(req.params.id)) return res.status(404).json({ error: 'Клиент не найден' });
    res.json({ success: true, message: 'Данные клиента удалены' });
  });

  app.put('/api/clients/:id/memory', (req, res) => {
    if (!requireSession(req, res)) return;
    const updated = db.updateClientMemory(req.params.id, req.body.memory || {});
    if (!updated) return res.status(404).json({ error: 'Клиент не найден' });
    res.json(updated);
  });
  app.post('/api/clients/:id/notes', async (req, res) => {
    if (!requireSession(req, res)) return;
    if (!req.body.note) return res.status(400).json({ error: 'Note text required' });
    try {
      db.addClientNote(req.params.id, req.body.note);
      const structuredMemory = await yandexGpt.extractMemoryFromMasterNote(req.body.note);
      res.json({ success: true, extractedMemory: structuredMemory, client: db.updateClientMemory(req.params.id, structuredMemory) });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get('/api/dialogs', (req, res) => { if (!requireSession(req, res)) return; res.json(db.getConversations()); });
  app.post('/api/dialogs/:id/reply', (req, res) => {
    if (!requireSession(req, res)) return;
    if (!req.body.text) return res.status(400).json({ error: 'Text required' });
    const msg = db.addMessage(req.params.id, { sender: 'master', text: req.body.text });
    db.updateConversationStatus(req.params.id, 'resolved');
    res.json(msg);
  });
  app.post('/api/chat', async (req, res) => {
    try {
      const { telegramId, name, username, message, actionPayload } = req.body;
      if (!telegramId || (!message && !actionPayload)) return res.status(400).json({ error: 'Invalid request' });
      res.json(await conversationManager.handleClientMessage({ telegramId, name, username, message: message || '', actionPayload }));
    } catch (err: any) { console.error('Chat error:', err); res.status(500).json({ error: err.message || 'Ошибка обработки диалога' }); }
  });

  app.get('/api/notifications', (req, res) => { if (!requireSession(req, res)) return; res.json(db.getNotifications(req.query.clientId as string | undefined)); });
  app.post('/api/notifications', (req, res) => {
    if (!requireSession(req, res)) return;
    if (!req.body.clientId || !req.body.text) return res.status(400).json({ error: 'Client ID and text are required' });
    const client = db.getClientById(req.body.clientId);
    res.json(db.createNotification({ ...req.body, clientName: req.body.clientName || client?.name || 'Клиент', type: req.body.type || 'appointment_reminder', title: req.body.title || 'Уведомление Beauty AI' }));
  });
  app.put('/api/notifications/:id/read', (req, res) => { if (!requireSession(req, res)) return; res.json({ success: db.markNotificationRead(req.params.id) }); });
  app.post('/api/notifications/:id/confirm', (req, res) => { if (!requireSession(req, res)) return; res.json({ success: db.confirmAppointmentFromNotification(req.params.id) }); });

  app.get('/api/discounts', (req, res) => { if (!requireSession(req, res)) return; res.json(db.getDiscountCampaigns()); });
  app.post('/api/discounts', (req, res) => {
    if (!requireSession(req, res)) return;
    const { title, description, discountPercent, discountAmount, code, targetAudience, targetClientId, serviceId, validUntil, maxUses, bannerColor, isActive } = req.body;
    if (!title || (!discountPercent && !discountAmount) || !code) return res.status(400).json({ error: 'Пожалуйста, заполните название акции, размер скидки и промокод' });
    res.status(201).json(db.createDiscountCampaign({ title, description: description || '', discountPercent: Number(discountPercent) || 0, discountAmount: discountAmount ? Number(discountAmount) : null, code, targetAudience: targetAudience || 'all', targetClientId, serviceId, validUntil: validUntil || '2026-12-31', maxUses: maxUses ? Number(maxUses) : undefined, bannerColor, isActive: isActive !== undefined ? isActive : true }));
  });
  app.put('/api/discounts/:id', (req, res) => {
    if (!requireSession(req, res)) return;
    const updated = db.updateDiscountCampaign(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Акция или промокод не найдены' });
    res.json({ success: true, campaign: updated });
  });
  app.delete('/api/discounts/:id', (req, res) => {
    if (!requireSession(req, res)) return;
    if (!db.deleteDiscountCampaign(req.params.id)) return res.status(404).json({ error: 'Акция или промокод не найдены' });
    res.json({ success: true, message: 'Акция успешно удалена' });
  });
  app.post('/api/promos/verify', (req, res) => {
    if (!req.body.code) return res.status(400).json({ valid: false, error: 'Промокод не указан' });
    const cleanCode = req.body.code.trim().toUpperCase();
    const campaign = db.discountCampaigns.find(c => c.code.toUpperCase() === cleanCode && c.isActive);
    if (!campaign) return res.status(404).json({ valid: false, error: 'Промокод не найден или срок его действия истёк' });
    if (campaign.validUntil && new Date(campaign.validUntil) < new Date(new Date().toISOString().split('T')[0])) return res.status(400).json({ valid: false, error: `Срок действия промокода истёк ${campaign.validUntil}` });
    if (req.body.clientId && campaign.targetClientId && campaign.targetClientId !== req.body.clientId) return res.status(403).json({ valid: false, error: 'Этот промокод привязан к другой клиентке' });
    res.json({ valid: true, code: campaign.code, title: campaign.title, discountPercent: campaign.discountPercent, discountAmount: campaign.discountAmount, description: campaign.description, validUntil: campaign.validUntil });
  });
  app.post('/api/discounts/:id/broadcast', (req, res) => { if (!requireSession(req, res)) return; res.json(db.broadcastCampaign(req.params.id)); });
  app.get('/api/notification-settings', (req, res) => { if (!requireSession(req, res)) return; res.json(db.notificationSettings); });
  app.put('/api/notification-settings', (req, res) => { if (!requireSession(req, res)) return; res.json(db.updateNotificationSettings(req.body)); });

  app.post('/api/auth/admin-verify', (req, res) => {
    if (!req.body.telegramId) return res.status(400).json({ success: false, error: 'Укажите Telegram ID или username' });
    const check = db.verifyAdminTelegramId(req.body.telegramId, req.body.salonId);
    if (!check.isValid) return res.status(403).json({ success: false, error: `Доступ запрещён: Telegram ID "${req.body.telegramId}" не привязан к админке.` });
    const session = check.isSuperAdmin
      ? { role: 'super_admin' as const, telegramId: String(req.body.telegramId).trim() }
      : { role: 'salon_owner' as const, salonId: check.salon?.id, telegramId: String(req.body.telegramId).trim() };
    if (!session.salonId && session.role !== 'super_admin') return res.status(403).json({ success: false, error: 'У владельца не привязан салон' });
    const token = createTenantSessionToken(session);
    res.json({ success: true, isSuperAdmin: check.isSuperAdmin, masterName: check.isSuperAdmin ? 'Главный Администратор Платформы' : check.salon?.ownerName || 'Мастер', adminTelegramId: req.body.telegramId, salon: check.salon, salonId: check.salon?.id, accessToken: token, session });
  });
  app.get('/api/auth/admin-info', (_req, res) => res.json({ adminConfigured: Boolean(db.adminTelegramId), adminUsername: db.adminTelegramId, superAdminUsername: db.superAdminTelegramId }));

  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      const update = req.body;
      const text = update?.message?.text || update?.callback_query?.data;
      const from = update?.message?.from || update?.callback_query?.from;
      if (from && text) await conversationManager.handleClientMessage({ telegramId: `tg-${from.id}`, name: [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Гость', username: from.username, message: text });
      res.json({ ok: true });
    } catch (e) { console.error('Webhook error:', e); res.json({ ok: false }); }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Beauty AI server running on http://0.0.0.0:${PORT}`));
}

startServer();
