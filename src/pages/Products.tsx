import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppData } from '@/hooks/useAppData';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { Field, TextInput, TextArea, Select, Button } from '@/components/Form';
import { formatCOP, formatDimension } from '@/lib/format';
import { calculateStats } from '@/lib/calculations';
import { ExternalLink, ArrowRight, Ruler, Plus, Pencil, Trash2, DollarSign, LayoutGrid } from 'lucide-react';
import { useEditMode } from '@/hooks/useEditMode';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { CompetitorAvatar } from '@/components/Logo';
import { getCategoryIcon } from '@/lib/categoryIcons';
import type { Product, PriceRecord, Competitor, Category, AnalysisPeriod } from '@/types/database';

interface ProductsProps {
  selectedPeriodId: string | null;
}

export function Products({ selectedPeriodId }: ProductsProps) {
  const { competitors, categories } = useAppData();
  const [products, setProducts] = useState<(Product & { competitors?: Competitor; categories?: Category })[]>([]);
  const [priceRecords, setPriceRecords] = useState<Record<string, PriceRecord[]>>({});
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [filterCompetitor, setFilterCompetitor] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const editMode = useEditMode();

  const refresh = useCallback(() => {
    let query = supabase.from('products').select(`*, competitors (id, name, is_madesa), categories (id, name)`).order('name');
    if (filterCompetitor !== 'all') query = query.eq('competitor_id', filterCompetitor);
    if (filterCategory !== 'all') query = query.eq('category_id', filterCategory);
    query.then(({ data }) => setProducts((data || []) as unknown as typeof products));
  }, [filterCompetitor, filterCategory]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (products.length === 0) return;
    supabase
      .from('price_records')
      .select(`*, analysis_periods (id, name, period_code, sort_order)`)
      .in('product_id', products.map((p) => p.id))
      .order('query_date', { ascending: false })
      .then(({ data }) => {
        const map: Record<string, PriceRecord[]> = {};
        for (const r of (data || []) as unknown as (PriceRecord & { analysis_periods?: AnalysisPeriod })[]) {
          if (!map[r.product_id]) map[r.product_id] = [];
          map[r.product_id].push(r);
        }
        setPriceRecords(map);
      });
  }, [products]);

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('price_records').delete().eq('product_id', deleteTarget.id);
    await supabase.from('products').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    refresh();
  }

  if (selectedProductId) {
    const product = products.find((p) => p.id === selectedProductId);
    if (product) {
      return (
        <ProductDetail
          product={product}
          priceHistory={priceRecords[selectedProductId] || []}
          onBack={() => setSelectedProductId(null)}
          selectedPeriodId={selectedPeriodId}
        />
      );
    }
  }

  return (
    <>
      <div className="p-6 space-y-5 animate-fade-in">
        {/* Competitor filter chips */
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Competidor</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setFilterCompetitor('all')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                filterCompetitor === 'all'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
              }`
            >
              <LayoutGrid size={16} />
              Todos
            </button>
            {competitors.map((c) => {
              const active = filterCompetitor === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setFilterCompetitor(c.id)}
                  className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <CompetitorAvatar name={c.name} size={26} logoUrl={c.logo_url} />
                  <span className="truncate max-w-[120px]">{c.name}</span>
                  {c.is_madesa && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-madesa-50 text-madesa-600'}`}>
                      M
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category filter chips */
        <div className="space-y-2.5">
          <div className="flex items-center gap-2">
            <FolderTree size={14} className="text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Categoría</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                filterCategory === 'all'
                  ? 'bg-gray-900 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
              }`
            >
              <LayoutGrid size={16} />
              Todas
            </button>
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.name);
              const active = filterCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setFilterCategory(cat.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    active
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm'
                  }`
                >
                  <Icon size={16} />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {editMode && (
          <div className="flex justify-end">
            <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} className="mr-1.5 inline" /> Agregar producto</Button>
          </div>
        )}

        <div className="text-xs text-gray-400">
          {products.length} producto{products.length !== 1 ? 's' : ''}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const prices = priceRecords[p.id] || [];
            const latest = prices[0];
            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all group">
                <div className="flex items-start justify-between">
                  <button onClick={() => setSelectedProductId(p.id)} className="text-left min-w-0 flex-1">
                    <h3 className="font-display font-semibold text-gray-900 truncate">{p.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <CompetitorAvatar name={p.competitors?.name || ''} size={18} logoUrl={p.competitors?.logo_url} />
                      <span className="text-xs text-gray-400">{p.competitors?.name}</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-xs text-gray-400">{p.categories?.name}</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    {p.competitors?.is_madesa && <span className="text-xs font-semibold text-madesa-600 bg-madesa-50 px-2 py-0.5 rounded">Madesa</span>}
                    {editMode && <button onClick={() => setDeleteTarget(p)} className="text-gray-300 hover:text-red-600 p-1"><Trash2 size={14} /></button>}
                  </div>
                </div>
                <button onClick={() => setSelectedProductId(p.id)} className="block w-full text-left">
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
                    {p.width_cm && <span className="flex items-center gap-1"><Ruler size={12} /> {p.width_cm}×{p.height_cm}×{p.depth_cm}cm</span>}
                    {p.material && <span>{p.material}</span>}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div><p className="text-xs text-gray-400">Precio actual</p><p className="font-display font-bold text-gray-900">{latest ? formatCOP(latest.promo_price || latest.normal_price) : '—'}</p></div>
                    <div className="text-right"><p className="text-xs text-gray-400">Histórico</p><p className="text-xs text-gray-500">{prices.length} registros</p></div>
                    <ArrowRight size={18} className="text-gray-300 group-hover:text-madesa-600 transition-colors" />
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <ProductFormModal open={showForm} onClose={() => setShowForm(false)} editing={editing} competitors={competitors} categories={categories} onSaved={() => { refresh(); setShowForm(false); }} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar producto"
        message={`¿Seguro que quieres eliminar "${deleteTarget?.name}"? Se eliminarán también todos sus registros de precios asociados.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

function ProductFormModal({ open, onClose, editing, competitors, categories, onSaved }: {
  open: boolean; onClose: () => void; editing: Product | null; competitors: Competitor[]; categories: Category[]; onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [competitorId, setCompetitorId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [description, setDescription] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [material, setMaterial] = useState('');
  const [numDoors, setNumDoors] = useState('');
  const [numDrawers, setNumDrawers] = useState('');
  const [capacitySeats, setCapacitySeats] = useState('');
  const [features, setFeatures] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setName(editing.name); setCompetitorId(editing.competitor_id); setCategoryId(editing.category_id);
      setSku(editing.sku || ''); setProductUrl(editing.product_url || ''); setDescription(editing.description || '');
      setWidth(editing.width_cm?.toString() || ''); setHeight(editing.height_cm?.toString() || ''); setDepth(editing.depth_cm?.toString() || '');
      setMaterial(editing.material || ''); setNumDoors(editing.num_doors?.toString() || ''); setNumDrawers(editing.num_drawers?.toString() || '');
      setCapacitySeats(editing.capacity_seats?.toString() || ''); setFeatures(editing.features || '');
    } else {
      setName(''); setCompetitorId(''); setCategoryId(''); setSku(''); setProductUrl(''); setDescription('');
      setWidth(''); setHeight(''); setDepth(''); setMaterial(''); setNumDoors(''); setNumDrawers(''); setCapacitySeats(''); setFeatures('');
    }
    setError(null);
  }, [editing, open]);

  async function save() {
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    if (!competitorId) { setError('Selecciona un competidor'); return; }
    if (!categoryId) { setError('Selecciona una categoría'); return; }
    setSaving(true);
    const payload = {
      name: name.trim(), competitor_id: competitorId, category_id: categoryId, sku: sku || null,
      product_url: productUrl || null, description: description || null,
      width_cm: width ? parseFloat(width) : null, height_cm: height ? parseFloat(height) : null, depth_cm: depth ? parseFloat(depth) : null,
      material: material || null, num_doors: numDoors ? parseInt(numDoors) : null, num_drawers: numDrawers ? parseInt(numDrawers) : null,
      capacity_seats: capacitySeats ? parseInt(capacitySeats) : null, features: features || null,
    };
    const { error: err } = editing ? await supabase.from('products').update(payload).eq('id', editing.id) : await supabase.from('products').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar producto' : 'Agregar producto'} size="lg"
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button></>}>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nombre" className="md:col-span-2"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Closet Modular 2 Puertas" /></Field>
        <Field label="Competidor"><Select value={competitorId} onChange={(e) => setCompetitorId(e.target.value)}><option value="">Seleccionar...</option>{competitors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Categoría"><Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}><option value="">Seleccionar...</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="SKU / Referencia"><TextInput value={sku} onChange={(e) => setSku(e.target.value)} /></Field>
        <Field label="URL del producto"><TextInput value={productUrl} onChange={(e) => setProductUrl(e.target.value)} placeholder="https://..." /></Field>
        <Field label="Ancho (cm)"><TextInput type="number" value={width} onChange={(e) => setWidth(e.target.value)} /></Field>
        <Field label="Alto (cm)"><TextInput type="number" value={height} onChange={(e) => setHeight(e.target.value)} /></Field>
        <Field label="Profundidad (cm)"><TextInput type="number" value={depth} onChange={(e) => setDepth(e.target.value)} /></Field>
        <Field label="Material"><TextInput value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="MDF melamina" /></Field>
        <Field label="Número de puertas"><TextInput type="number" value={numDoors} onChange={(e) => setNumDoors(e.target.value)} /></Field>
        <Field label="Número de cajones"><TextInput type="number" value={numDrawers} onChange={(e) => setNumDrawers(e.target.value)} /></Field>
        <Field label="Capacidad / Asientos"><TextInput type="number" value={capacitySeats} onChange={(e) => setCapacitySeats(e.target.value)} /></Field>
        <Field label="Descripción" className="md:col-span-2"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></Field>
        <Field label="Características" className="md:col-span-2"><TextArea value={features} onChange={(e) => setFeatures(e.target.value)} rows={2} placeholder="Riel metálico, espejo, etc." /></Field>
      </div>
    </Modal>
  );
}

function ProductDetail({ product, priceHistory, onBack, selectedPeriodId }: {
  product: Product & { competitors?: Competitor; categories?: Category };
  priceHistory: (PriceRecord & { analysis_periods?: AnalysisPeriod })[];
  onBack: () => void;
  selectedPeriodId: string | null;
}) {
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [priceHistoryState, setPriceHistoryState] = useState(priceHistory);
  const { periods } = useAppData();
  const editMode = useEditMode();

  const sortedHistory = [...priceHistoryState].sort((a, b) => {
    const aSort = a.analysis_periods?.sort_order || 0;
    const bSort = b.analysis_periods?.sort_order || 0;
    return aSort - bSort;
  });

  const prices = sortedHistory.map((r) => r.promo_price || r.normal_price);
  const stats = calculateStats(prices);
  const firstPrice = sortedHistory[0];
  const lastPrice = sortedHistory[sortedHistory.length - 1];
  const variation = firstPrice && lastPrice ? (((lastPrice.promo_price || lastPrice.normal_price) - (firstPrice.promo_price || firstPrice.normal_price)) / (firstPrice.promo_price || firstPrice.normal_price)) * 100 : 0;

  async function refreshPrices() {
    const { data } = await supabase.from('price_records').select(`*, analysis_periods (id, name, period_code, sort_order)`).eq('product_id', product.id).order('query_date', { ascending: false });
    setPriceHistoryState((data || []) as unknown as typeof priceHistoryState);
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">← Volver a productos</button>
        {editMode && <Button onClick={() => setShowPriceForm(true)}><DollarSign size={16} className="mr-1.5 inline" /> Registrar precio</Button>}
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display font-extrabold text-2xl text-gray-900">{product.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{product.competitors?.name} · {product.categories?.name}{product.sku && ` · SKU: ${product.sku}`}</p>
            {product.product_url && <a href={product.product_url} target="_blank" rel="noopener noreferrer" className="text-sm text-madesa-600 hover:underline flex items-center gap-1 mt-2"><ExternalLink size={14} /> Ver producto</a>}
          </div>
          <div className="text-right"><p className="text-xs text-gray-400">Precio actual</p><p className="font-display font-bold text-2xl text-gray-900">{lastPrice ? formatCOP(lastPrice.promo_price || lastPrice.normal_price) : '—'}</p></div>
        </div>
        <p className="text-sm text-gray-500 mt-3">{product.description || product.features}</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SpecCard label="Ancho" value={formatDimension(product.width_cm)} />
        <SpecCard label="Alto" value={formatDimension(product.height_cm)} />
        <SpecCard label="Profundidad" value={formatDimension(product.depth_cm)} />
        <SpecCard label="Material" value={product.material || '—'} />
        <SpecCard label="Puertas" value={product.num_doors?.toString() || '—'} />
        <SpecCard label="Cajones" value={product.num_drawers?.toString() || '—'} />
        <SpecCard label="Capacidad" value={product.capacity_seats ? `${product.capacity_seats} pers.` : '—'} />
        <SpecCard label="Precio/m ancho" value={product.width_cm ? formatCOP(Math.round((lastPrice?.promo_price || lastPrice?.normal_price || 0) / (product.width_cm / 100))) : '—'} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatBox label="Promedio" value={formatCOP(Math.round(stats.avg))} />
        <StatBox label="Mediana" value={formatCOP(Math.round(stats.median))} />
        <StatBox label="Mínimo" value={formatCOP(Math.round(stats.min))} />
        <StatBox label="Máximo" value={formatCOP(Math.round(stats.max))} />
        <StatBox label="Variación" value={`${variation > 0 ? '+' : ''}${variation.toFixed(1)}%`} accent={variation < 0 ? 'green' : variation > 0 ? 'red' : undefined} />
      </div>
      <Card title="Historial de precios" subtitle={`${sortedHistory.length} registros históricos`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Período</th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Precio normal</th>
              <th className="text-right py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Precio promo</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Fecha consulta</th>
              <th className="text-left py-2.5 px-3 font-medium text-gray-400 text-xs uppercase">Observaciones</th>
            </tr></thead>
            <tbody>
              {sortedHistory.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-3 px-3 font-medium text-gray-900">{r.analysis_periods?.name || r.query_date}</td>
                  <td className="py-3 px-3 text-right tabular-nums text-gray-500">{formatCOP(r.normal_price)}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-medium text-gray-900">{formatCOP(r.promo_price)}</td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{r.query_date}</td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{r.observations || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <PriceFormModal open={showPriceForm} onClose={() => setShowPriceForm(false)} productId={product.id} periods={periods} defaultPeriodId={selectedPeriodId} onSaved={() => { refreshPrices(); setShowPriceForm(false); }} />
    </div>
  );
}

export function PriceFormModal({ open, onClose, productId, periods, defaultPeriodId, onSaved }: {
  open: boolean; onClose: () => void; productId: string; periods: AnalysisPeriod[]; defaultPeriodId: string | null; onSaved: () => void;
}) {
  const [periodId, setPeriodId] = useState('');
  const [normalPrice, setNormalPrice] = useState('');
  const [promoPrice, setPromoPrice] = useState('');
  const [queryDate, setQueryDate] = useState(new Date().toISOString().split('T')[0]);
  const [url, setUrl] = useState('');
  const [observations, setObservations] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPeriodId(defaultPeriodId || periods[0]?.id || '');
    setNormalPrice(''); setPromoPrice(''); setUrl(''); setObservations('');
    setQueryDate(new Date().toISOString().split('T')[0]);
    setError(null);
  }, [open, defaultPeriodId, periods]);

  async function save() {
    if (!periodId) { setError('Selecciona un período'); return; }
    if (!normalPrice) { setError('El precio normal es obligatorio'); return; }
    setSaving(true);
    const { error: err } = await supabase.from('price_records').insert({
      product_id: productId, period_id: periodId, normal_price: parseFloat(normalPrice),
      promo_price: promoPrice ? parseFloat(promoPrice) : null, currency: 'COP',
      query_date: queryDate, url: url || null, observations: observations || null,
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar precio" subtitle="El precio se agrega al historial. Los registros anteriores no se modifican."
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button></>}>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Período"><Select value={periodId} onChange={(e) => setPeriodId(e.target.value)}>{periods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        <Field label="Fecha de consulta"><TextInput type="date" value={queryDate} onChange={(e) => setQueryDate(e.target.value)} /></Field>
        <Field label="Precio normal (COP)"><TextInput type="number" value={normalPrice} onChange={(e) => setNormalPrice(e.target.value)} placeholder="1899000" /></Field>
        <Field label="Precio promocional (COP)"><TextInput type="number" value={promoPrice} onChange={(e) => setPromoPrice(e.target.value)} placeholder="1599000" /></Field>
        <Field label="URL" className="md:col-span-2"><TextInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></Field>
        <Field label="Observaciones" className="md:col-span-2"><TextArea value={observations} onChange={(e) => setObservations(e.target.value)} rows={2} /></Field>
      </div>
    </Modal>
  );
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p><p className="font-display font-semibold text-gray-900 mt-1">{value}</p></div>;
}

function StatBox({ label, value, accent }: { label: string; value: string; accent?: 'green' | 'red' }) {
  return <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p><p className={`font-display font-bold text-lg mt-1 ${accent === 'green' ? 'text-green-600' : accent === 'red' ? 'text-red-600' : 'text-gray-900'}`}>{value}</p></div>;
}
