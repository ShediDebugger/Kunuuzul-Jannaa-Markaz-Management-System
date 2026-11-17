import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  HardDrive,
  Download,
  Shield,
  Clock,
  Database,
  Users,
  CreditCard,
  UserCheck,
  Loader2,
  CheckCircle2,
  FileDown,
  FolderArchive,
  ArrowDownToLine,
} from 'lucide-react';
import { api } from '../services/api';

const EXPORT_OPTIONS = [
  { key: 'students', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'payments', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'guardians', icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
];

export default function BackupPage() {
  const { t } = useTranslation();

  const [backupResult, setBackupResult] = useState(null);
  const [creating, setCreating] = useState(false);
  const [exportingKey, setExportingKey] = useState(null);

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      const res = await api.migration.createBackup();
      setBackupResult(res.data);
    } catch (err) {
      alert(err.message || 'Backup failed');
    } finally {
      setCreating(false);
    }
  };

  const handleExport = async (dataset) => {
    try {
      setExportingKey(dataset);
      const res = await api.migration.exportData(dataset);
      // In a real app, this would trigger a download
      alert(`${t('backup.download')}: ${res.data?.filename || dataset + '.csv'}`);
    } catch (err) {
      alert(err.message || 'Export failed');
    } finally {
      setExportingKey(null);
    }
  };

  const formatDate = (iso) => {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    }).format(new Date(iso));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-800 via-violet-700 to-purple-600 p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Shield / vault pattern */}
            <path d="M100 20 L170 60 L170 120 Q170 170 100 190 Q30 170 30 120 L30 60 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M100 40 L150 70 L150 115 Q150 155 100 170 Q50 155 50 115 L50 70 Z" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="100" cy="110" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="97" y="105" width="6" height="12" rx="2" fill="currentColor" opacity="0.5" />
          </svg>
        </div>
        <div className="relative flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
            <HardDrive className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('backup.title')}</h1>
            <p className="text-white/80 mt-1 text-sm sm:text-base max-w-2xl">{t('backup.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Full Backup Section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50">
              <Shield className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">{t('backup.create_backup')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Full database snapshot including all tables and records</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Last Backup Result */}
          {backupResult ? (
            <div className="mb-6 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-800">Backup Created Successfully</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <p className="text-xs text-gray-500 mb-1">{t('backup.backup_id')}</p>
                  <p className="font-mono text-xs text-gray-800 font-medium break-all">{backupResult.backup_id}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <p className="text-xs text-gray-500 mb-1">{t('backup.last_backup')}</p>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs text-gray-800 font-medium">{formatDate(backupResult.created_at)}</p>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-3 border border-emerald-100">
                  <p className="text-xs text-gray-500 mb-1">{t('backup.backup_size')}</p>
                  <p className="text-xs text-gray-800 font-medium">{backupResult.size_kb} KB</p>
                </div>
              </div>
              {backupResult.tables && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 mb-2">{t('backup.backup_tables')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {backupResult.tables.map((table) => (
                      <span
                        key={table}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-emerald-100 rounded-full text-xs text-gray-600"
                      >
                        <Database className="w-3 h-3 text-emerald-500" />
                        {table}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-8 text-center">
              <FolderArchive className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{t('backup.no_backups')}</p>
            </div>
          )}

          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="flex items-center gap-2.5 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('backup.creating')}
              </>
            ) : (
              <>
                <HardDrive className="w-5 h-5" />
                {t('backup.create_backup')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Section */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <FileDown className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-800">{t('backup.export_title')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">Download individual datasets as CSV spreadsheet files</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {EXPORT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isExporting = exportingKey === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => handleExport(opt.key)}
                  disabled={isExporting}
                  className={`group relative flex flex-col items-center gap-3 p-6 rounded-xl border-2 ${opt.border} ${opt.bg} hover:shadow-md transition-all duration-200 disabled:opacity-50`}
                >
                  <div className={`p-3 rounded-full bg-white shadow-sm ${opt.color}`}>
                    {isExporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span className="font-semibold text-gray-800 text-sm">{t(`backup.export_${opt.key}`)}</span>
                  <div className={`flex items-center gap-1 text-xs ${opt.color} font-medium`}>
                    <ArrowDownToLine className="w-3 h-3" />
                    CSV
                  </div>
                </button>
              );
            })}
          </div>

          {/* Export All */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => handleExport('all')}
              disabled={exportingKey === 'all'}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50"
            >
              {exportingKey === 'all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {t('backup.export_all')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
