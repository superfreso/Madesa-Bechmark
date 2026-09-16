import { formatCOP } from '@/lib/format';
import { hexToRgba } from '@/lib/colors';

interface MadesaVsMarketChartProps {
  madesaAvg: number;
  marketAvg: number;
  marketMin: number;
  marketMax: number;
  madesaColor?: string;
  marketColor?: string;
}

export function MadesaVsMarketChart({
  madesaAvg,
  marketAvg,
  marketMin,
  marketMax,
  madesaColor = '#dc2626',
  marketColor = '#2563eb',
}: MadesaVsMarketChartProps) {
  const diff = madesaAvg - marketAvg;
  const diffPct = marketAvg > 0 ? (diff / marketAvg) * 100 : 0;
  const isMadesaCheaper = diff < 0;

  // Range for the gauge
  const gaugeMin = Math.min(marketMin, madesaAvg) * 0.9;
  const gaugeMax = Math.max(marketMax, madesaAvg) * 1.1;
  const gaugeRange = gaugeMax - gaugeMin || 1;

  const madesaPct = ((madesaAvg - gaugeMin) / gaugeRange) * 100;
  const marketPct = ((marketAvg - gaugeMin) / gaugeRange) * 100;

  return (
    <div className="w-full space-y-5">
      {/* Summary comparison bar */}
      <div className="space-y-3">
        {/* Madesa bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: madesaColor }} />
              <span className="text-sm font-semibold text-gray-700">Madesa</span>
            </div>
            <span className="text-sm font-display font-bold tabular-nums text-gray-900">
              {formatCOP(Math.round(madesaAvg))}
            </span>
          </div>
          <div className="h-7 bg-gray-50 rounded-lg relative overflow-hidden">
            <div
              className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-700"
              style={{
                width: `${Math.max(madesaPct, 3)}%`,
                background: `linear-gradient(90deg, ${hexToRgba(madesaColor, 0.7)}, ${madesaColor})`,
              }}
            >
              <span className="text-[10px] font-medium text-white">Promedio</span>
            </div>
          </div>
        </div>

        {/* Market bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: marketColor }} />
              <span className="text-sm font-semibold text-gray-700">Mercado</span>
            </div>
            <span className="text-sm font-display font-bold tabular-nums text-gray-900">
              {formatCOP(Math.round(marketAvg))}
            </span>
          </div>
          <div className="h-7 bg-gray-50 rounded-lg relative overflow-hidden">
            <div
              className="h-full rounded-lg flex items-center justify-end pr-2 transition-all duration-700"
              style={{
                width: `${Math.max(marketPct, 3)}%`,
                background: `linear-gradient(90deg, ${hexToRgba(marketColor, 0.7)}, ${marketColor})`,
              }}
            >
              <span className="text-[10px] font-medium text-white">Promedio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Difference highlight */}
      <div
        className={`rounded-xl p-4 border ${
          isMadesaCheaper
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500 mb-1">
              Diferencia de Madesa vs. Mercado
            </p>
            <p className="font-display font-bold text-2xl tabular-nums text-gray-900">
              {isMadesaCheaper ? '-' : '+'}
              {formatCOP(Math.round(Math.abs(diff)))}
            </p>
          </div>
          <div
            className={`text-right ${
              isMadesaCheaper ? 'text-green-600' : 'text-red-600'
            }`}
          >
            <p className="font-display font-bold text-3xl tabular-nums">
              {isMadesaCheaper ? '-' : '+'}
              {Math.abs(diffPct).toFixed(1)}%
            </p>
            <p className="text-xs font-medium mt-0.5">
              {isMadesaCheaper ? 'Madesa es más económico' : 'Madesa es más costoso'}
            </p>
          </div>
        </div>
      </div>

      {/* Range context */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
        <div>
          <span className="font-medium text-gray-500">Rango del mercado:</span>{' '}
          <span className="tabular-nums">{formatCOP(Math.round(marketMin))}</span>
          {' — '}
          <span className="tabular-nums">{formatCOP(Math.round(marketMax))}</span>
        </div>
      </div>
    </div>
  );
}
