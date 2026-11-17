import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  GraduationCap,
  Layers,
  CalendarCheck,
  CreditCard,
  BookOpen,
  Award,
  TrendingUp,
  HeartHandshake,
  BarChart3,
  Settings,
  ShieldAlert,
  FileSpreadsheet,
  ScrollText,
  HardDrive,
  Compass,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { user } = useAuth();

  if (!user) return null;

  // Determine authorized menu items based on user role
  const menuItems = [
    {
      to: '/dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      roles: ['admin', 'reception', 'teacher', 'cashier', 'parent', 'student', 'supporter'],
    },
    {
      to: '/portal',
      label: t('nav.portal'),
      icon: Compass,
      roles: ['parent', 'student', 'admin'],
    },
    {
      to: '/students',
      label: t('nav.students'),
      icon: GraduationCap,
      roles: ['admin', 'reception', 'parent', 'student'],
    },
    {
      to: '/guardians',
      label: t('nav.guardians'),
      icon: Users,
      roles: ['admin', 'reception'],
    },
    {
      to: '/classes',
      label: t('nav.classes'),
      icon: Layers,
      roles: ['admin', 'reception'],
    },
    {
      to: '/teachers',
      label: t('nav.teachers'),
      icon: UserCheck,
      roles: ['admin'],
    },
    {
      to: '/attendance',
      label: t('nav.attendance'),
      icon: CalendarCheck,
      roles: ['admin', 'teacher', 'parent', 'student', 'reception'],
    },
    {
      to: '/fees',
      label: t('nav.fees'),
      icon: CreditCard,
      roles: ['admin', 'cashier', 'parent'],
    },
    {
      to: '/quran-progress',
      label: t('nav.quran_progress'),
      icon: BookOpen,
      roles: ['admin', 'teacher', 'parent', 'student', 'reception'],
    },
    {
      to: '/grades',
      label: t('nav.grades'),
      icon: Award,
      roles: ['admin', 'teacher', 'parent', 'student', 'reception'],
    },
    {
      to: '/promotions',
      label: t('nav.promotions'),
      icon: TrendingUp,
      roles: ['admin'],
    },
    {
      to: '/supporters',
      label: t('nav.supporters'),
      icon: HeartHandshake,
      roles: ['admin', 'supporter'],
    },
    {
      to: '/reports',
      label: t('nav.reports'),
      icon: BarChart3,
      roles: ['admin', 'supporter'],
    },
    {
      to: '/users',
      label: t('nav.users'),
      icon: Users,
      roles: ['admin'],
    },
    {
      to: '/settings',
      label: t('nav.settings'),
      icon: Settings,
      roles: ['admin'],
    },
    {
      to: '/migration',
      label: t('nav.migration'),
      icon: FileSpreadsheet,
      roles: ['admin'],
    },
    {
      to: '/audit-logs',
      label: t('nav.audit_logs'),
      icon: ScrollText,
      roles: ['admin'],
    },
    {
      to: '/backup',
      label: t('nav.backup'),
      icon: HardDrive,
      roles: ['admin'],
    },
  ];

  const filteredItems = menuItems.filter((item) => item.roles.includes(user.role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 w-64 bg-white border-e border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full lg:rtl:translate-x-0'
        }`}
      >
        {/* Header / Close on mobile */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 lg:hidden">
          <span className="font-bold text-brand-800 text-sm">{t('app.name')}</span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-800 font-semibold shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0 text-brand-700" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-gray-200 text-xs text-gray-400 text-center">
          {t('app.version')} • {t('app.name')}
        </div>
      </aside>
    </>
  );
}
