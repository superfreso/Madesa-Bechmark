import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppData } from '@/hooks/useAppData';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { Field, TextInput, TextArea, Select, Button } from '@/components/Form';
import { formatCOP } from '@/lib/format';
import { Shield, Truck, Wrench, Check, X, Minus, Plus, Trash2, MapPin, Clock, Pencil } from 'lucide-react';
import { useEditMode } from '@/hooks/useEditMode';
import { CompetitorAvatar } from '@/components/Logo';
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
  const [editing, setEditing] = useState<CommercialCondition | null>(null);
  const editMode = useEditMode();

  const refresh = useCallback(() => {
    if (!selectedPeriodId) return;
    supabase.from('commercial_conditions').select(`*, competitors (id, name, logo_url, is_madesa)`).eq('period_id', selectedPeriodId)
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
            <Button key={t} variant="secondary" onClick={() => { setFormType(t); setEditing(null); setShowForm(true); }}>
              <Plus size={16} className="mr-1.5 inline" /> {typeInfo[t].label}
            </Button>
          ))}
        </div>}
        {grouped.map(({ type, items }) => (
          <Card key={type} title={typeInfo[type].label} subtitle={`${items.length} competidores con datos registrados`}>
            {type === 'shipping' ? (
              <ShippingBogotaTable items={items} editMode={editMode} onDelete={deleteCondition} onEdit={(c) => { setFormType('shipping'); setEditing(c); setShowForm(true); }} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-gray-100">
                    <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Competidor</th>
                    {type === 'warranty' && <><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Disponibilidad</th><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Duración</th><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Cobertura</th><th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Exclusiones</th></>}
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
                        {type === 'installation' && <><td className="py-3 px-3 text-right tabular-nums text-gray-600">{c.value === 0 ? 'Gratis' : c.value ? formatCOP(c.value) : '—'}</td><td className="py-3 px-3 text-gray-400 text-xs">{c.conditions || '—'}</td></>}
                        <td className="py-3 px-3">{editMode && <button onClick={() => deleteCondition(c.id)} className="text-gray-300 hover:text-red-600"><Trash2 size={14} /></button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        ))}
      </div>
      <ConditionFormModal open={showForm} onClose={() => setShowForm(false)} competitors={competitors} periodId={selectedPeriodId} conditionType={formType} editing={editing} onSaved={() => { refresh(); setShowForm(false); }} />
    </>
  );
}

function ShippingBogotaTable({ items, editMode, onDelete, onEdit }: {
  items: (CommercialCondition & { competitors?: Competitor })[];
  editMode: boolean;
  onDelete: (id: string) => void;
  onEdit: (c: CommercialCondition) => void;
}) {
  if (items.length === 0) {
    return <div className="py-8 text-center text-gray-300 text-sm">Sin datos de envío registrados para este período</div>;
  }
  const sorted = [...items].sort((a, b) => {
    const aName = a.competitors?.name || '';
    const bName = b.competitors?.name || '';
    if (a.competitors?.is_madesa) return -1;
    if (b.competitors?.is_madesa) return 1;
    return aName.localeCompare(bName);
  });
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Empresa</th>
            <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase tracking-wider"><span className="inline-flex items-center gap-1"><Clock size={11} /> Tiempo Bogotá</span></th>
            <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase tracking-wider">Envío</th>
            <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase tracking-wider"><span className="inline-flex items-center gap-1"><MapPin size={11} /> Observación benchmark</span></th>
            <th className="py-2.5 px-3"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <td className="py-3.5 px-3">
                <div className="flex items-center gap-2.5">
                  <CompetitorAvatar name={c.competitors?.name || ''} size={28} logoUrl={c.competitors?.logo_url} />
                  <div>
                    <p className="font-medium text-gray-900">{c.competitors?.name}</p>
                    {c.competitors?.is_madesa && <span className="text-xs text-madesa-600 font-semibold">Madesa</span>}
                  </div>
                </div>
              </td>
              <td className="py-3.5 px-3 text-gray-700 font-medium">{c.estimated_time || '—'}</td>
              <td className="py-3.5 px-3"><ShippingBadge value={c.value} availability={c.availability} /></td>
              <td className="py-3.5 px-3 text-gray-500 text-xs max-w-md">{c.conditions || '—'}</td>
              <td className="py-3.5 px-3">
                {editMode && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => onEdit(c)} className="text-gray-300 hover:text-gray-600 p-1" aria-label="Editar"><Pencil size={14} /></button>
                    <button onClick={() => onDelete(c.id)} className="text-gray-300 hover:text-red-600 p-1" aria-label="Eliminar"><Trash2 size={14} /></button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ShippingBadge({ value, availability }: { value: number | null; availability: string | null }) {
  if (value === 0 || availability === 'included') {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-green-50 text-green-700"><Check size={12} /> Gratis</span>;
  }
  if (value && value > 0) {
    return <span className="text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-red-50 text-red-700"><span className="w-2 h-2 rounded-full bg-red-500" /> Pagado · {formatCOP(value)}</span>;
  }
  return <span className="text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1 bg-gray-100 text-gray-500"><Minus size={12} /> Sin dato</span>;
}

function ConditionFormModal({ open, onClose, competitors, periodId, conditionType, editing, onSaved }: {
  open: boolean; onClose: () => void; competitors: Competitor[]; periodId: string | null; conditionType: ConditionType; editing: CommercialCondition | null; onSaved: () => void;
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
    if (editing) {
      setCompetitorId(editing.competitor_id);
      setAvailability(editing.availability || 'available');
      setValue(editing.value?.toString() || '');
      setCoverage(editing.coverage || '');
      setDuration(editing.duration || '');
      setConditions(editing.conditions || '');
      setExclusions(editing.exclusions || '');
      setEstimatedTime(editing.estimated_time || '');
      setUrl(editing.url || '');
      setObservations(editing.observations || '');
    } else {
      setCompetitorId(''); setAvailability('available'); setValue(''); setCoverage(''); setDuration('');
      setConditions(''); setExclusions(''); setEstimatedTime(''); setUrl(''); setObservations('');
    }
    setError(null);
  }, [editing, open]);

  async function save() {
    if (!competitorId) { setError('Selecciona un competidor'); return; }
    if (!periodId) { setError('Selecciona un período'); return; }
    setSaving(true);
    const payload = {
      competitor_id: competitorId, period_id: periodId, condition_type: conditionType,
      availability, value: value ? parseFloat(value) : null, coverage: coverage || null,
      duration: duration || null, conditions: conditions || null, exclusions: exclusions || null,
      estimated_time: estimatedTime || null, url: url || null, observations: observations || null,
      query_date: new Date().toISOString().split('T')[0],
    };
    const { error: err } = editing
      ? await supabase.from('commercial_conditions').update(payload).eq('id', editing.id)
      : await supabase.from('commercial_conditions').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  const availabilityOptions = conditionType === 'installation'
    ? [{ value: 'included', label: 'Incluida' }, { value: 'available', label: 'Disponible' }, { value: 'not_available', label: 'No disponible' }]
    : [{ value: 'available', label: 'Disponible' }, { value: 'included', label: 'Incluida / Gratis' }, { value: 'not_available', label: 'No disponible' }];

  return (
    <Modal open={open} onClose={onClose} title={editing ? `Editar ${conditionType === 'warranty' ? 'garantía' : conditionType === 'shipping' ? 'envío' : 'instalación'}` : `Registrar ${conditionType === 'warranty' ? 'garantía' : conditionType === 'shipping' ? 'envío' : 'instalación'}`}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button></>}>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Competidor"><Select value={competitorId} onChange={(e) => setCompetitorId(e.target.value)} disabled={!!editing}><option value="">Seleccionar...</option>{competitors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
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
            <Field label="Costo envío Bogotá (COP)"><TextInput type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0 = gratis" /></Field>
            <Field label="Tiempo entrega Bogotá"><TextInput value={estimatedTime} onChange={(e) => setEstimatedTime(e.target.value)} placeholder="Ej: Hasta 3 días estándar" /></Field>
            <Field label="Cobertura" className="md:col-span-2"><TextInput value={coverage} onChange={(e) => setCoverage(e.target.value)} placeholder="Ej: Bogotá y zonas habilitadas" /></Field>
            <Field label="Observación benchmark" className="md:col-span-2"><TextArea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={3} placeholder="Ej: Gratis en modalidad elegible. También tiene opciones de 48 h..." /></Field>
          </>
        )}
        {conditionType === 'installation' && <Field label="Costo (COP)"><TextInput type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0 = gratis" /></Field>}
        {conditionType !== 'shipping' && <Field label="Condiciones" className="md:col-span-2"><TextArea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={2} /></Field>}
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
