import { useState } from 'react';
import { hexToRgba } from '@/lib/colors';

interface SimpleBarChartProps {
  data: { label: string; value: number; color?: string; highlight?: boolean }[];
  formatValue?: (v: number) => string;
  height?: number;
  onBarClick?: (index: number) => void;
}

export function SimpleBarChart({ data, formatValue, height = 260, onBarClick }: SimpleBarChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        Sin datos para mostrar
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const chartHeight = height - 50;
  const gap = 12;
  const barAreaWidth = 100 / data.length;

  return (
    <div className="w-full">
      <div className="relative" style={{ height: chartHeight }}>
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p) => (
          <div
            key={p}
            className="absolute left-0 right-0 border-t border-gray-100"
            style={{ bottom: `${p * 100}%` }}
          />
        ))}

        {/* Bars */}
        <div className="flex items-end justify-around h-full" style={{ gap: `${gap}px` }}>
          {data.map((d, i) => {
            const h = (d.value / maxVal) * (chartHeight - 30);
            const color = d.color || (d.highlight ? '#dc2626' : '#d1d5db');
            const isHovered = hovered === i;
            return (
              <div
                key={i}
                className={`flex flex-col items-center flex-1 relative ${onBarClick ? 'cursor-pointer' : ''}`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onBarClick?.(i)}
              >
                {/* Value label */}
                <span
                  className={`text-xs font-semibold tabular-nums mb-1.5 transition-all duration-200 ${
                    isHovered ? 'text-gray-900 scale-110' : 'text-gray-600'
                  }`}
                >
                  {formatValue ? formatValue(d.value) : d.value}
                </span>

                {/* Bar */}
                <div
                  className="w-full rounded-t-lg transition-all duration-500 relative group cursor-pointer"
                  style={{
                    height: Math.max(h, 4),
                    background: isHovered
                      ? `linear-gradient(180deg, ${color} 0%, ${hexToRgba(color, 0.75)} 100%)`
                      : `linear-gradient(180deg, ${color} 0%, ${hexToRgba(color, 0.55)} 100%)`,
                    maxWidth: '64px',
                    margin: '0 auto',
                    boxShadow: isHovered ? `0 4px 20px ${hexToRgba(color, 0.35)}` : 'none',
                    transform: isHovered ? 'translateY(-3px)' : 'none',
                  }}
                >
                  {isHovered && (
                    <div
                      className="absolute -top-1 left-0 right-0 h-1 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Labels */}
      <div className="flex items-start justify-around mt-3 border-t border-gray-100 pt-2.5" style={{ gap: `${gap}px` }}>
        {data.map((d, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <span
              className={`text-xs font-medium text-center truncate w-full max-w-[80px] ${
                d.highlight ? 'text-madesa-600 font-semibold' : 'text-gray-500'
              }`}
            >
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
