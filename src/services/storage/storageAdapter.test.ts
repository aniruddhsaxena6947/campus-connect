import { describe, expect, it } from 'bun:test';
import {
  readStorageJson,
  removeStorageKey,
  StorageAdapter,
  writeStorageJson,
} from './storageAdapter';

function createMemoryAdapter(): StorageAdapter {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

describe('storageAdapter', () => {
  it('writes, reads, and removes structured JSON safely', () => {
    const adapter = createMemoryAdapter();
    writeStorageJson('test_key', { themeMode: 'dark', platformOS: 'android' }, adapter);

    const parsed = readStorageJson<{ themeMode: string; platformOS: string }>('test_key', adapter);
    expect(parsed).toEqual({ themeMode: 'dark', platformOS: 'android' });

    removeStorageKey('test_key', adapter);
    expect(readStorageJson('test_key', adapter)).toBeNull();
  });

  it('returns null on corrupted JSON instead of throwing', () => {
    const adapter = createMemoryAdapter();
    adapter.setItem('corrupt_key', '{not-valid-json');
    expect(readStorageJson('corrupt_key', adapter)).toBeNull();
  });
});
