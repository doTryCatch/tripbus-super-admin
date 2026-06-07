'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Search, ChevronDown, Calendar, X, Filter, SlidersHorizontal,
} from 'lucide-react';

// ─── Filter Types ───────────────────────────────────────────
export interface FilterConfig {
  key: string;
  type: 'text' | 'select' | 'dateRange' | 'datePresets' | 'multiSelect';
  label: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
}

interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, any>;
  onChange: (values: Record<string, any>) => void;
  onClear?: () => void;
}

// ─── Date Presets ───────────────────────────────────────────
const DATE_PRESETS = [
  { value: '7d', label: 'Last 7 Days' },
  { value: '30d', label: 'Last 30 Days' },
  { value: '90d', label: 'Last 90 Days' },
  { value: 'custom', label: 'Custom' },
];

// ─── Text Search ────────────────────────────────────────────
function TextFilter({ config, value, onChange }: {
  config: FilterConfig;
  value: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(value);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const handleChange = (v: string) => {
    setLocal(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 300);
  };

  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search size="16" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
      <input
        type="text"
        placeholder={config.placeholder || 'Search...'}
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400"
      />
    </div>
  );
}

// ─── Select Filter ──────────────────────────────────────────
function SelectFilter({ config, value, onChange }: {
  config: FilterConfig;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 min-w-[140px]"
    >
      <option value="">{config.placeholder || 'All'}</option>
      {config.options?.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

// ─── Date Range Filter ──────────────────────────────────────
function DateRangeFilter({ config, value, onChange }: {
  config: FilterConfig;
  value: { from?: string; to?: string };
  onChange: (v: { from?: string; to?: string }) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Calendar size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="date"
          value={value?.from || ''}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="pl-8 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          placeholder="From"
        />
      </div>
      <span className="text-gray-400 dark:text-gray-500 text-xs">to</span>
      <div className="relative">
        <Calendar size="14" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="date"
          value={value?.to || ''}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="pl-8 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
          placeholder="To"
        />
      </div>
    </div>
  );
}

// ─── Date Presets Filter ────────────────────────────────────
function DatePresetsFilter({ config, value, onChange }: {
  config: FilterConfig;
  value: string;
  onChange: (v: string) => void;
}) {
  const [customRange, setCustomRange] = useState<{ from?: string; to?: string }>({});

  const handlePreset = (preset: string) => {
    onChange(preset);
    if (preset === 'custom') {
      // Don't change anything, let user pick dates
    } else {
      setCustomRange({});
    }
  };

  const now = new Date();
  const getDateRange = (preset: string) => {
    if (preset === 'custom') {
      return customRange;
    }
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
    const from = new Date(now);
    from.setDate(from.getDate() - days);
    return {
      from: from.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0],
    };
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => handlePreset(p.value)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              value === p.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {value === 'custom' && (
        <DateRangeFilter
          config={config}
          value={customRange}
          onChange={(v) => {
            setCustomRange(v);
            onChange('custom');
          }}
        />
      )}
    </div>
  );
}

// ─── Main FilterBar ─────────────────────────────────────────
export default function FilterBar({ filters, values, onChange, onClear }: FilterBarProps) {
  const activeCount = Object.entries(values).filter(([k, v]) => {
    if (v === '' || v === undefined || v === null) return false;
    if (typeof v === 'object' && !v.from && !v.to) return false;
    return true;
  }).length;

  const handleChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  const handleClear = () => {
    const cleared: Record<string, any> = {};
    filters.forEach((f) => {
      cleared[f.key] = f.type === 'dateRange' ? {} : '';
    });
    onChange(cleared);
    onClear?.();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
          <SlidersHorizontal size="16" />
          <span className="text-xs font-medium uppercase tracking-wider">Filters</span>
        </div>

        {filters.map((config) => {
          const value = values[config.key];
          switch (config.type) {
            case 'text':
              return (
                <TextFilter
                  key={config.key}
                  config={config}
                  value={value || ''}
                  onChange={(v) => handleChange(config.key, v)}
                />
              );
            case 'select':
              return (
                <SelectFilter
                  key={config.key}
                  config={config}
                  value={value || ''}
                  onChange={(v) => handleChange(config.key, v)}
                />
              );
            case 'dateRange':
              return (
                <DateRangeFilter
                  key={config.key}
                  config={config}
                  value={value || {}}
                  onChange={(v) => handleChange(config.key, v)}
                />
              );
            case 'datePresets':
              return (
                <DatePresetsFilter
                  key={config.key}
                  config={config}
                  value={value || '30d'}
                  onChange={(v) => handleChange(config.key, v)}
                />
              );
            default:
              return null;
          }
        })}

        {activeCount > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <X size="14" />
            Clear Filters ({activeCount})
          </button>
        )}
      </div>
    </div>
  );
}
