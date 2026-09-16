import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppData } from '@/hooks/useAppData';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { Field, TextInput, TextArea, Select, Button } from '@/components/Form';
import { CreditCard, CheckCircle2, XCircle, Plus, Pencil, Trash2 } from 'lucide-react';
import { useEditMode } from '@/hooks/useEditMode';
import type { PaymentMethod, Competitor } from '@/types/database';

interface PaymentsProps {
  selectedPeriodId: string | null;
}

export function Payments({ selectedPeriodId }: PaymentsProps) {
  const { competitors } = useAppData();
  const [methods, setMethods] = useState<(PaymentMethod & { competitors?: Competitor })[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const editMode = useEditMode();

  const refresh = useCallback(() => {
    if (!selectedPeriodId) return;
    supabase.from('payment_methods').select(`*, competitors (id, name, is_madesa)`).eq('period_id', selectedPeriodId)
      .then(({ data }) => setMethods((data || []) as unknown as typeof methods));
  }, [selectedPeriodId]);

  useEffect(() => { refresh(); }, [refresh]);

  const byCompetitor = useMemo(() => {
    const map = new Map<string, { competitor: Competitor; methods: PaymentMethod[] }>();
    for (const m of methods) {
      const comp = m.competitors;
      if (!comp) continue;
      if (!map.has(comp.id)) map.set(comp.id, { competitor: comp, methods: [] });
      map.get(comp.id)!.methods.push(m);
    }
    return Array.from(map.values());
  }, [methods]);

  async function deleteMethod(id: string) {
    await supabase.from('payment_methods').delete().eq('id', id);
    refresh();
  }

  return (
    <>
      <div className="p-6 space-y-6 animate-fade-in">
        {editMode && <div className="flex justify-end">
          <Button onClick={() => { setEditingMethod(null); setShowForm(true); }}><Plus size={16} className="mr-1.5 inline" /> Agregar método de pago</Button>
        </div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {byCompetitor.map(({ competitor, methods: compMethods }) => {
            const comfort = calculatePaymentComfort(compMethods);
            return (
              <div key={competitor.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-gray-900">{competitor.name}</h3>
                  <ComfortBadge level={comfort.level} />
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                  <div className="flex justify-between"><span>Métodos disponibles</span><span className="font-medium text-gray-700">{compMethods.length}</span></div>
                  <div className="flex justify-between"><span>Ofrece MSI</span><span className="font-medium text-gray-700">{compMethods.some((m) => (m.interest_free_installments || 0) > 0) ? 'Sí' : 'No'}</span></div>
                  <div className="flex justify-between"><span>Cuotas máx. sin interés</span><span className="font-medium text-gray-700">{Math.max(0, ...compMethods.map((m) => m.interest_free_installments || 0))}</span></div>
                  <div className="flex justify-between"><span>Cuotas máx. totales</span><span className="font-medium text-gray-700">{Math.max(0, ...compMethods.map((m) => m.num_installments || 0))}</span></div>
                  <div className="flex justify-between"><span>Financiación propia</span><span className="font-medium text-gray-700">{compMethods.some((m) => m.method_type === 'store_credit') ? 'Sí' : 'No'}</span></div>
                  <div className="flex justify-between"><span>Financiación externa</span><span className="font-medium text-gray-700">{compMethods.some((m) => m.method_type === 'external_financing') ? 'Sí' : 'No'}</span></div>
                  <div className="flex justify-between"><span>Addi / BNPL</span><span className="font-medium text-gray-700">{compMethods.some((m) => m.method_type === 'bnpl') ? 'Sí' : 'No'}</span></div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400 font-medium mb-1">Justificación</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{comfort.reason}</p>
                </div>
              </div>
            );
          })}
        </div>
        {byCompetitor.map(({ competitor, methods: compMethods }) => (
          <Card key={competitor.id} title={`Métodos de pago — ${competitor.name}`} subtitle={`${compMethods.length} métodos registrados`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Método</th>
                  <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Cuotas</th>
                  <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">MSI</th>
                  <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Tasa</th>
                  <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Bancos</th>
                  <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Condiciones</th>
                  <th className="py-2.5 px-3"></th>
                </tr></thead>
                <tbody>
                  {compMethods.map((m) => {
                    const variableFields = (m.variable_fields || []) as string[];
                    const isVar = (f: string) => variableFields.includes(f);
                    return (
                      <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-3 font-medium text-gray-900"><div className="flex items-center gap-2"><CreditCard size={14} className="text-gray-400" />{m.method_name}</div></td>
                        <td className="text-right py-3 px-3 tabular-nums text-gray-500">{isVar('num_installments') ? <span className="italic text-amber-600">Variable</span> : (m.num_installments || '—')}</td>
                        <td className="text-right py-3 px-3 tabular-nums text-gray-700 font-medium">{isVar('interest_free_installments') ? <span className="italic text-amber-600">Variable</span> : (m.interest_free_installments || 0)}</td>
                        <td className="text-right py-3 px-3 tabular-nums text-gray-500">{isVar('interest_rate') ? <span className="italic text-amber-600">Variable</span> : (m.interest_rate ? `${m.interest_rate}%` : '—')}</td>
                        <td className="py-3 px-3 text-gray-400 text-xs">{m.participating_banks || '—'}</td>
                        <td className="py-3 px-3 text-gray-400 text-xs">{m.conditions || '—'}</td>
                        <td className="py-3 px-3">
                          {editMode && (
                            <div className="flex items-center gap-1">
                              <button onClick={() => { setEditingMethod(m); setShowForm(true); }} className="text-gray-300 hover:text-gray-600"><Pencil size={14} /></button>
                              <button onClick={() => deleteMethod(m.id)} className="text-gray-300 hover:text-red-600"><Trash2 size={14} /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
      <PaymentMethodFormModal open={showForm} onClose={() => setShowForm(false)} competitors={competitors} periodId={selectedPeriodId} editing={editingMethod} onSaved={() => { refresh(); setShowForm(false); }} />
    </>
  );
}

const methodTypes = [
  { value: 'credit_card', label: 'Tarjeta de crédito' },
  { value: 'debit_card', label: 'Tarjeta débito' },
  { value: 'pse', label: 'PSE' },
  { value: 'bnpl', label: 'Addi / Buy now pay later' },
  { value: 'wallet', label: 'Billetera digital' },
  { value: 'store_credit', label: 'Financiación propia' },
  { value: 'external_financing', label: 'Financiación externa' },
  { value: 'bank_transfer', label: 'Transferencia' },
  { value: 'other', label: 'Otro' },
];

const variableFieldsOptions = [
  { key: 'num_installments', label: 'Número de cuotas' },
  { key: 'interest_free_installments', label: 'Cuotas sin interés (MSI)' },
  { key: 'interest_rate', label: 'Tasa de interés' },
  { key: 'interest_installments', label: 'Cuotas con interés' },
  { key: 'min_amount', label: 'Monto mínimo' },
  { key: 'max_amount', label: 'Monto máximo' },
];

function PaymentMethodFormModal({ open, onClose, competitors, periodId, editing, onSaved }: {
  open: boolean; onClose: () => void; competitors: Competitor[]; periodId: string | null; editing: PaymentMethod | null; onSaved: () => void;
}) {
  const [competitorId, setCompetitorId] = useState('');
  const [methodName, setMethodName] = useState('');
  const [methodType, setMethodType] = useState('credit_card');
  const [numInstallments, setNumInstallments] = useState('');
  const [interestFree, setInterestFree] = useState('');
  const [interestInstallments, setInterestInstallments] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [banks, setBanks] = useState('');
  const [requirements, setRequirements] = useState('');
  const [conditions, setConditions] = useState('');
  const [url, setUrl] = useState('');
  const [observations, setObservations] = useState('');
  const [variableFields, setVariableFields] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setCompetitorId(editing.competitor_id);
      setMethodName(editing.method_name);
      setMethodType(editing.method_type || 'credit_card');
      setNumInstallments(editing.num_installments?.toString() || '');
      setInterestFree(editing.interest_free_installments?.toString() || '');
      setInterestInstallments(editing.interest_installments?.toString() || '');
      setInterestRate(editing.interest_rate?.toString() || '');
      setMinAmount(editing.min_amount?.toString() || '');
      setMaxAmount(editing.max_amount?.toString() || '');
      setBanks(editing.participating_banks || '');
      setRequirements(editing.requirements || '');
      setConditions(editing.conditions || '');
      setUrl(editing.url || '');
      setObservations(editing.observations || '');
      setVariableFields((editing.variable_fields as string[]) || []);
    } else {
      setCompetitorId(''); setMethodName(''); setMethodType('credit_card'); setNumInstallments(''); setInterestFree('');
      setInterestInstallments(''); setInterestRate(''); setMinAmount(''); setMaxAmount(''); setBanks('');
      setRequirements(''); setConditions(''); setUrl(''); setObservations(''); setVariableFields([]);
    }
    setError(null);
  }, [open, editing]);

  function toggleVariable(field: string) {
    setVariableFields((prev) => prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]);
  }

  async function save() {
    if (!competitorId) { setError('Selecciona un competidor'); return; }
    if (!periodId) { setError('Selecciona un período'); return; }
    if (!methodName.trim()) { setError('El nombre del método es obligatorio'); return; }
    setSaving(true);
    const payload = {
      competitor_id: competitorId, period_id: periodId, method_name: methodName.trim(), method_type: methodType,
      num_installments: numInstallments ? parseInt(numInstallments) : null,
      interest_free_installments: interestFree ? parseInt(interestFree) : null,
      interest_installments: interestInstallments ? parseInt(interestInstallments) : null,
      interest_rate: interestRate ? parseFloat(interestRate) : null,
      min_amount: minAmount ? parseFloat(minAmount) : null, max_amount: maxAmount ? parseFloat(maxAmount) : null,
      participating_banks: banks || null, requirements: requirements || null, conditions: conditions || null,
      url: url || null, observations: observations || null, variable_fields: variableFields,
    };
    const { error: err } = editing
      ? await supabase.from('payment_methods').update(payload).eq('id', editing.id)
      : await supabase.from('payment_methods').insert({ ...payload, query_date: new Date().toISOString().split('T')[0] });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar método de pago' : 'Agregar método de pago'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button></>}>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Competidor"><Select value={competitorId} onChange={(e) => setCompetitorId(e.target.value)}><option value="">Seleccionar...</option>{competitors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Nombre del método"><TextInput value={methodName} onChange={(e) => setMethodName(e.target.value)} placeholder="Tarjeta de crédito" /></Field>
        <Field label="Tipo de método"><Select value={methodType} onChange={(e) => setMethodType(e.target.value)}>{methodTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</Select></Field>
        <NumberFieldWithVariable label="Número de cuotas" value={numInstallments} onChange={setNumInstallments} fieldKey="num_installments" isVariable={variableFields.includes('num_installments')} onToggleVariable={() => toggleVariable('num_installments')} />
        <NumberFieldWithVariable label="Cuotas sin interés (MSI)" value={interestFree} onChange={setInterestFree} fieldKey="interest_free_installments" isVariable={variableFields.includes('interest_free_installments')} onToggleVariable={() => toggleVariable('interest_free_installments')} />
        <NumberFieldWithVariable label="Cuotas con interés" value={interestInstallments} onChange={setInterestInstallments} fieldKey="interest_installments" isVariable={variableFields.includes('interest_installments')} onToggleVariable={() => toggleVariable('interest_installments')} />
        <NumberFieldWithVariable label="Tasa de interés (%)" value={interestRate} onChange={setInterestRate} fieldKey="interest_rate" isVariable={variableFields.includes('interest_rate')} onToggleVariable={() => toggleVariable('interest_rate')} />
        <NumberFieldWithVariable label="Monto mínimo" value={minAmount} onChange={setMinAmount} fieldKey="min_amount" isVariable={variableFields.includes('min_amount')} onToggleVariable={() => toggleVariable('min_amount')} />
        <NumberFieldWithVariable label="Monto máximo" value={maxAmount} onChange={setMaxAmount} fieldKey="max_amount" isVariable={variableFields.includes('max_amount')} onToggleVariable={() => toggleVariable('max_amount')} />
        <Field label="Bancos participantes"><TextInput value={banks} onChange={(e) => setBanks(e.target.value)} placeholder="Bancolombia, Davivienda..." /></Field>
        <Field label="Requisitos" className="md:col-span-2"><TextInput value={requirements} onChange={(e) => setRequirements(e.target.value)} /></Field>
        <Field label="Condiciones" className="md:col-span-2"><TextArea value={conditions} onChange={(e) => setConditions(e.target.value)} rows={2} /></Field>
        <Field label="URL"><TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></Field>
        <Field label="Observaciones"><TextInput value={observations} onChange={(e) => setObservations(e.target.value)} /></Field>
      </div>
      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-700 font-medium mb-1">Campos variables</p>
        <p className="text-xs text-amber-600">Marca "Var." en cualquier campo numérico cuando el valor depende de análisis (ej. financiamiento). El campo se mostrará como "Variable" en la tabla.</p>
      </div>
    </Modal>
  );
}

function NumberFieldWithVariable({ label, value, onChange, fieldKey, isVariable, onToggleVariable }: {
  label: string; value: string; onChange: (v: string) => void; fieldKey: string; isVariable: boolean; onToggleVariable: () => void;
}) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <TextInput
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={isVariable}
          placeholder={isVariable ? 'Variable' : ''}
          className={isVariable ? 'bg-amber-50 border-amber-200' : ''}
        />
        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer whitespace-nowrap px-2 shrink-0">
          <input type="checkbox" checked={isVariable} onChange={onToggleVariable} className="rounded" />
          Var.
        </label>
      </div>
    </Field>
  );
}

interface ComfortResult { level: 'Alta' | 'Media' | 'Baja'; reason: string; }

function calculatePaymentComfort(methods: PaymentMethod[]): ComfortResult {
  if (methods.length === 0) return { level: 'Baja', reason: 'No hay métodos de pago registrados.' };
  const count = methods.length;
  const hasMSI = methods.some((m) => (m.interest_free_installments || 0) > 0);
  const maxMSI = Math.max(0, ...methods.map((m) => m.interest_free_installments || 0));
  const maxInstallments = Math.max(0, ...methods.map((m) => m.num_installments || 0));
  const hasStoreCredit = methods.some((m) => m.method_type === 'store_credit');
  const hasExternalFinancing = methods.some((m) => m.method_type === 'external_financing');
  const hasBNPL = methods.some((m) => m.method_type === 'bnpl');
  const hasPSE = methods.some((m) => m.method_type === 'pse');
  const hasWallet = methods.some((m) => m.method_type === 'wallet');
  const reasons: string[] = [];
  if (hasMSI) reasons.push(`${maxMSI} MSI disponibles`);
  if (hasStoreCredit) reasons.push('financiación propia');
  if (hasExternalFinancing) reasons.push('financiación externa');
  if (hasBNPL) reasons.push('Addi/BNPL disponible');
  if (hasPSE) reasons.push('PSE disponible');
  if (hasWallet) reasons.push('billetera digital disponible');
  if (maxInstallments >= 36) reasons.push(`hasta ${maxInstallments} cuotas`);
  let score = 0;
  if (count >= 4) score += 2; else if (count >= 2) score += 1;
  if (hasMSI) score += 2; if (maxMSI >= 12) score += 1;
  if (hasStoreCredit) score += 2; if (hasExternalFinancing) score += 1; if (hasBNPL) score += 1; if (hasPSE) score += 1;
  let level: 'Alta' | 'Media' | 'Baja';
  if (score >= 6) level = 'Alta'; else if (score >= 3) level = 'Media'; else level = 'Baja';
  return { level, reason: `${count} métodos disponibles · ${reasons.join(' · ') || 'sin facilidades destacadas'}` };
}

function ComfortBadge({ level }: { level: 'Alta' | 'Media' | 'Baja' }) {
  const styles = { Alta: 'bg-green-50 text-green-700 border-green-200', Media: 'bg-amber-50 text-amber-700 border-amber-200', Baja: 'bg-red-50 text-red-700 border-red-200' };
  const icons = { Alta: <CheckCircle2 size={14} />, Media: <CheckCircle2 size={14} />, Baja: <XCircle size={14} /> };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${styles[level]}`}>{icons[level]} Comodidad {level}</span>;
}
