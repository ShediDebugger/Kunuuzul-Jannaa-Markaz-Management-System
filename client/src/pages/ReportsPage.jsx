import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Users,
  CreditCard,
  CalendarCheck,
  BookOpen,
  Download,
  Printer,
  Sparkles,
  Loader2,
  TrendingUp,
  PieChart,
  Layers,
  Clock,
  DollarSign,
  Award,
} from 'lucide-react';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';

export default function ReportsPage() {
  const { t } = useTranslation();
  const { formatDate } = useSettings();

  const [activeTab, setActiveTab] = useState('demographics'); // 'demographics' | 'finance' | 'attendance' | 'quran'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(null);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const res = await api.reports.getDashboard();
        setData(res.data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const handleExport = async (type) => {
    try {
      setExporting(type);
      const res = await api.reports.getExportData(type);
      alert(`Exporting ${type} dataset (${res.data?.length || 0} records ready for download)`);
    } catch (err) {
      alert('Export failed');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">{t('common.loading')}</p>
      </div>
    );
  }

  const demo = data?.demographics || {};
  const fin = data?.finance || {};
  const att = data?.attendance || {};
  const quran = data?.quran || {};

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-teal-950 to-emerald-900 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <rect x="20" y="20" width="160" height="160" rx="20" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="20" y1="100" x2="180" y2="100" stroke="currentColor" strokeWidth="1" />
            <line x1="100" y1="20" x2="100" y2="180" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
              <BarChart3 className="w-8 h-8 text-teal-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/30 text-teal-200 border border-teal-400/30 mb-1.5">
                <Sparkles className="w-3 h-3" /> Module M13
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('reports.title')}</h1>
              <p className="text-teal-100/90 text-sm sm:text-base mt-1 max-w-xl font-light">
                {t('reports.subtitle')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => handleExport('students')}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-xs sm:text-sm font-semibold text-white transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              Students CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold text-xs sm:text-sm shadow-md transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        {[
          { key: 'demographics', labelKey: 'reports.enrollment_tab', icon: Users },
          { key: 'finance', labelKey: 'reports.financial_tab', icon: CreditCard },
          { key: 'attendance', labelKey: 'reports.attendance_tab', icon: CalendarCheck },
          { key: 'quran', labelKey: 'reports.quran_tab', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ${
                isActive
                  ? 'bg-brand-100 text-brand-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(tab.labelKey)}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Enrollment & Demographics */}
      {activeTab === 'demographics' && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Total Students</span>
              <span className="text-3xl font-black text-gray-900 mt-1 block">{demo.total_students || 0}</span>
              <span className="text-xs text-emerald-600 font-medium">100% Active</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Gender Ratio</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black text-blue-700">♂ {demo.male_students || 0}</span>
                <span className="text-gray-300">/</span>
                <span className="text-2xl font-black text-pink-700">♀ {demo.female_students || 0}</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">Boys / Girls</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Day vs Boarding</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-700">{demo.day_students || 0}</span>
                <span className="text-gray-300">/</span>
                <span className="text-2xl font-black text-purple-700">{demo.boarding_students || 0}</span>
              </div>
              <span className="text-xs text-gray-400 font-medium">Day / Boarding dorm</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Support Type</span>
              <span className="text-3xl font-black text-gray-800 mt-1 block">{demo.family_dependent_students || 0}</span>
              <span className="text-xs text-gray-500 font-medium">{demo.independent_students || 0} independent</span>
            </div>
          </div>

          {/* Level Distribution Grid */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-700" />
              Enrollment by Level
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data?.levels?.map((lvl) => (
                <div key={lvl.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-gray-900 block">{lvl.code}</span>
                    <span className="text-xs text-gray-500">{lvl.name}</span>
                  </div>
                  <span className="text-xl font-black text-brand-700 bg-brand-50 px-3 py-1 rounded-lg border border-brand-200">
                    {lvl.student_count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Financial Revenue */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-emerald-950 text-white rounded-2xl p-5 shadow-md sm:col-span-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">Total Net Collections</span>
              <span className="text-4xl font-black mt-2 block font-mono">
                {parseFloat(fin.total_collected || 0).toLocaleString()} ETB
              </span>
              <span className="text-xs text-emerald-200/80 mt-1 block">{fin.total_receipts} Issued Receipts</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Free Students</span>
              <span className="text-3xl font-black text-emerald-700 mt-2 block">{fin.approved_free_count}</span>
              <span className="text-xs text-amber-600 font-medium block mt-1">{fin.pending_free_count} pending review</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Payment Channels</span>
              <span className="text-3xl font-black text-brand-700 mt-2 block">3</span>
              <span className="text-xs text-gray-400 font-medium block mt-1">Cash, e-birr, CBE Bank</span>
            </div>
          </div>

          {/* Payment Method Breakdown Cards */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-700" />
              {t('reports.collection_summary')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <span className="text-xs font-bold text-emerald-800 uppercase block">Cash Collections</span>
                <span className="text-2xl font-black text-emerald-900 mt-1 block font-mono">
                  {parseFloat(fin.total_cash || 0).toLocaleString()} ETB
                </span>
              </div>
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                <span className="text-xs font-bold text-blue-800 uppercase block">e-birr Transfers</span>
                <span className="text-2xl font-black text-blue-900 mt-1 block font-mono">
                  {parseFloat(fin.total_e_birr || 0).toLocaleString()} ETB
                </span>
              </div>
              <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/50">
                <span className="text-xs font-bold text-purple-800 uppercase block">CBE Bank Direct</span>
                <span className="text-2xl font-black text-purple-900 mt-1 block font-mono">
                  {parseFloat(fin.total_cbe || 0).toLocaleString()} ETB
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Attendance Analytics */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-teal-900 text-white rounded-2xl p-5 shadow-md">
              <span className="text-xs font-bold text-teal-300 uppercase tracking-wider block">Monthly Attendance Rate</span>
              <span className="text-4xl font-black mt-2 block font-mono">{att.monthly_rate}%</span>
              <span className="text-xs text-teal-200/80 mt-1 block">Active section average</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Total Present</span>
              <span className="text-3xl font-black text-emerald-700 mt-2 block">{att.present_count || 0}</span>
              <span className="text-xs text-gray-400 font-medium block mt-1">Sessions attended</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider block">Total Absent</span>
              <span className="text-3xl font-black text-red-700 mt-2 block">{att.absent_count || 0}</span>
              <span className="text-xs text-gray-400 font-medium block mt-1">Unexcused</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider block">Total Late</span>
              <span className="text-3xl font-black text-amber-700 mt-2 block">{att.late_count || 0}</span>
              <span className="text-xs text-gray-400 font-medium block mt-1">Delayed arrivals</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Quran Progress */}
      {activeTab === 'quran' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-700" />
              {t('reports.juz_breakdown')}
            </h3>
            <p className="text-xs text-gray-500">Distribution of enrolled students across the 30 Juz of the Holy Quran.</p>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2">
              {quran?.juz_distribution?.map((j) => (
                <div key={j.current_juz} className="p-3 rounded-xl border border-gray-100 bg-emerald-50/40 text-center">
                  <span className="text-xs font-bold text-emerald-800 block">Juz {j.current_juz}</span>
                  <span className="text-2xl font-black text-gray-900 mt-1 block">{j.count}</span>
                  <span className="text-[11px] text-gray-400">Students</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
