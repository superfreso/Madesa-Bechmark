import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppData } from '@/hooks/useAppData';
import { StatCard } from '@/components/StatCard';
import { Card } from '@/components/Card';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import { MultiLineChart } from '@/components/charts/MultiLineChart';
import { MadesaVsMarketChart } from '@/components/charts/MadesaVsMarketChart';
import { formatCOP, formatNumber } from '@/lib/format';
import { calculateStats, percentileDiff } from '@/lib/calculations';
import { getCompetitorColor } from '@/lib/colors';
import { Building2, Package, FolderTree, Calendar, TrendingUp, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import type { PriceRecord, Product, Competitor, Category } from '@/types/database';

interface DashboardProps {
  selectedPeriodId: string | null;
  onNavigateCompetitor?: (id: string) => void;
}

export function Dashboard({ selectedPeriodId, onNavigateCompetitor }: DashboardProps) {
  const { competitors, categories, periods, loading } = useAppData();
  const [priceRecords, setPriceRecords] = useState<(PriceRecord & { products?: Product & { competitors?: Competitor; categories?: Category } })[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId) || periods[0];

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
      .then(({ data }) => {
        setPriceRecords((data || []) as unknown as typeof priceRecords);
      });
  }, [selectedPeriodId]);

  const filteredRecords = useMemo(() => {
    if (selectedCategoryId === 'all') return priceRecords;
    return priceRecords.filter((r) => r.products?.categories?.id === selectedCategoryId);
  }, [priceRecords, selectedCategoryId]);

  // Group by competitor
  const competitorStats = useMemo(() => {
    const map = new Map<string, { competitor: Competitor; prices: number[] }>();
    for (const r of filteredRecords) {
      const comp = r.products?.competitors;
      if (!comp) continue;
      if (!map.has(comp.id)) map.set(comp.id, { competitor: comp, prices: [] });
      map.get(comp.id)!.prices.push(r.promo_price || r.normal_price);
    }
    return Array.from(map.values()).map(({ competitor, prices }) => ({
      competitor,
      stats: calculateStats(prices),
    }));
  }, [filteredRecords]);

  const marketAvg = useMemo(() => {
    const allPrices = filteredRecords.map((r) => r.promo_price || r.normal_price);
    return calculateStats(allPrices);
  }, [filteredRecords]);

  const madesaStat = competitorStats.find((s) => s.competitor.is_madesa);
  const madesaPosition = madesaStat
    ? competitorStats
        .sort((a, b) => a.stats.avg - b.stats.avg)
        .findIndex((s) => s.competitor.is_madesa) + 1
    : 0;

  const diffVsMarket = madesaStat ? percentileDiff(madesaStat.stats.avg, marketAvg.avg) : 0;

  // Assign consistent colors per competitor
  const competitorColorMap = useMemo(() => {
    const sorted = [...competitorStats].sort((a, b) => a.stats.avg - b.stats.avg);
    const map = new Map<string, string>();
    sorted.forEach((s, i) => {
      map.set(s.competitor.id, getCompetitorColor(s.competitor.name, s.competitor.is_madesa, i));
    });
    return map;
  }, [competitorStats]);

  // Chart data: average by competitor for selected category
  const chartData = useMemo(() => {
    return competitorStats
      .sort((a, b) => a.stats.avg - b.stats.avg)
      .map((s) => ({
        label: s.competitor.name,
        value: Math.round(s.stats.avg),
        color: competitorColorMap.get(s.competitor.id),
        highlight: s.competitor.is_madesa,
      }));
  }, [competitorStats, competitorColorMap]);

  // Evolution data across all periods
  const [evolutionData, setEvolutionData] = useState<{ label: string; values: { name: string; value: number; color: string }[] }[]>([]);

  useEffect(() => {
    if (competitors.length === 0 || periods.length === 0) return;
    async function loadEvolution() {
      const results: { label: string; values: { name: string; value: number; color: string }[] }[] = [];
      const sortedCompetitors = [...competitors].sort((a, b) => {
        const aStat = competitorStats.find((s) => s.competitor.id === a.id);
        const bStat = competitorStats.find((s) => s.competitor.id === b.id);
        if (a.is_madesa) return -1;
        if (b.is_madesa) return 1;
        return (aStat?.stats.avg || 0) - (bStat?.stats.avg || 0);
      });

      for (const period of periods) {
        const { data: fullData } = await supabase
          .from('price_records')
          .select(`normal_price, promo_price, products (competitor_id, category_id, competitors (id, name, is_madesa))`)
          .eq('period_id', period.id);
        const compAvgMap = new Map<string, { name: string; prices: number[]; is_madesa: boolean }>();
        for (const r of (fullData || []) as unknown as { normal_price: number; promo_price: number | null; products: { competitor_id: string; category_id: string; competitors: { id: string; name: string; is_madesa: boolean } } }[]) {
          const comp = r.products?.competitors;
          if (!comp) continue;
          if (selectedCategoryId !== 'all' && r.products?.category_id !== selectedCategoryId) continue;
          if (!compAvgMap.has(comp.id)) compAvgMap.set(comp.id, { name: comp.name, prices: [], is_madesa: comp.is_madesa });
          compAvgMap.get(comp.id)!.prices.push(r.promo_price || r.normal_price);
        }
        const values = sortedCompetitors
          .filter((c) => compAvgMap.has(c.id))
          .map((c) => ({
            name: c.name,
            value: Math.round(calculateStats(compAvgMap.get(c.id)!.prices).avg),
            color: competitorColorMap.get(c.id) || getCompetitorColor(c.name, c.is_madesa, 0),
          }));
        results.push({ label: period.name.replace(' 2026', ''), values });
      }
      setEvolutionData(results);
    }
    loadEvolution();
  }, [competitors, periods, selectedCategoryId, competitorStats, competitorColorMap]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>;
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Competidores analizados"
          value={String(competitors.filter((c) => c.is_active).length)}
          icon={<Building2 size={20} />}
        />
        <StatCard
          label="Categorías analizadas"
          value={String(categories.filter((c) => c.is_active).length)}
          icon={<FolderTree size={20} />}
        />
        <StatCard
          label="Productos registrados"
          value={formatNumber(filteredRecords.length)}
          sublabel={`${marketAvg.count} precios en el período`}
          icon={<Package size={20} />}
        />
        <StatCard
          label="Período actual"
          value={selectedPeriod?.name || '—'}
          sublabel={selectedPeriod?.status === 'open' ? 'En progreso' : 'Cerrado'}
          icon={<Calendar size={20} />}
          accent
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard
          label="Precio promedio del mercado"
          value={formatCOP(Math.round(marketAvg.avg))}
          sublabel={`Mediana: ${formatCOP(Math.round(marketAvg.median))} · ${marketAvg.count} productos`}
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          label="Posición de Madesa"
          value={madesaPosition > 0 ? `#${madesaPosition} de ${competitorStats.length}` : '—'}
          sublabel={madesaStat ? `Promedio: ${formatCOP(Math.round(madesaStat.stats.avg))}` : 'Sin datos'}
        />
        <StatCard
          label="Diferencia vs. mercado"
          value={`${diffVsMarket > 0 ? '+' : ''}${diffVsMarket.toFixed(1)}%`}
          sublabel={
            diffVsMarket < 0 ? 'Madesa más económico' : diffVsMarket > 0 ? 'Madesa más costoso' : 'Igual al mercado'
          }
          icon={
            diffVsMarket < 0 ? <ArrowDown size={20} className="text-green-600" /> :
            diffVsMarket > 0 ? <ArrowUp size={20} className="text-red-600" /> :
            <Minus size={20} />
          }
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-400 font-medium">Filtrar por categoría:</span>
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selectedCategoryId === 'all' ? 'bg-madesa-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCategoryId === cat.id ? 'bg-madesa-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Charts row 1: Madesa vs Market + Bar chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Madesa vs. Mercado" subtitle={`Comparación de precio promedio · ${selectedPeriod?.name || ''}`}>
          {madesaStat ? (
            <MadesaVsMarketChart
              madesaAvg={madesaStat.stats.avg}
              marketAvg={marketAvg.avg}
              marketMin={marketAvg.min}
              marketMax={marketAvg.max}
              madesaColor={competitorColorMap.get(madesaStat.competitor.id)}
            />
          ) : (
            <div className="flex items-center justify-center text-sm text-gray-400" style={{ height: 200 }}>
              Sin datos de Madesa para este período
            </div>
          )}
        </Card>
        <Card title="Precio promedio por competidor" subtitle={`${selectedPeriod?.name || ''} · Click para ver detalle`}>
          <SimpleBarChart
            data={chartData}
            formatValue={(v) => formatCOP(v)}
            onBarClick={(index) => {
              const entry = chartData[index];
              const comp = competitorStats.find((s) => s.competitor.name === entry.label);
              if (comp && onNavigateCompetitor) onNavigateCompetitor(comp.competitor.id);
            }}
          />
        </Card>
      </div>

      {/* Charts row 2: Evolution */}
      <Card title="Evolución del precio promedio" subtitle="Todos los períodos registrados">
        <MultiLineChart data={evolutionData} formatValue={(v) => formatCOP(v)} />
      </Card>

      {/* Detail table */}
      <Card title="Comparativa detallada" subtitle="Estadísticas calculadas a partir de productos individuales">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Competidor</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Promedio</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Mediana</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Mínimo</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Máximo</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Productos</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase tracking-wider">vs. Madesa</th>
              </tr>
            </thead>
            <tbody>
              {competitorStats
                .sort((a, b) => a.stats.avg - b.stats.avg)
                .map((s) => {
                  const diff = madesaStat ? percentileDiff(s.stats.avg, madesaStat.stats.avg) : 0;
                  const color = competitorColorMap.get(s.competitor.id);
                  return (
                    <tr key={s.competitor.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-3 font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                          {s.competitor.name}
                          {s.competitor.is_madesa && <span className="text-xs text-madesa-600 font-semibold">Madesa</span>}
                        </div>
                      </td>
                      <td className="text-right py-3 px-3 tabular-nums text-gray-700">{formatCOP(Math.round(s.stats.avg))}</td>
                      <td className="text-right py-3 px-3 tabular-nums text-gray-500">{formatCOP(Math.round(s.stats.median))}</td>
                      <td className="text-right py-3 px-3 tabular-nums text-gray-500">{formatCOP(Math.round(s.stats.min))}</td>
                      <td className="text-right py-3 px-3 tabular-nums text-gray-500">{formatCOP(Math.round(s.stats.max))}</td>
                      <td className="text-right py-3 px-3 tabular-nums text-gray-500">{s.stats.count}</td>
                      <td className={`text-right py-3 px-3 tabular-nums font-medium ${diff < 0 ? 'text-green-600' : diff > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {s.competitor.is_madesa ? '—' : `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
