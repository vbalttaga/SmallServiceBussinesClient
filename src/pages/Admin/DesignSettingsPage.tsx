import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Palette, Save, RefreshCw, ExternalLink } from 'lucide-react';
import TemplatePicker from '../../components/TemplatePicker';
import { designApi } from '../../api/designApi';
import { useTenantTheme } from '../../theme/ThemeProvider';
import { toast } from '../../store/toastStore';
import type { DesignTemplateColors } from '../../types/design';

/**
 * Tenant-side theme management. Owners can switch templates + override
 * specific brand colors on top of the picked template.
 */
export default function DesignSettingsPage() {
  const { t } = useTranslation();
  const { theme, reload } = useTenantTheme();
  const [selected, setSelected] = useState<string>('');
  const [primaryOverride, setPrimaryOverride] = useState<string>('');
  const [accentOverride, setAccentOverride] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!theme) return;
    setSelected(theme.templateCode ?? '');
    const ov = safeParse<Partial<DesignTemplateColors>>(theme.brandColorsOverrideJson);
    setPrimaryOverride(ov?.primary ?? '');
    setAccentOverride(ov?.accent ?? '');
  }, [theme]);

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      const overrides: Partial<DesignTemplateColors> = {};
      if (primaryOverride) overrides.primary = primaryOverride;
      if (accentOverride)  overrides.accent  = accentOverride;
      const json = Object.keys(overrides).length ? JSON.stringify(overrides) : undefined;
      await designApi.setTheme(selected, json);
      await reload();
      toast.success(t('design.saved', 'Theme updated'));
    } catch {
      toast.error(t('design.saveFailed', 'Could not update theme'));
    } finally { setSaving(false); }
  }

  function resetOverrides() {
    setPrimaryOverride('');
    setAccentOverride('');
  }

  return (
    <div style={{ maxWidth: 960 }}>
      <h1 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Palette size={22} /> {t('design.title', 'Design & Branding')}
      </h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: 24 }}>
        {t('design.subtitle', 'Pick a visual theme for your public booking page. Changes apply instantly.')}
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>{t('design.pickTemplate', 'Template')}</h2>
        <TemplatePicker value={selected} onChange={setSelected} />
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>{t('design.overrides', 'Optional brand overrides')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          <ColorField
            label={t('design.primaryColor', 'Primary color')}
            value={primaryOverride}
            onChange={setPrimaryOverride}
            placeholder={t('design.fromTemplate', '(from template)')}
          />
          <ColorField
            label={t('design.accentColor', 'Accent color')}
            value={accentOverride}
            onChange={setAccentOverride}
            placeholder={t('design.fromTemplate', '(from template)')}
          />
        </div>
        {(primaryOverride || accentOverride) && (
          <button type="button" className="btn btn-link" style={{ paddingLeft: 0, marginTop: 8 }} onClick={resetOverrides}>
            <RefreshCw size={13} /> {t('design.resetOverrides', 'Reset to template defaults')}
          </button>
        )}
      </section>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={save}
          disabled={saving || !selected}
          style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
        >
          <Save size={16} /> {saving ? t('design.saving', 'Saving...') : t('design.save', 'Save theme')}
        </button>

        {theme?.organisationName && (
          <a
            href={`${window.location.protocol}//${window.location.host}?org=${encodeURIComponent(String(theme.organisationId))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline-secondary"
            style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
          >
            <ExternalLink size={16} /> {t('design.preview', 'Preview booking page')}
          </a>
        )}
      </div>
    </div>
  );
}

function ColorField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', fontSize: 13 }}>
      <span style={{ marginBottom: 6, color: 'var(--color-text-secondary)' }}>{label}</span>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 40, height: 40, padding: 0, border: 'none', background: 'transparent' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--color-border, #e5e7eb)' }}
        />
      </div>
    </label>
  );
}

function safeParse<T>(s?: string): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}
