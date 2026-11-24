import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import type { WeekPeriodOption } from '../types';

interface WeekRangeDropdownProps {
  options: WeekPeriodOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function WeekRangeDropdown({ options, selectedId, onSelect }: WeekRangeDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const currentOpt = options.find((o) => o.id === selectedId) ?? options[0];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-9 items-center justify-between gap-2 rounded-xl border bg-white px-3 text-left text-xs font-semibold text-slate-800 transition ${
          open
            ? 'border-[#8B1515] ring-2 ring-red-100'
            : 'border-slate-200 hover:border-red-300'
        }`}
      >
        <span className="truncate">{currentOpt?.dropdownLabel}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
            open ? 'rotate-180 text-[#8B1515]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-1.5 w-64 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-950/5">
          {options.map((opt) => {
            const active = opt.id === selectedId;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelect(opt.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs transition ${
                  active
                    ? 'bg-red-50 font-bold text-[#8B1515]'
                    : 'font-medium text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{opt.dropdownLabel}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-[#8B1515]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}