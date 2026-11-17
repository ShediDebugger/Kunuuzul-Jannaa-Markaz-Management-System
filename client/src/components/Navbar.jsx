import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Globe, Calendar as CalendarIcon, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { CALENDAR_TYPES } from '../utils/calendar';

export default function Navbar({ onToggleSidebar }) {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { calendar, setCalendar } = useSettings();

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleCalendarChange = (e) => {
    setCalendar(e.target.value);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-2.5 sm:px-6">
      <div className="flex items-center justify-between gap-2">
        {/* Left Side: Mobile Menu Button & Brand Title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden focus:outline-none"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-brand-800 leading-tight">
              {t('app.name')}
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              {t('app.sub_title')}
            </p>
          </div>
        </div>

        {/* Right Side: Calendar Switcher, Language Switcher, User Badge, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Calendar Switcher */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs">
            <CalendarIcon className="w-3.5 h-3.5 text-gray-500 hidden sm:inline" />
            <select
              value={calendar}
              onChange={handleCalendarChange}
              className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer"
              title={t('calendar.switch_label')}
            >
              <option value={CALENDAR_TYPES.ETHIOPIAN}>{t('calendar.ethiopian')}</option>
              <option value={CALENDAR_TYPES.HIJRI}>{t('calendar.hijri')}</option>
              <option value={CALENDAR_TYPES.GREGORIAN}>{t('calendar.gregorian')}</option>
            </select>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-gray-500 hidden sm:inline" />
            <select
              value={i18n.language}
              onChange={handleLanguageChange}
              className="bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer"
              title={t('languages.switch_label')}
            >
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="om">Afaan Oromoo</option>
            </select>
          </div>

          {/* User Info & Role Badge */}
          {user && (
            <div className="hidden md:flex items-center gap-2 border-s border-gray-200 ps-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-800 flex items-center justify-center font-bold text-xs">
                {user.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="text-start">
                <div className="text-xs font-semibold text-gray-900 leading-none">
                  {user.full_name}
                </div>
                <div className="text-[11px] text-brand-700 font-medium">
                  {t(`roles.${user.role}`)}
                </div>
              </div>
            </div>
          )}

          {/* Logout Button */}
          {user && (
            <button
              onClick={logout}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title={t('auth.logout')}
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span className="hidden sm:inline">{t('auth.logout')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
