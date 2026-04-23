import api from './client';
import type {
  EntityMetadata,
  EntityListResponse,
  EntityDetailResponse,
  AdminSaveRequest,
  AdminSaveResponse,
  AdminDeleteRequest,
  LookupItem,
} from '../types/admin';

export const adminApi = {
  // ── READ ──────────────────────────────────
  getEntities: () =>
    api.get<EntityMetadata[]>('/admin/entities'),

  getEntityList: (typeName: string, page = 1, pageSize = 20, search?: string) =>
    api.get<EntityListResponse>(`/admin/entities/${typeName}`, {
      params: { page, pageSize, ...(search ? { search } : {}) },
    }),

  getEntityDetail: (typeName: string, id: number) =>
    api.get<EntityDetailResponse>(`/admin/entities/${typeName}/${id}`),

  // ── CUD ───────────────────────────────────
  createEntity: (typeName: string, data: AdminSaveRequest) =>
    api.post<AdminSaveResponse>(`/admin/entities/${typeName}`, data),

  updateEntity: (typeName: string, id: number, data: AdminSaveRequest) =>
    api.put<AdminSaveResponse>(`/admin/entities/${typeName}/${id}`, data),

  deleteEntity: (typeName: string, data: AdminDeleteRequest) =>
    api.delete<AdminSaveResponse>(`/admin/entities/${typeName}`, { data }),

  // ── CLONE ─────────────────────────────────
  cloneEntity: (typeName: string, id: number) =>
    api.post<AdminSaveResponse>(`/admin/entities/${typeName}/${id}/clone`),

  // ── LOOKUP (FK dropdowns) ────────────────
  getLookup: (typeName: string) =>
    api.get<LookupItem[]>(`/admin/lookups/${typeName}`),

  // ── EXPORT ────────────────────────────────
  exportEntity: (typeName: string, search?: string) =>
    api.get(`/admin/entities/${typeName}/export`, {
      params: search ? { search } : {},
      responseType: 'blob',
    }),
};
