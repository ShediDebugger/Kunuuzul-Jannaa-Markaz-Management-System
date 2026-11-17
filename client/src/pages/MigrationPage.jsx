import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Download,
  Loader2,
  ClipboardPaste,
  Eye,
  Rocket,
  Info,
  ChevronDown,
  ChevronUp,
  BookOpen,
} from 'lucide-react';
import { api } from '../services/api';

const COLUMN_MAP = [
  { oromo: 'MAQAA', meaning: 'Full Name', example: 'Ahmed Mohammed' },
  { oromo: 'SAALA', meaning: 'Sex (Dhiira / Dhalaa)', example: 'Dhiira' },
  { oromo: 'UMRI', meaning: 'Date of Birth / Age', example: '2014-05-12' },
  { oromo: 'KUTAA', meaning: 'Level Code', example: 'H-01' },
  { oromo: 'JUZA', meaning: 'Current Juz', example: '5' },
  { oromo: 'BILBILA', meaning: 'Guardian Phone', example: '+251911000001' },
  { oromo: 'AANAA', meaning: 'Kebele / District', example: 'Kebele 04' },
  { oromo: 'GANDA', meaning: 'Specific Place', example: 'Ganda Baha' },
  { oromo: 'YEROO', meaning: 'Session Name', example: 'Morning' },
  { oromo: 'B/J', meaning: 'Boarding (Eeyyee/Lakki)', example: 'Lakki' },
  { oromo: 'L/G', meaning: 'Old Registration #', example: '0045' },
];

const STATUS_CONFIG = {
  valid: { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Valid' },
  warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Warning' },
  error: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Error' },
};

export default function MigrationPage() {
  const { t } = useTranslation();
  const textareaRef = useRef(null);

  const [rawInput, setRawInput] = useState('');
  const [preview, setPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());

  const handlePreview = async () => {
    try {
      setLoading(true);
      setImportResult(null);
      const rows = JSON.parse(rawInput);
      if (!Array.isArray(rows)) throw new Error('Input must be a JSON array');
      const res = await api.migration.preview(rows);
      setPreview(res.data);
    } catch (err) {
      alert(err.message || 'Invalid JSON format. Check your data.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    const validRows = preview.rows
      .filter((r) => r.status !== 'error')
      .map((r) => r.mapped);
    if (validRows.length === 0) return alert('No valid rows to import.');

    try {
      setImporting(true);
      const res = await api.migration.execute(validRows);
      setImportResult(res.data);
      setPreview(null);
      setRawInput('');
    } catch (err) {
      alert(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handlePasteSample = () => {
    const sample = JSON.stringify([
      { MAQAA: 'Ahmed Mohammed', SAALA: 'Dhiira', UMRI: '2013-03-15', KUTAA: 'QT-03', JUZA: '5', BILBILA: '+251911222333', AANAA: 'Kebele 02', GANDA: 'Ganda Lixa', YEROO: 'All Day' },
      { MAQAA: 'Halima Abdi', SAALA: 'Dhalaa', UMRI: '2015-07-20', KUTAA: 'H-01', JUZA: '1', BILBILA: '+251911444555', AANAA: 'Kebele 05', GANDA: 'Ganda Bahaa', YEROO: 'Morning' },
      { MAQAA: '', SAALA: 'Dhiira', KUTAA: 'H-02', JUZA: '2' },
    ], null, 2);
    setRawInput(sample);
  };

  const toggleRow = (idx) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-800 via-brand-700 to-emerald-600 p-6 sm:p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <pattern id="migGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#migGrid)" />
          </svg>
        </div>
        <div className="relative flex items-start gap-4">
          <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('migration.title')}</h1>
            <p className="text-white/80 mt-1 text-sm sm:text-base max-w-2xl">{t('migration.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Import Result Success Card */}
      {importResult && (
        <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-emerald-100">
              <Rocket className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-emerald-800">{t('migration.import_result')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: t('migration.imported_students'), value: importResult.imported_students, color: 'text-emerald-700' },
              { label: t('migration.created_guardians'), value: importResult.created_guardians, color: 'text-blue-700' },
              { label: t('migration.skipped'), value: importResult.skipped, color: 'text-gray-600' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-lg p-4 text-center border border-emerald-100">
                <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Column Guide Toggle */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-brand-700" />
            <span className="font-semibold text-gray-800">{t('migration.column_guide')}</span>
          </div>
          {showGuide ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>
        {showGuide && (
          <div className="border-t border-gray-100 px-5 py-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200">
                    <th className="pb-2 font-semibold text-gray-700 pe-4">{t('migration.column_name')}</th>
                    <th className="pb-2 font-semibold text-gray-700 pe-4">{t('migration.column_meaning')}</th>
                    <th className="pb-2 font-semibold text-gray-500">Example</th>
                  </tr>
                </thead>
                <tbody>
                  {COLUMN_MAP.map((col) => (
                    <tr key={col.oromo} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 pe-4">
                        <code className="bg-brand-50 text-brand-800 px-2 py-0.5 rounded text-xs font-mono font-bold">{col.oromo}</code>
                      </td>
                      <td className="py-2 pe-4 text-gray-700">{col.meaning}</td>
                      <td className="py-2 text-gray-400 font-mono text-xs">{col.example}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Upload / Paste Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-brand-700" />
            <h2 className="font-semibold text-gray-800">{t('migration.upload_title')}</h2>
          </div>
          <button
            onClick={handlePasteSample}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            Paste Sample
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{t('migration.upload_desc')}</p>

        <textarea
          ref={textareaRef}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder={t('migration.paste_placeholder')}
          className="w-full h-40 sm:h-48 p-4 text-sm font-mono bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-y transition"
        />

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={handlePreview}
            disabled={!rawInput.trim() || loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-700 text-white rounded-lg font-medium text-sm hover:bg-brand-800 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            {loading ? t('common.loading') : t('migration.preview_title')}
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition">
            <Download className="w-4 h-4" />
            {t('migration.template_download')}
          </button>
        </div>
      </div>

      {/* Preview Results */}
      {preview && (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t('migration.total_rows'), value: preview.total, color: 'border-gray-200 bg-gray-50', text: 'text-gray-800' },
              { label: t('migration.valid_rows'), value: preview.valid, color: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700' },
              { label: t('migration.warning_rows'), value: preview.warning, color: 'border-amber-200 bg-amber-50', text: 'text-amber-700' },
              { label: t('migration.error_rows'), value: preview.error, color: 'border-red-200 bg-red-50', text: 'text-red-700' },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl border ${stat.color} p-4 text-center`}>
                <p className={`text-2xl font-bold ${stat.text}`}>{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Preview Table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Eye className="w-4 h-4 text-brand-700" />
                {t('migration.preview_title')}
              </h3>
              <button
                onClick={handleImport}
                disabled={importing || preview.valid + preview.warning === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-sm"
              >
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                {importing ? t('migration.importing') : t('migration.import_btn')}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 font-semibold text-gray-600 w-12">#</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 w-20">{t('common.status')}</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">{t('migration.mapped_name')}</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">{t('migration.mapped_sex')}</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">{t('migration.mapped_level')}</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">{t('migration.mapped_juz')}</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">{t('migration.mapped_phone')}</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((row, idx) => {
                    const cfg = STATUS_CONFIG[row.status];
                    const StatusIcon = cfg.icon;
                    const isExpanded = expandedRows.has(idx);
                    return (
                      <React.Fragment key={idx}>
                        <tr className={`border-t border-gray-100 hover:bg-gray-50 transition-colors ${row.status === 'error' ? 'bg-red-50/40' : ''}`}>
                          <td className="px-4 py-3 font-mono text-xs text-gray-400">{row.row_index}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                              <StatusIcon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800">{row.mapped.full_name}</td>
                          <td className="px-4 py-3 text-gray-600">{row.mapped.sex === 'male' ? '♂' : '♀'} {row.mapped.sex}</td>
                          <td className="px-4 py-3">
                            <code className="bg-brand-50 text-brand-800 px-1.5 py-0.5 rounded text-xs font-mono">{row.mapped.level_code}</code>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{row.mapped.current_juz}</td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{row.mapped.guardian_phone || '—'}</td>
                          <td className="px-4 py-3">
                            {(row.errors.length > 0 || row.warnings.length > 0) && (
                              <button onClick={() => toggleRow(idx)} className="p-1 rounded hover:bg-gray-100 transition">
                                {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                              </button>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (row.errors.length > 0 || row.warnings.length > 0) && (
                          <tr>
                            <td colSpan={8} className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                              <div className="space-y-1 ps-8">
                                {row.errors.map((e, i) => (
                                  <p key={i} className="text-xs text-red-600 flex items-center gap-1.5">
                                    <XCircle className="w-3 h-3 shrink-0" /> {e}
                                  </p>
                                ))}
                                {row.warnings.map((w, i) => (
                                  <p key={i} className="text-xs text-amber-600 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3 h-3 shrink-0" /> {w}
                                  </p>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!preview && !importResult && (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-12 text-center">
          <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{t('migration.no_data')}</p>
        </div>
      )}
    </div>
  );
}
