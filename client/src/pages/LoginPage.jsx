import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, Lock, User, AlertCircle, BookOpen, Globe, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { CALENDAR_TYPES } from '../utils/calendar';

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const { calendar, setCalendar } = useSettings();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Quick fill demo helper
  const handleQuickFill = (userType) => {
    const creds = {
      admin: { u: 'admin', p: 'admin123' },
      reception: { u: 'reception', p: 'reception123' },
      teacher: { u: 'teacher_ahmed', p: 'teacher123' },
      cashier: { u: 'cashier', p: 'cashier123' },
      parent: { u: 'parent_fatima', p: 'parent123' },
      student: { u: 'student_bilal', p: 'student123' },
      supporter: { u: 'supporter_zayd', p: 'supporter123' },
    };
    if (creds[userType]) {
      setUsername(creds[userType].u);
      setPassword(creds[userType].p);
      setError('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gray-50 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Top Controls: Language & Calendar Switchers */}
      <div className="absolute top-4 end-4 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs shadow-sm">
          <CalendarIcon className="w-3.5 h-3.5 text-gray-500" />
          <select
            value={calendar}
            onChange={(e) => setCalendar(e.target.value)}
            className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value={CALENDAR_TYPES.ETHIOPIAN}>{t('calendar.ethiopian')}</option>
            <option value={CALENDAR_TYPES.HIJRI}>{t('calendar.hijri')}</option>
            <option value={CALENDAR_TYPES.GREGORIAN}>{t('calendar.gregorian')}</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 text-xs shadow-sm">
          <Globe className="w-3.5 h-3.5 text-gray-500" />
          <select
            value={i18n.language}
            onChange={(e) => i18n.changeLanguage(e.target.value)}
            className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="om">Afaan Oromoo</option>
          </select>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-2">
          <div className="w-14 h-14 rounded-2xl bg-brand-700 text-white flex items-center justify-center shadow-lg shadow-brand-700/20">
            <BookOpen className="w-8 h-8" />
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-gray-900 tracking-tight">
          {t('app.name')}
        </h2>
        <p className="mt-1 text-center text-xs text-gray-600">
          {t('app.sub_title')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-gray-200 rounded-2xl sm:px-10">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900">{t('auth.title')}</h3>
            <p className="text-xs text-gray-500">{t('auth.subtitle')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('auth.username')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-gray-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t('auth.username_placeholder')}
                  className="w-full ps-9 pe-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.password_placeholder')}
                  className="w-full ps-9 pe-10 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-brand-700 hover:bg-brand-800 text-white font-semibold rounded-xl text-sm shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.logging_in') : t('auth.sign_in')}
            </button>
          </form>

          {/* Quick Demo Access Chips for Testing */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wider text-center">
              Quick Fill Test Accounts:
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {[
                { label: 'Admin', key: 'admin' },
                { label: 'Reception', key: 'reception' },
                { label: 'Teacher', key: 'teacher' },
                { label: 'Cashier', key: 'cashier' },
                { label: 'Parent', key: 'parent' },
                { label: 'Student', key: 'student' },
                { label: 'Supporter', key: 'supporter' },
              ].map((role) => (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => handleQuickFill(role.key)}
                  className="px-2 py-1 text-[11px] font-medium bg-gray-100 hover:bg-brand-100 hover:text-brand-800 text-gray-700 rounded-lg transition"
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
