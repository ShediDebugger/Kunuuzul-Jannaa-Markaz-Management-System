import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CALENDAR_TYPES, formatDate } from '../utils/calendar';
import api from '../services/api';

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [calendar, setCalendarState] = useState(
    localStorage.getItem('kjm_calendar') || CALENDAR_TYPES.ETHIOPIAN
  );
  const [settings, setSettings] = useState({});

  const setCalendar = (type) => {
    setCalendarState(type);
    localStorage.setItem('kjm_calendar', type);
  };

  const loadSettings = async () => {
    try {
      const res = await api.settings.get();
      if (res.data?.map) {
        setSettings(res.data.map);
      }
    } catch (err) {
      // Unauthenticated or offline: keep defaults
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const formatDateWithPref = (dateInput) => {
    return formatDate(dateInput, calendar, i18n.language);
  };

  return (
    <SettingsContext.Provider
      value={{
        calendar,
        setCalendar,
        formatDateWithPref,
        settings,
        refreshSettings: loadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
