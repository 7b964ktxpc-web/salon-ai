import crypto from 'node:crypto';
import type { SalonTenant, SubscriptionPlanId } from '../src/types.ts';

/** Universal platform roles. A user must never receive tenant access from a client-supplied salon id alone. */
export type PlatformRole = 'super_admin' | 'salon_owner' | 'master' | 'client';

export interface TenantSession {
  role: PlatformRole;
  salonId?: string;
  telegramId?: string;
}

export interface SalonInvite {
  token: string;
  salonId: string;
  slug: string;
  createdAt: string;
  expiresAt?: string;
  usedAt?: string;
}

export interface TelegramBotConfig {
  botUsername?: string;
  botName?: string;
  tokenConfigured: boolean;
  webhookConfigured: boolean;
  enabled: boolean;
}

const PUBLIC_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeSlug(value: string): string {
  const slug = value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const latin = slug.replace(/[а-яё]/gi, '');
  return (latin || 'salon').slice(0, 48).replace(/-$/g, '');
}

export function createSalonPublicToken(): string { return crypto.randomBytes(18).toString('base64url'); }

export function createSalonPublicPath(slug: string, token?: string): string {
  const normalized = normalizeSlug(slug);
  if (!PUBLIC_SLUG_RE.test(normalized)) throw new Error('Некорректный slug салона');
  return token ? `/s/${normalized}/${token}` : `/s/${normalized}`;
}

export function createSalonAdminPath(slug: string, token: string): string {
  const normalized = normalizeSlug(slug);
  if (!PUBLIC_SLUG_RE.test(normalized) || !token) throw new Error('Некорректная ссылка приглашения');
  return `/salon/${normalized}/admin/${token}`;
}

export function createSalonInvite(salon: SalonTenant, ttlDays = 14): SalonInvite {
  const now = new Date();
  return { token: createSalonPublicToken(), salonId: salon.id, slug: salon.slug, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + ttlDays * 86400000).toISOString() };
}

export function isInviteExpired(invite: SalonInvite, now = new Date()): boolean {
  if (invite.usedAt) return true;
  if (!invite.expiresAt) return false;
  return new Date(invite.expiresAt).getTime() <= now.getTime();
}

export function resolveTelegramRole(telegramId: string, superAdminTelegramId: string, salons: Iterable<SalonTenant>): TenantSession {
  const id = String(telegramId || '').trim();
  const superAdmin = String(superAdminTelegramId || '').trim();
  if (id && superAdmin && id === superAdmin) return { role: 'super_admin', telegramId: id };
  for (const salon of salons) {
    if (salon.ownerTelegramId && salon.ownerTelegramId === id && salon.status !== 'suspended') return { role: 'salon_owner', salonId: salon.id, telegramId: id };
  }
  return { role: 'client', telegramId: id || undefined };
}

export function assertSalonOwner(session: TenantSession, salonId: string): void {
  if (session.role === 'super_admin') return;
  if (session.role !== 'salon_owner' || session.salonId !== salonId) throw new Error('Недостаточно прав для доступа к этому салону');
}

export function assertSuperAdmin(session: TenantSession): void {
  if (session.role !== 'super_admin') throw new Error('Доступ только для главного администратора');
}

export function botConfigFromSalon(salon: SalonTenant): TelegramBotConfig {
  return { botUsername: salon.botUsername, botName: salon.settings.telegramBotName, tokenConfigured: Boolean(salon.botTokenConfigured), webhookConfigured: Boolean(salon.botTokenConfigured && salon.botUsername), enabled: salon.status === 'active' || salon.status === 'trial' };
}

export function planAllowsBot(planId: SubscriptionPlanId): boolean { return planId === 'pro' || planId === 'studio'; }

/** Signed session token. The browser cannot change salonId/role without invalidating the signature. */
export function createTenantSessionToken(session: TenantSession, secret = process.env.BEAUTY_AI_SESSION_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || ''): string {
  if (!secret) throw new Error('BEAUTY_AI_SESSION_SECRET не настроен');
  const payload = Buffer.from(JSON.stringify({ ...session, exp: Date.now() + 7 * 86400000 }), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyTenantSessionToken(token: string, secret = process.env.BEAUTY_AI_SESSION_SECRET || process.env.TELEGRAM_WEBHOOK_SECRET || ''): TenantSession | null {
  if (!token || !secret) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as TenantSession & { exp?: number };
    if (!parsed.exp || parsed.exp <= Date.now()) return null;
    if (!['super_admin', 'salon_owner', 'master', 'client'].includes(parsed.role)) return null;
    return { role: parsed.role, salonId: parsed.salonId, telegramId: parsed.telegramId };
  } catch { return null; }
}
