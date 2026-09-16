import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppData } from '@/hooks/useAppData';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { Field, TextInput, Select, Button } from '@/components/Form';
import { MultiLineChart } from '@/components/charts/MultiLineChart';
import { formatNumber, formatPercent } from '@/lib/format';
import { TrendingUp, TrendingDown, Globe, Plus, Trash2 } from 'lucide-react';
import { useEditMode } from '@/hooks/useEditMode';
import type { TrafficRecord, Competitor, AnalysisPeriod } from '@/types/database';

interface TrafficProps {
  selectedPeriodId: string | null;
}

export function Traffic({ selectedPeriodId }: TrafficProps) {
  const { competitors, periods } = useAppData();
  const [records, setRecords] = useState<(TrafficRecord & { competitors?: Competitor })[]>([]);
  const [allRecords, setAllRecords] = useState<(TrafficRecord & { competitors?: Competitor; analysis_periods?: AnalysisPeriod })[]>([]);
  const [showForm, setShowForm] = useState(false);
  const editMode = useEditMode();

  const refresh = useCallback(() => {
    if (!selectedPeriodId) return;
    supabase.from('traffic_records').select(`*, competitors (id, name, is_madesa)`).eq('period_id', selectedPeriodId)
      .then(({ data }) => setRecords((data || []) as unknown as typeof records));
    supabase.from('traffic_records').select(`*, competitors (id, name, is_madesa), analysis_periods (id, name, period_code, sort_order)`).order('query_date', { ascending: true })
      .then(({ data }) => setAllRecords((data || []) as unknown as typeof allRecords));
  }, [selectedPeriodId]);

  useEffect(() => { refresh(); }, [refresh]);

  const sortedRecords = useMemo(() => [...records].sort((a, b) => (b.estimated_visits || 0) - (a.estimated_visits || 0)), [records]);

  const evolutionData = useMemo(() => {
    const sortedPeriods = [...periods].sort((a, b) => a.sort_order - b.sort_order);
    const colors = ['#dc2626', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return sortedPeriods.map((period) => {
      const periodRecords = allRecords.filter((r) => r.period_id === period.id);
      const values = competitors.map((comp, idx) => {
        const rec = periodRecords.find((r) => r.competitor_id === comp.id);
        return { name: comp.name, value: rec?.estimated_visits || 0, color: comp.is_madesa ? '#dc2626' : colors[idx % colors.length] };
      });
      return { label: period.name.replace(' 2026', ''), values };
    });
  }, [allRecords, periods, competitors]);

  async function deleteRecord(id: string) {
    await supabase.from('traffic_records').delete().eq('id', id);
    refresh();
  }

  return (
    <>
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <div className="text-amber-600 mt-0.5"><TrendingUp size={18} /></div>
          <p className="text-sm text-amber-800"><strong>Visitas estimadas según Semrush.</strong> Estas cifras son estimaciones de tráfico web y no representan ventas reales ni datos internos de las empresas.</p>
        </div>
        {editMode && <div className="flex justify-end">
          <Button onClick={() => setShowForm(true)}><Plus size={16} className="mr-1.5 inline" /> Registrar tráfico</Button>
        </div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedRecords.map((r) => {
            const comp = r.competitors;
            if (!comp) return null;
            const mom = r.mom_growth_pct || 0;
            const yoy = r.yoy_growth_pct || 0;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <div><h3 className="font-display font-semibold text-gray-900">{comp.name}</h3><p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Globe size={12} /> {r.domain}</p></div>
                  <div className="flex items-center gap-1 shrink-0">
                    {comp.is_madesa && <span className="text-xs font-semibold text-madesa-600 bg-madesa-50 px-2 py-0.5 rounded">Madesa</span>}
                    <button onClick={() => deleteRecord(r.id)} className="text-gray-300 hover:text-red-600 p-1">{editMode && <Trash2 size={14} />}</button>
                  </div>
                </div>
                <div className="mt-4"><p className="text-xs text-gray-400">Visitas estimadas</p><p className="font-display font-bold text-2xl text-gray-900">{formatNumber(r.estimated_visits)}</p></div>
                <div className="mt-3 grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
                  <div><p className="text-xs text-gray-400">MoM</p><p className={`font-display font-semibold flex items-center gap-1 ${mom > 0 ? 'text-green-600' : mom < 0 ? 'text-red-600' : 'text-gray-400'}`}>{mom > 0 ? <TrendingUp size={14} /> : mom < 0 ? <TrendingDown size={14} /> : null}{mom > 0 ? '+' : ''}{formatPercent(mom)}</p></div>
                  <div><p className="text-xs text-gray-400">YoY</p><p className={`font-display font-semibold flex items-center gap-1 ${yoy > 0 ? 'text-green-600' : yoy < 0 ? 'text-red-600' : 'text-gray-400'}`}>{yoy > 0 ? <TrendingUp size={14} /> : yoy < 0 ? <TrendingDown size={14} /> : null}{yoy > 0 ? '+' : ''}{formatPercent(yoy)}</p></div>
                </div>
                <div className="mt-3 flex gap-3 text-xs text-gray-400"><span>Móvil: {r.mobile_traffic_pct}%</span><span>Desktop: {r.desktop_traffic_pct}%</span></div>
              </div>
            );
          })}
        </div>
        <Card title="Evolución del tráfico" subtitle="Visitas estimadas por período según Semrush"><MultiLineChart data={evolutionData} formatValue={(v) => formatNumber(v)} /></Card>
        <Card title="Comparativa de tráfico" subtitle="Período seleccionado">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Competidor</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Dominio</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Visitas</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Móvil</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Desktop</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">MoM</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">YoY</th>
              </tr></thead>
              <tbody>
                {sortedRecords.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-3 font-medium text-gray-900">{r.competitors?.name}{r.competitors?.is_madesa && <span className="ml-2 text-xs text-madesa-600 font-semibold">Madesa</span>}</td>
                    <td className="py-3 px-3 text-gray-400 text-xs">{r.domain}</td>
                    <td className="py-3 px-3 text-right tabular-nums font-medium text-gray-900">{formatNumber(r.estimated_visits)}</td>
                    <td className="py-3 px-3 text-right tabular-nums text-gray-500">{r.mobile_traffic_pct}%</td>
                    <td className="py-3 px-3 text-right tabular-nums text-gray-500">{r.desktop_traffic_pct}%</td>
                    <td className={`py-3 px-3 text-right tabular-nums font-medium ${(r.mom_growth_pct || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>{(r.mom_growth_pct || 0) > 0 ? '+' : ''}{formatPercent(r.mom_growth_pct)}</td>
                    <td className={`py-3 px-3 text-right tabular-nums font-medium ${(r.yoy_growth_pct || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>{(r.yoy_growth_pct || 0) > 0 ? '+' : ''}{formatPercent(r.yoy_growth_pct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      <TrafficFormModal open={showForm} onClose={() => setShowForm(false)} competitors={competitors} periodId={selectedPeriodId} onSaved={() => { refresh(); setShowForm(false); }} />
    </>
  );
}

function TrafficFormModal({ open, onClose, competitors, periodId, onSaved }: {
  open: boolean; onClose: () => void; competitors: Competitor[]; periodId: string | null; onSaved: () => void;
}) {
  const [competitorId, setCompetitorId] = useState('');
  const [domain, setDomain] = useState('');
  const [estimatedVisits, setEstimatedVisits] = useState('');
  const [mobilePct, setMobilePct] = useState('');
  const [desktopPct, setDesktopPct] = useState('');
  const [momGrowth, setMomGrowth] = useState('');
  const [yoyGrowth, setYoyGrowth] = useState('');
  const [ranking, setRanking] = useState('');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCompetitorId(''); setDomain(''); setEstimatedVisits(''); setMobilePct(''); setDesktopPct('');
    setMomGrowth(''); setYoyGrowth(''); setRanking(''); setObservations('');
    setError(null);
  }, [open]);

  async function save() {
    if (!competitorId) { setError('Selecciona un competidor'); return; }
    if (!periodId) { setError('Selecciona un período'); return; }
    if (!domain.trim()) { setError('El dominio es obligatorio'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('traffic_records').insert({
      competitor_id: competitorId, period_id: periodId, domain: domain.trim(),
      estimated_visits: estimatedVisits ? parseInt(estimatedVisits) : null,
      mobile_traffic_pct: mobilePct ? parseFloat(mobilePct) : null, desktop_traffic_pct: desktopPct ? parseFloat(desktopPct) : null,
      mom_growth_pct: momGrowth ? parseFloat(momGrowth) : null, yoy_growth_pct: yoyGrowth ? parseFloat(yoyGrowth) : null,
      ranking: ranking ? parseInt(ranking) : null, observations: observations || null,
      query_date: new Date().toISOString().split('T')[0],
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar tráfico digital" subtitle="Datos de Semrush — visitas estimadas"
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button></>}>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Competidor"><Select value={competitorId} onChange={(e) => setCompetitorId(e.target.value)}><option value="">Seleccionar...</option>{competitors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Dominio"><TextInput value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="jamar.com" /></Field>
        <Field label="Visitas estimadas"><TextInput type="number" value={estimatedVisits} onChange={(e) => setEstimatedVisits(e.target.value)} placeholder="510000" /></Field>
        <Field label="Ranking"><TextInput type="number" value={ranking} onChange={(e) => setRanking(e.target.value)} /></Field>
        <Field label="Tráfico móvil (%)"><TextInput type="number" value={mobilePct} onChange={(e) => setMobilePct(e.target.value)} placeholder="58" /></Field>
        <Field label="Tráfico desktop (%)"><TextInput type="number" value={desktopPct} onChange={(e) => setDesktopPct(e.target.value)} placeholder="42" /></Field>
        <Field label="Crecimiento MoM (%)"><TextInput type="number" value={momGrowth} onChange={(e) => setMomGrowth(e.target.value)} placeholder="5.2" /></Field>
        <Field label="Crecimiento YoY (%)"><TextInput type="number" value={yoyGrowth} onChange={(e) => setYoyGrowth(e.target.value)} placeholder="18.0" /></Field>
        <Field label="Observaciones" className="md:col-span-2"><TextInput value={observations} onChange={(e) => setObservations(e.target.value)} placeholder="Visitas estimadas según Semrush" /></Field>
      </div>
    </Modal>
  );
}
