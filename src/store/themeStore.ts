import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: () => boolean;
}

function getSystemPreference(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function applyTheme(theme: Theme) {
  const isDark = theme === 'dark' || (theme === 'system' && getSystemPreference());
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
}

const validThemes: Theme[] = ['light', 'dark', 'system'];
const storedTheme = localStorage.getItem('theme');
const savedTheme: Theme = validThemes.includes(storedTheme as Theme) ? (storedTheme as Theme) : 'system';
applyTheme(savedTheme);

// Listen for system preference changes
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const handleSystemThemeChange = () => {
  const current = useThemeStore.getState().theme;
  if (current === 'system') applyTheme('system');
};
mediaQuery.addEventListener('change', handleSystemThemeChange);

/** Call to remove the system theme preference listener. */
export function cleanupThemeListener() {
  mediaQuery.removeEventListener('change', handleSystemThemeChange);
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: savedTheme,

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    applyTheme(theme);
    set({ theme });
  },

  isDark: () => {
    const { theme } = get();
    return theme === 'dark' || (theme === 'system' && getSystemPreference());
  },
}));
