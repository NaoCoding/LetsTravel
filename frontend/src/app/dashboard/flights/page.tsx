'use client';

import { useTranslation } from 'i18next/react';

export default function FlightsPage() {
  const { t } = useTranslation('common');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('flights.title')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">{t('flights.subtitle')}</p>
      </div>
    </div>
  );
}
