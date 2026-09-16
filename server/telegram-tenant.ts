import { db } from './db.ts';
import type { SalonTenant } from '../src/types.ts';

/**
 * Resolve a Telegram webhook to exactly one salon.
 * The bot token is supplied by Telegram as part of the configured webhook URL,
 * so callers must pass the token belonging to the receiving bot.
 */
export function findSalonByTelegramBotToken(token: string): SalonTenant | undefined {
  const normalized = String(token || '').trim();
  if (!normalized) return undefined;
  return db.getAllSalons().find((salon) => salon.telegramBot?.token === normalized);
}

export function findSalonByTelegramUsername(username: string): SalonTenant | undefined {
  const normalized = String(username || '').replace(/^@/, '').trim().toLowerCase();
  if (!normalized) return undefined;
  return db.getAllSalons().find((salon) => {
    const configured = String(salon.telegramBot?.username || '').replace(/^@/, '').trim().toLowerCase();
    return configured && configured === normalized;
  });
}
