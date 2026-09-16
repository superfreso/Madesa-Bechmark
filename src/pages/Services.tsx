import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppData } from '@/hooks/useAppData';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { Field, TextInput, TextArea, Select, Button } from '@/components/Form';
import { formatCOP } from '@/lib/format';
import { Shield, Truck, Wrench, Check, X, Minus, Plus, Trash2 } from 'lucide-react';
import { useEditMode } from '@/hooks/useEditMode';
import type { CommercialCondition, Competitor } from '@/types/database';

interface ServicesProps {
  selectedPeriodId: string | null;
}

type ConditionType = 'warranty' | 'shipping' | 'installation';

export function Services({ selectedPeriodId }: ServicesProps) {
  const { competitors } = useAppData();
  const [conditions, setConditions] = useState<(CommercialCondition & { competitors?: Competitor })[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<ConditionType>('warranty');
  const editMode = useEditMode();

  const refresh = useCallback(() => {
    if (!selectedPeriodId) return;
    supabase.from('commercial_conditions').select(`*, competitors (id, name, is_madesa)`).eq('period_id', selectedPeriodId)
      .then(({ data }) => setConditions((data || []) as unknown as typeof conditions));
  }, [selectedPeriodId]);

  useEffect(() => { refresh(); }, [refresh]);

  const grouped = useMemo(() => {
    const types: ConditionType[] = ['warranty', 'shipping', 'installation'];
    return types.map((type) => ({ type, items: conditions.filter((c) => c.condition_type === type) }));
  }, [conditions]);

  const typeInfo: Record<ConditionType, { label: string; icon: React.ReactNode }> = {
    warranty: { label: 'Garantía', icon: <Shield size={18} /> },
    shipping: { label: 'Envío', icon: <Truck size={18} /> },
    installation: { label: 'Instalación', icon: <Wrench size={18} /> },
  };

  async function deleteCondition(id: string) {
    await supabase.from('commercial_conditions').delete().eq('id', id);
    refresh();
  }

  return (
    <>
      <div className="p-6 space-y-6 animate-fade-in">
        {editMode && <div className="flex justify-end gap-2">
          {(['warranty', 'shipping', 'installation'] as ConditionType[]).map((t) => (
            <Button key={t} variant="secondary" onClick={() => { setFormType(t); setShowForm(true); }}>
              <Plus size={16} className="mr-1.5 inline" /> {typeInfo[t].label}
            </Button>
          ))}
        </div>}
        {grouped.map(({ type, items }) => (
          <Card key={type} title={typeInfo[type].label} subtitle={`${items.length} competidores con datos registrados`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Competidor</th>
                  {type === 'warranty' && <><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Disponibilidad</th><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Duración</th><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Cobertura</th><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Exclusiones</th></>}
                  {type === 'shipping' && <><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Disponibilidad</th><th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Costo</th><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Tiempo</th><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Condiciones</th></>}
                  {type === 'installation' && <><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Disponibilidad</th><th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Costo</th><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Condiciones</th></>}
                  <th className="py-2.5 px-3"></th>
                </tr></thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-center text-gray-300 text-sm">Sin datos registrados para este período</td></tr>
                  ) : items.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium text-gray-900">{c.competitors?.name}{c.competitors?.is_madesa && <span className="ml-2 text-xs text-madesa-600 font-semibold">Madesa</span>}</td>
                      <td className="py-3 px-3"><AvailabilityBadge availability={c.availability} /></td>
                      {type === 'warranty' && <><td className="py-3 px-3 text-gray-600">{c.duration || '—'}</td><td className="py-3 px-3 text-gray-500 text-xs">{c.coverage || '—'}</td><td className="py-3 px-3 text-gray-400 text-xs">{c.exclusions || '—'}</td></>}
                      {type === 'shipping' && <><td className="py-3 px-3 text-right tabular-nums text-gray-600">{c.value === 0 ? 'Gratis' : c.value ? formatCOP(c.value) : '—'}</td><td className="py-3 px-3 text-gray-500 text-xs">{c.estimated_time || '—'}</td><td className="py-3 px-3 text-gray-400 text-xs">{c.conditions || '—'}</td></>}
                      {type === 'installation' && <><td className="py-3 px-3 text-right tabular-nums text-gray-600">{c.value === 0 ? 'Gratis' : c.value ? formatCOP(c.value) : '—'}</td><td className="py-3 px-3 text-gray-400 text-xs">{c.conditions || '—'}</td></>}
                      <td className="py-3 px-3">{editMode && <button onClick={() => deleteCondition(c.id)} className="text-gray-300 hover:text-red-600"><Trash2 size={14} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
      <ConditionFormModal open={showForm} onClose={() => setShowForm(false)} competitors={competitors} periodId={selectedPeriodId} conditionType={formType} onSaved={() => { refresh(); setShowForm(false); }} />
    </>
  );
}

function ConditionFormModal({ open, onClose, competitors, periodId, conditionType, onSaved }: {
  open: boolean; onClose: () => void; competitors: Competitor[]; periodId: string | null; conditionType: ConditionType; onSaved: () => void;
}) {
  const [competitorId, setCompetitorId] = useState('');
  const [availability, setAvailability] = useState('available');
  const [value, setValue] = useState('');
  const [coverage, setCoverage] = useState('');
  const [duration, setDuration] = useState('');
  const [conditions, setConditions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [url, setUrl] = useState('');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCompetitorId(''); setAvailability('available'); setValue(''); setCoverage(''); setDuration('');
    setConditions(''); setExclusions(''); setEstimatedTime(''); setUrl(''); setObservations('');
    setError(null);
  }, [open]);

  async function save() {
    if (!competitorId) { setError('Selecciona un competidor'); return; }
    if (!periodId) { setError('Selecciona un período'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('commercial_conditions').insert({
      competitor_id: competitorId, period_id: periodId, condition_type: conditionType,
      availability, value: value ? parseFloat(value) : null, coverage: coverage || null,
      duration: duration || null, conditions: conditions || null, exclusions: exclusions || null,
      estimated_time: estimatedTime || null, url: url || null, observations: observations || null,
      query_date: new Date().toISOString().split('T')[0],
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  const availabilityOptions = conditionType === 'installation'
    ? [{ value: 'included', label: 'Incluida' }, { value: 'available', label: 'Disponible' }, { value: 'not_available', label: 'No disponible' }]
    : [{ value: 'available', label: 'Disponible' }, { value: 'included', label: 'Incluida' }, { value: 'not_available', label: 'No disponible' }];

  return (
    <Modal open={open} onClose={onClose} title={`Registrar ${conditionType === 'warranty' ? 'garantía' : conditionType === 'shipping' ? 'envío' : 'instalación'}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button></>}>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Competidor"><Select value={competitorId} onChange={(e) => setCompetitorId(e.target.value)}><option value="">Seleccionar...</option>{competitors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Disponibilidad"><Select value={availability} onChange={(e) => setAvailability(e.target.value)}>{availabilityOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select></Field>
        {conditionType === 'warranty' && (
          <>
            <Field label="Duración"><TextInput value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="5 años" /></Field>
            <Field label="Cobertura"><TextInput value={coverage} onChange={(e) => setCoverage(e.target.value)} /></Field>
            <Field label="Exclusiones"><TextInput value={exclusions} onChange={(e) => setExclusions(e.target.value)} /></Field>
          </>
        )}
        {conditionType === 'shipping' && (
          <>
            <Field label="Costo (COP)"><TextInput type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0 = gratis" /></Field>
            <Field label="Tiempo estimado"><TextInput value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} placeholder="3-5 días hábiles" /></Field>
            <Field label="Cobertura"><TextInput value={coverage} onChange={(e) => setCoverage(e.target.value)} /></Field>
          </>
        )}
        {conditionType === 'installation' && <Field label="Costo (COP)"><TextInput type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0 = gratis" /></Field>}
        <Field label="Condiciones" className="md:col-span-2"><TextArea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={2} /></Field>
        <Field label="URL"><TextInput value={url} onChange={(e) => setUrl(e.target.value)} /></Field>
        <Field label="Observaciones"><TextInput value={observations} onChange={(e) => setObservations(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function AvailabilityBadge({ availability }: { availability: string | null }) {
  if (!availability) return <span className="text-gray-300 text-xs">—</span>;
  const map: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
    available: { label: 'Disponible', class: 'bg-blue-50 text-blue-700', icon: <Check size={12} /> },
    included: { label: 'Incluida', class: 'bg-green-50 text-green-700', icon: <Check size={12} /> },
    not_available: { label: 'No disponible', class: 'bg-red-50 text-red-700', icon: <X size={12} /> },
  };
  const info = map[availability] || { label: availability, class: 'bg-gray-100 text-gray-600', icon: <Minus size={12} /> };
  return <span className={`text-xs font-medium px-2 py-1 rounded inline-flex items-center gap-1 ${info.class}`}>{info.icon} {info.label}</span>;
}
