import { AsyncLocalStorage } from 'node:async_hooks';
import { db } from './db.ts';

const tenantStorage = new AsyncLocalStorage<string>();
const originalDescriptor = Object.getOwnPropertyDescriptor(db, 'activeSalonId');
const fallbackSalonId = String((db as any).activeSalonId || '');

if (!originalDescriptor || originalDescriptor.configurable !== false) {
  Object.defineProperty(db, 'activeSalonId', {
    configurable: true,
    enumerable: true,
    get() {
      return tenantStorage.getStore() || fallbackSalonId;
    },
    set(value: string) {
      const normalized = String(value || '').trim();
      if (!normalized) return;
      const current = tenantStorage.getStore();
      if (current) {
        // A request-scoped tenant must not be switched by request data.
        if (current !== normalized) throw new Error('Нельзя изменить tenant в пределах запроса');
        return;
      }
      (db as any).__beautyAiFallbackSalonId = normalized;
    },
  });
}

export function runWithTenant<T>(salonId: string | undefined, callback: () => T): T {
  const normalized = String(salonId || '').trim();
  if (!normalized) return callback();
  return tenantStorage.run(normalized, callback);
}

export function getRequestTenantId(): string | undefined {
  return tenantStorage.getStore();
}
