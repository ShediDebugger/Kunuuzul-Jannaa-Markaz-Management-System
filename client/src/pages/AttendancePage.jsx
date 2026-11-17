import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Save,
  Loader2,
  Layers,
  Calendar,
  Sparkles,
  BarChart2,
  FileCheck,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';

const STATUS_OPTIONS = [
  { value: 'present', labelKey: 'attendance.present', icon: CheckCircle2, color: 'text-emerald-700 bg-emerald-50 border-emerald-300 ring-emerald-500' },
  { value: 'absent', labelKey: 'attendance.absent', icon: XCircle, color: 'text-red-700 bg-red-50 border-red-300 ring-red-500' },
  { value: 'late', labelKey: 'attendance.late', icon: Clock, color: 'text-amber-700 bg-amber-50 border-amber-300 ring-amber-500' },
  { value: 'excused', labelKey: 'attendance.excused', icon: HelpCircle, color: 'text-blue-700 bg-blue-50 border-blue-300 ring-blue-500' },
];

export default function AttendancePage() {
  const { t } = useTranslation();
  const { formatDate } = useSettings();

  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(1);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load sections list
  useEffect(() => {
    async function loadSections() {
      try {
        const res = await api.classes.getSections();
        const list = res.data || [];
        setSections(list);
        if (list.length > 0) setSelectedSection(list[0].id);
      } catch (err) {
        console.error('Failed to load sections:', err);
      }
    }
    loadSections();
  }, []);

  // Load section attendance for selected date
  const loadAttendance = useCallback(async () => {
    if (!selectedSection) return;
    try {
      setLoading(true);
      setSaveSuccess(false);
      const res = await api.attendance.getSectionAttendance(selectedSection, date);
      setAttendanceList(res.data.students || []);
      setSummary(res.data.summary || null);
    } catch (err) {
      console.error('Failed to load section attendance:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSection, date]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceList((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, attendance_status: newStatus } : s))
    );
  };

  const handleNoteChange = (studentId, noteText) => {
    setAttendanceList((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, note: noteText } : s))
    );
  };

  const handleMarkAllPresent = () => {
    setAttendanceList((prev) =>
      prev.map((s) => ({ ...s, attendance_status: 'present' }))
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const records = attendanceList.map((s) => ({
        student_id: s.id,
        status: s.attendance_status || 'present',
        note: s.note || '',
      }));

      await api.attendance.recordBulk({
        section_id: selectedSection,
        date,
        records,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      loadAttendance();
    } catch (err) {
      alert(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // Real-time counts
  const presentCount = attendanceList.filter((s) => s.attendance_status === 'present').length;
  const absentCount = attendanceList.filter((s) => s.attendance_status === 'absent').length;
  const lateCount = attendanceList.filter((s) => s.attendance_status === 'late').length;
  const excusedCount = attendanceList.filter((s) => s.attendance_status === 'excused').length;
  const totalCount = attendanceList.length;
  const rate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 100;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-800 to-teal-700 p-6 sm:p-8 text-white shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <pattern id="attPat" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#attPat)" />
          </svg>
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
              <CalendarCheck className="w-8 h-8 text-emerald-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 mb-1.5">
                <Sparkles className="w-3 h-3" /> Module M6
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{t('attendance.title')}</h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-1 max-w-xl">{t('attendance.subtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button
              onClick={handleMarkAllPresent}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/30 text-xs sm:text-sm font-semibold text-white transition shadow-sm active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              {t('attendance.mark_all_present')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/20 active:scale-95 transition disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? t('attendance.saving') : t('attendance.save_attendance')}
            </button>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{t('common.success')} — Attendance records saved successfully.</span>
        </div>
      )}

      {/* Control Bar & Live Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Section & Date Selectors */}
        <div className="lg:col-span-5 rounded-2xl bg-white border border-gray-200 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-brand-700" />
                {t('attendance.select_section')}
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium"
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} ({sec.level_code} - {sec.session_name})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-700" />
                {t('attendance.date')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 font-medium"
              />
            </div>
          </div>
          <div className="text-xs text-gray-500 flex items-center justify-between pt-1 border-t border-gray-100">
            <span>Calendar Display:</span>
            <span className="font-semibold text-brand-700">{formatDate(date)}</span>
          </div>
        </div>

        {/* Live Counters */}
        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-white border border-gray-200 rounded-2xl p-3.5 text-center shadow-sm">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Students</span>
            <span className="text-2xl font-black text-gray-900 mt-1 block">{totalCount}</span>
            <span className="text-[11px] text-gray-400">Enrolled</span>
          </div>
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 text-center shadow-sm">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">{t('attendance.present')}</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{presentCount}</span>
            <span className="text-[11px] text-emerald-600 font-medium">{rate}% rate</span>
          </div>
          <div className="bg-red-50/70 border border-red-200 rounded-2xl p-3.5 text-center shadow-sm">
            <span className="text-xs font-bold text-red-800 uppercase tracking-wider block">{t('attendance.absent')}</span>
            <span className="text-2xl font-black text-red-700 mt-1 block">{absentCount}</span>
            <span className="text-[11px] text-red-600 font-medium">Unexcused</span>
          </div>
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-3.5 text-center shadow-sm">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">{t('attendance.late')}</span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">{lateCount}</span>
            <span className="text-[11px] text-amber-600 font-medium">Delayed</span>
          </div>
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3.5 text-center shadow-sm col-span-2 sm:col-span-1">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">{t('attendance.excused')}</span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">{excusedCount}</span>
            <span className="text-[11px] text-blue-600 font-medium">With Excuse</span>
          </div>
        </div>
      </div>

      {/* Main Student Attendance Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <FileCheck className="w-5 h-5 text-brand-700" />
            <h2 className="font-bold text-gray-800 text-base">Classroom Attendance Roster</h2>
          </div>
          <span className="text-xs text-gray-500 font-mono">
            {formatDate(date)} • {totalCount} Students
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">{t('common.loading')}</p>
          </div>
        ) : attendanceList.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium">No students enrolled in this section.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200/80 text-left">
                  <th className="px-4 py-3.5 font-bold text-gray-700 w-12">#</th>
                  <th className="px-4 py-3.5 font-bold text-gray-700">{t('students.full_name')}</th>
                  <th className="px-4 py-3.5 font-bold text-gray-700 w-24">Reg No.</th>
                  <th className="px-4 py-3.5 font-bold text-gray-700 w-80 text-center">Status</th>
                  <th className="px-4 py-3.5 font-bold text-gray-700">Remarks / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {attendanceList.map((student, idx) => {
                  const currentStatus = student.attendance_status || 'present';
                  return (
                    <tr
                      key={student.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        currentStatus === 'absent' ? 'bg-red-50/30' : currentStatus === 'late' ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900">{student.full_name}</div>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <span>{student.sex === 'male' ? '♂ Boy' : '♀ Girl'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{student.registration_number}</td>
                      <td className="px-4 py-3">
                        {/* 4 Status Pill Buttons */}
                        <div className="flex items-center justify-center gap-1.5 p-1 rounded-xl bg-gray-100 border border-gray-200">
                          {STATUS_OPTIONS.map((opt) => {
                            const isSelected = currentStatus === opt.value;
                            const Icon = opt.icon;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => handleStatusChange(student.id, opt.value)}
                                className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                  isSelected
                                    ? `${opt.color} shadow-sm border ring-1`
                                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/60'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden sm:inline">{t(opt.labelKey)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={student.note || ''}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          placeholder={t('attendance.note_placeholder')}
                          className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 placeholder-gray-400"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with Save Action */}
        <div className="px-5 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {t('attendance.attendance_rate')}: <strong className="text-emerald-700">{rate}%</strong> ({presentCount} of {totalCount} students)
          </p>
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-sm shadow-sm transition active:scale-95 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? t('attendance.saving') : t('attendance.save_attendance')}
          </button>
        </div>
      </div>
    </div>
  );
}
