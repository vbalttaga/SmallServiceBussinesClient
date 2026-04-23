import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useTranslation } from 'react-i18next';

export default function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();
  const { t } = useTranslation();

  const themes = [
    { key: 'light' as const, icon: <Sun size={16} />, label: t('common.light', 'Light') },
    { key: 'dark' as const, icon: <Moon size={16} />, label: t('common.dark', 'Dark') },
    { key: 'system' as const, icon: <Monitor size={16} />, label: t('common.system', 'System') },
  ];

  return (
    <div
      className="btn-group btn-group-sm"
      role="group"
      aria-label={t('common.themeSelector', 'Theme selector')}
    >
      {themes.map((themeOption) => (
        <button
          key={themeOption.key}
          type="button"
          className={`btn ${theme === themeOption.key ? 'btn-primary' : 'btn-outline-secondary'}`}
          onClick={() => setTheme(themeOption.key)}
          aria-pressed={theme === themeOption.key}
          title={themeOption.label}
        >
          {themeOption.icon}
        </button>
      ))}
    </div>
  );
}
