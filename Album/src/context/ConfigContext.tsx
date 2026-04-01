import { createContext, useContext, useState, type ReactNode } from 'react';
import type { BlobConfig } from '../types';
import configData from '../../data.json';

const SESSION_KEY = 'album-viewer-sas';

interface ConfigContextValue {
  config: BlobConfig | null;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

function extractConfig(): BlobConfig | null {
  // 1. Try data.json: concatenate file names (strip .json), base64-decode to get SAS token
  if (configData?.root && configData?.folder && configData?.files?.length) {
    const base64 = configData.files.map((f: string) => f.replace(/\.json$/, '')).join('');
    try {
      const sasToken = atob(base64);
      return {
        accountName: configData.root,
        containerName: configData.folder,
        sasToken,
      };
    } catch { /* invalid base64, fall through */ }
  }

  // 2. Fallback to env variables (for dev)
  const accountName = import.meta.env.VITE_AZURE_ACCOUNT_NAME ?? '';
  const containerName = import.meta.env.VITE_AZURE_CONTAINER_NAME ?? '';
  const envToken = import.meta.env.VITE_AZURE_SAS_TOKEN;
  if (envToken) {
    return { accountName, containerName, sasToken: envToken };
  }

  // 3. Check sessionStorage
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored && accountName) {
    return { accountName, containerName, sasToken: stored };
  }

  return null;
}

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config] = useState<BlobConfig | null>(() => extractConfig());

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
