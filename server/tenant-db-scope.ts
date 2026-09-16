import { AsyncLocalStorage } from 'node:async_hooks';
import { db } from './db.ts';

const tenantStorage = new AsyncLocalStorage<string>();
let fallbackSalonId = String((db as any).activeSalonId || '');

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
      if (current !== normalized) throw new Error('Нельзя изменить tenant в пределах запроса');
      return;
    }
    fallbackSalonId = normalized;
  },
});

export function runWithTenant<T>(salonId: string | undefined, callback: () => T): T {
  const normalized = String(salonId || '').trim();
  if (!normalized) return callback();
  return tenantStorage.run(normalized, callback);
}

export function getRequestTenantId(): string | undefined {
  return tenantStorage.getStore();
}
