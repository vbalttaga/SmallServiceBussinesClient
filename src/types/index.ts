export interface UserInfo {
  id: number;
  personId: number;
  organisationId: number;
  orgSlug: string;
  orgName: string;
  login: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  permission: number;
  roles: string[];
  permissions: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
  subdomainUrl?: string;
}

// ---- Appointment domain ---------------------------------------------------

export interface BusinessTypeDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface BusinessSummaryDto {
  id: number;
  slug: string;
  name: string;
}

export interface BranchDto {
  id: number;
  organisationId: number;
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  email?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
}

export interface ServiceCategoryDto {
  id: number;
  name: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface ServiceDto {
  id: number;
  organisationId: number;
  serviceCategoryId?: number;
  categoryName?: string;
  name: string;
  description?: string;
  durationMinutes: number;
  bufferMinutes: number;
  price: number;
  priceMin?: number;
  currency: string;
  imageUrl?: string;
  color?: string;
  isActive: boolean;
  isOnline: boolean;
  requiresConfirmation: boolean;
  sortOrder: number;
}

export interface StaffDto {
  id: number;
  organisationId: number;
  personId: number;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  bio?: string;
  specialization?: string;
  color?: string;
  isBookable: boolean;
  isVisible: boolean;
  sortOrder: number;
}

export interface TimeSlotDto {
  startDateTime: string; // ISO
  endDateTime: string;
}

export interface AppointmentDto {
  appointmentId: number;
  organisationId?: number;
  branchId?: number;
  branchName?: string;
  branchAddress?: string;
  serviceId: number;
  serviceName: string;
  serviceImageUrl?: string;
  staffId: number;
  staffName: string;
  staffPhotoUrl?: string;
  clientId: number;
  /** Present in GetByStaff projection ("John Doe"). */
  clientName?: string;
  /** Present in GetByClient / GetById projections. */
  clientFirstName?: string;
  clientLastName?: string;
  clientEmail?: string;
  clientPhone?: string;
  appointmentStatusId: number;
  statusCode: 'new' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  statusName: string;
  statusColor?: string;
  startDateTime: string;
  endDateTime: string;
  durationMinutes: number;
  price: number;
  currency: string;
  clientNote?: string;
  internalNote?: string;
  source?: string;
  confirmationToken?: string;
  dateCreated: string;
}

export interface CreateAppointmentDto {
  serviceId: number;
  staffId: number;
  branchId?: number;
  startDateTime: string;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  clientNote?: string;
}

export interface CreateAppointmentResponse {
  appointmentId: number;
  confirmationToken?: string;
  error?: string;
}

export interface UpdateAppointmentStatusDto {
  newStatusCode: 'new' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  comment?: string;
}

export interface WeeklyScheduleDayDto {
  dayOfWeek: number; // 0=Sun..6=Sat
  startTime: string; // HH:mm
  endTime: string;
  branchId?: number;
}

export interface DashboardMetricsDto {
  todayCount: number;
  upcomingCount: number;
  monthRevenue: number;
  staffCount: number;
  serviceCount: number;
  clientCount: number;
}

export const APPOINTMENT_STATUSES = [
  { code: 'new',         name: 'New',         color: '#3b82f6' },
  { code: 'confirmed',   name: 'Confirmed',   color: '#10b981' },
  { code: 'in_progress', name: 'In Progress', color: '#f59e0b' },
  { code: 'completed',   name: 'Completed',   color: '#16a34a' },
  { code: 'cancelled',   name: 'Cancelled',   color: '#ef4444' },
  { code: 'no_show',     name: 'No-show',     color: '#6b7280' },
] as const;
