import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { BULAN_INDO } from '../constants';

interface MonthYearCalendarPickerProps {
  year: number;
  monthIndex: number;
  onChange: (year: number, monthIndex: number) => void;
}

export function MonthYearCalendarPicker({
  year,
  monthIndex,
  onChange,
}: MonthYearCalendarPickerProps) {
  const [open, setOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(year);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setPickerYear(year);
  }, [year, open]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-9 items-center justify-between gap-2.5 rounded-xl border bg-white px-3 text-xs font-semibold text-slate-800 transition ${
          open
            ? 'border-[#8B1515] ring-2 ring-red-100'
            : 'border-slate-200 hover:border-red-300'
        }`}
      >
        <span>
          {BULAN_INDO[monthIndex]} {year}
        </span>
        <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500" />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-1.5 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl ring-1 ring-slate-950/5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <button
              type="button"
              onClick={() => setPickerYear((y) => y - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Tahun sebelumnya"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="font-heading text-sm font-extrabold text-slate-900">
              {pickerYear}
            </span>
            <button
              type="button"
              onClick={() => setPickerYear((y) => y + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Tahun berikutnya"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {BULAN_INDO.map((namaBulan, idx) => {
              const isSelected = pickerYear === year && idx === monthIndex;
              return (
                <button
                  key={namaBulan}
                  type="button"
                  onClick={() => {
                    onChange(pickerYear, idx);
                    setOpen(false);
                  }}
                  className={`rounded-xl px-2 py-2 text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-[#8B1515] font-bold text-white'
                      : 'text-slate-700 hover:bg-red-50 hover:text-[#8B1515]'
                  }`}
                >
                  {namaBulan.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}