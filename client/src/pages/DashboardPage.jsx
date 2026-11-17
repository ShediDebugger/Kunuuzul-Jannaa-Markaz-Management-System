import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  GraduationCap,
  CreditCard,
  AlertCircle,
  Calendar,
  CheckCircle,
  BookOpen,
  ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { formatDateWithPref, calendar } = useSettings();

  const todayStr = new Date().toISOString().split('T')[0];

  // Placeholder statistics aligned with Developer Manual Section 13
  const stats = [
    {
      title: t('dashboard.total_students'),
      value: '248',
      sub: `${t('dashboard.boys')}: 138 | ${t('dashboard.girls')}: 110`,
      icon: GraduationCap,
      color: 'bg-blue-500',
    },
    {
      title: t('dashboard.income_month'),
      value: '142,500 ETB',
      sub: 'Cash: 45k | e-birr: 62k | CBE: 35.5k',
      icon: CreditCard,
      color: 'bg-emerald-500',
    },
    {
      title: t('dashboard.unpaid_total'),
      value: '31,200 ETB',
      sub: '28 students pending',
      icon: AlertCircle,
      color: 'bg-amber-500',
    },
    {
      title: t('dashboard.active_teachers'),
      value: '12',
      sub: '7 Levels • 14 Sections',
      icon: Users,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-800 to-brand-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-700/60 text-xs font-medium mb-2 backdrop-blur-sm">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {formatDateWithPref(todayStr)} ({t(`calendar.${calendar}`)})
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            {t('dashboard.welcome')}, {user?.full_name}!
          </h2>
          <p className="text-brand-100 text-xs sm:text-sm mt-1">
            {t('roles.' + user?.role)} • {t('app.sub_title')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm border border-white/10 text-center">
            <div className="text-xs text-brand-200">Active Academic Year</div>
            <div className="text-sm font-bold">2026-2027</div>
          </div>
        </div>
      </div>

      {/* Overview Cards (Admin, Cashier, Reception) */}
      {['admin', 'cashier', 'reception'].includes(user?.role) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.color} text-white`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  {stat.sub}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Info Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core Markaz Level Path */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-brand-700" />
            <span>Markaz Education Path (Tracks & Levels)</span>
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Structured memorization and recitation progression stored in the system:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <span className="font-semibold text-gray-800">1. Huruufa Track:</span>
              <span className="text-brand-800 font-medium">H-01 → H-02 (Co-ed)</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <span className="font-semibold text-gray-800">2. Qurana Tilaawa:</span>
              <span className="text-brand-800 font-medium">QT-03 (Co-ed) → QT-04 (Boys) / QT-05 (Girls)</span>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
              <span className="font-semibold text-gray-800">3. Qurana Hifzi:</span>
              <span className="text-brand-800 font-medium">QH-06 (Boys) / QH-07 (Girls)</span>
            </div>
          </div>
        </div>

        {/* System Status / Phase Roadmap */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>Development Roadmap & Status</span>
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Phase 0: Developer Manual & Agreed Specs (Complete)</span>
            </div>
            <div className="flex items-center gap-2 text-brand-800 font-semibold">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
              <span>Phase 1: Project Setup, Database, Auth & Multi-language (In Progress)</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              <span>Phase 2: Students, Guardians, Levels, Teachers</span>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
              <span>Phase 3: Fees, Payments, Receipts, Unpaid List</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
