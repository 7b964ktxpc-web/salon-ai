import type { Request, Response, NextFunction } from 'express';
import { verifyTenantSessionToken, type TenantSession } from './platform-tenant.ts';
import { runWithTenant } from './tenant-db-scope.ts';

export function getBearerToken(req: Request): string | null {
  const header = String(req.header('authorization') || '');
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  return header.slice(7).trim() || null;
}

export function attachTenantSession(req: Request, _res: Response, next: NextFunction): void {
  const token = getBearerToken(req);
  req.tenantSession = token ? (verifyTenantSessionToken(token) || undefined) : undefined;
  const salonId = req.tenantSession?.role === 'salon_owner' || req.tenantSession?.role === 'master'
    ? req.tenantSession.salonId
    : undefined;
  runWithTenant(salonId, next);
}

export function requireSession(req: Request, res: Response): TenantSession | null {
  if (!req.tenantSession) {
    res.status(401).json({ error: 'Необходима авторизация' });
    return null;
  }
  return req.tenantSession;
}

export function requireSuperAdmin(req: Request, res: Response): TenantSession | null {
  const session = requireSession(req, res);
  if (!session) return null;
  if (session.role !== 'super_admin') {
    res.status(403).json({ error: 'Доступ только для SUPER ADMIN' });
    return null;
  }
  return session;
}

export function requireSalonOwner(req: Request, res: Response, salonId: string): TenantSession | null {
  const session = requireSession(req, res);
  if (!session) return null;
  if (session.role === 'super_admin') return session;
  if (session.role !== 'salon_owner' || session.salonId !== salonId) {
    res.status(403).json({ error: 'Нет доступа к этому салону' });
    return null;
  }
  return session;
}

/** Requires a signed salon-owner session and returns the tenant id from the token, never from request body. */
export function requireCurrentSalon(req: Request, res: Response): string | null {
  const session = requireSession(req, res);
  if (!session) return null;
  if (session.role === 'super_admin') {
    const requested = String(req.params.salonId || req.params.id || req.body?.salonId || req.query?.salonId || '').trim();
    if (!requested) {
      res.status(400).json({ error: 'Не указан salonId' });
      return null;
    }
    return requested;
  }
  if (session.role !== 'salon_owner' || !session.salonId) {
    res.status(403).json({ error: 'Доступ только для владельца салона' });
    return null;
  }
  return session.salonId;
}

/** Middleware factory for routes where the salon id is part of the URL. */
export function requireSalonParam(paramName = 'id') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const session = requireSession(req, res);
    if (!session) return;
    const requestedSalonId = String(req.params[paramName] || '').trim();
    if (!requestedSalonId) {
      res.status(400).json({ error: 'Не указан salonId' });
      return;
    }
    if (session.role !== 'super_admin' && (session.role !== 'salon_owner' || session.salonId !== requestedSalonId)) {
      res.status(403).json({ error: 'Нет доступа к этому салону' });
      return;
    }
    next();
  };
}

declare global {
  namespace Express {
    interface Request {
      tenantSession?: TenantSession;
    }
  }
}
