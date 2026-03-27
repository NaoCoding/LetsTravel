'use client';

import { useTranslation } from 'i18next/react';

export default function DashboardPage() {
  const { t } = useTranslation('common');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{t('dashboard.welcome')}</h1>
      <p className="text-gray-600">{t('dashboard.comingSoon')}</p>
    </div>
  );
}
