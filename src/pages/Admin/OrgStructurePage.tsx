import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Users2, Clock, Plus, Pencil, Trash2, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import { useToastStore } from '../../store/toastStore';

interface Department {
  departmentId: number;
  parentDepartmentId?: number;
  name: string;
  managerPersonId?: number;
  managerName?: string;
  parentDepartmentName?: string;
  sortOrder: number;
  memberCount: number;
}

interface Team {
  teamId: number;
  departmentId?: number;
  name: string;
  leadPersonId?: number;
  leadName?: string;
  departmentName?: string;
  memberCount: number;
}

interface WorkSchedule {
  workScheduleId: number;
  name: string;
  type: string;
  workDays: string;
  workStartTime: string;
  workEndTime: string;
}

interface PersonLookup {
  personId: number;
  firstName: string;
  lastName: string;
}

export default function OrgStructurePage() {
  const { t } = useTranslation();
  const addToast = useToastStore(s => s.addToast);
  const [tab, setTab] = useState<'departments' | 'teams' | 'schedules'>('departments');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [persons, setPersons] = useState<PersonLookup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dRes, tRes, sRes, pRes] = await Promise.all([
        api.get('/org/structure/departments'),
        api.get('/org/structure/teams'),
        api.get('/org/structure/schedules'),
        api.get('/org/users/persons'),
      ]);
      setDepartments(dRes.data);
      setTeams(tRes.data);
      setSchedules(sRes.data);
      setPersons(pRes.data);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Department CRUD ──
  const [deptForm, setDeptForm] = useState<Partial<Department> | null>(null);
  const [deptSaving, setDeptSaving] = useState(false);

  const saveDept = async () => {
    if (!deptForm?.name?.trim()) return;
    setDeptSaving(true);
    try {
      await api.post('/org/structure/departments', {
        departmentId: deptForm.departmentId || null,
        name: deptForm.name,
        parentDepartmentId: deptForm.parentDepartmentId || null,
        managerPersonId: deptForm.managerPersonId || null,
        sortOrder: deptForm.sortOrder || 0,
      });
      addToast('success', t('common.saved'));
      setDeptForm(null);
      fetchAll();
    } catch { addToast('error', t('common.error')); }
    setDeptSaving(false);
  };

  const deleteDept = async (id: number) => {
    try {
      await api.delete(`/org/structure/departments/${id}`);
      addToast('success', t('common.deleted'));
      fetchAll();
    } catch { addToast('error', t('common.error')); }
  };

  // ── Team CRUD ──
  const [teamForm, setTeamForm] = useState<Partial<Team> | null>(null);
  const [teamSaving, setTeamSaving] = useState(false);

  const saveTeam = async () => {
    if (!teamForm?.name?.trim()) return;
    setTeamSaving(true);
    try {
      await api.post('/org/structure/teams', {
        teamId: teamForm.teamId || null,
        name: teamForm.name,
        departmentId: teamForm.departmentId || null,
        leadPersonId: teamForm.leadPersonId || null,
      });
      addToast('success', t('common.saved'));
      setTeamForm(null);
      fetchAll();
    } catch { addToast('error', t('common.error')); }
    setTeamSaving(false);
  };

  const deleteTeam = async (id: number) => {
    try {
      await api.delete(`/org/structure/teams/${id}`);
      addToast('success', t('common.deleted'));
      fetchAll();
    } catch { addToast('error', t('common.error')); }
  };

  // ── Schedule CRUD ──
  const [schedForm, setSchedForm] = useState<Partial<WorkSchedule> | null>(null);
  const [schedSaving, setSchedSaving] = useState(false);

  const saveSched = async () => {
    if (!schedForm?.name?.trim()) return;
    setSchedSaving(true);
    try {
      await api.post('/org/structure/schedules', {
        workScheduleId: schedForm.workScheduleId || null,
        name: schedForm.name,
        type: schedForm.type || 'standard',
        workDays: schedForm.workDays || '1,2,3,4,5',
        workStartTime: schedForm.workStartTime || '09:00',
        workEndTime: schedForm.workEndTime || '18:00',
      });
      addToast('success', t('common.saved'));
      setSchedForm(null);
      fetchAll();
    } catch { addToast('error', t('common.error')); }
    setSchedSaving(false);
  };

  const tabs = [
    { key: 'departments' as const, icon: Building2, label: t('orgStructure.departments') || 'Departments' },
    { key: 'teams' as const, icon: Users2, label: t('orgStructure.teams') || 'Teams' },
    { key: 'schedules' as const, icon: Clock, label: t('orgStructure.schedules') || 'Work Schedules' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>
        <Building2 size={22} style={{ verticalAlign: 'middle', marginRight: 8 }} />
        {t('orgStructure.title') || 'Organisation Structure'}
      </h2>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        {tabs.map(tb => (
          <li key={tb.key} className="nav-item">
            <button className={`nav-link ${tab === tb.key ? 'active' : ''}`}
                    onClick={() => setTab(tb.key)} style={{ fontSize: 14 }}>
              <tb.icon size={14} style={{ marginRight: 6 }} />
              {tb.label}
            </button>
          </li>
        ))}
      </ul>

      {loading && <div className="text-center py-4"><div className="spinner-border spinner-border-sm" /></div>}

      {/* ── Departments Tab ── */}
      {!loading && tab === 'departments' && (
        <div>
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-dark btn-sm" onClick={() => setDeptForm({ name: '', sortOrder: 0 })}>
              <Plus size={14} style={{ marginRight: 4 }} /> {t('common.add')}
            </button>
          </div>
          <table className="table table-hover" style={{ fontSize: 14 }}>
            <thead>
              <tr>
                <th>{t('orgStructure.name') || 'Name'}</th>
                <th>{t('orgStructure.parent') || 'Parent'}</th>
                <th>{t('orgStructure.manager') || 'Manager'}</th>
                <th>{t('orgStructure.members') || 'Members'}</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {departments.map(d => (
                <tr key={d.departmentId}>
                  <td style={{ fontWeight: 500 }}>
                    <ChevronRight size={12} style={{ marginRight: 4, opacity: 0.3 }} />
                    {d.name}
                  </td>
                  <td className="text-muted">{d.parentDepartmentName || '—'}</td>
                  <td>{d.managerName || '—'}</td>
                  <td><span className="badge bg-secondary">{d.memberCount}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => setDeptForm(d)}>
                      <Pencil size={12} />
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteDept(d.departmentId)}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-3">{t('common.noData') || 'No data'}</td></tr>
              )}
            </tbody>
          </table>

          {/* Department Form Modal */}
          {deptForm && (
            <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 9990 }}
                 onMouseDown={e => { if (e.target === e.currentTarget) setDeptForm(null); }}>
              <div className="modal-dialog" onMouseDown={e => e.stopPropagation()}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{deptForm.departmentId ? t('common.edit') : t('common.add')} {t('orgStructure.department') || 'Department'}</h5>
                    <button className="btn-close" onClick={() => setDeptForm(null)} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">{t('orgStructure.name') || 'Name'} *</label>
                      <input className="form-control form-control-sm" value={deptForm.name || ''}
                             onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('orgStructure.parent') || 'Parent Department'}</label>
                      <select className="form-select form-select-sm" value={deptForm.parentDepartmentId || ''}
                              onChange={e => setDeptForm({ ...deptForm, parentDepartmentId: e.target.value ? Number(e.target.value) : undefined })}>
                        <option value="">— None —</option>
                        {departments.filter(d => d.departmentId !== deptForm.departmentId).map(d => (
                          <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('orgStructure.manager') || 'Manager'}</label>
                      <select className="form-select form-select-sm" value={deptForm.managerPersonId || ''}
                              onChange={e => setDeptForm({ ...deptForm, managerPersonId: e.target.value ? Number(e.target.value) : undefined })}>
                        <option value="">— None —</option>
                        {persons.map(p => (
                          <option key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Sort Order</label>
                      <input type="number" className="form-control form-control-sm" value={deptForm.sortOrder || 0}
                             onChange={e => setDeptForm({ ...deptForm, sortOrder: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-sm btn-light" onClick={() => setDeptForm(null)}>{t('common.cancel')}</button>
                    <button className="btn btn-sm btn-dark" disabled={deptSaving} onClick={saveDept}>
                      {deptSaving ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Teams Tab ── */}
      {!loading && tab === 'teams' && (
        <div>
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-dark btn-sm" onClick={() => setTeamForm({ name: '' })}>
              <Plus size={14} style={{ marginRight: 4 }} /> {t('common.add')}
            </button>
          </div>
          <table className="table table-hover" style={{ fontSize: 14 }}>
            <thead>
              <tr>
                <th>{t('orgStructure.name') || 'Name'}</th>
                <th>{t('orgStructure.department') || 'Department'}</th>
                <th>{t('orgStructure.lead') || 'Lead'}</th>
                <th>{t('orgStructure.members') || 'Members'}</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {teams.map(team => (
                <tr key={team.teamId}>
                  <td style={{ fontWeight: 500 }}>{team.name}</td>
                  <td className="text-muted">{team.departmentName || '—'}</td>
                  <td>{team.leadName || '—'}</td>
                  <td><span className="badge bg-secondary">{team.memberCount}</span></td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => setTeamForm(team)}>
                      <Pencil size={12} />
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => deleteTeam(team.teamId)}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {teams.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-3">{t('common.noData') || 'No data'}</td></tr>
              )}
            </tbody>
          </table>

          {/* Team Form Modal */}
          {teamForm && (
            <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 9990 }}
                 onMouseDown={e => { if (e.target === e.currentTarget) setTeamForm(null); }}>
              <div className="modal-dialog" onMouseDown={e => e.stopPropagation()}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{teamForm.teamId ? t('common.edit') : t('common.add')} {t('orgStructure.team') || 'Team'}</h5>
                    <button className="btn-close" onClick={() => setTeamForm(null)} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">{t('orgStructure.name') || 'Name'} *</label>
                      <input className="form-control form-control-sm" value={teamForm.name || ''}
                             onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('orgStructure.department') || 'Department'}</label>
                      <select className="form-select form-select-sm" value={teamForm.departmentId || ''}
                              onChange={e => setTeamForm({ ...teamForm, departmentId: e.target.value ? Number(e.target.value) : undefined })}>
                        <option value="">— None —</option>
                        {departments.map(d => (
                          <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">{t('orgStructure.lead') || 'Team Lead'}</label>
                      <select className="form-select form-select-sm" value={teamForm.leadPersonId || ''}
                              onChange={e => setTeamForm({ ...teamForm, leadPersonId: e.target.value ? Number(e.target.value) : undefined })}>
                        <option value="">— None —</option>
                        {persons.map(p => (
                          <option key={p.personId} value={p.personId}>{p.firstName} {p.lastName}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-sm btn-light" onClick={() => setTeamForm(null)}>{t('common.cancel')}</button>
                    <button className="btn btn-sm btn-dark" disabled={teamSaving} onClick={saveTeam}>
                      {teamSaving ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Schedules Tab ── */}
      {!loading && tab === 'schedules' && (
        <div>
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-dark btn-sm" onClick={() => setSchedForm({ name: '', type: 'standard', workDays: '1,2,3,4,5', workStartTime: '09:00', workEndTime: '18:00' })}>
              <Plus size={14} style={{ marginRight: 4 }} /> {t('common.add')}
            </button>
          </div>
          <table className="table table-hover" style={{ fontSize: 14 }}>
            <thead>
              <tr>
                <th>{t('orgStructure.name') || 'Name'}</th>
                <th>{t('orgStructure.type') || 'Type'}</th>
                <th>{t('orgStructure.workDays') || 'Work Days'}</th>
                <th>{t('orgStructure.hours') || 'Hours'}</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {schedules.map(s => (
                <tr key={s.workScheduleId}>
                  <td style={{ fontWeight: 500 }}>{s.name}</td>
                  <td><span className="badge bg-info bg-opacity-10 text-dark">{s.type}</span></td>
                  <td style={{ fontSize: 13 }}>{s.workDays}</td>
                  <td style={{ fontSize: 13 }}>{s.workStartTime} - {s.workEndTime}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setSchedForm(s)}>
                      <Pencil size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted py-3">{t('common.noData') || 'No data'}</td></tr>
              )}
            </tbody>
          </table>

          {/* Schedule Form Modal */}
          {schedForm && (
            <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)', zIndex: 9990 }}
                 onMouseDown={e => { if (e.target === e.currentTarget) setSchedForm(null); }}>
              <div className="modal-dialog" onMouseDown={e => e.stopPropagation()}>
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">{schedForm.workScheduleId ? t('common.edit') : t('common.add')} {t('orgStructure.schedule') || 'Work Schedule'}</h5>
                    <button className="btn-close" onClick={() => setSchedForm(null)} />
                  </div>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">{t('orgStructure.name') || 'Name'} *</label>
                      <input className="form-control form-control-sm" value={schedForm.name || ''}
                             onChange={e => setSchedForm({ ...schedForm, name: e.target.value })} />
                    </div>
                    <div className="row g-3 mb-3">
                      <div className="col-6">
                        <label className="form-label">{t('orgStructure.type') || 'Type'}</label>
                        <select className="form-select form-select-sm" value={schedForm.type || 'standard'}
                                onChange={e => setSchedForm({ ...schedForm, type: e.target.value })}>
                          <option value="standard">Standard</option>
                          <option value="shift">Shift</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div className="col-6">
                        <label className="form-label">{t('orgStructure.workDays') || 'Work Days'}</label>
                        <input className="form-control form-control-sm" value={schedForm.workDays || '1,2,3,4,5'}
                               onChange={e => setSchedForm({ ...schedForm, workDays: e.target.value })}
                               placeholder="1,2,3,4,5" />
                      </div>
                    </div>
                    <div className="row g-3">
                      <div className="col-6">
                        <label className="form-label">{t('orgStructure.startTime') || 'Start Time'}</label>
                        <input type="time" className="form-control form-control-sm" value={schedForm.workStartTime || '09:00'}
                               onChange={e => setSchedForm({ ...schedForm, workStartTime: e.target.value })} />
                      </div>
                      <div className="col-6">
                        <label className="form-label">{t('orgStructure.endTime') || 'End Time'}</label>
                        <input type="time" className="form-control form-control-sm" value={schedForm.workEndTime || '18:00'}
                               onChange={e => setSchedForm({ ...schedForm, workEndTime: e.target.value })} />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button className="btn btn-sm btn-light" onClick={() => setSchedForm(null)}>{t('common.cancel')}</button>
                    <button className="btn btn-sm btn-dark" disabled={schedSaving} onClick={saveSched}>
                      {schedSaving ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
