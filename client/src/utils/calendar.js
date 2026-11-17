/**
 * Calendar Conversion & Formatting Utilities
 * Standard: Dates are stored once in Gregorian (YYYY-MM-DD).
 * Conversion happens only when displaying or reading a date based on user's calendar choice:
 * - 'gregorian'
 * - 'ethiopian'
 * - 'hijri'
 */

export const CALENDAR_TYPES = {
  GREGORIAN: 'gregorian',
  ETHIOPIAN: 'ethiopian',
  HIJRI: 'hijri',
};

const ETHIOPIAN_MONTHS = {
  en: ['Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yakatit', 'Magabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'],
  om: ['Fuulbaana', 'Onkololeessa', 'Sadaasa', 'Muddee', 'Amajjii', 'Guraandhala', 'Bitootessa', 'Ebla', 'Caamsaa', 'Waxabajjii', 'Adooleessa', 'Hagayya', 'Qaammee'],
  ar: ['مسكرم', 'تقمت', 'هيدار', 'تاحساس', 'تير', 'يكاتيت', 'مغابيت', 'ميازيا', 'جنبوت', 'سيني', 'هملي', 'نحاسي', 'باجومي'],
};

/**
 * Format a standard ISO/Gregorian date string or Date object into the chosen calendar representation
 * @param {string|Date} dateInput - 'YYYY-MM-DD' or Date
 * @param {string} calendarType - 'gregorian' | 'ethiopian' | 'hijri'
 * @param {string} locale - 'en' | 'ar' | 'om'
 * @returns {string} Formatted date label
 */
export const formatDate = (dateInput, calendarType = 'gregorian', locale = 'en') => {
  if (!dateInput) return '';

  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  try {
    if (calendarType === CALENDAR_TYPES.ETHIOPIAN) {
      // Use Intl ethiopic calendar
      const ethiopicFormatter = new Intl.DateTimeFormat(`${locale === 'ar' ? 'ar' : 'en'}-u-ca-ethiopic`, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });
      const parts = ethiopicFormatter.formatToParts(date);
      const day = parts.find((p) => p.type === 'day')?.value || '';
      const monthIndex = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10) - 1;
      const year = parts.find((p) => p.type === 'year')?.value || '';

      const monthName =
        ETHIOPIAN_MONTHS[locale]?.[monthIndex] ||
        ETHIOPIAN_MONTHS.en[monthIndex] ||
        `Month ${monthIndex + 1}`;

      return `${day} ${monthName} ${year}`;
    }

    if (calendarType === CALENDAR_TYPES.HIJRI) {
      // Use Intl Islamic calendar
      const intlLocale = locale === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-US-u-ca-islamic-umalqura';
      const hijriFormatter = new Intl.DateTimeFormat(intlLocale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      return hijriFormatter.format(date);
    }

    // Default: Gregorian
    const gregLocale = locale === 'ar' ? 'ar-EG' : 'en-GB';
    return new Intl.DateTimeFormat(gregLocale, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch (err) {
    console.error('Error formatting date:', err);
    return date.toISOString().split('T')[0];
  }
};

/**
 * Get current date in standard Gregorian format (YYYY-MM-DD)
 */
export const getTodayGregorian = () => {
  return new Date().toISOString().split('T')[0];
};
