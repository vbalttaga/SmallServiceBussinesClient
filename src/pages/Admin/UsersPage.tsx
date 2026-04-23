import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useRef } from 'react';
import { UserPlus, Search, Check, X, Shield, Users2, Pencil, Camera, Mail, Copy } from 'lucide-react';
import api from '../../api/client';
import { useToastStore } from '../../store/toastStore';
import { translateApiMessage } from '../../utils/apiMessage';

interface OrgUser {
  userId: number;
  personId: number;
  login: string;
  firstName: string;
  lastName: string;
  email: string;
  photoUrl?: string;
  enabled: boolean;
  permission: number;
  lastLogin?: string;
  dateCreated: string;
  roleNames: string;
  managerPersonId?: number;
  managerName: string;
  positionId?: number;
  positionName: string;
}

interface PersonLookup {
  personId: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface RoleLookup {
  roleId: number;
  name: string;
  code: string;
  isSystemRole: boolean;
}

interface PositionLookup {
  positionId: number;
  name: string;
}

interface CreateUserForm {
  login: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  managerPersonId: string;
  positionId: string;
}

export default function UsersPage() {
  const { t } = useTranslation();
  const addToast = useToastStore(s => s.addToast);

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [persons, setPersons] = useState<PersonLookup[]>([]);
  const [roles, setRoles] = useState<RoleLookup[]>([]);
  const [positions, setPositions] = useState<PositionLookup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editUser, setEditUser] = useState<OrgUser | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ token: string; link: string } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateUserForm>();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/org/users', { params: { page, pageSize, search: search || undefined } });
      setUsers(res.data.items);
      setTotal(res.data.total);
    } catch { /* */ }
    setLoading(false);
  }, [page, search]);

  const fetchPersons = async () => {
    try {
      const res = await api.get('/org/users/persons');
      setPersons(res.data);
    } catch { /* */ }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      setRoles(res.data);
    } catch { /* */ }
  };

  const fetchPositions = async () => {
    try {
      const res = await api.get('/org/users/positions');
      setPositions(res.data);
    } catch { /* */ }
  };

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchPersons(); fetchRoles(); fetchPositions(); }, []);

  const onCreateSubmit = async (data: CreateUserForm) => {
    setCreating(true);
    try {
      await api.post('/org/users', {
        login: data.login,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        managerPersonId: data.managerPersonId ? parseInt(data.managerPersonId) : null,
        positionId: data.positionId ? parseInt(data.positionId) : null,
      });
      addToast('success', t('orgUsers.userCreated'));
      setShowCreate(false);
      reset();
      fetchUsers();
      fetchPersons();
    } catch (e: any) {
      const msg = e.response?.data?.message;
      addToast('error', msg ? translateApiMessage(msg, t) : t('orgUsers.createFailed'));
    }
    setCreating(false);
  };

  const toggleEnabled = async (user: OrgUser) => {
    try {
      await api.put(`/org/users/${user.userId}/${user.enabled ? 'disable' : 'enable'}`);
      addToast('success', user.enabled ? t('orgUsers.userDisabled') : t('orgUsers.userEnabled'));
      fetchUsers();
    } catch { addToast('error', t('common.error')); }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
            <Users2 size={22} style={{ verticalAlign: 'middle', marginRight: 8 }} />
            {t('orgUsers.title')}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
            {t('orgUsers.subtitle', { count: total })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-dark btn-sm" onClick={() => setShowCreate(true)}>
            <UserPlus size={16} style={{ marginRight: 6 }} />
            {t('orgUsers.addUser')}
          </button>
          <button className="btn btn-outline-dark btn-sm" onClick={() => { setShowInvite(true); setInviteResult(null); }}>
            <Mail size={16} style={{ marginRight: 6 }} />
            {t('orgUsers.inviteUser')}
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16, maxWidth: 340, position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: 12, top: 10, color: '#999' }} />
        <input
          className="form-control form-control-sm"
          style={{ paddingLeft: 34 }}
          placeholder={t('admin.searchPlaceholder')}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-hover" style={{ fontSize: 14 }}>
          <thead>
            <tr>
              <th>{t('orgUsers.name')}</th>
              <th>{t('orgUsers.login')}</th>
              <th>{t('orgUsers.email')}</th>
              <th>{t('orgUsers.position')}</th>
              <th>{t('orgUsers.roles')}</th>
              <th>{t('orgUsers.manager')}</th>
              <th>{t('orgUsers.status')}</th>
              <th style={{ width: 50 }}></th>
              <th style={{ width: 110 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-4">{t('common.loading')}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-4 text-muted">{t('orgUsers.noUsers')}</td></tr>
            ) : users.map(u => (
              <tr key={u.userId}>
                <td style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {u.photoUrl ? (
                    <img src={u.photoUrl} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%', background: '#e9ecef',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 600, color: '#666', flexShrink: 0,
                    }}>
                      {(u.firstName?.[0] || '')}{(u.lastName?.[0] || '')}
                    </span>
                  )}
                  {u.firstName} {u.lastName}
                </td>
                <td><code style={{ fontSize: 13 }}>{u.login}</code></td>
                <td>{u.email}</td>
                <td style={{ fontSize: 13 }}>{u.positionName || '—'}</td>
                <td>
                  {u.roleNames ? (
                    <span className="badge bg-secondary bg-opacity-10 text-dark" style={{ fontSize: 12 }}>
                      {u.roleNames}
                    </span>
                  ) : '—'}
                </td>
                <td style={{ fontSize: 13 }}>{u.managerName || '—'}</td>
                <td>
                  <span className={`badge ${u.enabled ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: 11 }}>
                    {u.enabled ? t('orgUsers.active') : t('orgUsers.disabled')}
                  </span>
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    style={{ fontSize: 12, padding: '2px 10px' }}
                    title={t('admin.edit')}
                    onClick={() => setEditUser(u)}
                  >
                    <Pencil size={14} />
                  </button>
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${u.enabled ? 'btn-outline-danger' : 'btn-outline-success'}`}
                    style={{ fontSize: 12, padding: '2px 10px' }}
                    onClick={() => toggleEnabled(u)}
                  >
                    {u.enabled ? <X size={12} /> : <Check size={12} />}
                    {' '}{u.enabled ? t('orgUsers.disable') : t('orgUsers.enable')}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            &laquo;
          </button>
          <span style={{ alignSelf: 'center', fontSize: 13 }}>
            {t('admin.page', { page, totalPages })}
          </span>
          <button className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            &raquo;
          </button>
        </div>
      )}

      {/* Create User Modal */}
      {showCreate && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}
             onClick={() => setShowCreate(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('orgUsers.addUser')}</h5>
                <button className="btn-close" onClick={() => setShowCreate(false)} />
              </div>
              <form onSubmit={handleSubmit(onCreateSubmit)}>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label">{t('orgUsers.firstName')} *</label>
                      <input className={`form-control form-control-sm ${errors.firstName ? 'is-invalid' : ''}`}
                             {...register('firstName', { required: true })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">{t('orgUsers.lastName')} *</label>
                      <input className={`form-control form-control-sm ${errors.lastName ? 'is-invalid' : ''}`}
                             {...register('lastName', { required: true })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">{t('orgUsers.email')}</label>
                      <input type="email" className="form-control form-control-sm" {...register('email')} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">{t('orgUsers.login')} *</label>
                      <input className={`form-control form-control-sm ${errors.login ? 'is-invalid' : ''}`}
                             {...register('login', { required: true })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">{t('orgUsers.password')} *</label>
                      <input type="password"
                             className={`form-control form-control-sm ${errors.password ? 'is-invalid' : ''}`}
                             {...register('password', { required: true, minLength: 4 })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">{t('orgUsers.manager')}</label>
                      <select className="form-select form-select-sm" {...register('managerPersonId')}>
                        <option value="">— {t('orgUsers.noManager')} —</option>
                        {persons.map(p => (
                          <option key={p.personId} value={p.personId}>
                            {p.firstName} {p.lastName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label">{t('orgUsers.position')}</label>
                      <select className="form-select form-select-sm" {...register('positionId')}>
                        <option value="">— {t('orgUsers.noPosition')} —</option>
                        {positions.map(p => (
                          <option key={p.positionId} value={p.positionId}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-sm btn-light" onClick={() => setShowCreate(false)}>
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="btn btn-sm btn-dark" disabled={creating}>
                    {creating ? t('common.creating') : t('common.save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          persons={persons}
          roles={roles}
          positions={positions}
          onClose={() => setEditUser(null)}
          onSaved={() => { setEditUser(null); fetchUsers(); fetchPersons(); }}
        />
      )}

      {/* Invite Modal */}
      {showInvite && (
        <InviteModal
          persons={persons}
          roles={roles}
          inviteResult={inviteResult}
          inviting={inviting}
          onSend={async (data) => {
            setInviting(true);
            try {
              const res = await api.post('/org/invitations', data);
              const token = res.data.token;
              const link = `${window.location.origin}/accept-invitation?token=${token}`;
              setInviteResult({ token, link });
              addToast('success', t('orgUsers.inviteSent'));
            } catch (e: any) {
              const code = e.response?.data?.message;
              addToast('error', code ? translateApiMessage(code, t) : t('orgUsers.inviteFailed'));
            } finally {
              setInviting(false);
            }
          }}
          onClose={() => { setShowInvite(false); setInviteResult(null); }}
        />
      )}
    </div>
  );
}

/* ─── Edit User Modal ─── */
function EditUserModal({
  user, persons, roles, positions, onClose, onSaved,
}: {
  user: OrgUser;
  persons: PersonLookup[];
  roles: RoleLookup[];
  positions: PositionLookup[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const addToast = useToastStore(s => s.addToast);
  const [saving, setSaving] = useState(false);

  // Photo
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl = res.data.url;
      setPhotoUrl(newUrl);
      await api.put(`/upload/person/${user.personId}/photo`, { photoUrl: newUrl });
      addToast('success', t('orgUsers.photoUploaded') || 'Photo uploaded');
    } catch {
      addToast('error', 'Upload failed');
    }
    setUploading(false);
  };

  // Profile fields
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);

  // Manager
  const [managerId, setManagerId] = useState(String(user.managerPersonId || ''));

  // Position
  const [positionId, setPositionId] = useState(String(user.positionId || ''));

  // Roles
  const [userRoleIds, setUserRoleIds] = useState<number[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    api.get(`/users/${user.userId}/roles`).then(res => {
      setUserRoleIds(res.data.map((r: any) => r.roleId));
    }).catch(() => {}).finally(() => setLoadingRoles(false));
  }, [user.userId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update profile (firstName, lastName, email, positionId)
      await api.put(`/org/users/${user.personId}`, {
        firstName, lastName, email,
        positionId: positionId ? parseInt(positionId) : null,
      });

      // 2. Update manager
      const newManagerId = managerId ? parseInt(managerId) : null;
      if (newManagerId && newManagerId !== user.managerPersonId) {
        await api.put(`/org/users/${user.personId}/manager`, { managerPersonId: newManagerId });
      }

      // 3. Update roles
      await api.put(`/org/users/${user.userId}/roles`, { roleIds: userRoleIds });

      addToast('success', translateApiMessage('UPDATED_OK', t));
      onSaved();
    } catch (e: any) {
      const msg = e.response?.data?.message;
      addToast('error', msg ? translateApiMessage(msg, t) : t('admin.saveFailed'));
    }
    setSaving(false);
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <Pencil size={16} style={{ marginRight: 8 }} />
              {t('orgUsers.editUser')} — {user.firstName} {user.lastName}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {/* Photo Section */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div
                style={{
                  width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                  background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', position: 'relative', flexShrink: 0,
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {photoUrl ? (
                  <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 22, fontWeight: 600, color: '#999' }}>
                    {(user.firstName?.[0] || '')}{(user.lastName?.[0] || '')}
                  </span>
                )}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: 24,
                  background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Camera size={12} color="#fff" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={handlePhotoUpload}
              />
              <div style={{ fontSize: 13, color: '#666' }}>
                {uploading ? t('common.loading') : t('orgUsers.uploadPhoto') || 'Click to upload photo'}
              </div>
            </div>

            {/* Profile Section */}
            <h6 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-secondary)' }}>
              {t('orgUsers.personalInfo')}
            </h6>
            <div className="row g-3 mb-4">
              <div className="col-6">
                <label className="form-label">{t('orgUsers.firstName')} *</label>
                <input className="form-control form-control-sm" value={firstName}
                       onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label">{t('orgUsers.lastName')} *</label>
                <input className="form-control form-control-sm" value={lastName}
                       onChange={e => setLastName(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label">{t('orgUsers.email')}</label>
                <input type="email" className="form-control form-control-sm" value={email}
                       onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="col-6">
                <label className="form-label">{t('orgUsers.login')}</label>
                <input className="form-control form-control-sm" value={user.login} disabled
                       style={{ background: '#f1f1f1' }} />
              </div>
            </div>

            {/* Position & Manager */}
            <h6 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-secondary)' }}>
              {t('orgUsers.position')} & {t('orgUsers.manager')}
            </h6>
            <div className="row g-3 mb-4">
              <div className="col-6">
                <label className="form-label">{t('orgUsers.position')}</label>
                <select className="form-select form-select-sm" value={positionId}
                        onChange={e => setPositionId(e.target.value)}>
                  <option value="">— {t('orgUsers.noPosition')} —</option>
                  {positions.map(p => (
                    <option key={p.positionId} value={p.positionId}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label">{t('orgUsers.manager')}</label>
                <select className="form-select form-select-sm" value={managerId}
                        onChange={e => setManagerId(e.target.value)}>
                  <option value="">— {t('orgUsers.noManager')} —</option>
                  {persons.filter(p => p.personId !== user.personId).map(p => (
                    <option key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Roles Section */}
            <h6 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-secondary)' }}>
              <Shield size={14} style={{ marginRight: 4 }} />
              {t('orgUsers.roles')}
            </h6>
            {loadingRoles ? (
              <span className="text-muted" style={{ fontSize: 13 }}>{t('common.loading')}</span>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                {roles.map(r => (
                  <label key={r.roleId} className="form-check" style={{ cursor: 'pointer' }}>
                    <input
                      type="checkbox" className="form-check-input"
                      checked={userRoleIds.includes(r.roleId)}
                      onChange={e => {
                        setUserRoleIds(prev =>
                          e.target.checked ? [...prev, r.roleId] : prev.filter(id => id !== r.roleId)
                        );
                      }}
                    />
                    <span className="form-check-label" style={{ fontSize: 13 }}>{r.name}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Meta Info */}
            <div style={{ borderTop: '1px solid #eee', paddingTop: 12, marginTop: 8 }}>
              <span style={{ fontSize: 12, color: '#999' }}>
                {t('orgUsers.lastLogin')}: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}
                {' · '}
                {t('orgUsers.created')}: {new Date(user.dateCreated).toLocaleDateString()}
                {' · '}
                {t('orgUsers.status')}: {user.enabled ? t('orgUsers.active') : t('orgUsers.disabled')}
              </span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-sm btn-light" onClick={onClose}>
              {t('common.cancel')}
            </button>
            <button type="button" className="btn btn-sm btn-dark" disabled={saving} onClick={handleSave}>
              {saving ? t('common.saving') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Invite User Modal ─── */
function InviteModal({
  persons, roles, inviteResult, inviting, onSend, onClose,
}: {
  persons: PersonLookup[];
  roles: RoleLookup[];
  inviteResult: { token: string; link: string } | null;
  inviting: boolean;
  onSend: (data: { email: string; roleCode?: string; managerPersonId?: number }) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [roleCode, setRoleCode] = useState('employee');
  const [managerPersonId, setManagerPersonId] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleSend = () => {
    if (!email.trim()) return;
    onSend({
      email: email.trim(),
      roleCode: roleCode || undefined,
      managerPersonId: managerPersonId ? Number(managerPersonId) : undefined,
    });
  };

  const handleCopyLink = () => {
    if (inviteResult) {
      navigator.clipboard.writeText(inviteResult.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 9990 }}
         onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-dialog" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <Mail size={18} style={{ marginRight: 8 }} />
              {t('orgUsers.inviteUser')}
            </h5>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {inviteResult ? (
              /* Success — show link */
              <div>
                <div className="alert alert-success" style={{ fontSize: 13 }}>
                  {t('orgUsers.inviteSentSuccess')}
                </div>
                <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
                  {t('orgUsers.inviteLink')}
                </label>
                <div className="input-group input-group-sm">
                  <input className="form-control form-control-sm" readOnly value={inviteResult.link}
                         style={{ fontSize: 12, background: '#f8f9fa' }} />
                  <button className="btn btn-outline-secondary btn-sm" onClick={handleCopyLink}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#999', marginTop: 8 }}>
                  {t('orgUsers.inviteLinkHint')}
                </p>
              </div>
            ) : (
              /* Form */
              <div>
                <div className="mb-3">
                  <label className="form-label">
                    Email <span style={{ color: '#dc3545' }}>*</span>
                  </label>
                  <input type="email" className="form-control form-control-sm"
                         value={email} onChange={e => setEmail(e.target.value)}
                         placeholder="user@example.com" />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label">{t('orgUsers.roles')}</label>
                    <select className="form-select form-select-sm" value={roleCode}
                            onChange={e => setRoleCode(e.target.value)}>
                      {roles.map(r => (
                        <option key={r.roleId} value={r.code || r.name.toLowerCase()}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-6">
                    <label className="form-label">{t('orgUsers.manager')}</label>
                    <select className="form-select form-select-sm" value={managerPersonId}
                            onChange={e => setManagerPersonId(e.target.value)}>
                      <option value="">— {t('orgUsers.noManager')} —</option>
                      {persons.map(p => (
                        <option key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-sm btn-light" onClick={onClose}>
              {inviteResult ? t('common.close') : t('common.cancel')}
            </button>
            {!inviteResult && (
              <button type="button" className="btn btn-sm btn-dark" disabled={inviting || !email.trim()} onClick={handleSend}>
                <Mail size={14} style={{ marginRight: 4 }} />
                {inviting ? t('orgUsers.sending') : t('orgUsers.sendInvite')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
