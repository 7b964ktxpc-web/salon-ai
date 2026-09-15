import type { Request, Response, NextFunction } from 'express';
import { verifyTenantSessionToken, type TenantSession } from './platform-tenant.ts';

export function getBearerToken(req: Request): string | null {
  const header = String(req.header('authorization') || '');
  if (!header.toLowerCase().startsWith('bearer ')) return null;
  return header.slice(7).trim() || null;
}

export function attachTenantSession(req: Request, _res: Response, next: NextFunction): void {
  const token = getBearerToken(req);
  req.tenantSession = token ? (verifyTenantSessionToken(token) || undefined) : undefined;
  next();
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

declare global {
  namespace Express {
    interface Request {
      tenantSession?: TenantSession;
    }
  }
}
