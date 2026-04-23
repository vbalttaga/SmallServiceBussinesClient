/**
 * String-code permission constants matching the database seed data.
 * Usage: import { P } from '../constants/permissions';
 *        hasPermission(P.APPOINTMENTS_MANAGE)
 */
export const P = {
  // Appointment domain
  APPOINTMENTS_VIEW_ALL:  'appointments.view.all',
  APPOINTMENTS_VIEW_OWN:  'appointments.view.own',
  APPOINTMENTS_MANAGE:    'appointments.manage',

  CATALOG_SERVICES_MANAGE: 'catalog.services.manage',
  CATALOG_STAFF_MANAGE:    'catalog.staff.manage',
  CATALOG_BRANCHES_MANAGE: 'catalog.branches.manage',

  CLIENTS_MANAGE: 'clients.manage',

  // Reports
  REPORTS_VIEW:   'reports.view',
  REPORTS_EXPORT: 'reports.view',

  // Organisation management
  ORG_USERS_MANAGE:    'org.users.manage',
  ORG_ROLES_MANAGE:    'org.roles.manage',
  ORG_AUDIT_VIEW:      'org.audit.view',
  ORG_SETTINGS_MANAGE: 'org.settings.manage',

  // Billing
  BILLING_MANAGE: 'billing.manage',

  // Administration aliases
  ADMIN_USERS_MANAGE:    'org.users.manage',
  ADMIN_ROLES_MANAGE:    'org.roles.manage',
  ADMIN_SETTINGS_MANAGE: 'org.settings.manage',
} as const;

export type PermissionCode = (typeof P)[keyof typeof P];
