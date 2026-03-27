'use client';

import { useTranslation } from 'react-i18next';

export default function BookingsPage() {
  const { t } = useTranslation('common');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('bookings.title')}</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-600">{t('bookings.subtitle')}</p>
      </div>
    </div>
  );
}
