'use client';

import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation('common');

  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{t('settings.title')}</h1>
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">{t('settings.accountSettings')}</h2>
          <p className="text-sm sm:text-base text-gray-600">{t('settings.managePreferences')}</p>
        </div>
      </div>
    </div>
  );
}
