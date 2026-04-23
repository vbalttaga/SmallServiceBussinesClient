import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Palette } from 'lucide-react';
import { designApi } from '../api/designApi';
import type { DesignTemplateDto, DesignTemplateColors, DesignTemplateTypography } from '../types/design';
import './TemplatePicker.css';

interface Props {
  value?: string;
  onChange: (code: string) => void;
  category?: string;
  /** If true, shows a compact grid; else a full width grid with large preview */
  compact?: boolean;
}

/**
 * Visual template gallery. Each card is a live mini-preview of the theme — the
 * real colors and fonts, not a static screenshot, so it stays in sync if a
 * template definition changes.
 */
export default function TemplatePicker({ value, onChange, category, compact = false }: Props) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<DesignTemplateDto[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>(category ?? '');

  useEffect(() => {
    designApi.listTemplates(categoryFilter || undefined)
      .then(setTemplates)
      .catch(() => setTemplates([]));
  }, [categoryFilter]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((tpl) => tpl.category && set.add(tpl.category));
    return Array.from(set);
  }, [templates]);

  return (
    <div className={'tpl-picker ' + (compact ? 'tpl-picker--compact' : '')}>
      {!compact && categories.length > 0 && (
        <div className="tpl-picker__filter">
          <button type="button"
            className={'tpl-chip ' + (!categoryFilter ? 'tpl-chip--active' : '')}
            onClick={() => setCategoryFilter('')}>
            {t('tpl.all', 'All')}
          </button>
          {categories.map((c) => (
            <button key={c} type="button"
              className={'tpl-chip ' + (categoryFilter === c ? 'tpl-chip--active' : '')}
              onClick={() => setCategoryFilter(c)}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="tpl-grid">
        {templates.map((tpl) => (
          <TemplateCard
            key={tpl.code}
            tpl={tpl}
            active={value === tpl.code}
            onClick={() => onChange(tpl.code)}
            compact={compact}
          />
        ))}
        {templates.length === 0 && (
          <div className="tpl-empty">
            <Palette size={24} /> <span>{t('tpl.empty', 'No templates available yet')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ tpl, active, onClick, compact }: { tpl: DesignTemplateDto; active: boolean; onClick: () => void; compact: boolean }) {
  const colors  = safeParse<DesignTemplateColors>(tpl.colorsJson)     ?? emptyColors();
  const typo    = safeParse<DesignTemplateTypography>(tpl.typographyJson) ?? { fontFamily: 'inherit', headingFamily: 'inherit', scale: 1 };

  const style: React.CSSProperties = {
    '--c-primary':       colors.primary,
    '--c-primary-hover': colors.primaryHover,
    '--c-bg':            colors.bg,
    '--c-surface':       colors.surface,
    '--c-surface-alt':   colors.surfaceAlt,
    '--c-text':          colors.text,
    '--c-text-muted':    colors.textMuted,
    '--c-accent':        colors.accent,
    '--c-border':        colors.border,
    '--c-hero':          colors.heroGradient ?? colors.bg,
    '--c-font':          typo.fontFamily,
    '--c-heading-font':  typo.headingFamily,
  } as React.CSSProperties;

  return (
    <button
      type="button"
      className={'tpl-card ' + (active ? 'tpl-card--active' : '') + (compact ? ' tpl-card--compact' : '')}
      style={style}
      onClick={onClick}
      aria-pressed={active}
    >
      {active && <span className="tpl-card__badge"><Check size={14} /></span>}

      {/* Live preview */}
      <div className="tpl-preview">
        <div className="tpl-preview__hero">
          <div className="tpl-preview__title">{tpl.name}</div>
          <div className="tpl-preview__pill" />
        </div>
        <div className="tpl-preview__body">
          <div className="tpl-preview__card">
            <div className="tpl-preview__line tpl-preview__line--title" />
            <div className="tpl-preview__line" />
            <div className="tpl-preview__btn">Book</div>
          </div>
          <div className="tpl-preview__swatches">
            <span style={{ background: colors.primary }} />
            <span style={{ background: colors.accent }} />
            <span style={{ background: colors.surfaceAlt, border: `1px solid ${colors.border}` }} />
          </div>
        </div>
      </div>

      <div className="tpl-card__meta">
        <div className="tpl-card__name">{tpl.name}</div>
        {tpl.category && <div className="tpl-card__category">{tpl.category}</div>}
      </div>

      {!compact && tpl.description && (
        <div className="tpl-card__desc">{tpl.description}</div>
      )}
    </button>
  );
}

function safeParse<T>(s?: string): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

function emptyColors(): DesignTemplateColors {
  return {
    primary: '#2563eb', primaryHover: '#1d4ed8',
    bg: '#fff', surface: '#fff', surfaceAlt: '#f1f5f9',
    text: '#0f172a', textMuted: '#64748b',
    accent: '#06b6d4', border: '#e2e8f0',
  };
}
