import api from './client';

export interface PortfolioItemDto {
  id: number;
  organisationId: number;
  staffId?: number;
  staffName?: string;
  serviceId?: number;
  serviceName?: string;
  title?: string;
  description?: string;
  imageUrl: string;
  thumbnailUrl?: string;
  tagsCsv?: string;
  likeCount: number;
  sortOrder: number;
  isPublic: boolean;
  dateCreated: string;
}

export interface MarketplaceBusinessDto {
  id: number;
  name: string;
  slug: string;
  shortTagline?: string;
  cityTag?: string;
  logoUrl?: string;
  bookingCoverUrl?: string;
  averageRating?: number;
  reviewCount: number;
  designTemplateCode?: string;
  businessType?: string;
  businessTypeName?: string;
}

export interface ReviewDto {
  id: number;
  rating: number;
  comment?: string;
  isPublic: boolean;
  isVerified: boolean;
  responseText?: string;
  dateCreated: string;
  staffName?: string;
  serviceName?: string;
  clientName?: string;
}

export interface ServicePackageDto {
  id: number;
  name: string;
  description?: string;
  sessionCount: number;
  totalPrice: number;
  currency: string;
  validityDays?: number;
  isActive: boolean;
  isOnline: boolean;
}

export interface LoyaltyAccountDto {
  id: number;
  points: number;
  lifetimePoints: number;
  tierCode?: string;
}

export interface LoyaltyTransactionDto {
  id: number;
  type: string;
  points: number;
  reason?: string;
  dateCreated: string;
}

export const marketplaceApi = {
  search: (params: { query?: string; businessType?: string; city?: string; page?: number; pageSize?: number } = {}) =>
    api.get<MarketplaceBusinessDto[]>('/marketplace/businesses', { params }).then((r) => r.data),
};

export const portfolioApi = {
  getPublic: (slug?: string, staffId?: number, serviceId?: number) =>
    api.get<PortfolioItemDto[]>('/portfolio/public', { params: { slug, staffId, serviceId } }).then((r) => r.data),
  getAll: (staffId?: number, serviceId?: number) =>
    api.get<PortfolioItemDto[]>('/portfolio', { params: { staffId, serviceId } }).then((r) => r.data),
  create: (data: { staffId?: number; serviceId?: number; imageUrl: string; title?: string; description?: string; tagsCsv?: string }) =>
    api.post<{ id: number }>('/portfolio', data).then((r) => r.data),
  like: (id: number) => api.post<{ likes: number }>(`/portfolio/${id}/like`).then((r) => r.data),
};

export const reviewsApi = {
  getPublic: (slug?: string, take = 20) =>
    api.get<ReviewDto[]>('/reviews/public', { params: { slug, take } }).then((r) => r.data),
  submitByToken: (token: string, rating: number, comment?: string) =>
    api.post<{ id: number }>(`/reviews/by-token/${encodeURIComponent(token)}`, { rating, comment }).then((r) => r.data),
  respond: (reviewId: number, text: string) =>
    api.post('/reviews/respond', { reviewId, text }).then((r) => r.data),
};

export const loyaltyApi = {
  getRule: () => api.get('/loyalty/rule').then((r) => r.data),
  setRule: (rule: {
    isEnabled: boolean;
    earnPointsPerCurrency: number;
    redeemPointsPerDiscount: number;
    minPointsToRedeem: number;
    birthdayBonus: number;
    signupBonus: number;
    pointsValidityDays?: number | null;
  }) => api.put('/loyalty/rule', rule).then((r) => r.data),
  getMyAccount: () => api.get<{ account: LoyaltyAccountDto; transactions: LoyaltyTransactionDto[] }>('/loyalty/me').then((r) => r.data),
};

export const waitlistApi = {
  join: (data: { serviceId: number; staffId?: number; branchId?: number; preferredDateFrom?: string; preferredDateTo?: string }) =>
    api.post<{ id: number }>('/waitlist', data).then((r) => r.data),
  mine: () => api.get('/waitlist/me').then((r) => r.data),
};

export const packagesApi = {
  getPublic: (slug?: string) => api.get<ServicePackageDto[]>('/packages/public', { params: { slug } }).then((r) => r.data),
  purchase: (servicePackageId: number) => api.post<{ id: number }>('/packages/purchase', { servicePackageId }).then((r) => r.data),
  mine: () => api.get('/packages/me').then((r) => r.data),
};

export const giftCardsApi = {
  issue: (data: { amount: number; currency: string; recipientEmail?: string; recipientName?: string; message?: string; expiresAt?: string }) =>
    api.post<{ id: number }>('/giftcards/issue', data).then((r) => r.data),
  check: (code: string, slug?: string) =>
    api.get(`/giftcards/check/${encodeURIComponent(code)}`, { params: { slug } }).then((r) => r.data),
};

export const promoApi = {
  validate: (code: string, amount: number, orgId?: number, clientId?: number) =>
    api.post<{ valid: boolean; discount: number; error?: string; promoCodeId?: number }>('/promo/validate', { code, amount, clientId }, { params: { orgId } }).then((r) => r.data),
};
