import api from './client';
import type { DesignTemplateDto, TenantThemeDto } from '../types/design';

export const designApi = {
  listTemplates: (category?: string) =>
    api.get<DesignTemplateDto[]>('/design/templates', { params: { category } }).then((r) => r.data),

  getTheme: (slug?: string) =>
    api.get<TenantThemeDto>('/design/theme', { params: { slug } }).then((r) => r.data),

  setTheme: (templateCode: string, brandColorsOverrideJson?: string) =>
    api.put('/design/theme', { templateCode, brandColorsOverrideJson }).then((r) => r.data),
};
