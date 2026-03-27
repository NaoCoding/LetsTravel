'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'i18next/react';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from '@/public/locales/en/common.json';
import zhTW from '@/public/locales/zh-TW/common.json';

// Initialize i18next
if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      fallbackLng: 'en',
      supportedLngs: ['en', 'zh-TW'],
      resources: {
        en: { common: en },
        'zh-TW': { common: zhTW },
      },
      ns: ['common'],
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
    });
}

interface I18nContextType {
  currentLanguage: string;
  changeLanguage: (lang: string) => Promise<void>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Set initial language and mark as initialized
    setCurrentLanguage(i18n.language || 'en');
    setIsInitialized(true);
  }, []);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    setCurrentLanguage(lang);
  };

  if (!isInitialized) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider value={{ currentLanguage, changeLanguage }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
