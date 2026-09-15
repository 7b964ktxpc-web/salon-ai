import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db.ts';
import { conversationManager } from './server/conversation.ts';
import { yandexGpt } from './server/yandex-gpt.ts';
import { aiTools } from './server/tools.ts';
import { attachRequestContext } from './server/tenant-context.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());
  app.use(attachRequestContext);

  // Beauty AI platform identity. Tenant authorization is deliberately request-scoped;
  // no route should rely on a process-global active salon for security decisions.
  app.use((req, _res, next) => {
    const telegramId = String(req.header('x-telegram-user-id') || '').trim();
    const superAdminId = String(process.env.SUPER_ADMIN_TELEGRAM_ID || '').trim();
    if (telegramId) {
      const salons = db.getAllSalons();
      const salon = salons.find((item) => item.ownerTelegramId === telegramId && item.status !== 'suspended');
      req.tenantSession = telegramId === superAdminId
        ? { role: 'super_admin', telegramId }
        : salon
          ? { role: 'salon_owner', salonId: salon.id, telegramId }
          : { role: 'client', telegramId };
    }
    next();
  });

  // --- API Routes ---

  // Health & Yandex Cloud status
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Beauty AI',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
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
      return res.status(404).json({ error: 'Работа не найдена' });
    }
    res.json(updated);
  });

  app.delete('/api/portfolio/:id', (req, res) => {
    const deleted = db.deletePortfolioItem(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Работа не найдена' });
    }
    res.json({ success: true });
  });

  // The remainder of the existing API is intentionally preserved below.
