import api from './client';
import type {
  AppointmentDto, CreateAppointmentDto, CreateAppointmentResponse,
  UpdateAppointmentStatusDto, DashboardMetricsDto, TimeSlotDto,
  StaffDto, WeeklyScheduleDayDto,
} from '../types';

/** Authenticated staff/manager endpoints (scoped by JWT orgId). */
export const internalApi = {
  getSchedule: (from: string, to: string, staffId?: number) =>
    api.get<AppointmentDto[]>('/internal/appointments/schedule', { params: { from, to, staffId } }).then((r) => r.data),

  getAvailability: (params: {
    staffId: number; serviceId: number; branchId?: number; date: string; slotStepMinutes?: number;
  }) => api.get<TimeSlotDto[]>('/internal/appointments/availability', { params }).then((r) => r.data),

  getById: (id: number) =>
    api.get<AppointmentDto>(`/internal/appointments/${id}`).then((r) => r.data),

  create: (dto: CreateAppointmentDto) =>
    api.post<CreateAppointmentResponse>('/internal/appointments', dto).then((r) => r.data),

  updateStatus: (id: number, dto: UpdateAppointmentStatusDto) =>
    api.put(`/internal/appointments/${id}/status`, dto).then((r) => r.data),

  getDashboard: () =>
    api.get<DashboardMetricsDto>('/internal/dashboard').then((r) => r.data),

  // Staff management
  getStaff: (params: { serviceId?: number; branchId?: number; onlyBookable?: boolean } = {}) =>
    api.get<StaffDto[]>('/internal/staff', { params }).then((r) => r.data),

  getStaffSchedule: (staffId: number) =>
    api.get(`/internal/staff/${staffId}/schedule`).then((r) => r.data),

  updateStaffSchedule: (staffId: number, days: WeeklyScheduleDayDto[]) =>
    api.put(`/internal/staff/${staffId}/schedule`, { staffId, days }).then((r) => r.data),

  getTimeOff: (staffId: number, from: string, to: string) =>
    api.get(`/internal/staff/${staffId}/timeoff`, { params: { from, to } }).then((r) => r.data),

  createTimeOff: (staffId: number, startDateTime: string, endDateTime: string, reason?: string) =>
    api.post(`/internal/staff/${staffId}/timeoff`, { startDateTime, endDateTime, reason }).then((r) => r.data),

  deleteTimeOff: (id: number) => api.delete(`/internal/staff/timeoff/${id}`).then((r) => r.data),
};

/** Authenticated customer endpoints. */
export const clientApi = {
  myAppointments: (includePast = false) =>
    api.get<AppointmentDto[]>('/client/appointments', { params: { includePast } }).then((r) => r.data),

  cancel: (id: number, reason?: string) =>
    api.post(`/client/appointments/${id}/cancel`, { reason }).then((r) => r.data),
};

/** Business type catalog (used during registration). */
export const businessTypesApi = {
  list: () => api.get('/business-types').then((r) => r.data),
};
