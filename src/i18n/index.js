import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { resources } from './translations';

// Get saved language preference from localStorage
const savedLanguage = localStorage.getItem('language');
const systemLanguage = navigator.language.split('-')[0];

// Check if the detected system language is supported
const isSupportedSystemLanguage = Object.keys(resources).some(
  langCode => langCode === systemLanguage || langCode.startsWith(systemLanguage + '_')
);

// Use saved language, or system language if supported, or fall back to English
let fallbackLanguage = 'en';
if (savedLanguage === 'system') {
  fallbackLanguage = isSupportedSystemLanguage ? systemLanguage : 'en';
} else if (savedLanguage && resources[savedLanguage]) {
  fallbackLanguage = savedLanguage;
} else if (isSupportedSystemLanguage) {
  fallbackLanguage = systemLanguage;
}

// Special handling for Traditional Chinese based on region
if (systemLanguage === 'zh' && navigator.language.includes('TW')) {
  fallbackLanguage = 'zh_TW';
}

i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    resources,
    lng: fallbackLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'language',
      caches: ['localStorage']
    }
  });

// Function to change language
export const changeLanguage = (langCode) => {
  // If "system" is selected, determine the appropriate language
  if (langCode === 'system') {
    const systemLang = navigator.language.split('-')[0];
    const isSupportedLang = Object.keys(resources).some(
      code => code === systemLang || code.startsWith(systemLang + '_')
    );
    
    // Special handling for Traditional Chinese based on region
    if (systemLang === 'zh' && navigator.language.includes('TW')) {
      i18n.changeLanguage('zh_TW');
    } else {
      i18n.changeLanguage(isSupportedLang ? systemLang : 'en');
    }
    
    // Save the preference as "system"
    localStorage.setItem('language', 'system');
  } else {
    // Change to the selected language
    i18n.changeLanguage(langCode);
    // Save the preference
    localStorage.setItem('language', langCode);
  }
};

export default i18n; 