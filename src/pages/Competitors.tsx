import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppData } from '@/hooks/useAppData';
import { Card } from '@/components/Card';
import { CompetitorAvatar } from '@/components/Logo';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Field, TextInput, TextArea, Select, Button } from '@/components/Form';
import { formatCOP } from '@/lib/format';
import { calculateStats } from '@/lib/calculations';
import { ExternalLink, ArrowRight, Globe, Shield, Truck, Wrench as WrenchIcon, CreditCard, Plus, Pencil, Trash2, Upload } from 'lucide-react';
import { useEditMode } from '@/hooks/useEditMode';
import type { PriceRecord, Product, CommercialCondition, PaymentMethod, TrafficRecord, Competitor, Category, AnalysisPeriod } from '@/types/database';

interface CompetitorsProps {
  selectedPeriodId: string | null;
  initialCompetitorId?: string | null;
  onConsumedCompetitorId?: () => void;
}

export function Competitors({ selectedPeriodId, initialCompetitorId, onConsumedCompetitorId }: CompetitorsProps) {
  const { competitors: initialCompetitors, categories, periods } = useAppData();
  const [competitors, setCompetitors] = useState<Competitor[]>(initialCompetitors);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState<string | null>(initialCompetitorId || null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Competitor | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Competitor | null>(null);
  const editMode = useEditMode();

  useEffect(() => { setCompetitors(initialCompetitors); }, [initialCompetitors]);

  useEffect(() => {
    if (initialCompetitorId) {
      setSelectedCompetitorId(initialCompetitorId);
      onConsumedCompetitorId?.();
    }
  }, [initialCompetitorId]);

  const refresh = useCallback(() => {
    supabase.from('competitors').select('*').order('is_madesa', { ascending: false }).order('name')
      .then(({ data }) => setCompetitors(data || []));
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.logo_url) {
      const path = deleteTarget.logo_url.split('/competitor-logos/')[1];
      if (path) await supabase.storage.from('competitor-logos').remove([path]);
    }
    await supabase.from('competitors').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    refresh();
  }

  if (selectedCompetitorId) {
    return (
      <CompetitorDetail
        competitorId={selectedCompetitorId}
        onBack={() => setSelectedCompetitorId(null)}
        selectedPeriodId={selectedPeriodId}
        allCompetitors={competitors}
        allCategories={categories}
        allPeriods={periods}
      />
    );
  }

  return (
    <>
      <CompetitorList
        competitors={competitors}
        periods={periods}
        selectedPeriodId={selectedPeriodId}
        onSelect={setSelectedCompetitorId}
        editMode={editMode}
        onAdd={() => { setEditing(null); setShowForm(true); }}
        onEdit={(comp) => { setEditing(comp); setShowForm(true); }}
        onDelete={(comp) => setDeleteTarget(comp)}
      />
      <CompetitorFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        editing={editing}
        onSaved={() => { refresh(); setShowForm(false); }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar competidor"
        message={`¿Seguro que quieres eliminar "${deleteTarget?.name}"? Se eliminarán también todos sus productos, precios y datos asociados.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

function CompetitorList({ competitors, periods, selectedPeriodId, onSelect, editMode, onAdd, onEdit, onDelete }: {
  competitors: Competitor[];
  periods: AnalysisPeriod[];
  selectedPeriodId: string | null;
  onSelect: (id: string) => void;
  editMode: boolean;
  onAdd: () => void;
  onEdit: (comp: Competitor) => void;
  onDelete: (comp: Competitor) => void;
}) {
  const [priceData, setPriceData] = useState<Record<string, { avg: number; count: number }>>({});

  useEffect(() => {
    if (!selectedPeriodId) return;
    supabase
      .from('price_records')
      .select(`normal_price, promo_price, products (competitor_id)`)
      .eq('period_id', selectedPeriodId)
      .then(({ data }) => {
        const map = new Map<string, number[]>();
        for (const r of (data || []) as unknown as { normal_price: number; promo_price: number | null; products: { competitor_id: string } }[]) {
          const cid = r.products?.competitor_id;
          if (!cid) continue;
          if (!map.has(cid)) map.set(cid, []);
          map.get(cid)!.push(r.promo_price || r.normal_price);
        }
        const result: Record<string, { avg: number; count: number }> = {};
        map.forEach((prices, cid) => {
          const stats = calculateStats(prices);
          result[cid] = { avg: Math.round(stats.avg), count: stats.count };
        });
        setPriceData(result);
      });
  }, [selectedPeriodId]);

  const selectedPeriod = periods.find((p) => p.id === selectedPeriodId);

  return (
    <div className="p-6 space-y-4 animate-fade-in">
      {editMode && <div className="flex justify-end">
        <Button onClick={onAdd}><Plus size={16} className="mr-1.5 inline" /> Agregar competidor</Button>
      </div>}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {competitors.map((comp) => {
          const data = priceData[comp.id];
          return (
            <div
              key={comp.id}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <div className="flex items-start justify-between">
                <button onClick={() => onSelect(comp.id)} className="flex items-center gap-3 text-left min-w-0 flex-1">
                  <CompetitorAvatar name={comp.name} size={48} logoUrl={comp.logo_url} />
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-gray-900 truncate">{comp.name}</h3>
                    {comp.website && (
                      <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Globe size={12} /> {comp.website.replace('https://www.', '')}
                      </span>
                    )}
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  {comp.is_madesa && <span className="text-xs font-semibold text-madesa-600 bg-madesa-50 px-2 py-1 rounded">Madesa</span>}
                  {editMode && (
                    <>
                      <button onClick={() => onEdit(comp)} className="text-gray-300 hover:text-gray-600 p-1">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => onDelete(comp)} className="text-gray-300 hover:text-red-600 p-1">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <button onClick={() => onSelect(comp.id)} className="block w-full text-left">
                <p className="text-sm text-gray-500 mt-3 line-clamp-2">{comp.description || 'Sin descripción'}</p>
                <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-400">Promedio {selectedPeriod?.name || ''}</p>
                    <p className="font-display font-bold text-gray-900">
                      {data ? formatCOP(data.avg) : '—'}
                      {data && <span className="text-xs text-gray-400 font-normal ml-1.5">· {data.count} productos</span>}
                    </p>
                  </div>
                  <ArrowRight size={18} className="text-gray-300 group-hover:text-madesa-600 transition-colors" />
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompetitorFormModal({ open, onClose, editing, onSaved }: {
  open: boolean;
  onClose: () => void;
  editing: Competitor | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('Colombia');
  const [description, setDescription] = useState('');
  const [isMadesa, setIsMadesa] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setWebsite(editing.website || '');
      setCountry(editing.country);
      setDescription(editing.description || '');
      setIsMadesa(editing.is_madesa);
      setIsActive(editing.is_active);
      setLogoUrl(editing.logo_url);
    } else {
      setName(''); setWebsite(''); setCountry('Colombia'); setDescription(''); setIsMadesa(false); setIsActive(true); setLogoUrl(null);
    }
    setError(null);
  }, [editing, open]);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError('La imagen no debe superar 2MB'); return; }
    setUploading(true);
    setError(null);
    const ext = file.name.split('.').pop();
    const fileName = `logo-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('competitor-logos').upload(fileName, file, { cacheControl: '3600', upsert: true });
    if (upErr) { setError(upErr.message); setUploading(false); return; }
    const { data: pubData } = supabase.storage.from('competitor-logos').getPublicUrl(fileName);
    setLogoUrl(pubData.publicUrl);
    setUploading(false);
  }

  async function save() {
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true);
    const payload = { name: name.trim(), website: website || null, country, description: description || null, is_madesa: isMadesa, is_active: isActive, logo_url: logoUrl };
    const { error: err } = editing
      ? await supabase.from('competitors').update(payload).eq('id', editing.id)
      : await supabase.from('competitors').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar competidor' : 'Agregar competidor'}
      subtitle="Los cambios se guardan inmediatamente en la base de datos"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
        </>
      }
    >
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
      <div className="space-y-4">
        <Field label="Logo del competidor">
          <div className="flex items-center gap-4">
            <CompetitorAvatar name={name || '?'} size={64} logoUrl={logoUrl} />
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors">
                <Upload size={14} />
                {uploading ? 'Subiendo...' : 'Subir imagen'}
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
              </label>
              {logoUrl && <button onClick={() => setLogoUrl(null)} className="text-xs text-gray-400 hover:text-red-500 text-left">Quitar logo</button>}
            </div>
          </div>
        </Field>
        <Field label="Nombre"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Jamar" /></Field>
        <Field label="Sitio web"><TextInput value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." /></Field>
        <Field label="País"><TextInput value={country} onChange={(e) => setCountry(e.target.value)} /></Field>
        <Field label="Descripción"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Breve descripción del competidor" /></Field>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={isMadesa} onChange={(e) => setIsMadesa(e.target.checked)} className="rounded" />
            Es Madesa
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" />
            Activo
          </label>
        </div>
      </div>
    </Modal>
  );
}

function CompetitorDetail({ competitorId, onBack, selectedPeriodId, allCompetitors, allCategories, allPeriods }: {
  competitorId: string;
  onBack: () => void;
  selectedPeriodId: string | null;
  allCompetitors: Competitor[];
  allCategories: Category[];
  allPeriods: AnalysisPeriod[];
}) {
  const competitor = allCompetitors.find((c) => c.id === competitorId);
  const [products, setProducts] = useState<(Product & { categories?: Category })[]>([]);
  const [priceRecords, setPriceRecords] = useState<(PriceRecord & { analysis_periods?: AnalysisPeriod })[]>([]);
  const [conditions, setConditions] = useState<CommercialCondition[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [traffic, setTraffic] = useState<TrafficRecord[]>([]);

  useEffect(() => {
    if (!competitorId) return;
    supabase.from('products').select(`*, categories (id, name)`).eq('competitor_id', competitorId).order('name')
      .then(({ data }) => setProducts((data || []) as unknown as typeof products));
  }, [competitorId]);

  useEffect(() => {
    if (products.length === 0) { setPriceRecords([]); return; }
    supabase.from('price_records').select(`*, analysis_periods (id, name, period_code, sort_order)`)
      .in('product_id', products.map((p) => p.id))
      .order('query_date', { ascending: false })
      .then(({ data }) => setPriceRecords((data || []) as unknown as typeof priceRecords));
  }, [products]);

  useEffect(() => {
    if (!competitorId || !selectedPeriodId) return;
    supabase.from('commercial_conditions').select('*').eq('competitor_id', competitorId).eq('period_id', selectedPeriodId)
      .then(({ data }) => setConditions(data || []));
    supabase.from('payment_methods').select('*').eq('competitor_id', competitorId).eq('period_id', selectedPeriodId)
      .then(({ data }) => setPaymentMethods(data || []));
    supabase.from('traffic_records').select('*').eq('competitor_id', competitorId).eq('period_id', selectedPeriodId)
      .then(({ data }) => setTraffic(data || []));
  }, [competitorId, selectedPeriodId]);

  if (!competitor) return null;

  const allPrices = priceRecords.map((r) => r.promo_price || r.normal_price);
  const stats = calculateStats(allPrices);
  const warranty = conditions.find((c) => c.condition_type === 'warranty');
  const shipping = conditions.find((c) => c.condition_type === 'shipping');
  const installation = conditions.find((c) => c.condition_type === 'installation');

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1">← Volver a competidores</button>
      <div className="flex items-start gap-5 bg-white rounded-xl border border-gray-200 p-6">
        <CompetitorAvatar name={competitor.name} size={64} logoUrl={competitor.logo_url} />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="font-display font-extrabold text-2xl text-gray-900">{competitor.name}</h2>
            {competitor.is_madesa && <span className="text-xs font-semibold text-madesa-600 bg-madesa-50 px-2 py-1 rounded">Madesa</span>}
          </div>
          {competitor.website && (
            <a href={competitor.website} target="_blank" rel="noopener noreferrer" className="text-sm text-madesa-600 hover:underline flex items-center gap-1 mt-1">
              <ExternalLink size={14} /> {competitor.website}
            </a>
          )}
          <p className="text-sm text-gray-500 mt-2">{competitor.description}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-400">Precio promedio histórico</p>
          <p className="font-display font-bold text-2xl text-gray-900">{formatCOP(Math.round(stats.avg))}</p>
          <p className="text-xs text-gray-400">{stats.count} registros</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ConditionCard icon={<Shield size={18} />} title="Garantía" condition={warranty} />
        <ConditionCard icon={<Truck size={18} />} title="Envío" condition={shipping} />
        <ConditionCard icon={<WrenchIcon size={18} />} title="Instalación" condition={installation} />
      </div>
      {traffic.length > 0 && (
        <Card title="Tráfico digital" subtitle="Visitas estimadas según Semrush">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-xs text-gray-400">Visitas estimadas</p><p className="font-display font-bold text-xl text-gray-900">{traffic[0].estimated_visits?.toLocaleString('es-CO') || '—'}</p></div>
            <div><p className="text-xs text-gray-400">Tráfico móvil</p><p className="font-display font-bold text-xl text-gray-900">{traffic[0].mobile_traffic_pct}%</p></div>
            <div><p className="text-xs text-gray-400">Crecimiento MoM</p><p className="font-display font-bold text-xl text-gray-900">{(traffic[0].mom_growth_pct ?? 0) > 0 ? '+' : ''}{traffic[0].mom_growth_pct ?? '—'}{traffic[0].mom_growth_pct != null ? '%' : ''}</p></div>
            <div><p className="text-xs text-gray-400">Crecimiento YoY</p><p className="font-display font-bold text-xl text-gray-900">{(traffic[0].yoy_growth_pct ?? 0) > 0 ? '+' : ''}{traffic[0].yoy_growth_pct ?? '—'}{traffic[0].yoy_growth_pct != null ? '%' : ''}</p></div>
          </div>
        </Card>
      )}
      {paymentMethods.length > 0 && (
        <Card title="Métodos de pago" subtitle={`${paymentMethods.length} métodos registrados`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2"><CreditCard size={16} className="text-gray-400" /><span className="font-medium text-gray-900 text-sm">{pm.method_name}</span></div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {pm.interest_free_installments && <span>MSI: {pm.interest_free_installments}</span>}
                  {pm.num_installments && <span>Cuotas máx: {pm.num_installments}</span>}
                  {pm.interest_rate && <span>Tasa: {pm.interest_rate}%</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
      <Card title="Productos analizados" subtitle={`${products.length} productos registrados`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Producto</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Categoría</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">SKU</th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Dimensiones</th>
            </tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-gray-900">{p.name}</td>
                  <td className="py-3 px-3 text-gray-500">{p.categories?.name || '—'}</td>
                  <td className="py-3 px-3 text-gray-400">{p.sku || '—'}</td>
                  <td className="py-3 px-3 text-right text-gray-500 text-xs">{p.width_cm ? `${p.width_cm}×${p.height_cm}×${p.depth_cm} cm` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {priceRecords.length > 0 && (
        <Card title="Historial de precios" subtitle={`${priceRecords.length} registros históricos`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Producto</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Período</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Precio normal</th>
                <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Precio promo</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Fecha</th>
              </tr></thead>
              <tbody>
                {priceRecords.slice(0, 20).map((r) => {
                  const product = products.find((p) => p.id === r.product_id);
                  return (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-3 font-medium text-gray-700">{product?.name || '—'}</td>
                      <td className="py-3 px-3 text-gray-500">{r.analysis_periods?.name || '—'}</td>
                      <td className="py-3 px-3 text-right tabular-nums text-gray-500">{formatCOP(r.normal_price)}</td>
                      <td className="py-3 px-3 text-right tabular-nums font-medium text-gray-900">{formatCOP(r.promo_price)}</td>
                      <td className="py-3 px-3 text-gray-400 text-xs">{r.query_date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function ConditionCard({ icon, title, condition }: { icon: React.ReactNode; title: string; condition?: CommercialCondition }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center gap-2 text-gray-400 mb-3">{icon}<span className="text-xs font-medium uppercase tracking-wider">{title}</span></div>
      {condition ? (
        <div className="space-y-1.5 text-sm">
          <p className="font-medium text-gray-900">{condition.availability === 'included' ? 'Incluida' : condition.availability === 'available' ? 'Disponible' : condition.availability === 'not_available' ? 'No disponible' : condition.availability}</p>
          {condition.duration && <p className="text-gray-500">Duración: {condition.duration}</p>}
          {condition.value !== null && condition.value !== undefined && condition.value > 0 && <p className="text-gray-500">Costo: {formatCOP(condition.value)}</p>}
          {condition.coverage && <p className="text-gray-500">Cobertura: {condition.coverage}</p>}
          {condition.estimated_time && <p className="text-gray-500">Tiempo: {condition.estimated_time}</p>}
          {condition.conditions && <p className="text-gray-400 text-xs mt-2">{condition.conditions}</p>}
        </div>
      ) : <p className="text-sm text-gray-300">Sin datos registrados</p>}
    </div>
  );
}
