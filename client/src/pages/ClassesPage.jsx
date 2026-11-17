import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Layers,
  ArrowRight,
  Plus,
  Users,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ClassesPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();

  const [levels, setLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal for new section
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [levelsRes, sectionsRes, sessionsRes, yearsRes] = await Promise.all([
        api.academics.getLevels(),
        api.academics.getSections(),
        api.academics.getSessions(),
        api.academics.getAcademicYears(),
      ]);
      setLevels(levelsRes.data);
      setSections(sectionsRes.data);
      setSessions(sessionsRes.data);
      setAcademicYears(yearsRes.data);

      if (levelsRes.data.length > 0) setSelectedLevelId(levelsRes.data[0].id);
      if (sessionsRes.data.length > 0) setSelectedSessionId(sessionsRes.data[0].id);
      const currentYear = yearsRes.data.find((y) => y.is_current) || yearsRes.data[0];
      if (currentYear) setSelectedYearId(currentYear.id);
    } catch (err) {
      setError(err.message || 'Failed to load academic data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSection = async (e) => {
    e.preventDefault();
    setModalError('');
    try {
      await api.academics.createSection({
        name: newSectionName,
        level_id: Number(selectedLevelId),
        session_id: Number(selectedSessionId),
        academic_year_id: Number(selectedYearId),
      });
      setIsSectionModalOpen(false);
      setNewSectionName('');
      setSuccess('Section added successfully');
      fetchData();
    } catch (err) {
      setModalError(err.message || 'Failed to create section');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('classes.title')}</h2>
          <p className="text-xs sm:text-sm text-gray-500">{t('classes.subtitle')}</p>
        </div>
        {hasRole('admin') && (
          <button
            onClick={() => {
              setModalError('');
              setIsSectionModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('classes.add_section')}</span>
          </button>
        )}
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess('')}><X className="w-4 h-4 text-emerald-500" /></button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')}><X className="w-4 h-4 text-red-500" /></button>
        </div>
      )}

      {/* Official Markaz Level Progression Path Visualization */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-2 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-700" />
          <span>{t('classes.level_path_title')}</span>
        </h3>
        <p className="text-xs text-gray-500 mb-6">
          Level path stored in data: H-01 $\rightarrow$ H-02 $\rightarrow$ QT-03 (co-ed). After QT-03, boys transition to QT-04 and girls to QT-05, then to QH-06 (boys) and QH-07 (girls).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Track 1: Huruufa */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
            <div className="font-bold text-emerald-900 uppercase tracking-wider text-[11px] mb-2">
              Track 1: Huruufa
            </div>
            <div className="space-y-2">
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                <span className="font-bold text-gray-800">H-01 (Introductory)</span>
                <span className="text-[11px] text-emerald-700 font-medium">Co-ed</span>
              </div>
              <div className="flex justify-center text-emerald-600">↓</div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between">
                <span className="font-bold text-gray-800">H-02 (Foundation)</span>
                <span className="text-[11px] text-emerald-700 font-medium">Co-ed</span>
              </div>
            </div>
          </div>

          {/* Track 2: Qurana Tilaawa */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
            <div className="font-bold text-blue-900 uppercase tracking-wider text-[11px] mb-2">
              Track 2: Qurana Tilaawa
            </div>
            <div className="space-y-2">
              <div className="bg-white p-2.5 rounded-lg border border-blue-100 flex items-center justify-between">
                <span className="font-bold text-gray-800">QT-03 (Recitation)</span>
                <span className="text-[11px] text-blue-700 font-medium">Co-ed</span>
              </div>
              <div className="flex justify-center text-blue-600">↓ (Splits by sex)</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2 rounded-lg border border-blue-100 text-center">
                  <div className="font-bold text-gray-800">QT-04</div>
                  <div className="text-[10px] text-blue-700">Boys</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-blue-100 text-center">
                  <div className="font-bold text-gray-800">QT-05</div>
                  <div className="text-[10px] text-pink-700">Girls</div>
                </div>
              </div>
            </div>
          </div>

          {/* Track 3: Qurana Hifzi */}
          <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4">
            <div className="font-bold text-purple-900 uppercase tracking-wider text-[11px] mb-2">
              Track 3: Qurana Hifzi
            </div>
            <div className="space-y-2 pt-6">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white p-2.5 rounded-lg border border-purple-100 text-center">
                  <div className="font-bold text-gray-800">QH-06</div>
                  <div className="text-[10px] text-blue-700">Hifzi (Boys)</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-purple-100 text-center">
                  <div className="font-bold text-gray-800">QH-07</div>
                  <div className="text-[10px] text-pink-700">Hifzi (Girls)</div>
                </div>
              </div>
              <div className="text-[11px] text-purple-700 text-center pt-2 font-medium">
                Full Memorization Track
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Levels & Sections List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Levels Detail Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 font-bold text-sm text-gray-900">
            Registered Levels & Progression Data
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-start">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[11px] font-bold">
                <tr>
                  <th className="px-4 py-3 text-start">{t('classes.code')}</th>
                  <th className="px-4 py-3 text-start">{t('classes.name')}</th>
                  <th className="px-4 py-3 text-start">{t('classes.track')}</th>
                  <th className="px-4 py-3 text-start">{t('classes.next_male')}</th>
                  <th className="px-4 py-3 text-start">{t('classes.next_female')}</th>
                  <th className="px-4 py-3 text-end">{t('classes.students_count')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {levels.map((lvl) => (
                  <tr key={lvl.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-bold text-brand-800">{lvl.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{lvl.name}</td>
                    <td className="px-4 py-3 text-gray-600">{lvl.track}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {lvl.next_level_male_code ? (
                        <span className="font-semibold text-blue-700">{lvl.next_level_male_code}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {lvl.next_level_female_code ? (
                        <span className="font-semibold text-pink-700">{lvl.next_level_female_code}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-end font-bold text-gray-900">
                      {lvl.active_students_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sections and Sessions Panel */}
        <div className="space-y-6">
          {/* Active Sections */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 font-bold text-sm text-gray-900">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-700" />
                <span>Active Sections ({sections.length})</span>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pe-1">
              {sections.map((sec) => (
                <div
                  key={sec.id}
                  className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-800">{sec.level_code} - {sec.name}</span>
                    <div className="text-[11px] text-gray-500">{sec.session_name}</div>
                  </div>
                  <span className="px-2 py-1 rounded-full bg-brand-50 text-brand-800 font-bold text-[11px]">
                    {sec.student_count} students
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3 font-bold text-sm text-gray-900">
              <Clock className="w-4 h-4 text-brand-700" />
              <span>Markaz Study Sessions</span>
            </div>
            <div className="space-y-2 text-xs">
              {sessions.map((ses) => (
                <div
                  key={ses.id}
                  className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between"
                >
                  <span className="font-semibold text-gray-800">{ses.name}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                    ses.is_boarding ? 'bg-purple-100 text-purple-800' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {ses.is_boarding ? 'Boarding (Sleeps at school)' : 'Day Shift'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Section Modal */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">{t('classes.add_section')}</h3>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSection} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Section Name (e.g., Section A, Boys Dorm B)
                </label>
                <input
                  type="text"
                  required
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Level
                </label>
                <select
                  value={selectedLevelId}
                  onChange={(e) => setSelectedLevelId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  {levels.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.code} - {lvl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Session
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  {sessions.map((ses) => (
                    <option key={ses.id} value={ses.id}>
                      {ses.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Academic Year
                </label>
                <select
                  value={selectedYearId}
                  onChange={(e) => setSelectedYearId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} {ay.is_current ? '(Current)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
