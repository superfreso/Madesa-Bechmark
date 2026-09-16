import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppData } from '@/hooks/useAppData';
import { Card } from '@/components/Card';
import { MultiLineChart } from '@/components/charts/MultiLineChart';
import { formatCOP } from '@/lib/format';
import { calculateStats } from '@/lib/calculations';
import type { PriceRecord, Product, Competitor, AnalysisPeriod, CommercialCondition, PaymentMethod } from '@/types/database';

interface HistoryProps {
  selectedPeriodId: string | null;
}

export function History({ selectedPeriodId: _ }: HistoryProps) {
  const { competitors, periods } = useAppData();
  const [range, setRange] = useState<number>(0); // 0 = all
  const [view, setView] = useState<'prices' | 'traffic' | 'conditions'>('prices');

  const filteredPeriods = useMemo(() => {
    const sorted = [...periods].sort((a, b) => a.sort_order - b.sort_order);
    if (range === 0) return sorted;
    return sorted.slice(-range);
  }, [periods, range]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Range selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-gray-400 font-medium">Rango:</span>
        {[
          { val: 3, label: '3 meses' },
          { val: 6, label: '6 meses' },
          { val: 12, label: '12 meses' },
          { val: 0, label: 'Todo el histórico' },
        ].map((r) => (
          <button
            key={r.val}
            onClick={() => setRange(r.val)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${range === r.val ? 'bg-madesa-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* View selector */}
      <div className="flex items-center gap-2">
        {[
          { val: 'prices' as const, label: 'Evolución de precios' },
          { val: 'traffic' as const, label: 'Evolución de tráfico' },
          { val: 'conditions' as const, label: 'Evolución de condiciones' },
        ].map((v) => (
          <button
            key={v.val}
            onClick={() => setView(v.val)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === v.val ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {view === 'prices' && <PriceEvolution periods={filteredPeriods} competitors={competitors} />}
      {view === 'traffic' && <TrafficEvolution periods={filteredPeriods} competitors={competitors} />}
      {view === 'conditions' && <ConditionsEvolution periods={filteredPeriods} competitors={competitors} />}
    </div>
  );
}

function PriceEvolution({ periods, competitors }: { periods: AnalysisPeriod[]; competitors: Competitor[] }) {
  const [data, setData] = useState<{ label: string; values: { name: string; value: number; color: string }[] }[]>([]);

  useEffect(() => {
    if (periods.length === 0 || competitors.length === 0) return;
    async function load() {
      const colors = ['#dc2626', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const results: { label: string; values: { name: string; value: number; color: string }[] }[] = [];
      for (const period of periods) {
        const { data: records } = await supabase
          .from('price_records')
          .select(`normal_price, promo_price, products (competitor_id, competitors (id, name, is_madesa))`)
          .eq('period_id', period.id);
        const compMap = new Map<string, { name: string; prices: number[]; is_madesa: boolean }>();
        for (const r of (records || []) as unknown as { normal_price: number; promo_price: number | null; products: { competitor_id: string; competitors: { id: string; name: string; is_madesa: boolean } } }[]) {
          const comp = r.products?.competitors;
          if (!comp) continue;
          if (!compMap.has(comp.id)) compMap.set(comp.id, { name: comp.name, prices: [], is_madesa: comp.is_madesa });
          compMap.get(comp.id)!.prices.push(r.promo_price || r.normal_price);
        }
        const values = competitors.map((comp, idx) => {
          const entry = compMap.get(comp.id);
          const prices = entry?.prices || [];
          const stats = calculateStats(prices);
          return {
            name: comp.name,
            value: Math.round(stats.avg),
            color: comp.is_madesa ? '#dc2626' : colors[idx % colors.length],
          };
        });
        results.push({ label: period.name.replace(' 2026', ''), values });
      }
      setData(results);
    }
    load();
  }, [periods, competitors]);

  return (
    <Card title="Evolución del precio promedio" subtitle="Promedio calculado a partir de productos individuales por período">
      <MultiLineChart data={data} formatValue={(v) => formatCOP(v)} />
    </Card>
  );
}

function TrafficEvolution({ periods, competitors }: { periods: AnalysisPeriod[]; competitors: Competitor[] }) {
  const [data, setData] = useState<{ label: string; values: { name: string; value: number; color: string }[] }[]>([]);

  useEffect(() => {
    if (periods.length === 0 || competitors.length === 0) return;
    async function load() {
      const colors = ['#dc2626', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
      const results: { label: string; values: { name: string; value: number; color: string }[] }[] = [];
      for (const period of periods) {
        const { data: records } = await supabase
          .from('traffic_records')
          .select(`estimated_visits, competitor_id, competitors (id, name, is_madesa)`)
          .eq('period_id', period.id);
        const values = competitors.map((comp, idx) => {
          const rec = (records || []).find((r: Record<string, unknown>) => r.competitor_id === comp.id) as unknown as { estimated_visits: number } | undefined;
          return {
            name: comp.name,
            value: rec?.estimated_visits || 0,
            color: comp.is_madesa ? '#dc2626' : colors[idx % colors.length],
          };
        });
        results.push({ label: period.name.replace(' 2026', ''), values });
      }
      setData(results);
    }
    load();
  }, [periods, competitors]);

  return (
    <Card title="Evolución del tráfico digital" subtitle="Visitas estimadas según Semrush">
      <MultiLineChart data={data} formatValue={(v) => Number(v).toLocaleString('es-CO')} />
    </Card>
  );
}

function ConditionsEvolution({ periods, competitors }: { periods: AnalysisPeriod[]; competitors: Competitor[] }) {
  const [conditions, setConditions] = useState<CommercialCondition[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    if (periods.length === 0) return;
    const periodIds = periods.map((p) => p.id);
    supabase.from('commercial_conditions').select('*').in('period_id', periodIds)
      .then(({ data }) => setConditions(data || []));
    supabase.from('payment_methods').select('*').in('period_id', periodIds)
      .then(({ data }) => setPayments(data || []));
  }, [periods]);

  // Warranty evolution
  const warrantyEvolution = useMemo(() => {
    return periods.map((period) => {
      const values = competitors.map((comp) => {
        const cond = conditions.find((c) => c.competitor_id === comp.id && c.period_id === period.id && c.condition_type === 'warranty');
        const duration = cond?.duration || '';
        const years = parseInt(duration) || 0;
        return { name: comp.name, value: years, color: comp.is_madesa ? '#dc2626' : '#3b82f6' };
      });
      return { label: period.name.replace(' 2026', ''), values };
    });
  }, [periods, competitors, conditions]);

  // MSI evolution
  const msiEvolution = useMemo(() => {
    return periods.map((period) => {
      const values = competitors.map((comp) => {
        const compPayments = payments.filter((p) => p.competitor_id === comp.id && p.period_id === period.id);
        const maxMSI = Math.max(0, ...compPayments.map((p) => p.interest_free_installments || 0));
        return { name: comp.name, value: maxMSI, color: comp.is_madesa ? '#dc2626' : '#10b981' };
      });
      return { label: period.name.replace(' 2026', ''), values };
    });
  }, [periods, competitors, payments]);

  return (
    <div className="space-y-4">
      <Card title="Evolución de garantía" subtitle="Años de garantía por competidor y período">
        <MultiLineChart data={warrantyEvolution} formatValue={(v) => `${v} años`} />
      </Card>
      <Card title="Evolución de MSI" subtitle="Máximo de cuotas sin interés ofrecidas por competidor">
        <MultiLineChart data={msiEvolution} formatValue={(v) => `${v} MSI`} />
      </Card>

      {/* Conditions detail table */}
      <Card title="Historial de condiciones comerciales" subtitle="Todos los registros históricos">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Competidor</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Período</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Tipo</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {conditions.map((c) => {
                const comp = competitors.find((comp) => comp.id === c.competitor_id);
                const period = periods.find((p) => p.id === c.period_id);
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">
                      {comp?.name}
                      {comp?.is_madesa && <span className="ml-2 text-xs text-madesa-600 font-semibold">Madesa</span>}
                    </td>
                    <td className="py-3 px-3 text-gray-500">{period?.name}</td>
                    <td className="py-3 px-3 text-gray-500 capitalize">{c.condition_type}</td>
                    <td className="py-3 px-3 text-gray-400 text-xs">
                      {c.duration || c.estimated_time || c.conditions || c.availability || '—'}
                      {c.observations && <span className="block text-gray-300 mt-0.5">{c.observations}</span>}
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
