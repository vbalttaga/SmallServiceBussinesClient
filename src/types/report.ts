// ── Report Engine Types ──────────────────────────────────

export interface ReportGroupDto {
  id: number;
  name: string;
  icon: string;
  reports: ReportListItemDto[];
}

export interface ReportListItemDto {
  id: number;
  code: string;
  name: string;
  description: string;
}

export interface ReportMetadataDto {
  id: number;
  code: string;
  name: string;
  description: string;
  allowExport: boolean;
  allowFilter: boolean;
  allowSorting: boolean;
  columns: ReportColumnDto[];
  filters: ReportFilterDto[];
  actions: ReportActionDto[];
}

export interface ReportColumnDto {
  id: number;
  name: string;
  displayName: string;
  dataType: number; // 1=string, 2=int, 3=decimal, 4=date, 5=bool
  width?: number;
  sortOrder: number;
  sortable: boolean;
  filterable: boolean;
  visible: boolean;
  format: string;
}

export interface ReportFilterDto {
  id: number;
  parameterName: string;
  displayName: string;
  filterType: number; // 1=text, 2=number, 3=date, 4=dropdown
  operator: number;   // 1==, 2=like, 3=>, 4=<
  defaultValue: string;
  required: boolean;
  sortOrder: number;
}

export interface ReportActionDto {
  id: number;
  name: string;
  icon: string;
  actionType: number; // 1=DrillDown, 2=Navigate, 3=API, 4=Modal
  targetReportCode: string;
  apiEndpoint: string;
}

export interface ReportExecuteRequest {
  parameters: Record<string, unknown>;
  page: number;
  pageSize: number;
  sortColumn?: string;
  sortDirection?: string;
}

export interface ReportExecuteResponse {
  rows: Record<string, unknown>[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface ReportExportRequest {
  parameters: Record<string, unknown>;
  sortColumn?: string;
  sortDirection?: string;
}
