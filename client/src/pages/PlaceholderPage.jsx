import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Layers, ArrowRight } from 'lucide-react';

export default function PlaceholderPage({ titleKey, phaseNumber, description }) {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm text-center max-w-xl mx-auto my-12">
      <div className="w-14 h-14 bg-brand-50 text-brand-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100">
        <Layers className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{t(titleKey)}</h3>
      <p className="text-sm text-gray-500 mb-6">{description}</p>

      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
        <Clock className="w-3.5 h-3.5" />
        <span>Scheduled in Roadmap Phase {phaseNumber}</span>
      </div>
    </div>
  );
}
