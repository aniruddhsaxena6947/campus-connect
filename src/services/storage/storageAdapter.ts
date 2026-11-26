export interface StorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export const STORAGE_KEYS = {
  legacyMonolith: 'collegeconnect_rn_prototype_v1',
  prefs: 'collegeconnect_prefs_v1',
  auth: 'collegeconnect_auth_v1',
  campusData: 'collegeconnect_data_v1',
  freshWorkspaceV1: 'collegeconnect_fresh_workspace_v1',
  firestorePurgedV1: 'collegeconnect_firestore_purged_v1',
} as const;

export const webStorageAdapter: StorageAdapter = {
  getItem(key: string): string | null {
    try {
      if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
        return globalThis.localStorage.getItem(key);
      }
    } catch {
      // Ignore storage access errors in restricted environments
    }
    return null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
        globalThis.localStorage.setItem(key, value);
      }
    } catch {
      // Ignore quota errors
    }
  },
  removeItem(key: string): void {
    try {
      if (typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
        globalThis.localStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }
  },
};

export function readStorageJson<T>(
  key: string,
  adapter: StorageAdapter = webStorageAdapter
): Partial<T> | null {
  try {
    const raw = adapter.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<T>;
  } catch {
    return null;
  }
}

export function writeStorageJson<T>(
  key: string,
  value: T,
  adapter: StorageAdapter = webStorageAdapter
): void {
  try {
    adapter.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore serialization/quota errors
  }
}

export function removeStorageKey(key: string, adapter: StorageAdapter = webStorageAdapter): void {
  adapter.removeItem(key);
}
