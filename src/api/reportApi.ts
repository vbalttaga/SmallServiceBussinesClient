import api from './client';
import type {
  ReportGroupDto,
  ReportMetadataDto,
  ReportExecuteRequest,
  ReportExecuteResponse,
  ReportExportRequest,
} from '../types/report';

export const reportApi = {
  /** Get all report groups with their reports (sidebar nav) */
  getGroups: () =>
    api.get<ReportGroupDto[]>('/reports/groups'),

  /** Get full metadata for a report: columns, filters, actions */
  getMetadata: (code: string) =>
    api.get<ReportMetadataDto>(`/reports/${code}/metadata`),

  /** Execute a report with parameters, pagination, sorting */
  execute: (code: string, request: ReportExecuteRequest) =>
    api.post<ReportExecuteResponse>(`/reports/${code}/execute`, request),

  /** Export report as CSV (returns blob) */
  exportCsv: (code: string, request: ReportExportRequest) =>
    api.post(`/reports/${code}/export`, request, { responseType: 'blob' }),
};
