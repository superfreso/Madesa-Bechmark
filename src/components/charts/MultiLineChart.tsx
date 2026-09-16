import { useState } from 'react';
import { hexToRgba } from '@/lib/colors';

interface LineChartProps {
  data: { label: string; values: { name: string; value: number; color: string }[] }[];
  formatValue?: (v: number) => string;
  height?: number;
}

export function MultiLineChart({ data, formatValue, height = 280 }: LineChartProps) {
  const [hoveredSeries, setHoveredSeries] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ series: number; point: number } | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-sm text-gray-400" style={{ height }}>
        Sin datos para mostrar
      </div>
    );
  }

  const seriesNames = Array.from(new Set(data.flatMap((d) => d.values.map((v) => v.name))));
  const allValues = data.flatMap((d) => d.values.map((v) => v.value));
  const maxVal = Math.max(...allValues, 1);
  const minVal = Math.min(...allValues, 0);
  const range = maxVal - minVal || 1;
  const padTop = 20;
  const padBottom = 10;
  const chartHeight = height - padTop - padBottom - 50;
  const width = 100;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  function getPoint(val: number, index: number) {
    const x = index * stepX;
    const y = padTop + chartHeight - ((val - minVal) / range) * chartHeight;
    return { x, y };
  }

  function getSmoothPath(values: ({ value: number } | undefined)[]) {
    let path = '';
    let previousPoint: { x: number; y: number } | null = null;

    values.forEach((value, index) => {
      if (!value) {
        previousPoint = null;
        return;
      }

      const point = getPoint(value.value, index);
      if (!previousPoint) {
        path += `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      } else {
        const cpx = (previousPoint.x + point.x) / 2;
        path += ` C ${cpx.toFixed(2)} ${previousPoint.y.toFixed(2)}, ${cpx.toFixed(2)} ${point.y.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      }
      previousPoint = point;
    });

    return path;
  }

  return (
    <div className="w-full">
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height - 50}`}
          className="w-full"
          style={{ height: height - 50 }}
          preserveAspectRatio="none"
        >
          {/* Gradient defs */}
          <defs>
            {seriesNames.map((name, si) => {
              const color = data.flatMap((d) => d.values).find((v) => v.name === name)?.color || '#999';
              return (
                <linearGradient key={name} id={`grad-${si}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={hexToRgba(color, 0.18)} />
                  <stop offset="100%" stopColor={hexToRgba(color, 0)} />
                </linearGradient>
              );
            })}
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => (
            <line
              key={p}
              x1="0"
              y1={padTop + chartHeight - p * chartHeight}
              x2={width}
              y2={padTop + chartHeight - p * chartHeight}
              stroke="#f3f4f6"
              strokeWidth="0.12"
            />
          ))}

          {/* Area + Lines */}
          {seriesNames.map((name, si) => {
            const color = data.flatMap((d) => d.values).find((v) => v.name === name)?.color || '#999';
            const seriesValues = data.map((d) => d.values.find((v) => v.name === name));
            const linePath = getSmoothPath(seriesValues);
            const hasMissingValues = seriesValues.some((value) => !value);
            const areaPath = hasMissingValues
              ? ''
              : `${linePath} L ${((data.length - 1) * stepX).toFixed(2)} ${padTop + chartHeight} L 0 ${padTop + chartHeight} Z`;
            const isDimmed = hoveredSeries !== null && hoveredSeries !== name;
            const isHovered = hoveredSeries === name;

            return (
              <g
                key={name}
                style={{ transition: 'opacity 0.2s', opacity: isDimmed ? 0.25 : 1 }}
                onMouseEnter={() => setHoveredSeries(name)}
                onMouseLeave={() => setHoveredSeries(null)}
              >
                {areaPath && <path d={areaPath} fill={`url(#grad-${si})`} />}
                <path
                  d={linePath}
                  fill="none"
                  stroke={color}
                  strokeWidth={isHovered ? 0.7 : 0.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  style={{ transition: 'stroke-width 0.2s' }}
                />
                {seriesValues.map((value, i) => {
                  if (!value) return null;
                  const p = getPoint(value.value, i);
                  const isPointHovered = hoveredPoint?.series === si && hoveredPoint?.point === i;
                  return (
                    <g key={i}>
                      {(isHovered || isPointHovered) && (
                        <circle cx={p.x} cy={p.y} r="1.2" fill={hexToRgba(color, 0.3)} />
                      )}
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isPointHovered ? 1 : 0.7}
                        fill="white"
                        stroke={color}
                        strokeWidth="0.3"
                        style={{ transition: 'r 0.15s' }}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Hover tooltips */}
          {hoveredPoint &&
            (() => {
              const d = data[hoveredPoint.point];
              const v = d?.values.find((value) => value.name === seriesNames[hoveredPoint.series]);
              if (!v) return null;
              const p = getPoint(v.value, hoveredPoint.point);
              return (
                <g>
                  <line
                    x1={p.x}
                    y1={padTop}
                    x2={p.x}
                    y2={padTop + chartHeight}
                    stroke={v.color}
                    strokeWidth="0.15"
                    strokeDasharray="0.5,0.5"
                    opacity="0.5"
                  />
                </g>
              );
            })()}
        </svg>
      </div>

      {/* X axis labels */}
      <div className="flex justify-between mt-1 px-1">
        {data.map((d, i) => (
          <span
            key={i}
            className={`text-[10px] font-medium transition-colors ${
              hoveredPoint?.point === i ? 'text-gray-900' : 'text-gray-400'
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {seriesNames.map((name, si) => {
          const color = data.flatMap((d) => d.values).find((v) => v.name === name)?.color || '#999';
          const isDimmed = hoveredSeries !== null && hoveredSeries !== name;
          return (
            <div
              key={name}
              className="flex items-center gap-1.5 cursor-pointer transition-opacity"
              style={{ opacity: isDimmed ? 0.4 : 1 }}
              onMouseEnter={() => setHoveredSeries(name)}
              onMouseLeave={() => setHoveredSeries(null)}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: color, boxShadow: `0 1px 4px ${hexToRgba(color, 0.4)}` }}
              />
              <span
                className={`text-xs font-medium ${
                  hoveredSeries === name ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                {name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
