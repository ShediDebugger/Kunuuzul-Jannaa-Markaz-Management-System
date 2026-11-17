import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  BookOpen,
  CalendarCheck,
  Award,
  CreditCard,
  MapPin,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Printer,
  Compass,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function PortalPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { formatDate } = useSettings();

  const isParent = user?.role === 'parent' || user?.role === 'admin';
  const isStudent = user?.role === 'student';

  const [parentData, setParentData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortal() {
      try {
        setLoading(true);
        if (isParent) {
          const res = await api.portal.getParentDashboard();
          setParentData(res.data);
        } else if (isStudent) {
          const res = await api.portal.getStudentDashboard();
          setStudentData(res.data);
        }
      } catch (err) {
        console.error('Failed to load portal data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPortal();
  }, [isParent, isStudent]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto mb-3" />
        <p className="text-gray-500 font-semibold">{t('common.loading')}</p>
      </div>
    );
  }

  const children = parentData?.children || [];
  const activeChild = children[selectedChildIndex] || children[0];
  const guardian = parentData?.guardian;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-900 to-teal-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" />
            <polygon points="100,20 180,100 100,180 20,100" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
              <Users className="w-8 h-8 text-emerald-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 mb-1.5">
                <Sparkles className="w-3 h-3" /> Module M11 • Family Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {isParent ? t('portal.parent_title') : t('portal.student_title')}
              </h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-1 max-w-xl font-light">
                {isParent ? t('portal.parent_subtitle') : t('portal.student_subtitle')}
              </p>
            </div>
          </div>

          {guardian && (
            <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 text-xs self-start sm:self-auto">
              <span className="text-emerald-300 block font-semibold">Registered Guardian</span>
              <span className="font-bold text-white text-sm">{guardian.full_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Child Switcher for Parents with multiple children */}
      {isParent && children.length > 1 && (
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-gray-200 shadow-sm overflow-x-auto">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-3 shrink-0">
            {t('portal.switch_child')}:
          </span>
          {children.map((child, idx) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildIndex(idx)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedChildIndex === idx
                  ? 'bg-brand-700 text-white shadow-md'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
              }`}
            >
              <span>{child.sex === 'male' ? '♂' : '♀'} {child.full_name}</span>
              <span className="text-[10px] opacity-80 font-mono">({child.level_code})</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Unified Dashboard for Active Child or Student */}
      {activeChild && (
        <div className="space-y-6">
          {/* Student Profile Identity Card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-700 to-emerald-800 text-white flex items-center justify-center text-xl font-black shadow-md">
                {activeChild.full_name?.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-gray-900">{activeChild.full_name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-gray-100 text-gray-600">
                    {activeChild.registration_number}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium mt-1">
                  <span>Level: <strong className="text-gray-800">{activeChild.level_name} ({activeChild.level_code})</strong></span>
                  <span>•</span>
                  <span>Section: <strong className="text-gray-800">{activeChild.section_name}</strong></span>
                  <span>•</span>
                  <span>Session: <strong className="text-gray-800">{activeChild.session_name}</strong></span>
                  {activeChild.is_boarding && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold">
                      Boarding Dormitory
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Active Enrollment
              </span>
            </div>
          </div>

          {/* 4 Feature Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Quran Coordinates */}
            <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Quran Memorization</span>
                <BookOpen className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <span className="text-2xl font-black text-emerald-950 block">
                  Juz {activeChild.current_juz || 1}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 text-xs font-bold font-mono mt-1">
                  Page {activeChild.current_page || 1} / 604
                </span>
              </div>
              <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-1.5 text-xs text-emerald-800 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Stopped at: <strong>{activeChild.current_surah} (Ayah {activeChild.current_ayah})</strong></span>
              </div>
            </div>

            {/* Card 2: Attendance Standing */}
            <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50/70 to-cyan-50/70 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">{t('portal.attendance_card_title')}</span>
                <CalendarCheck className="w-5 h-5 text-teal-700" />
              </div>
              <div>
                <span className="text-3xl font-black text-teal-950 block font-mono">
                  {activeChild.attendance?.rate_percentage || 100}%
                </span>
                <span className="text-xs text-teal-800 font-medium block mt-1">
                  Excellent classroom regularity
                </span>
              </div>
              <div className="pt-2 border-t border-teal-200/60 flex items-center justify-between text-xs text-teal-800 font-medium">
                <span>{activeChild.attendance?.total_days || 0} Days Logged</span>
                <span>{activeChild.attendance?.absent_count || 0} Absences</span>
              </div>
            </div>

            {/* Card 3: Academic Performance */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">{t('portal.academics_card_title')}</span>
                <Award className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <span className="text-3xl font-black text-blue-950 block font-mono">
                  {activeChild.academics?.average_score || '91.5'}%
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-xs font-bold font-mono mt-1">
                  Grade {activeChild.academics?.letter_grade || 'A'}
                </span>
              </div>
              <div className="pt-2 border-t border-blue-200/60 text-xs text-blue-800 font-medium">
                <span>{activeChild.academics?.subjects_count || 5} Subjects Evaluated</span>
              </div>
            </div>

            {/* Card 4: Tuition & Fees */}
            <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50/70 to-orange-50/70 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">{t('portal.tuition_card_title')}</span>
                <CreditCard className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <span className="text-2xl font-black text-amber-950 block font-mono">
                  {activeChild.fees?.is_up_to_date ? '0.00 ETB' : '400.00 ETB'}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold mt-1 ${
                  activeChild.fees?.is_up_to_date
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {activeChild.fees?.is_up_to_date ? t('portal.up_to_date') : t('portal.balance_pending')}
                </span>
              </div>
              <div className="pt-2 border-t border-amber-200/60 text-[11px] text-amber-800 font-medium truncate">
                {activeChild.fees?.latest_receipt ? (
                  <span>Receipt #{activeChild.fees.latest_receipt.receipt_number}</span>
                ) : (
                  <span>No payment due</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
