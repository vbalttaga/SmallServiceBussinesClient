import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { designApi } from '../api/designApi';
import { getSubdomainSlug } from '../utils/tenant';
import { useAuthStore } from '../store/authStore';
import { applyThemeToRoot, resolveThemeFromTenant } from './applyTheme';
import type { TenantThemeDto } from '../types/design';

interface ThemeState {
  theme: TenantThemeDto | null;
  reload: () => Promise<void>;
}

const TenantThemeContext = createContext<ThemeState>({ theme: null, reload: async () => {} });

/**
 * Resolves the active tenant's theme (from subdomain slug, ?org=, or JWT) and
 * applies it to the document via CSS custom properties. Skips the API call
 * entirely when there's no tenant context to resolve (anonymous user on the
 * marketing landing) — the default CSS variables stay in effect.
 */
export function TenantThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<TenantThemeDto | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());

  async function load() {
    const slug = getSubdomainSlug() ?? new URLSearchParams(window.location.search).get('org') ?? undefined;

    // Without a tenant slug AND without an auth claim, the backend can't resolve
    // an organisation — calling would always 404. Stay on the default theme.
    if (!slug && !isAuthenticated) {
      setTheme(null);
      return;
    }

    try {
      const t = await designApi.getTheme(slug ?? undefined);
      setTheme(t);
      applyThemeToRoot(resolveThemeFromTenant(t));
    } catch {
      setTheme(null);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [isAuthenticated]);

  return (
    <TenantThemeContext.Provider value={{ theme, reload: load }}>
      {children}
    </TenantThemeContext.Provider>
  );
}

export const useTenantTheme = () => useContext(TenantThemeContext);
