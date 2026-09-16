import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { Field, TextInput, TextArea, Button } from '@/components/Form';
import { formatCOP } from '@/lib/format';
import { calculateStats } from '@/lib/calculations';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useEditMode } from '@/hooks/useEditMode';
import type { Category } from '@/types/database';

interface CategoriesProps {
  selectedPeriodId: string | null;
}

export function Categories({ selectedPeriodId }: CategoriesProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, { count: number; avg: number; competitors: number }>>({});
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const editMode = useEditMode();

  const refresh = useCallback(() => {
    supabase.from('categories').select('*').order('name').then(({ data }) => setCategories(data || []));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!selectedPeriodId) return;
    supabase
      .from('price_records')
      .select(`normal_price, promo_price, products (category_id, competitor_id)`)
      .eq('period_id', selectedPeriodId)
      .then(({ data }) => {
        const catMap = new Map<string, { prices: number[]; competitors: Set<string> }>();
        for (const r of (data || []) as unknown as { normal_price: number; promo_price: number | null; products: { category_id: string; competitor_id: string } }[]) {
          const catId = r.products?.category_id;
          if (!catId) continue;
          if (!catMap.has(catId)) catMap.set(catId, { prices: [], competitors: new Set() });
          catMap.get(catId)!.prices.push(r.promo_price || r.normal_price);
          catMap.get(catId)!.competitors.add(r.products!.competitor_id);
        }
        const result: Record<string, { count: number; avg: number; competitors: number }> = {};
        catMap.forEach((v, k) => { const stats = calculateStats(v.prices); result[k] = { count: stats.count, avg: Math.round(stats.avg), competitors: v.competitors.size }; });
        setCategoryStats(result);
      });
  }, [selectedPeriodId]);

  async function handleDelete() {
    if (!deleteTarget) return;
    await supabase.from('categories').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    refresh();
  }

  return (
    <>
      <div className="p-6 space-y-4 animate-fade-in">
        {editMode && <div className="flex justify-end">
          <Button onClick={() => { setEditing(null); setShowForm(true); }}><Plus size={16} className="mr-1.5 inline" /> Agregar categoría</Button>
        </div>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const stats = categoryStats[cat.id];
            return (
              <Card key={cat.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-semibold text-gray-900">{cat.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{cat.description || 'Sin descripción'}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${cat.is_active ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>{cat.is_active ? 'Activa' : 'Inactiva'}</span>
                    {editMode && (
                      <>
                        <button onClick={() => { setEditing(cat); setShowForm(true); }} className="text-gray-300 hover:text-gray-600 p-1"><Pencil size={14} /></button>
                        <button onClick={() => setDeleteTarget(cat)} className="text-gray-300 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-xs text-gray-400">Productos</p><p className="font-display font-bold text-gray-900">{stats?.count || 0}</p></div>
                  <div><p className="text-xs text-gray-400">Competidores</p><p className="font-display font-bold text-gray-900">{stats?.competitors || 0}</p></div>
                  <div><p className="text-xs text-gray-400">Promedio</p><p className="font-display font-bold text-gray-900 text-sm">{stats ? formatCOP(stats.avg) : '—'}</p></div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      <CategoryFormModal open={showForm} onClose={() => setShowForm(false)} editing={editing} onSaved={() => { refresh(); setShowForm(false); }} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar categoría"
        message={`¿Seguro que quieres eliminar "${deleteTarget?.name}"? Los productos asociados podrían quedar sin categoría.`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}

function CategoryFormModal({ open, onClose, editing, onSaved }: {
  open: boolean; onClose: () => void; editing: Category | null; onSaved: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) { setName(editing.name); setDescription(editing.description || ''); setIsActive(editing.is_active); }
    else { setName(''); setDescription(''); setIsActive(true); }
    setError(null);
  }, [editing, open]);

  async function save() {
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
    setSaving(true);
    const payload = { name: name.trim(), description: description || null, is_active: isActive };
    const { error: err } = editing ? await supabase.from('categories').update(payload).eq('id', editing.id) : await supabase.from('categories').insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    onSaved();
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar categoría' : 'Agregar categoría'}
      footer={<><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button onClick={save} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button></>}>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
      <div className="space-y-4">
        <Field label="Nombre"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Closets" /></Field>
        <Field label="Descripción"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Descripción de la categoría" /></Field>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded" /> Activa
        </label>
      </div>
    </Modal>
  );
}
