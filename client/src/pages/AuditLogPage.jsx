import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ScrollText,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  Clock,
  Database,
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  ArrowRightLeft,
  Loader2,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';

const ACTION_BADGES = {
  CREATE: { label: 'Created', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Plus },
  UPDATE: { label: 'Updated', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Pencil },
  DELETE: { label: 'Deleted', color: 'bg-red-50 text-red-700 border-red-200', icon: Trash2 },
  REVERSE: { label: 'Reversed', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: RotateCcw },
};

const TABLE_LABELS = {
  students: 'Students',
  payments: 'Payments',
  users: 'Users',
  guardians: 'Guardians',
  fee_plans: 'Fee Plans',
  free_student_requests: 'Free Requests',
  attendance: 'Attendance',
  levels: 'Levels',
  sections: 'Sections',
  teachers: 'Teachers',
  settings: 'Settings',
};

export default function AuditLogPage() {
  const { t } = useTranslation();
  const { calendarType } = useSettings();

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Filters
  const [filterTable, setFilterTable] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterActor, setFilterActor] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page };
      if (filterTable) params.table_name = filterTable;
      if (filterAction) params.action = filterAction;
      if (filterActor) params.actor_name = filterActor;
      const res = await api.migration.getAuditLogs(params);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filterTable, filterAction, filterActor]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const toggleRow = (idx) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hour12: false,
    }).format(d);
  };

  const renderJsonDiff = (oldVals, newVals) => {
    const allKeys = new Set([
      ...Object.keys(oldVals || {}),
      ...Object.keys(newVals || {}),
    ]);
    if (allKeys.size === 0) return <p className="text-xs text-gray-400 italic">{t('audit.no_changes')}</p>;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Old Values */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">{t('audit.old_values')}</p>
          <div className="bg-red-50/50 rounded-lg p-3 border border-red-100 space-y-1">
            {oldVals ? Object.entries(oldVals).map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-2 text-xs">
                <span className="text-gray-500 font-mono min-w-[80px]">{k}:</span>
                <span className="text-red-700 font-medium line-through">{JSON.stringify(v)}</span>
              </div>
            )) : <p className="text-xs text-gray-400 italic">— (new record)</p>}
          </div>
        </div>
        {/* New Values */}
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">{t('audit.new_values')}</p>
          <div className="bg-emerald-50/50 rounded-lg p-3 border border-emerald-100 space-y-1">
            {newVals ? Object.entries(newVals).map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-2 text-xs">
                <span className="text-gray-500 font-mono min-w-[80px]">{k}:</span>
                <span className="text-emerald-700 font-medium">{JSON.stringify(v)}</span>
              </div>
            )) : <p className="text-xs text-gray-400 italic">— (deleted)</p>}
          </div>
        </div>
      </div>
    );
  };

  const clearFilters = () => {
    setFilterTable('');
    setFilterAction('');
    setFilterActor('');
    setPage(1);
  };

  const hasActiveFilters = filterTable || filterAction || filterActor;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-indigo-700 p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-72 h-72 opacity-5">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="0.3" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.3" />
            {[...Array(12)].map((_, i) => (
              <line key={i} x1="100" y1="20" x2="100" y2="30" stroke="currentColor" strokeWidth="1" transform={`rotate(${i * 30} 100 100)`} />
            ))}
          </svg>
        </div>
        <div className="relative flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
            <ScrollText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('audit.title')}</h1>
            <p className="text-white/80 mt-1 text-sm sm:text-base max-w-2xl">{t('audit.subtitle')}</p>
            <p className="text-white/60 text-xs mt-2">{total} {t('common.total').toLowerCase()} entries</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-brand-700" />
            <span className="font-medium text-gray-700 text-sm">{t('common.filter')}</span>
            {hasActiveFilters && (
              <span className="bg-brand-100 text-brand-800 text-xs px-2 py-0.5 rounded-full font-medium">Active</span>
            )}
          </div>
          {showFilters ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showFilters && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t('audit.filter_table')}</label>
                <select
                  value={filterTable}
                  onChange={(e) => { setFilterTable(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50"
                >
                  <option value="">{t('common.all')}</option>
                  {Object.entries(TABLE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t('audit.filter_action')}</label>
                <select
                  value={filterAction}
                  onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50"
                >
                  <option value="">{t('common.all')}</option>
                  <option value="CREATE">{t('audit.action_create')}</option>
                  <option value="UPDATE">{t('audit.action_update')}</option>
                  <option value="DELETE">{t('audit.action_delete')}</option>
                  <option value="REVERSE">{t('audit.action_reverse')}</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t('audit.filter_actor')}</label>
                <input
                  type="text"
                  value={filterActor}
                  onChange={(e) => { setFilterActor(e.target.value); setPage(1); }}
                  placeholder={t('common.search')}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-gray-50"
                />
              </div>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 font-medium"
              >
                <X className="w-3 h-3" />
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-400">{t('common.loading')}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <ScrollText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400">{t('audit.no_changes')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">{t('audit.timestamp')}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">{t('audit.actor')}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">{t('audit.action')}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">{t('audit.table')}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">{t('audit.record_id')}</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => {
                  const actionCfg = ACTION_BADGES[log.action] || ACTION_BADGES.CREATE;
                  const ActionIcon = actionCfg.icon;
                  const isExpanded = expandedRows.has(idx);
                  return (
                    <React.Fragment key={log.id || idx}>
                      <tr className="border-t border-gray-100 hover:bg-gray-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3 h-3 shrink-0" />
                            {formatDate(log.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
                              <User className="w-3 h-3 text-brand-700" />
                            </div>
                            <span className="font-medium text-gray-700 text-xs">{log.actor_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${actionCfg.color}`}>
                            <ActionIcon className="w-3 h-3" />
                            {actionCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            <Database className="w-3 h-3 shrink-0 text-gray-400" />
                            {TABLE_LABELS[log.table_name] || log.table_name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <code className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-xs font-mono">#{log.record_id}</code>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleRow(idx)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                            title={t('audit.expand_diff')}
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gradient-to-r from-gray-50 to-white border-t border-gray-100">
                            {renderJsonDiff(log.old_values, log.new_values)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ← Prev
              </button>
              <span className="text-xs font-medium text-gray-600">Page {page}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
