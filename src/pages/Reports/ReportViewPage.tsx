import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Download, Play, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { reportApi } from '../../api/reportApi';
import type {
  ReportMetadataDto,
  ReportColumnDto,
  ReportFilterDto,
  ReportExecuteResponse,
} from '../../types/report';

export default function ReportViewPage() {
  const { code } = useParams<{ code: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [metadata, setMetadata] = useState<ReportMetadataDto | null>(null);
  const [data, setData] = useState<ReportExecuteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filter values
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  // Sorting
  const [sortColumn, setSortColumn] = useState<string | undefined>();
  const [sortDirection, setSortDirection] = useState<string | undefined>();

  // Load metadata when code changes
  useEffect(() => {
    if (!code) return;
    setLoading(true);
    setData(null);
    setFilterValues({});
    setPage(1);
    setSortColumn(undefined);
    setSortDirection(undefined);

    reportApi.getMetadata(code)
      .then(res => {
        setMetadata(res.data);
        // Set default filter values
        const defaults: Record<string, string> = {};
        res.data.filters.forEach(f => {
          if (f.defaultValue) defaults[f.parameterName] = f.defaultValue;
        });
        setFilterValues(defaults);
      })
      .catch(() => setMetadata(null))
      .finally(() => setLoading(false));
  }, [code]);

  // Visible columns
  const visibleColumns = useMemo(() =>
    (metadata?.columns ?? [])
      .filter(c => c.visible)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    [metadata]
  );

  // Execute report
  const executeReport = useCallback(async (p?: number) => {
    if (!code) return;
    setExecuting(true);
    const currentPage = p ?? page;
    try {
      const res = await reportApi.execute(code, {
        parameters: { ...filterValues },
        page: currentPage,
        pageSize,
        sortColumn,
        sortDirection,
      });
      setData(res.data);
      setPage(currentPage);
    } catch {
      setData(null);
    } finally {
      setExecuting(false);
    }
  }, [code, filterValues, page, pageSize, sortColumn, sortDirection]);

  // Handle sort click
  const handleSort = (col: ReportColumnDto) => {
    if (!col.sortable || !metadata?.allowSorting) return;
    let newDir = 'ASC';
    if (sortColumn === col.name) {
      newDir = sortDirection === 'ASC' ? 'DESC' : 'ASC';
    }
    setSortColumn(col.name);
    setSortDirection(newDir);
  };

  // Re-execute when sort changes
  useEffect(() => {
    if (sortColumn && data) {
      executeReport(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortColumn, sortDirection]);

  // Handle export
  const handleExport = async () => {
    if (!code) return;
    try {
      const res = await reportApi.exportCsv(code, {
        parameters: { ...filterValues },
        sortColumn,
        sortDirection,
      });
      const blob = new Blob([res.data as BlobPart], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${code}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Export failed silently
    }
  };

  // Handle filter change
  const onFilterChange = (paramName: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [paramName]: value }));
  };

  // Handle run (execute with page 1)
  const handleRun = () => {
    setPage(1);
    executeReport(1);
  };

  // Handle drilldown
  const handleDrilldown = (targetCode: string, row: Record<string, unknown>) => {
    const params = new URLSearchParams();
    Object.entries(row).forEach(([k, v]) => {
      if (v != null) params.set(k, String(v));
    });
    navigate(`/rpt/${targetCode}?${params.toString()}`);
  };

  // Format cell value
  const formatCell = (value: unknown, col: ReportColumnDto): string => {
    if (value == null) return '';
    switch (col.dataType) {
      case 4: // date
        try {
          const d = new Date(String(value));
          if (isNaN(d.getTime())) return String(value);
          return col.format
            ? d.toLocaleDateString()
            : d.toLocaleString();
        } catch { return String(value); }
      case 5: // bool
        return value === true || value === 'true' || value === 1
          ? t('admin.yes') : t('admin.no');
      case 3: // decimal
        return typeof value === 'number'
          ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : String(value);
      default:
        return String(value);
    }
  };

  // Pagination
  const totalPages = data ? Math.ceil(data.totalCount / data.pageSize) : 0;

  const pageNumbers = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | string)[] = [1];
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  }, [page, totalPages]);

  // ── Render ────────────────────────────────────

  if (loading) {
    return <div className="report-loading">{t('common.loading')}</div>;
  }

  if (!metadata) {
    return <div className="report-status">{t('reports.notFound')}</div>;
  }

  // Find drilldown actions
  const drilldownActions = metadata.actions.filter(a => a.actionType === 1 && a.targetReportCode);

  return (
    <div>
      {/* Header + Toolbar */}
      <div className="report-view__header">
        <div>
          <div className="report-view__title">{metadata.name}</div>
          {metadata.description && (
            <div className="report-view__desc">{metadata.description}</div>
          )}
        </div>
        <div className="report-toolbar">
          {metadata.allowFilter && (
            <button className="report-toolbar__btn" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={14} />
              {t('reports.filters')}
            </button>
          )}
          <button
            className="report-toolbar__btn report-toolbar__btn--primary"
            onClick={handleRun}
            disabled={executing}
          >
            <Play size={14} />
            {executing ? t('reports.executing') : t('reports.execute')}
          </button>
          {metadata.allowExport && data && (
            <button className="report-toolbar__btn" onClick={handleExport}>
              <Download size={14} />
              {t('reports.exportCsv')}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {metadata.allowFilter && showFilters && metadata.filters.length > 0 && (
        <div className="report-filters">
          <div className="report-filters__title">{t('reports.filters')}</div>
          <div className="report-filters__grid">
            {metadata.filters
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(filter => (
                <FilterField
                  key={filter.id}
                  filter={filter}
                  value={filterValues[filter.parameterName] ?? ''}
                  onChange={v => onFilterChange(filter.parameterName, v)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Data Table */}
      {data ? (
        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                {visibleColumns.map(col => (
                  <th
                    key={col.id}
                    className={col.sortable && metadata.allowSorting ? 'sortable' : ''}
                    onClick={() => handleSort(col)}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.displayName}
                    {col.sortable && metadata.allowSorting && sortColumn === col.name && (
                      <span className="sort-indicator">
                        {sortDirection === 'DESC' ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length} style={{ textAlign: 'center', color: '#94a3b8' }}>
                    {t('reports.noData')}
                  </td>
                </tr>
              ) : (
                data.rows.map((row, idx) => (
                  <tr key={idx}>
                    {visibleColumns.map(col => {
                      const val = row[col.name];
                      const drilldown = drilldownActions.length > 0 ? drilldownActions[0] : null;
                      // If first visible column and drilldown exists, render as link
                      if (drilldown && col === visibleColumns[0]) {
                        return (
                          <td key={col.id}>
                            <span
                              className="report-drilldown-link"
                              onClick={() => handleDrilldown(drilldown.targetReportCode, row)}
                            >
                              {formatCell(val, col)}
                            </span>
                          </td>
                        );
                      }
                      return <td key={col.id}>{formatCell(val, col)}</td>;
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {data.totalCount > 0 && (
            <div className="report-pagination">
              <div className="report-pagination__info">
                {t('reports.showing', {
                  from: (data.page - 1) * data.pageSize + 1,
                  to: Math.min(data.page * data.pageSize, data.totalCount),
                  total: data.totalCount,
                })}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div className="report-page-size">
                  <select
                    value={pageSize}
                    onChange={e => {
                      const ps = Number(e.target.value);
                      setPageSize(ps);
                      setPage(1);
                      // Will re-execute on next Run
                    }}
                  >
                    {[20, 50, 100, 200].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <span>{t('admin.perPage')}</span>
                </div>
                <div className="report-pagination__controls">
                  <button
                    className="report-pagination__btn"
                    disabled={page <= 1}
                    onClick={() => executeReport(page - 1)}
                  >
                    &laquo;
                  </button>
                  {pageNumbers.map((p, i) =>
                    typeof p === 'string' ? (
                      <span key={`dots-${i}`} style={{ padding: '0 4px' }}>...</span>
                    ) : (
                      <button
                        key={p}
                        className={`report-pagination__btn ${p === page ? 'report-pagination__btn--active' : ''}`}
                        onClick={() => executeReport(p)}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    className="report-pagination__btn"
                    disabled={page >= totalPages}
                    onClick={() => executeReport(page + 1)}
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : !executing ? (
        <div className="report-status">
          {t('reports.clickExecute')}
        </div>
      ) : null}
    </div>
  );
}

// ── Filter Field Component ──────────────────────

function FilterField({
  filter,
  value,
  onChange,
}: {
  filter: ReportFilterDto;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputType = (() => {
    switch (filter.filterType) {
      case 2: return 'number';
      case 3: return 'date';
      default: return 'text';
    }
  })();

  return (
    <div className="report-filter-field">
      <label>
        {filter.displayName}
        {filter.required && <span style={{ color: '#dc2626' }}> *</span>}
      </label>
      <input
        type={inputType}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={filter.displayName}
      />
    </div>
  );
}
