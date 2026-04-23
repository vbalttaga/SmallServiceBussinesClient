import api from './client';
import type {
  BusinessSummaryDto, ServiceCategoryDto, ServiceDto, StaffDto, TimeSlotDto,
  CreateAppointmentDto, CreateAppointmentResponse, AppointmentDto,
} from '../types';

/**
 * Public booking endpoints — anonymous access via tenant subdomain or ?slug=.
 */
export const publicApi = {
  getBusiness: (slug?: string) =>
    api.get<BusinessSummaryDto>('/public/business', { params: { slug } }).then((r) => r.data),

  getBusinessBySlug: (slug: string) =>
    api.get<BusinessSummaryDto>(`/public/org/${slug}`).then((r) => r.data),

  getCategories: (slug?: string) =>
    api.get<ServiceCategoryDto[]>('/public/categories', { params: { slug } }).then((r) => r.data),

  getServices: (slug?: string, categoryId?: number) =>
    api.get<ServiceDto[]>('/public/services', { params: { slug, categoryId } }).then((r) => r.data),

  getStaff: (slug?: string, serviceId?: number, branchId?: number) =>
    api.get<StaffDto[]>('/public/staff', { params: { slug, serviceId, branchId } }).then((r) => r.data),

  getAvailability: (params: {
    slug?: string;
    staffId: number;
    serviceId: number;
    branchId?: number;
    date: string;
    slotStepMinutes?: number;
  }) =>
    api.get<TimeSlotDto[]>('/public/availability', { params }).then((r) => r.data),

  createAppointment: (dto: CreateAppointmentDto, slug?: string) =>
    api
      .post<CreateAppointmentResponse>('/public/appointments', dto, { params: { slug } })
      .then((r) => r.data),

  getByToken: (token: string) =>
    api.get<AppointmentDto>(`/public/appointments/${encodeURIComponent(token)}`).then((r) => r.data),
};
