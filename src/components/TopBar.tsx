import { type AnalysisPeriod } from '@/types/database';
import { Pencil, Check } from 'lucide-react';

interface TopBarProps {
  title: string;
  subtitle?: string;
  periods: AnalysisPeriod[];
  selectedPeriodId: string | null;
  onPeriodChange: (id: string) => void;
  editMode: boolean;
  onToggleEditMode: () => void;
}

export function TopBar({ title, subtitle, periods, selectedPeriodId, onPeriodChange, editMode, onToggleEditMode }: TopBarProps) {
  return (
    <header
      className={`h-16 border-b flex items-center justify-between px-6 shrink-0 transition-colors duration-300 ${
        editMode
          ? 'bg-madesa-50 border-madesa-200'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="min-w-0">
        <h1 className="font-display font-bold text-gray-900 text-lg leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleEditMode}
          className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-all ${
            editMode
              ? 'bg-madesa-600 text-white hover:bg-madesa-700 shadow-sm'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
          title={editMode ? 'Modo edición activo' : 'Modo espectador'}
        >
          {editMode ? <><Check size={16} /> Edición</> : <><Pencil size={16} /> Editar</>}
        </button>
        <label className="text-xs text-gray-400 font-medium hidden sm:block">Período</label>
        <select
          value={selectedPeriodId || ''}
          onChange={(e) => onPeriodChange(e.target.value)}
          className="text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-madesa-500 focus:border-madesa-500 transition-all cursor-pointer"
        >
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
