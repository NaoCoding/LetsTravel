'use client';

import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
  const { t } = useTranslation('common');

  return (
    <div className="w-full">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">{t('dashboard.welcome')}</h1>
      <p className="text-sm sm:text-base text-gray-600">{t('dashboard.comingSoon')}</p>
    </div>
  );
}
