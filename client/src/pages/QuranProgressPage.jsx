import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen,
  Plus,
  BookmarkCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  FileText,
  Clock,
  Compass,
  MapPin,
  TrendingUp,
  X,
  Search,
} from 'lucide-react';
import { api } from '../services/api';
import { useSettings } from '../context/SettingsContext';

const QURAN_SURAHS = [
  'Al-Faatiha', 'Al-Baqarah', 'Aal-Imran', 'An-Nisa', 'Al-Maaida', 'Al-An\'aam', 'Al-A\'raaf', 'Al-Anfaal',
  'At-Tawba', 'Yunus', 'Hud', 'Yusuf', 'Ar-Ra\'d', 'Ibrahim', 'Al-Hijr', 'An-Nahl', 'Al-Israa', 'Al-Kahf',
  'Maryam', 'Ta-Ha', 'Al-Anbiyaa', 'Al-Hajj', 'Al-Mu\'minoon', 'An-Noor', 'Al-Furqaan', 'Ash-Shu\'araa',
  'An-Naml', 'Al-Qasas', 'Al-Ankaboot', 'Ar-Room', 'Luqman', 'As-Sajda', 'Al-Ahzaab', 'Saba', 'Faatir',
  'Ya-Seen', 'As-Saaffaat', 'Saad', 'Az-Zumar', 'Ghafir', 'Fussilat', 'Ash-Shoora', 'Az-Zukhruf', 'Ad-Dukhan',
  'Al-Jaathiya', 'Al-Ahqaaf', 'Muhammad', 'Al-Fath', 'Al-Hujuraat', 'Qaaf', 'Adh-Dhaariyaat', 'At-Toor',
  'An-Najm', 'Al-Qamar', 'Ar-Rahmaan', 'Al-Waaqia', 'Al-Hadeed', 'Al-Mujaadila', 'Al-Hashr', 'Al-Mumtahana',
  'As-Saff', 'Al-Jumu\'a', 'Al-Munaafiqoon', 'At-Taghaabun', 'At-Talaaq', 'At-Tahreem', 'Al-Mulk', 'Al-Qalam',
  'Al-Haaqqa', 'Al-Ma\'aarij', 'Nooh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddaththir', 'Al-Qiyaama', 'Al-Insaan',
  'Al-Mursalaat', 'An-Naba', 'An-Naazi\'aat', 'Abasa', 'At-Takweer', 'Al-Infitaar', 'Al-Mutaffifeen',
  'Al-Inshiqaaq', 'Al-Burooj', 'At-Taariq', 'Al-A\'laa', 'Al-Ghaashiya', 'Al-Fajr', 'Al-Balad', 'Ash-Shams',
  'Al-Layl', 'Ad-Duhaa', 'Ash-Sharh', 'At-Teen', 'Al-Alaq', 'Al-Qadr', 'Al-Bayyina', 'Az-Zalzala',
  'Al-Aadiyaat', 'Al-Qaari\'a', 'At-Takaathur', 'Al-Asr', 'Al-Humaza', 'Al-Feel', 'Quraysh', 'Al-Maa\'oon',
  'Al-Kawthar', 'Al-Kaafiroon', 'An-Nasr', 'Al-Masad', 'Al-Ikhlaas', 'Al-Falaq', 'An-Naas',
];

const EVALUATIONS = [
  { value: 'Mumtaz', labelKey: 'quran_progress.eval_mumtaz', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { value: 'Jayyid Jiddan', labelKey: 'quran_progress.eval_jayyid_jiddan', color: 'bg-teal-100 text-teal-800 border-teal-300' },
  { value: 'Jayyid', labelKey: 'quran_progress.eval_jayyid', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'Maqbool', labelKey: 'quran_progress.eval_maqbool', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { value: 'Daif', labelKey: 'quran_progress.eval_daif', color: 'bg-rose-100 text-rose-800 border-rose-300' },
];

export default function QuranProgressPage() {
  const { t } = useTranslation();
  const { formatDate } = useSettings();

  const [sections, setSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(1);
  const [studentsProgress, setStudentsProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Recording Progress
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetStudent, setTargetStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    date: new Date().toISOString().split('T')[0],
    type: 'new_memorization',
    page_number: 1,
    surah_name: 'Al-Faatiha',
    ayah_number: 7,
    from_page: 1,
    to_page: 1,
    from_ayah: 1,
    to_ayah: 7,
    evaluation: 'Mumtaz',
    note: '',
  });

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

  // Load section Quran matrix
  const loadSectionProgress = useCallback(async () => {
    if (!selectedSection) return;
    try {
      setLoading(true);
      const res = await api.quranProgress.getSectionProgress(selectedSection);
      setStudentsProgress(res.data.students || []);
    } catch (err) {
      console.error('Failed to load section progress:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedSection]);

  useEffect(() => {
    loadSectionProgress();
  }, [loadSectionProgress]);

  const handleOpenRecordModal = (student = null) => {
    if (student) {
      setTargetStudent(student);
      setFormData({
        student_id: student.id,
        date: new Date().toISOString().split('T')[0],
        type: 'new_memorization',
        page_number: student.current_page || 1,
        surah_name: student.current_surah || 'Al-Baqarah',
        ayah_number: student.current_ayah || 1,
        from_page: student.current_page || 1,
        to_page: student.current_page || 1,
        from_ayah: 1,
        to_ayah: student.current_ayah || 1,
        evaluation: 'Mumtaz',
        note: '',
      });
    } else {
      setTargetStudent(null);
      setFormData({
        student_id: studentsProgress[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        type: 'new_memorization',
        page_number: 1,
        surah_name: 'Al-Baqarah',
        ayah_number: 1,
        from_page: 1,
        to_page: 1,
        from_ayah: 1,
        to_ayah: 1,
        evaluation: 'Mumtaz',
        note: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmitProgress = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.quranProgress.addProgress({
        ...formData,
        student_id: parseInt(formData.student_id, 10),
        page_number: parseInt(formData.page_number, 10),
        ayah_number: parseInt(formData.ayah_number, 10),
        from_page: parseInt(formData.from_page || formData.page_number, 10),
        to_page: parseInt(formData.page_number, 10),
        from_ayah: parseInt(formData.from_ayah || 1, 10),
        to_ayah: parseInt(formData.ayah_number, 10),
      });

      setIsModalOpen(false);
      loadSectionProgress();
    } catch (err) {
      alert(err.message || 'Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner with Islamic-themed styling */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-brand-900 to-emerald-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-72 h-72 opacity-10 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <polygon points="50 0, 100 50, 50 100, 0 50" fill="none" stroke="currentColor" strokeWidth="1" />
            <polygon points="50 15, 85 50, 50 85, 15 50" fill="none" stroke="currentColor" strokeWidth="0.75" />
            <circle cx="50" cy="50" r="18" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 shadow-inner">
              <BookOpen className="w-8 h-8 text-emerald-200" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 mb-1.5">
                <Sparkles className="w-3 h-3" /> Module M8
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t('quran_progress.title')}</h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mt-1 max-w-2xl font-light">
                {t('quran_progress.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenRecordModal()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 bg-amber-500 hover:bg-amber-400 text-gray-950 font-black text-sm shadow-lg shadow-black/20 active:scale-95 transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            {t('quran_progress.record_progress')}
          </button>
        </div>
      </div>

      {/* Control Bar: Section Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-700">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Classroom Section</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(parseInt(e.target.value, 10))}
              className="mt-0.5 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 font-semibold text-gray-800"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} ({sec.level_code})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Compass className="w-4 h-4 text-emerald-600" />
          <span>Tracking standard 604-page Madani Mushaf coordinates</span>
        </div>
      </div>

      {/* Classroom Quran Matrix */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-brand-700" />
            <h2 className="font-bold text-gray-800 text-base">{t('quran_progress.classroom_grid')}</h2>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-800 border border-brand-200">
            {studentsProgress.length} Students
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-500 font-medium">{t('common.loading')}</p>
          </div>
        ) : studentsProgress.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm font-medium">No students enrolled in this section.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200/80 text-left">
                  <th className="px-4 py-3.5 font-bold text-gray-700 w-12">#</th>
                  <th className="px-4 py-3.5 font-bold text-gray-700">{t('students.full_name')}</th>
                  <th className="px-4 py-3.5 font-bold text-gray-700 text-center">Current Juz</th>
                  <th className="px-4 py-3.5 font-bold text-gray-700 text-center">Madani Page</th>
                  <th className="px-4 py-3.5 font-bold text-gray-700">Specific Place Where Stopped</th>
                  <th className="px-4 py-3.5 font-bold text-gray-700 text-center">Last Evaluation</th>
                  <th className="px-4 py-3.5 font-bold text-gray-700 w-28 text-center">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {studentsProgress.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-emerald-50/20 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{student.full_name}</div>
                      <div className="text-[11px] text-gray-400 font-mono">{student.registration_number}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Juz {student.current_juz || 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-amber-50 text-amber-900 border border-amber-200 font-mono">
                        <FileText className="w-3.5 h-3.5 text-amber-600" />
                        Page {student.current_page || 1} / 604
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <span className="font-bold text-gray-800">
                            Surah {student.current_surah || 'Al-Baqarah'}
                          </span>
                          <span className="ms-1.5 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200">
                            Ayah {student.current_ayah || 1}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {student.last_evaluation || 'Mumtaz'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleOpenRecordModal(student)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-800 font-bold text-xs border border-brand-200 transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Record
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Progress Entry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 to-teal-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-lg">{t('quran_progress.record_progress')}</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitProgress} className="p-6 space-y-4">
              {/* Student Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('quran_progress.student')}
                </label>
                <select
                  value={formData.student_id}
                  onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-semibold"
                >
                  {studentsProgress.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.registration_number})
                    </option>
                  ))}
                </select>
              </div>

              {/* Type & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {t('quran_progress.type')}
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium"
                  >
                    <option value="new_memorization">{t('quran_progress.new_memorization')}</option>
                    <option value="revision">{t('quran_progress.revision')}</option>
                    <option value="recitation">{t('quran_progress.recitation')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    {t('quran_progress.date')}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                </div>
              </div>

              {/* Specific Place Details: Page Number & Ayat Number */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-700" />
                  Specific Place Stopped At (Page & Ayah)
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Page Number (1-604) */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t('quran_progress.page_number')} (1 - 604)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="604"
                      value={formData.page_number}
                      onChange={(e) => setFormData({ ...formData, page_number: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-gray-900"
                      required
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">{t('quran_progress.page_help')}</span>
                  </div>

                  {/* Specific Ayat Number */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t('quran_progress.ayah_number')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="286"
                      value={formData.ayah_number}
                      onChange={(e) => setFormData({ ...formData, ayah_number: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-bold text-gray-900"
                      required
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Specific stopped Ayat</span>
                  </div>
                </div>

                {/* Surah Name Selection */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {t('quran_progress.surah_name')}
                  </label>
                  <select
                    value={formData.surah_name}
                    onChange={(e) => setFormData({ ...formData, surah_name: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 font-semibold text-gray-800"
                  >
                    {QURAN_SURAHS.map((surah, idx) => (
                      <option key={surah} value={surah}>
                        {idx + 1}. {surah}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Evaluation */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('quran_progress.evaluation')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {EVALUATIONS.map((ev) => (
                    <button
                      key={ev.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, evaluation: ev.value })}
                      className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        formData.evaluation === ev.value
                          ? `${ev.color} ring-2 ring-brand-500 shadow-sm`
                          : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {t(ev.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Teacher Remarks */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  {t('quran_progress.note')}
                </label>
                <textarea
                  rows="2"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder={t('quran_progress.note_placeholder')}
                  className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 placeholder-gray-400"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold bg-brand-700 hover:bg-brand-800 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
                  {saving ? t('quran_progress.recording') : t('quran_progress.save_progress')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
