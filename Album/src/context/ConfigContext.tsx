import { createContext, useContext, useState, type ReactNode } from 'react';
import type { BlobConfig } from '../types';

const SESSION_KEY = 'album-viewer-sas';
const ACCOUNT_NAME = import.meta.env.VITE_AZURE_ACCOUNT_NAME ?? '';
const CONTAINER_NAME = import.meta.env.VITE_AZURE_CONTAINER_NAME ?? '';

interface ConfigContextValue {
  config: BlobConfig | null;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

function extractToken(): string | null {
  // 1. Check URL for ?t=<base64-encoded-sas-token>
  const params = new URLSearchParams(window.location.search);
  const tokenParam = params.get('t');
  if (tokenParam) {
    try {
      const decoded = atob(tokenParam);
      sessionStorage.setItem(SESSION_KEY, decoded);
      // Remove ?t= from URL to keep it clean
      params.delete('t');
      const clean = params.toString();
      const newUrl = window.location.pathname + (clean ? `?${clean}` : '') + window.location.hash;
      window.history.replaceState({}, '', newUrl);
      return decoded;
    } catch { /* invalid base64, fall through */ }
  }

  // 2. Check sessionStorage
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) return stored;

  // 3. Fallback to env variable (for dev)
  const envToken = import.meta.env.VITE_AZURE_SAS_TOKEN;
  return envToken || null;
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config] = useState<BlobConfig | null>(() => {
    const sasToken = extractToken();
    if (!sasToken) return null;
    return { accountName: ACCOUNT_NAME, containerName: CONTAINER_NAME, sasToken };
  });

  return (
    <ConfigContext.Provider value={{ config }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error('useConfig must be used within ConfigProvider');
  return ctx;
}
