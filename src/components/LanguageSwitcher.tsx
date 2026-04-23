import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'ro', label: 'RO' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {languages.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className="nav-link-btn"
          style={{
            fontWeight: i18n.language === code ? 700 : 400,
            opacity: i18n.language === code ? 1 : 0.6,
            padding: '2px 6px',
            fontSize: 12,
            minWidth: 0,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
