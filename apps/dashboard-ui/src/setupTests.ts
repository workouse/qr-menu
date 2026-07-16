import '@testing-library/jest-dom';
import { vi } from 'vitest';
import enTranslations from './locales/en.json';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => (enTranslations as Record<string, string>)[key] || key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
}));
