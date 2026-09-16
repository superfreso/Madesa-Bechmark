import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAppData } from '@/hooks/useAppData';
import { Card } from '@/components/Card';
import { formatDate } from '@/lib/format';
import { Calendar, Plus, Lock, Unlock, Database } from 'lucide-react';
import type { AnalysisPeriod } from '@/types/database';

interface SettingsProps {
  selectedPeriodId: string | null;
  onPeriodChange: (id: string) => void;
}

export function Settings({ selectedPeriodId, onPeriodChange }: SettingsProps) {
  const { periods, loading, competitors, categories } = useAppData();
  const [products, setProducts] = useState<number>(0);
  const [priceRecords, setPriceRecords] = useState<number>(0);

  useEffect(() => {
    supabase.from('products').select('id', { count: 'exact', head: true }).then(({ count }) => setProducts(count || 0));
    supabase.from('price_records').select('id', { count: 'exact', head: true }).then(({ count }) => setPriceRecords(count || 0));
  }, []);

  const [showNewPeriod, setShowNewPeriod] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newPeriodCode, setNewPeriodCode] = useState('');

  async function createPeriod() {
    if (!newPeriodName || !newPeriodCode) return;
    const sortOrder = (periods[periods.length - 1]?.sort_order || 0) + 1;
    const { data } = await supabase
      .from('analysis_periods')
      .insert({ name: newPeriodName, period_code: newPeriodCode, sort_order: sortOrder, status: 'open' })
      .select()
      .single();
    if (data) {
      setNewPeriodName('');
      setNewPeriodCode('');
      setShowNewPeriod(false);
      onPeriodChange(data.id);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-full text-gray-400">Cargando...</div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Database overview */}
      <Card title="Estado de la base de datos" subtitle="Resumen de datos almacenados">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <DBStat icon={<Database size={16} />} label="Competidores" value={competitors.length} />
          <DBStat icon={<Database size={16} />} label="Categorías" value={categories.length} />
          <DBStat icon={<Database size={16} />} label="Productos" value={products} />
          <DBStat icon={<Database size={16} />} label="Precios" value={priceRecords} />
          <DBStat icon={<Calendar size={16} />} label="Períodos" value={periods.length} />
          <DBStat icon={<Calendar size={16} />} label="Período actual" value={periods.find((p) => p.id === selectedPeriodId)?.name || '—'} small />
        </div>
      </Card>

      {/* Periods management */}
      <Card
        title="Períodos de análisis"
        subtitle="Las investigaciones se organizan por períodos. Los datos históricos nunca se sobrescriben."
        action={
          <button
            onClick={() => setShowNewPeriod(!showNewPeriod)}
            className="flex items-center gap-1.5 text-sm font-medium text-madesa-600 hover:text-madesa-700"
          >
            <Plus size={16} /> Nuevo período
          </button>
        }
      >
        {showNewPeriod && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Nombre (ej. Diciembre 2026)</label>
              <input
                value={newPeriodName}
                onChange={(e) => setNewPeriodName(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-madesa-500"
                placeholder="Diciembre 2026"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-1">Código (ej. 2026-12)</label>
              <input
                value={newPeriodCode}
                onChange={(e) => setNewPeriodCode(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-madesa-500"
                placeholder="2026-12"
              />
            </div>
            <button
              onClick={createPeriod}
              className="bg-madesa-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-madesa-700 transition-colors"
            >
              Crear
            </button>
          </div>
        )}

        <div className="space-y-2">
          {[...periods].reverse().map((period) => (
            <div
              key={period.id}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer ${
                period.id === selectedPeriodId ? 'border-madesa-300 bg-madesa-50' : 'border-gray-100 hover:bg-gray-50'
              }`}
              onClick={() => onPeriodChange(period.id)}
            >
              <div className="flex items-center gap-3">
                <Calendar size={16} className="text-gray-400" />
                <div>
                  <span className="font-medium text-gray-900 text-sm">{period.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{period.period_code}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">{formatDate(period.start_date)} — {formatDate(period.end_date)}</span>
                <span className={`text-xs font-medium px-2 py-1 rounded flex items-center gap-1 ${
                  period.status === 'open' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {period.status === 'open' ? <><Unlock size={12} /> Abierto</> : <><Lock size={12} /> Cerrado</>}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Architecture note */}
      <Card title="Arquitectura de datos" subtitle="Principio de funcionamiento">
        <div className="text-sm text-gray-600 space-y-2">
          <p className="font-medium text-gray-900">Datos originales → Base histórica → Cálculos automáticos → Comparaciones → Gráficos → Indicadores → Conclusiones</p>
          <p className="text-gray-400 text-xs">
            Los promedios, medianas y comparaciones se calculan automáticamente a partir de los registros individuales de precios.
            Nunca se almacena un resultado manual. Los datos históricos nunca se sobrescriben ni eliminan.
          </p>
        </div>
      </Card>
    </div>
  );
}

function DBStat({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: number | string; small?: boolean }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-gray-400 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className={`font-display font-bold text-gray-900 ${small ? 'text-sm' : 'text-xl'}`}>{value}</p>
    </div>
  );
}
