import en from './en';
import fr from './fr';
import zh from './zh';
import zh_TW from './zh_TW';

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  zh: { translation: zh },
  zh_TW: { translation: zh_TW }
};

export const supportedLanguages = [
  { code: 'system', name: 'System' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'zh', name: 'Chinese (Simplified)' },
  { code: 'zh_TW', name: 'Chinese (Traditional)' }
]; 