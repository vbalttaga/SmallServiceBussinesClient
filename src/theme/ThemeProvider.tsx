import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { designApi } from '../api/designApi';
import { getSubdomainSlug } from '../utils/tenant';
import { applyThemeToRoot, resolveThemeFromTenant } from './applyTheme';
import type { TenantThemeDto } from '../types/design';

interface ThemeState {
  theme: TenantThemeDto | null;
  reload: () => Promise<void>;
}

const TenantThemeContext = createContext<ThemeState>({ theme: null, reload: async () => {} });

/**
 * Resolves the active tenant's theme (from subdomain slug, ?org=, or JWT) and
 * applies it to the document via CSS custom properties. Falls back silently if
 * no tenant is resolved (e.g. marketing landing).
 */
export function TenantThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<TenantThemeDto | null>(null);

  async function load() {
    const slug = getSubdomainSlug() ?? new URLSearchParams(window.location.search).get('org') ?? undefined;
    try {
      const t = await designApi.getTheme(slug ?? undefined);
      setTheme(t);
      applyThemeToRoot(resolveThemeFromTenant(t));
    } catch {
      setTheme(null);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  return (
    <TenantThemeContext.Provider value={{ theme, reload: load }}>
      {children}
    </TenantThemeContext.Provider>
  );
}

export const useTenantTheme = () => useContext(TenantThemeContext);
