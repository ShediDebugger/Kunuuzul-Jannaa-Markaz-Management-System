import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Save, CheckCircle, AlertCircle, Calendar, Globe, Building } from 'lucide-react';
import api from '../services/api';
import { useSettings } from '../context/SettingsContext';
import { CALENDAR_TYPES } from '../utils/calendar';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { calendar, setCalendar, refreshSettings } = useSettings();

  const [schoolName, setSchoolName] = useState('Kunuuzul-Jannaa-Markaz');
  const [contactPhone, setContactPhone] = useState('+251911234567');
  const [address, setAddress] = useState('Addis Ababa, Ethiopia');
  const [currentYear, setCurrentYear] = useState('2026-2027');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.settings.get();
        const map = res.data?.map || {};
        if (map.school_name) setSchoolName(map.school_name);
        if (map.phone_contact) setContactPhone(map.phone_contact);
        if (map.address) setAddress(map.address);
        if (map.current_academic_year) setCurrentYear(map.current_academic_year);
      } catch (err) {
        // Fallback to defaults
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');
    setLoading(true);

    try {
      await api.settings.update({
        school_name: schoolName,
        phone_contact: contactPhone,
        address,
        current_academic_year: currentYear,
      });
      await refreshSettings();
      setSuccess(t('settings.save_success'));
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('settings.title')}</h2>
        <p className="text-xs sm:text-sm text-gray-500">{t('settings.subtitle')}</p>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Institution Profile */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 font-bold text-sm text-gray-900">
            <Building className="w-4 h-4 text-brand-700" />
            <span>Institution Information</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('settings.school_name')}
              </label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('settings.contact_phone')}
              </label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('settings.address')}
              </label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Current Academic Year
              </label>
              <input
                type="text"
                required
                value={currentYear}
                onChange={(e) => setCurrentYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Display & Localization Preferences */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-100 font-bold text-sm text-gray-900">
            <Globe className="w-4 h-4 text-brand-700" />
            <span>Localization & Display Defaults</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('settings.default_calendar')}
              </label>
              <select
                value={calendar}
                onChange={(e) => setCalendar(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value={CALENDAR_TYPES.ETHIOPIAN}>{t('calendar.ethiopian')}</option>
                <option value={CALENDAR_TYPES.HIJRI}>{t('calendar.hijri')}</option>
                <option value={CALENDAR_TYPES.GREGORIAN}>{t('calendar.gregorian')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {t('settings.default_language')}
              </label>
              <select
                value={i18n.language}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                <option value="en">English</option>
                <option value="ar">العربية (Arabic - RTL)</option>
                <option value="om">Afaan Oromoo</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-700 hover:bg-brand-800 text-white rounded-xl text-sm font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? t('common.loading') : t('common.save')}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
