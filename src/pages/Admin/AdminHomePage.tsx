import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../../api/adminApi';
import type { EntityMetadata } from '../../types/admin';

export default function AdminHomePage() {
  const { t } = useTranslation();
  const [entities, setEntities] = useState<EntityMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getEntities()
      .then(res => setEntities(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, EntityMetadata[]>();
    entities.forEach(e => {
      const list = map.get(e.group) || [];
      list.push(e);
      map.set(e.group, list);
    });
    return map;
  }, [entities]);

  if (loading) {
    return <div className="admin-loading">{t('common.loading')}</div>;
  }

  return (
    <div>
      <div className="admin-page-header">
        <h1>{t('admin.title')}</h1>
      </div>
      <p className="admin-home__welcome">
        {t('admin.selectEntity')}
      </p>

      {Array.from(grouped.entries()).map(([group, items]) => (
        <div key={group} className="admin-home__group">
          <div className="admin-home__group-title">{group}</div>
          <div className="admin-home__cards">
            {items.map(entity => (
              <Link
                key={entity.typeName}
                to={`/admin/${entity.typeName}`}
                className="admin-home__card"
              >
                <div className="admin-home__card-name">{entity.displayName}</div>
                <div className="admin-home__card-props">
                  {entity.properties.length} {entity.properties.length === 1 ? t('admin.property') : t('admin.properties')}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
