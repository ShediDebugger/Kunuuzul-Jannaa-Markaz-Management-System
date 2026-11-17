import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award,
  Layers,
  BookOpen,
  Printer,
  Save,
  Loader2,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Sparkles,
  FileText,
  User,
  X,
  Percent,
} from 'lucide-react';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';

const SUBJECTS = [
  'Qurana Hifzii',
  'Qurana Tilaawaa',
  'Tajweed',
  'Aqiidaa fi Akhlaaqa',
  'Fiqhi',
  'Afaan Arabaa',
];

const TERMS = ['Term 1', 'Term 2'];

function getLetterBadgeColor(grade) {
  if (['A+', 'A', 'A-'].includes(grade)) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (['B+', 'B', 'B-'].includes(grade)) return 'bg-blue-100 text-blue-800 border-blue-300';
  if (['C+', 'C'].includes(grade)) return 'bg-amber-100 text-amber-800 border-amber-300';
  if (grade === 'D') return 'bg-orange-100 text-orange-800 border-orange-300';
  return 'bg-red-100 text-red-800 border-red-300';
}

function calculateLetter(total) {
  const score = parseFloat(total) || 0;
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

export default function GradesPage() {
  const { t } = useTranslation();
  const { formatDate } = useSettings();

  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(1);
  const [selectedSubject, setSelectedSubject] = useState(SUBJECTS[0]);
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);

  const [studentsGrades, setStudentsGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Printable Report Card Modal State
  const [reportModalStudent, setReportModalStudent] = useState(null);
  const [reportCardData, setReportCardData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Load sections
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

  // Load section grades for subject and term
  const loadGrades = useCallback(async () => {
    if (!selectedSection) return;
    try {
      setLoading(true);
      setSaveSuccess(false);
      const res = await api.grades.getSectionGrades(selectedSection, {
        subject: selectedSubject,
        term: selectedTerm,
      });
      setStudentsGrades(res.data.students || []);
    } catch (err) {
      console.error('Failed to load grades:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSection, selectedSubject, selectedTerm]);

  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  const handleMarkChange = (studentId, field, value) => {
    const num = Math.max(0, parseFloat(value) || 0);
    setStudentsGrades((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        const updated = { ...s, [field]: num };
        const total = (parseFloat(updated.mid_mark) || 0) +
          (parseFloat(updated.assignment_mark) || 0) +
          (parseFloat(updated.quiz_mark) || 0) +
          (parseFloat(updated.test_mark) || 0) +
          (parseFloat(updated.final_mark) || 0);
        return {
          ...updated,
          total_mark: total,
          letter_grade: calculateLetter(total),
        };
      })
    );
  };

  const handleRemarkChange = (studentId, value) => {
    setStudentsGrades((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, remark: value } : s))
    );
  };

  const handleSaveBatch = async () => {
    try {
      setSaving(true);
      await api.grades.recordBatch({
        section_id: selectedSection,
        subject: selectedSubject,
        term: selectedTerm,
        academic_year_id: 1,
        grades: studentsGrades.map((s) => ({
          student_id: s.id,
          mid_mark: s.mid_mark || 0,
          assignment_mark: s.assignment_mark || 0,
          quiz_mark: s.quiz_mark || 0,
          test_mark: s.test_mark || 0,
          final_mark: s.final_mark || 0,
          remark: s.remark || '',
        })),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
      loadGrades();
    } catch (err) {
      alert(err.message || 'Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  // Open official report card
  const handleViewReportCard = async (student) => {
    setReportModalStudent(student);
    try {
      setLoadingReport(true);
      const res = await api.grades.getStudentReportCard(student.id, { term: selectedTerm });
      setReportCardData(res.data);
    } catch (err) {
      alert('Failed to load report card');
    } finally {
      setLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-950 via-indigo-900 to-indigo-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-64 h-64 opacity-10 pointer-events-none">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <polygon points="100,10 120,70 190,70 135,110 155,175 100,135 45,175 65,110 10,70 80,70" fill="currentColor" />
          </svg>
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
              <Award className="w-8 h-8 text-indigo-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 mb-1.5">
                <Sparkles className="w-3 h-3" /> Module M9
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('grades.title')}</h1>
              <p className="text-indigo-100/90 text-sm sm:text-base mt-1 max-w-xl font-light">
                {t('grades.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveBatch}
            disabled={saving || loading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white font-black text-sm shadow-lg shadow-black/20 active:scale-95 transition self-start sm:self-auto disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? t('grades.saving') : t('grades.save_grades')}
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Grades saved successfully. Total scores and letter grades calculated automatically.</span>
        </div>
      )}

      {/* Filter / Selector Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-700" />
            Classroom Section
          </label>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(parseInt(e.target.value, 10))}
            className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-semibold text-gray-800"
          >
            {sections.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.name} ({sec.level_code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-brand-700" />
            {t('grades.select_subject')}
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-semibold text-gray-800"
          >
            {SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand-700" />
            {t('grades.select_term')}
          </label>
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-semibold text-gray-800"
          >
            {TERMS.map((term) => (
              <option key={term} value={term}>{t(term === 'Term 1' ? 'grades.term_1' : 'grades.term_2')}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Marks Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="font-bold text-gray-800 text-base">{selectedSubject} — {selectedTerm} Marks</h2>
            <p className="text-xs text-gray-500 mt-0.5">Numeric entries only. Total (100) and Letter Grade (A+ to F) compute live.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
              <Unlock className="w-3 h-3 text-emerald-600" /> Open for Entry
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">{t('common.loading')}</p>
          </div>
        ) : studentsGrades.length === 0 ? (
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
                  <th className="px-3 py-3.5 font-bold text-gray-700 w-24 text-center">Mid (20)</th>
                  <th className="px-3 py-3.5 font-bold text-gray-700 w-24 text-center">Asgn (10)</th>
                  <th className="px-3 py-3.5 font-bold text-gray-700 w-24 text-center">Quiz (10)</th>
                  <th className="px-3 py-3.5 font-bold text-gray-700 w-24 text-center">Test (20)</th>
                  <th className="px-3 py-3.5 font-bold text-gray-700 w-24 text-center">Final (40)</th>
                  <th className="px-3 py-3.5 font-bold text-gray-700 w-24 text-center">Total (100)</th>
                  <th className="px-3 py-3.5 font-bold text-gray-700 w-20 text-center">Grade</th>
                  <th className="px-3 py-3.5 font-bold text-gray-700">Remarks</th>
                  <th className="px-3 py-3.5 font-bold text-gray-700 w-16 text-center">Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentsGrades.map((student, idx) => {
                  const total = student.total_mark || 0;
                  const letter = student.letter_grade || calculateLetter(total);
                  return (
                    <tr key={student.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-gray-900">{student.full_name}</div>
                        <div className="text-[11px] text-gray-400 font-mono">{student.registration_number}</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={student.mid_mark || ''}
                          onChange={(e) => handleMarkChange(student.id, 'mid_mark', e.target.value)}
                          className="w-16 px-2 py-1 text-center font-bold text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={student.assignment_mark || ''}
                          onChange={(e) => handleMarkChange(student.id, 'assignment_mark', e.target.value)}
                          className="w-16 px-2 py-1 text-center font-bold text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={student.quiz_mark || ''}
                          onChange={(e) => handleMarkChange(student.id, 'quiz_mark', e.target.value)}
                          className="w-16 px-2 py-1 text-center font-bold text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={student.test_mark || ''}
                          onChange={(e) => handleMarkChange(student.id, 'test_mark', e.target.value)}
                          className="w-16 px-2 py-1 text-center font-bold text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="number"
                          min="0"
                          max="40"
                          step="0.5"
                          value={student.final_mark || ''}
                          onChange={(e) => handleMarkChange(student.id, 'final_mark', e.target.value)}
                          className="w-16 px-2 py-1 text-center font-bold text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center font-black text-gray-900 text-sm font-mono">
                        {total}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black border ${getLetterBadgeColor(letter)}`}>
                          {letter}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={student.remark || ''}
                          onChange={(e) => handleRemarkChange(student.id, e.target.value)}
                          placeholder="Remark..."
                          className="w-full px-2 py-1 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-500"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button
                          onClick={() => handleViewReportCard(student)}
                          title={t('grades.report_card')}
                          className="p-1.5 rounded-lg text-brand-700 bg-brand-50 hover:bg-brand-100 transition"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Report Card Modal */}
      {reportModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-brand-900 to-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-gold-300" />
                <h3 className="font-bold text-lg">{t('grades.report_card')}</h3>
              </div>
              <button
                onClick={() => setReportModalStudent(null)}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 print:p-0">
              {/* Markaz Official Header */}
              <div className="text-center pb-4 border-b-2 border-brand-800/20">
                <h2 className="text-xl font-black text-brand-900 uppercase tracking-wide">
                  Kunuuzul-Jannaa-Markaz
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Quran Memorization School • Official Academic Report</p>
                <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-xs font-bold text-brand-800">
                  <span>{selectedTerm} Report Card</span> • <span>Academic Year 2026-2027</span>
                </div>
              </div>

              {/* Student Info Box */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 block font-bold uppercase">Student</span>
                  <span className="font-bold text-gray-900 text-sm">{reportModalStudent.full_name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase">Reg Number</span>
                  <span className="font-mono font-bold text-gray-700">{reportModalStudent.registration_number}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase">Level / Section</span>
                  <span className="font-bold text-gray-800">Section A</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-bold uppercase">Date Issued</span>
                  <span className="font-bold text-gray-800">{formatDate(new Date())}</span>
                </div>
              </div>

              {/* Grades Table */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-bold text-left border-b border-gray-200">
                      <th className="p-2.5">Subject</th>
                      <th className="p-2.5 text-center">Mid (20)</th>
                      <th className="p-2.5 text-center">Asgn (10)</th>
                      <th className="p-2.5 text-center">Quiz (10)</th>
                      <th className="p-2.5 text-center">Test (20)</th>
                      <th className="p-2.5 text-center">Final (40)</th>
                      <th className="p-2.5 text-center">Total (100)</th>
                      <th className="p-2.5 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {reportCardData?.grades?.map((g) => (
                      <tr key={g.id}>
                        <td className="p-2.5 font-bold text-gray-900">{g.subject}</td>
                        <td className="p-2.5 text-center">{g.mid_mark}</td>
                        <td className="p-2.5 text-center">{g.assignment_mark}</td>
                        <td className="p-2.5 text-center">{g.quiz_mark}</td>
                        <td className="p-2.5 text-center">{g.test_mark}</td>
                        <td className="p-2.5 text-center">{g.final_mark}</td>
                        <td className="p-2.5 text-center font-bold text-gray-900">{g.total_mark}</td>
                        <td className="p-2.5 text-center font-black">{g.letter_grade}</td>
                      </tr>
                    )) || (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-gray-400">Loading subjects...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Score & Seal */}
              {reportCardData?.summary && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200">
                  <div>
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide block">Overall Term Average</span>
                    <span className="text-2xl font-black text-indigo-950 mt-0.5 block">
                      {reportCardData.summary.average_score}%
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide block">Overall Grade</span>
                    <span className="text-2xl font-black text-brand-800 mt-0.5 block">
                      {reportCardData.summary.overall_letter_grade}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-400">Official seal required for external transfer.</span>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                {t('grades.print_card')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
