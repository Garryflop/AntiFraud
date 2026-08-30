import React from 'react';
import { Calendar, Filter, X, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function DateRangeFilter() {
  const { 
    startDate, 
    endDate, 
    datePreset, 
    setDateFilter, 
    setStartDate, 
    setEndDate, 
    fetchStats, 
    fetchCases 
  } = useApp();

  const handleCustomApply = () => {
    if (startDate || endDate) {
      setDateFilter('CUSTOM', startDate, endDate);
    }
  };

  return (
    <div className="bg-[#1f1633] border border-[#362d59] p-3 rounded-xl mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
      
      {/* Label and Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center space-x-1.5 text-xs font-mono text-[#c2ef4e] font-bold mr-2 uppercase tracking-wider">
          <Calendar size={15} />
          <span>ФИЛЬТР ДАТЫ:</span>
        </div>

        {/* Preset Buttons per DESIGN.md button-cap */}
        <button
          onClick={() => setDateFilter('ALL')}
          className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-md border transition-all ${
            datePreset === 'ALL'
              ? 'bg-[#c2ef4e] text-[#1f1633] border-[#c2ef4e] shadow-md'
              : 'bg-[#150f23] text-[#bdb8c0] border-[#362d59] hover:text-white hover:border-[#6a5fc1]'
          }`}
        >
          Всё время
        </button>

        <button
          onClick={() => setDateFilter('2026')}
          className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-md border transition-all ${
            datePreset === '2026'
              ? 'bg-[#c2ef4e] text-[#1f1633] border-[#c2ef4e] shadow-md'
              : 'bg-[#150f23] text-[#bdb8c0] border-[#362d59] hover:text-white hover:border-[#6a5fc1]'
          }`}
        >
          2026 г.
        </button>

        <button
          onClick={() => setDateFilter('2025')}
          className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-md border transition-all ${
            datePreset === '2025'
              ? 'bg-[#c2ef4e] text-[#1f1633] border-[#c2ef4e] shadow-md'
              : 'bg-[#150f23] text-[#bdb8c0] border-[#362d59] hover:text-white hover:border-[#6a5fc1]'
          }`}
        >
          2025 г.
        </button>

        <button
          onClick={() => setDateFilter('2024')}
          className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-md border transition-all ${
            datePreset === '2024'
              ? 'bg-[#c2ef4e] text-[#1f1633] border-[#c2ef4e] shadow-md'
              : 'bg-[#150f23] text-[#bdb8c0] border-[#362d59] hover:text-white hover:border-[#6a5fc1]'
          }`}
        >
          2024 г.
        </button>

        <button
          onClick={() => setDateFilter('2023')}
          className={`px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider rounded-md border transition-all ${
            datePreset === '2023'
              ? 'bg-[#c2ef4e] text-[#1f1633] border-[#c2ef4e] shadow-md'
              : 'bg-[#150f23] text-[#bdb8c0] border-[#362d59] hover:text-white hover:border-[#6a5fc1]'
          }`}
        >
          2023 г.
        </button>
      </div>

      {/* Custom Date Range Selector (Start Date & End Date Inputs) */}
      <div className="flex items-center space-x-2 font-mono text-xs">
        <span className="text-[#bdb8c0] text-[11px]">С:</span>
        <input 
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setDateFilter('CUSTOM', e.target.value, endDate);
          }}
          className="bg-[#150f23] text-white border border-[#362d59] rounded-md px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-[#6a5fc1]"
        />

        <span className="text-[#bdb8c0] text-[11px]">ПО:</span>
        <input 
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setDateFilter('CUSTOM', startDate, e.target.value);
          }}
          className="bg-[#150f23] text-white border border-[#362d59] rounded-md px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-[#6a5fc1]"
        />

        {(startDate || endDate) && (
          <button
            onClick={() => setDateFilter('ALL')}
            className="p-1 rounded-md bg-[#3f3849] text-[#bdb8c0] hover:text-white hover:bg-[#fa7faa]/20 transition-all border border-[#362d59]"
            title="Сбросить даты"
          >
            <X size={14} />
          </button>
        )}
      </div>

    </div>
  );
}
