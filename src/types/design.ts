export interface DesignTemplateColors {
  primary: string;
  primaryHover: string;
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  border: string;
  success?: string;
  danger?: string;
  heroGradient?: string;
}

export interface DesignTemplateTypography {
  fontFamily: string;
  headingFamily: string;
  scale: number;
  headingWeight?: number;
  uppercaseHeadings?: boolean;
}

export interface DesignTemplateDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  category?: string;
  previewImageUrl?: string;
  colorsJson: string;
  typographyJson?: string;
  layoutCode: string;
  heroStyle: string;
  cardStyle: string;
  sortOrder: number;
}

export interface TenantThemeDto {
  organisationId: number;
  organisationName: string;
  designTemplateCode?: string;
  brandColorsOverrideJson?: string;
  logoUrl?: string;
  bookingCoverUrl?: string;
  primaryColor?: string;
  averageRating?: number;
  reviewCount?: number;
  templateCode?: string;
  templateName?: string;
  colorsJson?: string;
  typographyJson?: string;
  layoutCode?: string;
  heroStyle?: string;
  cardStyle?: string;
}
