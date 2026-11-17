import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GraduationCap,
  UserPlus,
  Search,
  Filter,
  Phone,
  BookOpen,
  History,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Edit,
  ShieldAlert,
  UserCheck,
  Eye,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function StudentsPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const { formatDateWithPref } = useSettings();

  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown reference data
  const [levels, setLevels] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [guardians, setGuardians] = useState([]);

  // Filters
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');

  // Modals & Panels
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Registration & Edit Form State
  const [formId, setFormId] = useState(null);
  const [fullName, setFullName] = useState('');
  const [sex, setSex] = useState('male');
  const [dob, setDob] = useState('2015-01-01');
  const [levelId, setLevelId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isBoarding, setIsBoarding] = useState(false);
  const [supportType, setSupportType] = useState('family_dependent');
  const [guardianId, setGuardianId] = useState('');
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');
  const [isNewGuardian, setIsNewGuardian] = useState(false);
  const [kebele, setKebele] = useState('');
  const [specificPlace, setSpecificPlace] = useState('');
  const [currentJuz, setCurrentJuz] = useState(1);
  const [customRegNumber, setCustomRegNumber] = useState('');

  const [formError, setFormError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReferenceData = async () => {
    try {
      const [levelsRes, sectionsRes, sessionsRes, guardiansRes] = await Promise.all([
        api.academics.getLevels(),
        api.academics.getSections(),
        api.academics.getSessions(),
        api.guardians.getAll({ limit: 100 }),
      ]);
      setLevels(levelsRes.data);
      setSections(sectionsRes.data);
      setSessions(sessionsRes.data);
      setGuardians(guardiansRes.data.guardians);

      if (levelsRes.data.length > 0 && !levelId) setLevelId(levelsRes.data[0].id);
      if (sessionsRes.data.length > 0 && !sessionId) setSessionId(sessionsRes.data[0].id);
    } catch (err) {
      console.error('Error fetching reference data:', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.students.getAll({
        search: search || undefined,
        level_id: levelFilter || undefined,
        session_id: sessionFilter || undefined,
        status: statusFilter || undefined,
      });
      setStudents(res.data.students);
      setTotal(res.data.total);
    } catch (err) {
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferenceData();
    fetchStudents();
  }, [levelFilter, sessionFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const resetForm = () => {
    setFormId(null);
    setFullName('');
    setSex('male');
    setDob('2015-01-01');
    setLevelId(levels[0]?.id || '');
    setSectionId('');
    setSessionId(sessions[0]?.id || '');
    setIsBoarding(false);
    setSupportType('family_dependent');
    setGuardianId(guardians[0]?.id || '');
    setNewGuardianName('');
    setNewGuardianPhone('');
    setIsNewGuardian(false);
    setKebele('');
    setSpecificPlace('');
    setCurrentJuz(1);
    setCustomRegNumber('');
    setFormError('');
    setDuplicateWarning(null);
  };

  const handleOpenRegister = () => {
    resetForm();
    setIsRegisterOpen(true);
  };

  const handleOpenEdit = (student) => {
    setFormId(student.id);
    setFullName(student.full_name);
    setSex(student.sex);
    setDob(student.date_of_birth.split('T')[0]);
    setLevelId(student.level_id);
    setSectionId(student.section_id || '');
    setSessionId(student.session_id);
    setIsBoarding(Boolean(student.is_boarding));
    setSupportType(student.support_type);
    setGuardianId(student.guardian_id);
    setIsNewGuardian(false);
    setKebele(student.kebele || '');
    setSpecificPlace(student.specific_place || '');
    setCurrentJuz(student.current_juz || 1);
    setCustomRegNumber(student.registration_number);
    setFormError('');
    setDuplicateWarning(null);
    setIsEditOpen(true);
  };

  const handleOpenProfile = async (student) => {
    try {
      const res = await api.students.getById(student.id);
      setSelectedStudent(res.data);
      setIsProfileOpen(true);
    } catch (err) {
      setError(err.message || 'Failed to fetch student details');
    }
  };

  // Check for duplicate on registration
  const handleCheckDuplicateAndSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      // Find guardian phone
      let checkPhone = '';
      if (isNewGuardian) {
        checkPhone = newGuardianPhone;
      } else {
        const selectedG = guardians.find((g) => g.id === Number(guardianId));
        checkPhone = selectedG?.primary_phone || '';
      }

      // Check duplicates
      if (!duplicateWarning && checkPhone) {
        const dupCheck = await api.students.checkDuplicate({
          full_name: fullName,
          date_of_birth: dob,
          guardian_phone: checkPhone,
        });

        if (dupCheck.data.isDuplicate) {
          setDuplicateWarning(dupCheck.data.duplicate);
          setIsSubmitting(false);
          return; // Pause to let user review the warning
        }
      }

      // Proceed with registration
      const payload = {
        full_name: fullName,
        sex,
        date_of_birth: dob,
        level_id: Number(levelId),
        section_id: sectionId ? Number(sectionId) : null,
        session_id: Number(sessionId),
        is_boarding: isBoarding,
        support_type: supportType,
        kebele,
        specific_place: specificPlace,
        current_juz: Number(currentJuz),
        custom_reg_number: customRegNumber || undefined,
      };

      if (isNewGuardian) {
        payload.guardian_data = {
          full_name: newGuardianName,
          primary_phone: newGuardianPhone,
        };
      } else {
        payload.guardian_id = Number(guardianId);
      }

      await api.students.register(payload);
      setIsRegisterOpen(false);
      setSuccess('Student successfully registered!');
      fetchStudents();
      fetchReferenceData();
    } catch (err) {
      setFormError(err.message || 'Failed to register student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      await api.students.update(formId, {
        full_name: fullName,
        sex,
        date_of_birth: dob,
        level_id: Number(levelId),
        section_id: sectionId ? Number(sectionId) : null,
        session_id: Number(sessionId),
        is_boarding: isBoarding,
        support_type: supportType,
        guardian_id: Number(guardianId),
        kebele,
        specific_place: specificPlace,
        current_juz: Number(currentJuz),
      });

      setIsEditOpen(false);
      setSuccess('Student details updated successfully (audit logged).');
      fetchStudents();
    } catch (err) {
      setFormError(err.message || 'Failed to update student');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (student) => {
    const newStatus = student.status === 'active' ? 'inactive' : 'active';
    try {
      await api.students.toggleStatus(student.id, newStatus);
      setSuccess(`Student marked as ${newStatus}`);
      fetchStudents();
    } catch (err) {
      setError(err.message || 'Failed to toggle student status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('students.title')}</h2>
          <p className="text-xs sm:text-sm text-gray-500">{t('students.subtitle')}</p>
        </div>
        {hasRole('admin', 'reception') && (
          <button
            onClick={handleOpenRegister}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('students.register_student')}</span>
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

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, reg. number, phone, or guardian..."
            className="w-full ps-9 pe-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <Search className="w-4 h-4 absolute start-3 top-2.5 text-gray-400" />
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Level Filter */}
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="">All Levels</option>
            {levels.map((l) => (
              <option key={l.id} value={l.id}>{l.code} ({l.name})</option>
            ))}
          </select>

          {/* Session Filter */}
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="">All Sessions</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">{t('common.active')}</option>
            <option value="inactive">{t('common.inactive')}</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 uppercase text-[11px] font-bold">
              <tr>
                <th className="px-4 py-3 text-start">{t('students.reg_number')}</th>
                <th className="px-4 py-3 text-start">{t('students.full_name')}</th>
                <th className="px-4 py-3 text-start">{t('students.level')} & Section</th>
                <th className="px-4 py-3 text-start">{t('students.session')}</th>
                <th className="px-4 py-3 text-start">{t('students.guardian')}</th>
                <th className="px-4 py-3 text-center">{t('students.current_juz')}</th>
                <th className="px-4 py-3 text-start">{t('common.status')}</th>
                <th className="px-4 py-3 text-end">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    {t('common.no_data')}
                  </td>
                </tr>
              ) : (
                students.map((stu) => (
                  <tr key={stu.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-brand-800 text-xs">
                      {stu.registration_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900">{stu.full_name}</div>
                      <div className="text-[11px] text-gray-500">
                        {stu.sex === 'male' ? t('common.male') : t('common.female')} • {stu.age || 0} yrs
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-800">{stu.level_code}</span>
                      <div className="text-[11px] text-gray-500">{stu.section_name || 'No Section'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-800 font-medium">{stu.session_name}</div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        stu.is_boarding ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {stu.is_boarding ? t('students.boarding') : t('students.day_student')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-900 font-medium">{stu.guardian_name}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{stu.guardian_phone}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
                        Juz {stu.current_juz}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          stu.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {t(`common.${stu.status}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenProfile(stu)}
                          className="p-1.5 text-gray-500 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition"
                          title={t('students.view_profile')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasRole('admin', 'reception') && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(stu)}
                              className="p-1.5 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title={t('common.edit')}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(stu)}
                              className={`p-1.5 rounded-lg transition ${
                                stu.status === 'active'
                                  ? 'text-gray-500 hover:text-amber-700 hover:bg-amber-50'
                                  : 'text-gray-500 hover:text-emerald-700 hover:bg-emerald-50'
                              }`}
                              title={stu.status === 'active' ? t('students.deactivate') : t('students.reactivate')}
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

      {/* Registration Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">{t('students.register_student')}</h3>
                <p className="text-xs text-gray-500">Auto-generates sequential registration number</p>
              </div>
              <button onClick={() => setIsRegisterOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {duplicateWarning && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>{t('students.duplicate_warning')}</span>
                </div>
                <p>
                  Found: <strong>{duplicateWarning.full_name}</strong> ({duplicateWarning.registration_number}) - DOB: {duplicateWarning.date_of_birth?.split('T')[0]}.
                </p>
                <p className="italic">Click "Confirm & Save Anyway" if this is a different student.</p>
              </div>
            )}

            {formError && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCheckDuplicateAndSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.full_name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="First Middle Last"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.sex')} *
                  </label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="male">{t('common.male')}</option>
                    <option value="female">{t('common.female')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.dob')} *
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.level')} *
                  </label>
                  <select
                    value={levelId}
                    onChange={(e) => setLevelId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    {levels.map((lvl) => (
                      <option key={lvl.id} value={lvl.id}>
                        {lvl.code} - {lvl.name} ({lvl.track})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.section')} (Optional)
                  </label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {sections
                      .filter((sec) => !levelId || sec.level_id === Number(levelId))
                      .map((sec) => (
                        <option key={sec.id} value={sec.id}>
                          {sec.name} ({sec.session_name})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.session')} *
                  </label>
                  <select
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
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
                    {t('students.support_type')}
                  </label>
                  <select
                    value={supportType}
                    onChange={(e) => setSupportType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="family_dependent">{t('students.family_dependent')}</option>
                    <option value="independent">{t('students.independent')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.current_juz')} (1 - 30)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={currentJuz}
                    onChange={(e) => setCurrentJuz(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isBoardingCheck"
                    checked={isBoarding}
                    onChange={(e) => setIsBoarding(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                  />
                  <label htmlFor="isBoardingCheck" className="text-xs font-semibold text-gray-700 cursor-pointer">
                    {t('students.boarding')} (Dormitory student)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Custom Reg. No (Optional, for migrated students)
                  </label>
                  <input
                    type="text"
                    value={customRegNumber}
                    onChange={(e) => setCustomRegNumber(e.target.value)}
                    placeholder="Leave blank for auto-number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              {/* Guardian Selection Section */}
              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Guardian Information *
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsNewGuardian(!isNewGuardian)}
                    className="text-xs text-brand-700 hover:underline font-semibold"
                  >
                    {isNewGuardian ? 'Select Existing Guardian' : '+ New Guardian'}
                  </button>
                </div>

                {isNewGuardian ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Guardian Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newGuardianName}
                        onChange={(e) => setNewGuardianName(e.target.value)}
                        placeholder="Parent / Guardian Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">
                        Guardian Primary Phone *
                      </label>
                      <input
                        type="text"
                        required
                        value={newGuardianPhone}
                        onChange={(e) => setNewGuardianPhone(e.target.value)}
                        placeholder="+251911..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                ) : (
                  <select
                    value={guardianId}
                    onChange={(e) => setGuardianId(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="">Select Existing Guardian...</option>
                    {guardians.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.full_name} ({g.primary_phone})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.kebele')}
                  </label>
                  <input
                    type="text"
                    value={kebele}
                    onChange={(e) => setKebele(e.target.value)}
                    placeholder="Kebele / Aanaa"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.specific_place')}
                  </label>
                  <input
                    type="text"
                    value={specificPlace}
                    onChange={(e) => setSpecificPlace(e.target.value)}
                    placeholder="Ganda / Specific location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {duplicateWarning ? 'Confirm & Save Anyway' : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">{t('students.edit_student')}</h3>
                <p className="text-xs text-gray-500 font-mono">{customRegNumber}</p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStudent} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.full_name')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.sex')} *
                  </label>
                  <select
                    value={sex}
                    onChange={(e) => setSex(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="male">{t('common.male')}</option>
                    <option value="female">{t('common.female')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.dob')} *
                  </label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.level')} *
                  </label>
                  <select
                    value={levelId}
                    onChange={(e) => setLevelId(e.target.value)}
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
                    {t('students.section')}
                  </label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.level_code} - {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {t('students.session')} *
                  </label>
                  <select
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
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
                    {t('students.current_juz')}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={currentJuz}
                    onChange={(e) => setCurrentJuz(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Guardian
                  </label>
                  <select
                    value={guardianId}
                    onChange={(e) => setGuardianId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    {guardians.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.full_name} ({g.primary_phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editBoardingCheck"
                  checked={isBoarding}
                  onChange={(e) => setIsBoarding(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
                <label htmlFor="editBoardingCheck" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  {t('students.boarding')}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile & Audit History Modal */}
      {isProfileOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedStudent.full_name}</h3>
                <p className="text-xs text-brand-800 font-mono font-bold">
                  {selectedStudent.registration_number}
                </p>
              </div>
              <button onClick={() => setIsProfileOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-medium">Level & Track</span>
                <div className="font-bold text-gray-900 mt-0.5">
                  {selectedStudent.level_name} ({selectedStudent.level_code})
                </div>
                <div className="text-[11px] text-gray-500">{selectedStudent.track}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-medium">Section & Session</span>
                <div className="font-bold text-gray-900 mt-0.5">
                  {selectedStudent.section_name || 'Unassigned Section'}
                </div>
                <div className="text-[11px] text-gray-500">{selectedStudent.session_name}</div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-medium">Current Juz</span>
                <div className="font-bold text-emerald-800 text-sm mt-0.5">
                  Juz {selectedStudent.current_juz} / 30
                </div>
              </div>

              <div className="p-3 bg-gray-50 rounded-xl">
                <span className="text-gray-400 font-medium">Guardian</span>
                <div className="font-bold text-gray-900 mt-0.5">{selectedStudent.guardian_name}</div>
                <div className="text-[11px] text-gray-500 font-mono">{selectedStudent.guardian_phone}</div>
              </div>
            </div>

            {/* Audit History (Manual M15 requirement) */}
            <div className="mt-2 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2 font-bold text-xs text-gray-800 uppercase tracking-wider mb-2">
                <History className="w-4 h-4 text-gray-500" />
                <span>{t('students.history')}</span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {selectedStudent.audit_history?.map((log, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 rounded-lg text-[11px] border border-gray-100">
                    <div className="flex items-center justify-between text-gray-700 font-semibold">
                      <span>{log.action}</span>
                      <span className="text-gray-400 text-[10px]">
                        {formatDateWithPref(log.created_at)}
                      </span>
                    </div>
                    <div className="text-gray-500 text-[10px] mt-0.5">
                      By: {log.actor_name || log.username || 'System'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
