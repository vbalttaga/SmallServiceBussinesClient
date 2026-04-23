import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3 } from 'lucide-react';
import { reportApi } from '../../api/reportApi';
import type { ReportGroupDto } from '../../types/report';

export default function ReportHomePage() {
  const { t } = useTranslation();
  const [groups, setGroups] = useState<ReportGroupDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportApi.getGroups()
      .then(res => setGroups(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="report-loading">{t('common.loading')}</div>;
  }

  if (groups.length === 0) {
    return (
      <div className="report-status">
        {t('reports.noGroups')}
      </div>
    );
  }

  return (
    <div>
      <h1 className="report-home__title">{t('reports.title')}</h1>
      <div className="report-home__groups">
        {groups.map(group => (
          <div key={group.id} className="report-group-card">
            <div className="report-group-card__header">
              <BarChart3 size={20} />
              <span className="report-group-card__name">{group.name}</span>
            </div>
            <ul className="report-group-card__list">
              {group.reports.map(report => (
                <li key={report.code}>
                  <Link to={`/rpt/${report.code}`} className="report-group-card__link">
                    {report.name}
                    {report.description && (
                      <span className="report-group-card__desc"> — {report.description}</span>
                    )}
                  </Link>
                </li>
              ))}
              {group.reports.length === 0 && (
                <li style={{ color: '#94a3b8', fontSize: 13 }}>{t('reports.noReports')}</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
