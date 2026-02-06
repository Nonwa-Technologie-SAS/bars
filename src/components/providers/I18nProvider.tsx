'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { type Locale, translate } from '@/shared/i18n';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'bars_locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr');

  // Charger la langue depuis le localStorage au montage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (
      stored === 'fr' ||
      stored === 'en' ||
      stored === 'lb' ||
      stored === 'ar' ||
      stored === 'zh'
    ) {
      setLocaleState(stored);
    }
  }, []);

  // Synchroniser <html lang> et le localStorage lorsqu'on change de langue
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Map locale to proper HTML lang and direction
      let htmlLang = 'fr';
      let dir: 'ltr' | 'rtl' = 'ltr';

      if (locale === 'fr') htmlLang = 'fr';
      else if (locale === 'en') htmlLang = 'en';
      else if (locale === 'lb' || locale === 'ar') {
        htmlLang = 'ar';
        dir = 'rtl';
      } else if (locale === 'zh') {
        htmlLang = 'zh-CN';
      }

      document.documentElement.lang = htmlLang;
      document.documentElement.dir = dir;
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale);
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const value: I18nContextValue = useMemo(
    () => ({
      locale,
      setLocale,
      t: (key: string) => translate(locale, key),
    }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}

