'use client';

import { useTranslation } from 'react-i18next';

export default function FlightsPage() {
  const { t } = useTranslation('common');

  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{t('flights.title')}</h1>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
        <p className="text-sm sm:text-base text-gray-600">{t('flights.subtitle')}</p>
      </div>
    </div>
  );
}
