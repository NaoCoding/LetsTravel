'use client';

import { useTranslation } from 'i18next/react';

export default function SettingsPage() {
  const { t } = useTranslation('common');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('settings.title')}</h1>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{t('settings.accountSettings')}</h2>
          <p className="text-gray-600">{t('settings.managePreferences')}</p>
        </div>
      </div>
    </div>
  );
}
