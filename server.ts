import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db.ts';
import { conversationManager } from './server/conversation.ts';
import { yandexGpt } from './server/yandex-gpt.ts';
import { aiTools } from './server/tools.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Health & Yandex Cloud status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Lashm.anya AI',
      timestamp: new Date().toISOString(),
      yandexGpt: yandexGpt.getStatus(),
    });
  });

  // Services
  app.get('/api/services', (req, res) => {
    res.json(db.getServices());
  });

  app.put('/api/services/:id/price', (req, res) => {
    const { id } = req.params;
    const { price } = req.body;
    const updated = db.updateServicePrice(id, price !== undefined ? price : null);
    if (!updated) {
      return res.status(404).json({ error: 'Услуга не найдена' });
    }
    res.json(updated);
  });

  // Portfolio Management
  app.get('/api/portfolio', (req, res) => {
    res.json(db.getPortfolio());
  });

  app.post('/api/portfolio', (req, res) => {
    const { title, category, categoryLabel, description, curl, length, volume, duration, serviceId, imageUrl, tags } = req.body;
    if (!title || !imageUrl) {
      return res.status(400).json({ error: 'Пожалуйста, укажите название работы и изображение' });
    }

    const newItem = db.addPortfolioItem({
      title: title.trim(),
      category: category || 'lashes',
      categoryLabel: categoryLabel || 'Наращивание',
      description: description || '',
      curl: curl || '',
      length: length || '',
      volume: volume || '',
      duration: duration || '',
      serviceId: serviceId || '',
      imageUrl: imageUrl.trim(),
      tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
    });

    res.status(201).json({ success: true, item: newItem });
  });

  app.put('/api/portfolio/:id', (req, res) => {
    const { id } = req.params;
    const updated = db.updatePortfolioItem(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Работа в портфолио не найдена' });
    }
    res.json({ success: true, item: updated });
  });

  app.delete('/api/portfolio/:id', (req, res) => {
    const { id } = req.params;
    const success = db.deletePortfolioItem(id);
    if (!success) {
      return res.status(404).json({ error: 'Работа в портфолио не найдена' });
    }
    res.json({ success: true });
  });

  // Business settings
  app.get('/api/settings', (req, res) => {
    res.json({
      settings: db.businessSettings,
      workingHours: db.workingHours,
      subscription: db.getSubscription(),
      activePlan: db.getActivePlan(),
      yandexStatus: yandexGpt.getStatus(),
    });
  });

  app.put('/api/settings', (req, res) => {
    if (req.body.settings) {
      db.businessSettings = { ...db.businessSettings, ...req.body.settings };
    }
    if (req.body.workingHours) {
      db.workingHours = { ...db.workingHours, ...req.body.workingHours };
    }
    res.json({
      success: true,
      settings: db.businessSettings,
      workingHours: db.workingHours,
    });
  });

  // --- SaaS Subscription & Monetization Routes ---
  app.get('/api/subscription', (req, res) => {
    res.json({
      subscription: db.getSubscription(),
      activePlan: db.getActivePlan(),
      plans: db.getSubscriptionPlans(),
    });
  });

  app.post('/api/subscription/upgrade', (req, res) => {
    const { planId, billingCycle, paymentMethod } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'Тарифный план не указан' });
    }
    const result = db.upgradeSubscription(planId, billingCycle || 'monthly', paymentMethod || 'СБП / Карта');
    res.json({
      success: true,
      message: `Тариф «${result.plan.name}» успешно активирован!`,
      subscription: result.subscription,
      plan: result.plan,
    });
  });

  app.post('/api/subscription/autorenew', (req, res) => {
    const { autoRenew } = req.body;
    const sub = db.toggleSubscriptionAutoRenew(Boolean(autoRenew));
    res.json({ success: true, subscription: sub });
  });

  // --- Multi-Tenant & Platform Super Admin Endpoints ---
  app.get('/api/platform/stats', (req, res) => {
    res.json(db.getPlatformStats());
  });

  app.get('/api/platform/salons', (req, res) => {
    res.json({
      salons: db.getAllSalons(),
      activeSalonId: db.activeSalonId,
      plans: db.getSubscriptionPlans(),
    });
  });

  app.get('/api/salons/:idOrSlug', (req, res) => {
    const salon = db.getSalon(req.params.idOrSlug);
    if (!salon) {
      return res.status(404).json({ error: 'Салон не найден' });
    }
    res.json({ salon });
  });

  app.post('/api/platform/salons/:id/link-telegram-id', (req, res) => {
    const { telegramId } = req.body;
    if (!telegramId || !telegramId.trim()) {
      return res.status(400).json({ error: 'Укажите Telegram ID или @username мастера' });
    }
    try {
      const result = db.linkMasterTelegramId(req.params.id, telegramId);
      res.json({
        success: true,
        message: `Telegram ID "${telegramId}" успешно привязан к салону «${result.salon.settings.name}». Доступ в админку открыт!`,
        salon: result.salon,
      });
    } catch (e: any) {
      res.status(400).json({ error: e.message || 'Ошибка привязки ID' });
    }
  });

  app.put('/api/platform/salons/:id/status', (req, res) => {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'Статус не указан' });
    }
    const salon = db.updateSalonStatus(req.params.id, status);
    res.json({ success: true, salon });
  });

  app.put('/api/platform/salons/:id/plan', (req, res) => {
    const { planId, billingCycle } = req.body;
    if (!planId) {
      return res.status(400).json({ error: 'Тариф не указан' });
    }
    const salon = db.updateSalonPlan(req.params.id, planId, billingCycle || 'monthly');
    res.json({ success: true, salon });
  });

  app.delete('/api/platform/salons/:id', (req, res) => {
    const success = db.deleteSalon(req.params.id);
    if (!success) {
      return res.status(400).json({ error: 'Нельзя удалить единственный салон на платформе' });
    }
    res.json({ success: true, message: 'Салон удалён' });
  });

  app.post('/api/platform/broadcast', (req, res) => {
    const { title, text, target } = req.body;
    if (!title || !text) {
      return res.status(400).json({ error: 'Заполните заголовок и текст сообщения' });
    }
    const msg = db.broadcastToMasters(title, text, target || 'all_masters');
    res.status(201).json({ success: true, broadcast: msg });
  });

  app.get('/api/platform/broadcasts', (req, res) => {
    res.json({ broadcasts: db.getBroadcasts() });
  });

  app.post('/api/platform/switch-salon', (req, res) => {
    const { salonId } = req.body;
    if (!salonId) {
      return res.status(400).json({ error: 'ID салона не указан' });
    }
    const salon = db.setActiveSalon(salonId);
    res.json({
      success: true,
      activeSalonId: db.activeSalonId,
      salon,
      settings: salon.settings,
      services: salon.services,
      subscription: salon.subscription,
    });
  });

  app.post('/api/masters/register', (req, res) => {
    const { salonName, masterName, phone, city } = req.body;
    if (!salonName || !masterName || !phone || !city) {
      return res.status(400).json({ error: 'Пожалуйста, заполните название салона, имя мастера, телефон и город' });
    }
    const tenant = db.registerNewMaster(req.body);
    res.status(201).json({
      success: true,
      message: tenant.isIdVerified
        ? `Салон «${tenant.settings.name}» успешно создан! Доступ открыт.`
        : `Заявка на создание салона «${tenant.settings.name}» принята! Главный администратор привяжет ваш Telegram ID.`,
      salon: tenant,
    });
  });

  // --- Studio Presets & Multi-Salon Creation ---
  app.get('/api/masters/presets', (req, res) => {
    res.json({
      presets: db.getStudioPresets(),
      currentSettings: db.businessSettings,
    });
  });

  app.post('/api/masters/switch-preset', (req, res) => {
    const { presetId } = req.body;
    if (!presetId) {
      return res.status(400).json({ error: 'Пресет не указан' });
    }
    const result = db.switchStudioPreset(presetId);
    if (!result.success) {
      return res.status(404).json({ error: 'Пресет не найден' });
    }
    res.json({
      success: true,
      message: `Салон переключен на «${result.settings.name}» (${result.settings.city})`,
      settings: result.settings,
      services: result.services,
      subscription: result.subscription,
    });
  });

  app.post('/api/masters/create-studio', (req, res) => {
    const { salonName, masterName, city, address, phone } = req.body;
    if (!salonName || !masterName || !city || !address) {
      return res.status(400).json({ error: 'Заполните название салона, имя мастера, город и адрес' });
    }
    const result = db.createNewStudio(req.body);
    res.status(201).json({
      success: true,
      message: `Студия «${result.settings.name}» успешно создана! Все настройки и прайс обновлены.`,
      settings: result.settings,
      services: result.services,
      subscription: result.subscription,
    });
  });

  // Availability & Slots
  app.get('/api/availability', (req, res) => {
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const slots = db.getAvailableSlots(date);
    res.json({
      date,
      slots,
      blockedSlots: db.workingHours.blockedSlots?.[date] || [],
    });
  });

  app.post('/api/availability/toggle-slot', (req, res) => {
    const { date, time } = req.body;
    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time are required' });
    }
    const isBlocked = db.toggleSlotBlock(date, time);
    res.json({
      date,
      time,
      isBlocked,
      slots: db.getAvailableSlots(date),
    });
  });

  // Appointments
  app.get('/api/appointments', (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    if (clientId) {
      return res.json(db.getClientAppointments(clientId));
    }
    res.json(db.getAppointments());
  });

  app.post('/api/appointments', (req, res) => {
    const { clientId, serviceId, date, time, clientName, clientPhone, notes } = req.body;
    if (!clientId || !serviceId || !date || !time) {
      return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
    }

    const result = aiTools.create_appointment({
      clientId,
      serviceId,
      date,
      time,
      clientName: clientName || 'Клиент',
      clientPhone,
      notes,
    });

    if (!result.success) {
      return res.status(409).json({ error: result.error });
    }

    res.status(201).json(result.appointment);
  });

  app.put('/api/appointments/:id/reschedule', (req, res) => {
    const { id } = req.params;
    const { date, time } = req.body;
    if (!date || !time) {
      return res.status(400).json({ error: 'Date and time required' });
    }
    const result = aiTools.reschedule_appointment(id, date, time);
    if (!result.success) {
      return res.status(409).json({ error: result.error });
    }
    res.json(result.appointment);
  });

  app.put('/api/appointments/:id/cancel', (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const result = aiTools.cancel_appointment(id, reason);
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }
    res.json({ success: true, message: 'Запись отменена' });
  });

  // Clients
  app.get('/api/clients', (req, res) => {
    const search = ((req.query.q as string) || '').toLowerCase();
    const clients = db.getClients();
    if (!search) {
      return res.json(clients);
    }
    const filtered = clients.filter(c => 
      c.name.toLowerCase().includes(search) ||
      (c.phone && c.phone.includes(search)) ||
      (c.username && c.username.toLowerCase().includes(search))
    );
    res.json(filtered);
  });

  app.get('/api/clients/:id', (req, res) => {
    const client = db.getClientById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }
    const appointments = db.getClientAppointments(client.id);
    res.json({ client, appointments });
  });

  // Master Manual Client Creation
  app.post('/api/clients', (req, res) => {
    const { name, phone, username, birthday, preferredStyle, notes, telegramId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Имя клиента обязательно' });
    }
    const client = db.registerClient({
      name,
      phone,
      username,
      birthday,
      preferredStyle,
      telegramId,
    });
    if (notes) {
      db.addClientNote(client.id, notes);
    }
    res.status(201).json({ success: true, client });
  });

  // Client Mini-Registration
  app.post('/api/clients/register', (req, res) => {
    const { name, phone, username, birthday, preferredStyle, telegramId } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Пожалуйста, укажите ваше имя' });
    }

    const newClient = db.registerClient({
      name,
      phone,
      username,
      birthday,
      preferredStyle,
      telegramId,
    });

    res.json({
      success: true,
      client: newClient,
      message: `Добро пожаловать в Lashm.anya, ${newClient.name}! 🤍`,
    });
  });

  // Update client profile (e.g. name, birthday, phone, preferredStyle)
  app.put('/api/clients/:id', (req, res) => {
    const updated = db.updateClientProfile(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }
    res.json({
      success: true,
      client: updated,
      message: 'Профиль успешно сохранён',
    });
  });

  // Trigger Birthday discount greeting push for client
  app.post('/api/clients/:id/birthday-discount', (req, res) => {
    const client = db.getClientById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }

    const notification = db.notifications.find(
      n => n.clientId === client.id && n.type === 'birthday_greeting'
    ) || {
      id: `notif-bday-${Date.now()}`,
      clientId: client.id,
      clientName: client.name,
      type: 'birthday_greeting' as const,
      title: 'С днём рождения от Lashm.anya! 🎂 Скидка 20%',
      text: `${client.name}, поздравляем вас с днём рождения! 🤍 Пусть этот год будет полон красоты и сияния. Дарим вам скидку 20% по промокоду BIRTHDAY20 на любую процедуру в течение 30 дней!`,
      discountPercent: 20,
      discountCode: 'BIRTHDAY20',
      status: 'delivered' as const,
      createdAt: new Date().toISOString(),
      actionLabel: 'Записаться со скидкой 20%',
    };

    if (!db.notifications.some(n => n.id === notification.id)) {
      db.notifications.unshift(notification);
    }

    res.json({ success: true, notification });
  });

  app.delete('/api/clients/:id', (req, res) => {
    const success = db.deleteClient(req.params.id);
    if (!success) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }
    res.json({ success: true, message: 'Данные клиента удалены' });
  });

  // AI Memory endpoints
  app.put('/api/clients/:id/memory', (req, res) => {
    const { memory } = req.body;
    const updated = db.updateClientMemory(req.params.id, memory || {});
    if (!updated) {
      return res.status(404).json({ error: 'Клиент не найден' });
    }
    res.json(updated);
  });

  // Master writes a note -> YandexGPT extracts structured memory!
  app.post('/api/clients/:id/notes', async (req, res) => {
    const { note } = req.body;
    if (!note) {
      return res.status(400).json({ error: 'Note text required' });
    }

    try {
      // 1. Add raw note
      db.addClientNote(req.params.id, note);
      
      // 2. YandexGPT converts note to structured memory
      const structuredMemory = await yandexGpt.extractMemoryFromMasterNote(note);
      const updated = db.updateClientMemory(req.params.id, structuredMemory);

      res.json({
        success: true,
        extractedMemory: structuredMemory,
        client: updated,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // AI Dialogs & Master Handoff
  app.get('/api/dialogs', (req, res) => {
    res.json(db.getConversations());
  });

  app.post('/api/dialogs/:id/reply', (req, res) => {
    const { id } = req.params;
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text required' });

    const msg = db.addMessage(id, {
      sender: 'master',
      text,
    });
    db.updateConversationStatus(id, 'resolved');
    res.json(msg);
  });

  // Telegram Chat & Web Simulator
  app.post('/api/chat', async (req, res) => {
    try {
      const { telegramId, name, username, message, actionPayload } = req.body;
      if (!telegramId || (!message && !actionPayload)) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      const response = await conversationManager.handleClientMessage({
        telegramId,
        name,
        username,
        message: message || '',
        actionPayload,
      });

      res.json(response);
    } catch (err: any) {
      console.error('Chat error:', err);
      res.status(500).json({ error: err.message || 'Ошибка обработки диалога' });
    }
  });

  // --- Notifications & Reminders & Discounts ---
  app.get('/api/notifications', (req, res) => {
    const clientId = req.query.clientId as string | undefined;
    res.json(db.getNotifications(clientId));
  });

  app.post('/api/notifications', (req, res) => {
    const { clientId, clientName, type, title, text, discountPercent, discountCode, appointmentId, actionLabel } = req.body;
    if (!clientId || !text) {
      return res.status(400).json({ error: 'Client ID and text are required' });
    }
    const client = db.getClientById(clientId);
    const notif = db.createNotification({
      clientId,
      clientName: clientName || client?.name || 'Клиент',
      type: type || 'appointment_reminder',
      title: title || 'Уведомление Lashm.anya',
      text,
      discountPercent,
      discountCode,
      appointmentId,
      actionLabel,
    });
    res.json(notif);
  });

  app.put('/api/notifications/:id/read', (req, res) => {
    const ok = db.markNotificationRead(req.params.id);
    res.json({ success: ok });
  });

  app.post('/api/notifications/:id/confirm', (req, res) => {
    const ok = db.confirmAppointmentFromNotification(req.params.id);
    res.json({ success: ok });
  });

  app.get('/api/discounts', (req, res) => {
    res.json(db.getDiscountCampaigns());
  });

  app.post('/api/discounts', (req, res) => {
    const { title, description, discountPercent, discountAmount, code, targetAudience, targetClientId, serviceId, validUntil, maxUses, bannerColor, isActive } = req.body;
    if (!title || (!discountPercent && !discountAmount) || !code) {
      return res.status(400).json({ error: 'Пожалуйста, заполните название акции, размер скидки и промокод' });
    }
    const campaign = db.createDiscountCampaign({
      title,
      description: description || '',
      discountPercent: Number(discountPercent) || 0,
      discountAmount: discountAmount ? Number(discountAmount) : null,
      code,
      targetAudience: targetAudience || 'all',
      targetClientId,
      serviceId,
      validUntil: validUntil || '2026-12-31',
      maxUses: maxUses ? Number(maxUses) : undefined,
      bannerColor,
      isActive: isActive !== undefined ? isActive : true,
    });
    res.status(201).json(campaign);
  });

  app.put('/api/discounts/:id', (req, res) => {
    const { id } = req.params;
    const updated = db.updateDiscountCampaign(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Акция или промокод не найдены' });
    }
    res.json({ success: true, campaign: updated });
  });

  app.delete('/api/discounts/:id', (req, res) => {
    const { id } = req.params;
    const success = db.deleteDiscountCampaign(id);
    if (!success) {
      return res.status(404).json({ error: 'Акция или промокод не найдены' });
    }
    res.json({ success: true, message: 'Акция успешно удалена' });
  });

  // Verify promo code (used by client booking or chat)
  app.post('/api/promos/verify', (req, res) => {
    const { code, clientId, serviceId } = req.body;
    if (!code) {
      return res.status(400).json({ valid: false, error: 'Промокод не указан' });
    }
    const cleanCode = code.trim().toUpperCase();
    const campaign = db.discountCampaigns.find(c => c.code.toUpperCase() === cleanCode && c.isActive);
    
    // Also check standard birthday code
    if (cleanCode === 'BIRTHDAY20') {
      return res.json({
        valid: true,
        code: 'BIRTHDAY20',
        title: 'Скидка на День Рождения 🎂',
        discountPercent: 20,
        description: 'Скидка 20% в честь дня рождения',
      });
    }

    if (!campaign) {
      return res.status(404).json({ valid: false, error: 'Промокод не найден или срок его действия истёк' });
    }

    // Check expiration
    if (campaign.validUntil && new Date(campaign.validUntil) < new Date(new Date().toISOString().split('T')[0])) {
      return res.status(400).json({ valid: false, error: `Срок действия промокода истёк ${campaign.validUntil}` });
    }

    // Check target audience restrictions if client provided
    if (clientId && campaign.targetClientId && campaign.targetClientId !== clientId) {
      return res.status(403).json({ valid: false, error: 'Этот промокод привязан к другой клиентке' });
    }

    res.json({
      valid: true,
      code: campaign.code,
      title: campaign.title,
      discountPercent: campaign.discountPercent,
      discountAmount: campaign.discountAmount,
      description: campaign.description,
      validUntil: campaign.validUntil,
    });
  });

  app.post('/api/discounts/:id/broadcast', (req, res) => {
    const result = db.broadcastCampaign(req.params.id);
    res.json(result);
  });

  app.get('/api/notification-settings', (req, res) => {
    res.json(db.notificationSettings);
  });

  app.put('/api/notification-settings', (req, res) => {
    const updated = db.updateNotificationSettings(req.body);
    res.json(updated);
  });

  // --- Master & Super Admin Telegram ID Authentication ---
  app.post('/api/auth/admin-verify', (req, res) => {
    const { telegramId, salonId } = req.body;
    if (!telegramId) {
      return res.status(400).json({ success: false, error: 'Укажите Telegram ID или username' });
    }
    const check = db.verifyAdminTelegramId(telegramId, salonId);
    if (check.isValid) {
      if (check.salon && !check.isSuperAdmin) {
        db.setActiveSalon(check.salon.id);
      }
      res.json({
        success: true,
        isSuperAdmin: check.isSuperAdmin,
        masterName: check.isSuperAdmin ? 'Главный Администратор Платформы' : check.salon?.ownerName || 'Мастер',
        adminTelegramId: telegramId,
        salon: check.salon,
        salonId: check.salon?.id,
      });
    } else {
      res.status(403).json({
        success: false,
        error: `Доступ запрещён: Telegram ID "${telegramId}" не привязан к админке. Обратитесь к главному администратору платформы для привязки.`,
      });
    }
  });

  app.get('/api/auth/admin-info', (req, res) => {
    res.json({
      adminConfigured: Boolean(db.adminTelegramId),
      adminUsername: db.adminTelegramId,
      superAdminUsername: db.superAdminTelegramId,
    });
  });

  // Live Telegram Bot Webhook Endpoint
  app.post('/api/telegram/webhook', async (req, res) => {
    try {
      const update = req.body;
      // Handle standard Telegram Update object
      const message = update?.message || update?.callback_query?.message;
      const text = update?.message?.text || update?.callback_query?.data;
      const from = update?.message?.from || update?.callback_query?.from;

      if (from && text) {
        await conversationManager.handleClientMessage({
          telegramId: `tg-${from.id}`,
          name: [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Гость',
          username: from.username,
          message: text,
        });
      }

      res.json({ ok: true });
    } catch (e) {
      console.error('Webhook error:', e);
      res.json({ ok: false });
    }
  });

  // Vite middleware for development vs. Production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lashm.anya AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
