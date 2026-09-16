import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppData } from '@/hooks/useAppData';
import { Card } from '@/components/Card';
import { formatCOP } from '@/lib/format';
import { calculateStats, percentileDiff } from '@/lib/calculations';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import type { PriceRecord, Product, Competitor, Category, AnalysisPeriod } from '@/types/database';

interface PricesProps {
  selectedPeriodId: string | null;
}

type MetricType = 'avg' | 'median' | 'min' | 'max';

export function Prices({ selectedPeriodId }: PricesProps) {
  const { competitors, categories } = useAppData();
  const [records, setRecords] = useState<(PriceRecord & { products?: Product & { competitors?: Competitor; categories?: Category } })[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [metric, setMetric] = useState<MetricType>('avg');

  useEffect(() => {
    if (!selectedPeriodId) return;
    supabase
      .from('price_records')
      .select(`
        *,
        products (
          id, name, sku, competitor_id, category_id,
          competitors (id, name, is_madesa),
          categories (id, name)
        )
      `)
      .eq('period_id', selectedPeriodId)
      .then(({ data }) => setRecords((data || []) as unknown as typeof records));
  }, [selectedPeriodId]);

  const filtered = useMemo(() => {
    if (selectedCategory === 'all') return records;
    return records.filter((r) => r.products?.categories?.id === selectedCategory);
  }, [records, selectedCategory]);

  // Group by competitor + category
  const compCatStats = useMemo(() => {
    const map = new Map<string, { competitor: Competitor; category: Category; prices: number[] }>();
    for (const r of filtered) {
      const comp = r.products?.competitors;
      const cat = r.products?.categories;
      if (!comp || !cat) continue;
      const key = `${comp.id}-${cat.id}`;
      if (!map.has(key)) map.set(key, { competitor: comp, category: cat, prices: [] });
      map.get(key)!.prices.push(r.promo_price || r.normal_price);
    }
    return map;
  }, [filtered]);

  // Chart data by competitor for selected category
  const chartData = useMemo(() => {
    const compMap = new Map<string, { competitor: Competitor; prices: number[] }>();
    for (const r of filtered) {
      const comp = r.products?.competitors;
      if (!comp) continue;
      if (!compMap.has(comp.id)) compMap.set(comp.id, { competitor: comp, prices: [] });
      compMap.get(comp.id)!.prices.push(r.promo_price || r.normal_price);
    }
    return Array.from(compMap.values())
      .map(({ competitor, prices }) => {
        const s = calculateStats(prices);
        const val = metric === 'avg' ? s.avg : metric === 'median' ? s.median : metric === 'min' ? s.min : s.max;
        return { label: competitor.name, value: Math.round(val), highlight: competitor.is_madesa, count: s.count };
      })
      .sort((a, b) => a.value - b.value);
  }, [filtered, metric]);

  // Table data grouped by category
  const tableData = useMemo(() => {
    const catMap = new Map<string, { category: Category; rows: { competitor: Competitor; stats: ReturnType<typeof calculateStats> }[] }>();
    for (const [key, { competitor, category, prices }] of compCatStats) {
      if (!catMap.has(category.id)) catMap.set(category.id, { category, rows: [] });
      catMap.get(category.id)!.rows.push({ competitor, stats: calculateStats(prices) });
    }
    return Array.from(catMap.values()).map(({ category, rows }) => ({
      category,
      rows: rows.sort((a, b) => a.stats.avg - b.stats.avg),
    }));
  }, [compCatStats]);

  const metricLabel = metric === 'avg' ? 'Promedio' : metric === 'median' ? 'Mediana' : metric === 'min' ? 'Mínimo' : 'Máximo';

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 font-medium">Métrica:</span>
          {(['avg', 'median', 'min', 'max'] as MetricType[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                metric === m ? 'bg-madesa-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m === 'avg' ? 'Promedio' : m === 'median' ? 'Mediana' : m === 'min' ? 'Mínimo' : 'Máximo'}
            </button>
          ))}
        </div>
        <div className="h-5 w-px bg-gray-200" />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400 font-medium">Categoría:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === 'all' ? 'bg-madesa-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat.id ? 'bg-madesa-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <Card title={`${metricLabel} por competidor`} subtitle="El tamaño de muestra se muestra en cada barra">
        <SimpleBarChart
          data={chartData.map((d) => ({ label: d.label, value: d.value, highlight: d.highlight }))}
          formatValue={(v) => formatCOP(v)}
        />
        <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-2">
          {chartData.map((d) => (
            <div key={d.label} className="flex items-center gap-1.5 text-xs">
              <span className={`font-medium ${d.highlight ? 'text-madesa-600' : 'text-gray-600'}`}>{d.label}</span>
              <span className="text-gray-400">{d.count} productos</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Detailed table by category */}
      {tableData.map(({ category, rows }) => {
        const madesaRow = rows.find((r) => r.competitor.is_madesa);
        return (
          <Card key={category.id} title={category.name} subtitle={`${rows.length} competidores`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Competidor</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Promedio</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Mediana</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Mín</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Máx</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">N</th>
                    <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">vs. Madesa</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const diff = madesaRow ? percentileDiff(r.stats.avg, madesaRow.stats.avg) : 0;
                    return (
                      <tr key={r.competitor.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-3 font-medium text-gray-900">
                          {r.competitor.name}
                          {r.competitor.is_madesa && <span className="ml-2 text-xs text-madesa-600 font-semibold">Madesa</span>}
                        </td>
                        <td className="text-right py-3 px-3 tabular-nums text-gray-700">{formatCOP(Math.round(r.stats.avg))}</td>
                        <td className="text-right py-3 px-3 tabular-nums text-gray-500">{formatCOP(Math.round(r.stats.median))}</td>
                        <td className="text-right py-3 px-3 tabular-nums text-gray-500">{formatCOP(Math.round(r.stats.min))}</td>
                        <td className="text-right py-3 px-3 tabular-nums text-gray-500">{formatCOP(Math.round(r.stats.max))}</td>
                        <td className="text-right py-3 px-3 tabular-nums text-gray-400">{r.stats.count}</td>
                        <td className={`text-right py-3 px-3 tabular-nums font-medium ${r.competitor.is_madesa ? 'text-gray-300' : diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                          {r.competitor.is_madesa ? '—' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}

      {/* Individual price records */}
      <Card title="Registros individuales" subtitle={`${filtered.length} precios registrados en este período`}>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-100">
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Producto</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Competidor</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Normal</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Promo</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 font-medium text-gray-700">{r.products?.name || '—'}</td>
                  <td className="py-2.5 px-3 text-gray-500">{r.products?.competitors?.name || '—'}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums text-gray-400">{formatCOP(r.normal_price)}</td>
                  <td className="py-2.5 px-3 text-right tabular-nums font-medium text-gray-900">{formatCOP(r.promo_price)}</td>
                  <td className="py-2.5 px-3 text-gray-400 text-xs">{r.query_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
