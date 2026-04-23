import type { DesignTemplateColors, DesignTemplateTypography, DesignTemplateDto, TenantThemeDto } from '../types/design';

/**
 * Takes a design template plus optional tenant overrides and produces the
 * effective colors + typography maps.
 */
export function resolveThemeFromTenant(tenant: TenantThemeDto) {
  const colors: Partial<DesignTemplateColors> = safeParse(tenant.colorsJson) ?? {};
  const overrides: Partial<DesignTemplateColors> = safeParse(tenant.brandColorsOverrideJson) ?? {};
  const typography: Partial<DesignTemplateTypography> = safeParse(tenant.typographyJson) ?? {};
  return {
    colors: { ...colors, ...overrides } as DesignTemplateColors,
    typography: typography as DesignTemplateTypography,
    layoutCode: tenant.layoutCode ?? 'modern',
    heroStyle:  tenant.heroStyle  ?? 'default',
    cardStyle:  tenant.cardStyle  ?? 'soft',
    templateCode: tenant.templateCode,
  };
}

export function resolveThemeFromTemplate(tpl: DesignTemplateDto, overrideJson?: string) {
  const colors: Partial<DesignTemplateColors> = safeParse(tpl.colorsJson) ?? {};
  const overrides: Partial<DesignTemplateColors> = safeParse(overrideJson) ?? {};
  const typography: Partial<DesignTemplateTypography> = safeParse(tpl.typographyJson) ?? {};
  return {
    colors: { ...colors, ...overrides } as DesignTemplateColors,
    typography: typography as DesignTemplateTypography,
    layoutCode: tpl.layoutCode ?? 'modern',
    heroStyle:  tpl.heroStyle  ?? 'default',
    cardStyle:  tpl.cardStyle  ?? 'soft',
    templateCode: tpl.code,
  };
}

/**
 * Writes the resolved theme into CSS custom properties on <html>.
 * All UI styles read these via `var(--tenant-primary)` etc.
 */
export function applyThemeToRoot(theme: ReturnType<typeof resolveThemeFromTemplate>) {
  const root = document.documentElement;
  const c = theme.colors;
  const t = theme.typography;

  const set = (name: string, value?: string | number) => {
    if (value == null || value === '') root.style.removeProperty(name);
    else root.style.setProperty(name, String(value));
  };

  set('--tenant-primary',       c.primary);
  set('--tenant-primary-hover', c.primaryHover);
  set('--tenant-bg',            c.bg);
  set('--tenant-surface',       c.surface);
  set('--tenant-surface-alt',   c.surfaceAlt);
  set('--tenant-text',          c.text);
  set('--tenant-text-muted',    c.textMuted);
  set('--tenant-accent',        c.accent);
  set('--tenant-border',        c.border);
  set('--tenant-success',       c.success);
  set('--tenant-danger',        c.danger);
  set('--tenant-hero-gradient', c.heroGradient);

  set('--tenant-font',          t.fontFamily);
  set('--tenant-heading-font',  t.headingFamily);
  set('--tenant-heading-weight', t.headingWeight ?? 600);
  set('--tenant-scale',          t.scale ?? 1);

  root.dataset.tenantLayout = theme.layoutCode;
  root.dataset.tenantHero   = theme.heroStyle;
  root.dataset.tenantCard   = theme.cardStyle;
  if (theme.templateCode) root.dataset.tenantTemplate = theme.templateCode;

  if (t.uppercaseHeadings) root.classList.add('tenant-uppercase-headings');
  else root.classList.remove('tenant-uppercase-headings');
}

function safeParse(s?: string) {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}
