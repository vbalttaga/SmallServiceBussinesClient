export type EditTemplateType =
  | 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox'
  | 'date' | 'datetime' | 'time' | 'number' | 'password'
  | 'link' | 'multicheck' | 'hidden' | 'label' | 'html'
  | 'autocomplete' | 'readonly' | 'image' | 'file' | 'color'
  | 'numberrange' | 'daterange';

export type ControlType =
  | 'Input' | 'Select' | 'CheckBox' | 'Link'
  | 'MultyCheck' | 'DateRange' | 'NumberRange'
  | 'File' | 'Image';

export interface PropertyMetadata {
  name: string;
  displayName: string;
  typeName: string; // "string" | "number" | "datetime" | "boolean"
  // From CommonAttribute
  editTemplate: EditTemplateType;
  controlType: ControlType;
  editable: boolean;
  visible: boolean;
  sortable: boolean;
  searchable: boolean;
  order: number;
  displayGroup: string;
  // From ValidationAttribute
  required: boolean;
  // From AccessAttribute
  displayMode: number; // flags: Simple=1, Advanced=2, Search=4, etc.
  // FK reference target table (e.g. "Person", "RequestType")
  referenceType?: string;
  // MultiCheck (many-to-many) fields
  isMultiCheck?: boolean;
  multiCheckTargetType?: string;
  multiCheckJunctionTable?: string;
}

export interface EntityMetadata {
  typeName: string;
  displayName: string;
  singleName: string;
  icon: string;
  group: string;
  allowEdit: boolean;
  allowCreate: boolean;
  allowDelete: boolean;
  allowCopy: boolean;
  properties: PropertyMetadata[];
}

export interface EntityListResponse {
  items: Record<string, unknown>[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface EntityDetailResponse {
  item: Record<string, unknown>;
  metadata: EntityMetadata;
}

// ── Lookup (FK dropdown options) ─────────────

export interface LookupItem {
  id: number;
  displayName: string;
}

// ── CUD Request / Response types ─────────────

export interface AdminSaveRequest {
  item: Record<string, unknown>;
  comment?: string;
}

export interface AdminSaveResponse {
  id: number;
  message: string;
}

export interface AdminDeleteRequest {
  ids: number[];
  comment?: string;
}
