import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import type { SalonTenant } from '../src/types.ts';
import { assertSalonOwner, assertSuperAdmin, type TenantSession } from './platform-tenant.ts';

declare global {
  namespace Express {
    interface Request {
      tenantSession?: TenantSession;
      requestId?: string;
    }
  }
}

export function attachRequestContext(req: Request, _res: Response, next: NextFunction) {
  req.requestId = randomUUID();
  next();
}

export function requireSuperAdmin(req: Request): TenantSession {
  const session = req.tenantSession;
  if (!session) throw new Error('Необходима авторизация');
  assertSuperAdmin(session);
  return session;
}

export function requireSalonAccess(req: Request, salonId: string): TenantSession {
  const session = req.tenantSession;
  if (!session) throw new Error('Необходима авторизация');
  assertSalonOwner(session, salonId);
  return session;
}

export function findSalonForSession(session: TenantSession, salons: Iterable<SalonTenant>, requestedSalonId?: string): SalonTenant | undefined {
  if (session.role === 'super_admin') {
    return requestedSalonId ? [...salons].find((salon) => salon.id === requestedSalonId) : undefined;
  }
  if (!session.salonId) return undefined;
  return [...salons].find((salon) => salon.id === session.salonId);
}
