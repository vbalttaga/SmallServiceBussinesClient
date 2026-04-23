import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { PropertyMetadata, LookupItem } from '../../types/admin';

/* ─────────────────────────────────────────────
   FieldRenderer — renders a value according to
   its PropertyMetadata editTemplate.

   Two modes:
     • "cell"   — compact display for table cells
     • "field"  — form-style display for detail page
   ───────────────────────────────────────────── */

interface FieldRendererProps {
  property: PropertyMetadata;
  value: unknown;
  mode: 'cell' | 'field';
  readOnly?: boolean;
  onChange?: (name: string, value: unknown) => void;
  /** Lookup options for FK reference fields (select/autocomplete) */
  options?: LookupItem[];
}

// ─── Helpers ──────────────────────────────────

function formatDate(v: unknown): string {
  if (v === null || v === undefined) return '—';
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(v: unknown): string {
  if (v === null || v === undefined) return '—';
  const d = new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  return d.toLocaleString('ro-RO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function toStr(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) + '\u2026' : s;
}

// ─── Cell Renderer (table) ───────────────────

function CellRenderer({ property, value, options: _options }: { property: PropertyMetadata; value: unknown; options?: LookupItem[] }) {
  const { editTemplate, typeName } = property;

  // Null / empty
  if (value === null || value === undefined) {
    return <span className="cell-empty">—</span>;
  }

  // Checkbox → icon
  if (editTemplate === 'checkbox' || typeName === 'boolean') {
    const checked = value === true || value === 1 || value === '1' || value === 'true';
    return checked
      ? <span className="cell-bool cell-bool--yes"><Check size={14} /></span>
      : <span className="cell-bool cell-bool--no"><X size={14} /></span>;
  }

  // Date
  if (editTemplate === 'date') {
    return <span>{formatDate(value)}</span>;
  }

  // DateTime
  if (editTemplate === 'datetime' || typeName === 'datetime') {
    return <span>{formatDateTime(value)}</span>;
  }

  // Link
  if (editTemplate === 'link') {
    return (
      <span className="cell-link">
        {toStr(value)} <ExternalLink size={12} />
      </span>
    );
  }

  // HTML — strip tags for cell
  if (editTemplate === 'html') {
    const text = toStr(value).replace(/<[^>]*>/g, '');
    return <span title={text}>{truncate(text, 80)}</span>;
  }

  // Hidden / invisible
  if (editTemplate === 'hidden') {
    return null;
  }

  // Password — mask
  if (editTemplate === 'password') {
    return <span>{'*'.repeat(8)}</span>;
  }

  // MultiCheck → "{TargetType} (count)" as link
  if (editTemplate === 'multicheck' && property.isMultiCheck) {
    const ids = Array.isArray(value) ? value : [];
    const targetType = property.multiCheckTargetType || '';
    return (
      <Link
        to={`/admin/${targetType}`}
        className="cell-multicheck-link"
        title={`${targetType}: ${ids.length}`}
      >
        {targetType} ({ids.length})
      </Link>
    );
  }

  // Default text
  const str = toStr(value);
  return <span title={str}>{truncate(str, 80)}</span>;
}

// ─── Field Renderer (form) ───────────────────

function FormField({ property, value, readOnly, onChange, options }: Omit<FieldRendererProps, 'mode'>) {
  const { t } = useTranslation();
  const { editTemplate, typeName, name, editable } = property;
  const isReadOnly = readOnly || !editable || editTemplate === 'readonly' || editTemplate === 'label';
  const strVal = toStr(value);

  const handleChange = (v: unknown) => {
    onChange?.(name, v);
  };

  // Hidden
  if (editTemplate === 'hidden') {
    return null;
  }

  // Label — read-only text
  if (editTemplate === 'label' || editTemplate === 'readonly') {
    return <div className="field-value field-value--readonly">{strVal || '—'}</div>;
  }

  // Checkbox
  if (editTemplate === 'checkbox' || typeName === 'boolean') {
    const checked = value === true || value === 1 || value === '1' || value === 'true';
    return (
      <label className="field-checkbox">
        <input
          type="checkbox"
          checked={checked}
          disabled={isReadOnly}
          onChange={e => handleChange(e.target.checked)}
        />
        <span className="field-checkbox__label">{checked ? t('admin.yes') : t('admin.no')}</span>
      </label>
    );
  }

  // Textarea / HTML
  if (editTemplate === 'textarea' || editTemplate === 'html') {
    return (
      <textarea
        className="field-textarea"
        value={strVal}
        readOnly={isReadOnly}
        rows={editTemplate === 'html' ? 8 : 4}
        onChange={e => handleChange(e.target.value)}
      />
    );
  }

  // Date
  if (editTemplate === 'date') {
    const dateVal = value ? new Date(String(value)).toISOString().split('T')[0] : '';
    return (
      <input
        type="date"
        className="field-input"
        value={dateVal}
        readOnly={isReadOnly}
        onChange={e => handleChange(e.target.value)}
      />
    );
  }

  // DateTime
  if (editTemplate === 'datetime') {
    const dtVal = value ? new Date(String(value)).toISOString().slice(0, 16) : '';
    return (
      <input
        type="datetime-local"
        className="field-input"
        value={dtVal}
        readOnly={isReadOnly}
        onChange={e => handleChange(e.target.value)}
      />
    );
  }

  // Time
  if (editTemplate === 'time') {
    return (
      <input
        type="time"
        className="field-input"
        value={strVal}
        readOnly={isReadOnly}
        onChange={e => handleChange(e.target.value)}
      />
    );
  }

  // Password
  if (editTemplate === 'password') {
    return (
      <input
        type="password"
        className="field-input"
        value={strVal}
        readOnly={isReadOnly}
        onChange={e => handleChange(e.target.value)}
      />
    );
  }

  // Color
  if (editTemplate === 'color') {
    return (
      <div className="field-color">
        <input
          type="color"
          value={strVal || '#000000'}
          disabled={isReadOnly}
          onChange={e => handleChange(e.target.value)}
        />
        <span className="field-color__hex">{strVal}</span>
      </div>
    );
  }

  // Select / DropDown
  if (editTemplate === 'select' && options) {
    const numVal = strVal ? Number(strVal) : 0;
    return (
      <select
        className="field-input field-select"
        value={numVal || ''}
        disabled={isReadOnly}
        onChange={e => handleChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">— {t('admin.selectOption', 'Select...')} —</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt.displayName}
          </option>
        ))}
      </select>
    );
  }

  // Autocomplete (searchable dropdown)
  if (editTemplate === 'autocomplete' && options) {
    return (
      <AutocompleteField
        value={strVal}
        options={options}
        readOnly={isReadOnly}
        onChange={handleChange}
        placeholder={t('admin.searchOption', 'Search...')}
      />
    );
  }

  // MultiSelect
  if (editTemplate === 'multiselect' && options) {
    const numVal = strVal ? Number(strVal) : 0;
    return (
      <select
        className="field-input field-select"
        value={numVal || ''}
        disabled={isReadOnly}
        onChange={e => handleChange(e.target.value ? Number(e.target.value) : null)}
      >
        <option value="">— {t('admin.selectOption', 'Select...')} —</option>
        {options.map(opt => (
          <option key={opt.id} value={opt.id}>
            {opt.displayName}
          </option>
        ))}
      </select>
    );
  }

  // MultiCheck (checkboxes)
  if (editTemplate === 'multicheck' && property.isMultiCheck && options) {
    const selectedIds: number[] = Array.isArray(value) ? value.map(Number) : [];

    const handleToggle = (optId: number) => {
      if (isReadOnly) return;
      const newIds = selectedIds.includes(optId)
        ? selectedIds.filter(id => id !== optId)
        : [...selectedIds, optId];
      handleChange(newIds);
    };

    return (
      <div className="field-multicheck">
        {options.map(opt => (
          <label key={opt.id} className="field-multicheck__item">
            <input
              type="checkbox"
              checked={selectedIds.includes(opt.id)}
              disabled={isReadOnly}
              onChange={() => handleToggle(opt.id)}
            />
            <span>{opt.displayName}</span>
          </label>
        ))}
        {options.length === 0 && (
          <span className="field-multicheck__empty">{t('common.noOptions', 'No options')}</span>
        )}
      </div>
    );
  }

  // MultiCheck without options loaded yet
  if (editTemplate === 'multicheck' && property.isMultiCheck) {
    return <span className="field-value field-value--readonly">{t('common.loading')}...</span>;
  }

  // Fallback for select/autocomplete/multiselect without options loaded yet
  if (editTemplate === 'select' || editTemplate === 'multiselect' || editTemplate === 'autocomplete') {
    return (
      <input
        type="text"
        className="field-input"
        value={strVal}
        readOnly={isReadOnly}
        onChange={e => handleChange(e.target.value)}
      />
    );
  }

  // Link
  if (editTemplate === 'link') {
    return (
      <div className="field-link">
        <span>{strVal}</span>
        {strVal && <ExternalLink size={14} className="field-link__icon" />}
      </div>
    );
  }

  // Image
  if (editTemplate === 'image') {
    return strVal
      ? <img src={strVal} alt="" className="field-image" />
      : <div className="field-value field-value--readonly">—</div>;
  }

  // File
  if (editTemplate === 'file') {
    return strVal
      ? <a href={strVal} className="field-file-link" target="_blank" rel="noreferrer">{strVal}</a>
      : <div className="field-value field-value--readonly">—</div>;
  }

  // Number / number range
  if (typeName === 'number' || editTemplate === 'numberrange') {
    return (
      <input
        type="number"
        className="field-input"
        value={strVal}
        readOnly={isReadOnly}
        onChange={e => handleChange(e.target.value)}
      />
    );
  }

  // Default — text input
  return (
    <input
      type="text"
      className="field-input"
      value={strVal}
      readOnly={isReadOnly}
      onChange={e => handleChange(e.target.value)}
    />
  );
}

// ─── Autocomplete (searchable dropdown) ──────

function AutocompleteField({
  value,
  options,
  readOnly,
  onChange,
  placeholder,
}: {
  value: string;
  options: LookupItem[];
  readOnly: boolean;
  onChange: (v: unknown) => void;
  placeholder: string;
}) {
  const numVal = value ? Number(value) : 0;
  const selected = options.find(o => o.id === numVal);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search
    ? options.filter(o => o.displayName.toLowerCase().includes(search.toLowerCase()))
    : options;

  if (readOnly) {
    return <div className="field-value field-value--readonly">{selected?.displayName || value || '—'}</div>;
  }

  return (
    <div className="field-autocomplete" ref={wrapperRef}>
      <input
        type="text"
        className="field-input"
        value={open ? search : (selected?.displayName || '')}
        placeholder={placeholder}
        onFocus={() => { setOpen(true); setSearch(''); }}
        onChange={e => { setSearch(e.target.value); if (!open) setOpen(true); }}
      />
      {numVal > 0 && !open && (
        <button
          type="button"
          className="field-autocomplete__clear"
          onClick={() => { onChange(null); setSearch(''); }}
          title="Clear"
        >
          <X size={14} />
        </button>
      )}
      {open && (
        <ul className="field-autocomplete__dropdown">
          <li
            className="field-autocomplete__option field-autocomplete__option--empty"
            onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
          >
            — Clear —
          </li>
          {filtered.map(opt => (
            <li
              key={opt.id}
              className={`field-autocomplete__option${opt.id === numVal ? ' field-autocomplete__option--selected' : ''}`}
              onClick={() => { onChange(opt.id); setOpen(false); setSearch(''); }}
            >
              {opt.displayName}
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="field-autocomplete__option field-autocomplete__option--empty">
              No results
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────

export default function FieldRenderer(props: FieldRendererProps) {
  if (props.mode === 'cell') {
    return <CellRenderer property={props.property} value={props.value} options={props.options} />;
  }
  return <FormField {...props} />;
}
