import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ar from './locales/ar.json';
import om from './locales/om.json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  om: { translation: om },
};

const savedLanguage = localStorage.getItem('kjm_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safe from XSS
    },
  });

// Set layout direction based on active language
export const applyLanguageDirection = (lng) => {
  const isRtl = lng === 'ar';
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lng);
  localStorage.setItem('kjm_language', lng);
};

// Initial apply
applyLanguageDirection(savedLanguage);

// Update direction on language change
i18n.on('languageChanged', (lng) => {
  applyLanguageDirection(lng);
});

export default i18n;
