import React from 'react';
import { CreditCard, HeartPulse, Globe, Plus, Layers } from 'lucide-react';
import { DocumentType } from '../types';

export type NavFilter = 'all' | DocumentType | 'expiring_soon';

interface BottomNavProps {
  currentFilter: NavFilter;
  onSelectFilter: (filter: NavFilter) => void;
  onAddNew: () => void;
  counts: {
    all: number;
    drivers_license: number;
    medicare: number;
    passport: number;
    expiringSoon?: number;
  };
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentFilter,
  onSelectFilter,
  onAddNew,
  counts,
}) => {
  const tabs = [
    { id: 'all' as NavFilter, label: 'Vault', icon: Layers, count: counts.all },
    {
      id: 'drivers_license' as NavFilter,
      label: 'Licence',
      icon: CreditCard,
      count: counts.drivers_license,
    },
    {
      id: 'medicare' as NavFilter,
      label: 'Medicare',
      icon: HeartPulse,
      count: counts.medicare,
    },
    {
      id: 'passport' as NavFilter,
      label: 'Passport',
      icon: Globe,
      count: counts.passport,
    },
  ];

  return (
    <nav className="sticky bottom-0 z-30 w-full bg-[#111419]/95 backdrop-blur-lg border-t border-[#252C37] pb-safe pt-1.5 px-3">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            currentFilter === tab.id ||
            (tab.id === 'medicare' && currentFilter === 'insurance');

          return (
            <button
              key={tab.id}
              onClick={() => onSelectFilter(tab.id)}
              className="flex flex-col items-center justify-center py-1 px-2.5 min-w-[56px] group transition active:scale-95"
            >
              {/* Material You Pill Indicator */}
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? 'bg-[#2A374E] text-[#A8C7FA]'
                    : 'text-gray-400 group-hover:text-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.id === 'all' && counts.expiringSoon && counts.expiringSoon > 0 ? (
                  <span
                    className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center px-0.5 animate-pulse shadow-xs"
                    title={`${counts.expiringSoon} document(s) expiring within 30 days`}
                  >
                    {counts.expiringSoon}
                  </span>
                ) : (
                  tab.count > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                      {tab.count}
                    </span>
                  )
                )}
              </div>

              <span
                className={`text-[11px] font-medium tracking-tight mt-0.5 transition-colors ${
                  isActive ? 'text-[#E2E2E6] font-semibold' : 'text-gray-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Floating Add Card Action Button */}
        <button
          onClick={onAddNew}
          title="Add New Australian Document"
          className="flex flex-col items-center justify-center py-1 px-2 min-w-[50px] group active:scale-95"
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md flex items-center justify-center hover:shadow-blue-500/20 transition">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[11px] text-blue-300 font-medium mt-0.5">Add</span>
        </button>
      </div>
    </nav>
  );
};
