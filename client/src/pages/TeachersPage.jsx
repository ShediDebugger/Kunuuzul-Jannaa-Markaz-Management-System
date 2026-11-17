import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserCheck,
  UserPlus,
  Phone,
  Layers,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  Edit,
  ShieldAlert,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TeachersPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();

  const [teachers, setTeachers] = useState([]);
  const [sections, setSections] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [assignedSectionIds, setAssignedSectionIds] = useState([]);

  // Form states
  const [fullName, setFullName] = useState('');
  const [sex, setSex] = useState('male');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [teachersRes, sectionsRes] = await Promise.all([
        api.teachers.getAll({ search: search || undefined }),
        api.academics.getSections(),
      ]);
      setTeachers(teachersRes.data.teachers);
      setTotal(teachersRes.data.total);
      setSections(sectionsRes.data);
    } catch (err) {
      setError(err.message || 'Failed to load teachers data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.teachers.create({
        full_name: fullName,
        sex,
        phone,
      });
      setIsCreateOpen(false);
      setFullName('');
      setPhone('');
      setSuccess('Teacher registered successfully');
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to register teacher');
    }
  };

  const handleOpenAssignModal = (teacher) => {
    setSelectedTeacher(teacher);
    setAssignedSectionIds(teacher.sections?.map((s) => s.id) || []);
    setFormError('');
    setIsAssignOpen(true);
  };

  const handleToggleSectionCheckbox = (sectionId) => {
    if (assignedSectionIds.includes(sectionId)) {
      setAssignedSectionIds(assignedSectionIds.filter((id) => id !== sectionId));
    } else {
      setAssignedSectionIds([...assignedSectionIds, sectionId]);
    }
  };

  const handleSaveAssignments = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await api.teachers.assignSections(selectedTeacher.id, assignedSectionIds);
      setIsAssignOpen(false);
      setSuccess('Teacher sections updated successfully');
      fetchData();
    } catch (err) {
      setFormError(err.message || 'Failed to update section assignments');
    }
  };

  const handleToggleStatus = async (teacher) => {
    const newStatus = teacher.status === 'active' ? 'inactive' : 'active';
    try {
      await api.teachers.update(teacher.id, {
        full_name: teacher.full_name,
        sex: teacher.sex,
        phone: teacher.phone,
        status: newStatus,
      });
      setSuccess(`Teacher status updated to ${newStatus}`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update teacher status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('teachers.title')}</h2>
          <p className="text-xs sm:text-sm text-gray-500">{t('teachers.subtitle')}</p>
        </div>
        {hasRole('admin') && (
          <button
            onClick={() => {
              setFormError('');
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('teachers.add_teacher')}</span>
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

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by teacher name or phone..."
            className="w-full ps-9 pe-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Search className="w-4 h-4 absolute start-3 top-2.5 text-gray-400" />
        </form>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[11px] font-bold">
              <tr>
                <th className="px-4 py-3 text-start">{t('teachers.full_name')}</th>
                <th className="px-4 py-3 text-start">{t('teachers.phone')}</th>
                <th className="px-4 py-3 text-start">{t('common.status')}</th>
                <th className="px-4 py-3 text-start">{t('teachers.assigned_sections')}</th>
                <th className="px-4 py-3 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    {t('common.no_data')}
                  </td>
                </tr>
              ) : (
                teachers.map((tch) => (
                  <tr key={tch.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{tch.full_name}</div>
                      <div className="text-[11px] text-gray-500 capitalize">{tch.sex}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{tch.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          tch.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {t(`common.${tch.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {tch.sections && tch.sections.length > 0 ? (
                          tch.sections.map((s) => (
                            <span
                              key={s.id}
                              className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-800 border border-brand-200 text-[11px] font-medium"
                            >
                              {s.level_code} - {s.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs italic">
                            {t('teachers.no_sections')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="inline-flex items-center gap-2">
                        {hasRole('admin') && (
                          <>
                            <button
                              onClick={() => handleOpenAssignModal(tch)}
                              className="p-1.5 text-gray-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition"
                              title={t('teachers.assign_sections')}
                            >
                              <Layers className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(tch)}
                              className="p-1.5 text-gray-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                              title="Toggle Status"
                            >
                              <ShieldAlert className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">{t('teachers.add_teacher')}</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('teachers.full_name')}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ustaz Ahmed Nur"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Sex
                </label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                >
                  <option value="male">{t('common.male')}</option>
                  <option value="female">{t('common.female')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {t('teachers.phone')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="+251911..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
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

      {/* Assign Sections Modal */}
      {isAssignOpen && selectedTeacher && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">{t('teachers.assign_sections')}</h3>
                <p className="text-xs text-gray-500">{selectedTeacher.full_name}</p>
              </div>
              <button onClick={() => setIsAssignOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAssignments} className="space-y-4 mt-4">
              <div className="text-xs font-semibold text-gray-700">
                Select sections this teacher teaches:
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-xl p-3">
                {sections.map((sec) => {
                  const isChecked = assignedSectionIds.includes(sec.id);
                  return (
                    <label
                      key={sec.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs border ${
                        isChecked
                          ? 'bg-brand-50 border-brand-200 text-brand-900 font-semibold'
                          : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>
                        {sec.level_code} - {sec.name} ({sec.session_name})
                      </span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSectionCheckbox(sec.id)}
                        className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4 cursor-pointer"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
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
