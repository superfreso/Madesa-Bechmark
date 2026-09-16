import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { ExternalLink, Link2 } from 'lucide-react';
import { formatDate } from '@/lib/format';
import type { Source } from '@/types/database';

const sourceTypeLabels: Record<string, string> = {
  official_site: 'Sitio oficial',
  product_page: 'Página de producto',
  terms_conditions: 'Términos y condiciones',
  financing_page: 'Página de financiación',
  semrush: 'Semrush',
  other: 'Otra fuente confiable',
};

const sourceTypeColors: Record<string, string> = {
  official_site: 'bg-blue-50 text-blue-700',
  product_page: 'bg-green-50 text-green-700',
  terms_conditions: 'bg-amber-50 text-amber-700',
  financing_page: 'bg-purple-50 text-purple-700',
  semrush: 'bg-orange-50 text-orange-700',
  other: 'bg-gray-100 text-gray-600',
};

export function Sources() {
  const [sources, setSources] = useState<Source[]>([]);
  const [usageCounts, setUsageCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    supabase.from('sources').select('*').order('name').then(({ data }) => setSources(data || []));
  }, []);

  useEffect(() => {
    async function loadCounts() {
      const tables = ['price_records', 'commercial_conditions', 'payment_methods', 'traffic_records'];
      const counts: Record<string, number> = {};
      for (const table of tables) {
        const { data } = await supabase.from(table).select('source_id');
        for (const r of (data || []) as unknown as { source_id: string | null }[]) {
          if (r.source_id) counts[r.source_id] = (counts[r.source_id] || 0) + 1;
        }
      }
      setUsageCounts(counts);
    }
    loadCounts();
  }, []);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
        <div className="text-gray-400 mt-0.5">
          <Link2 size={18} />
        </div>
        <p className="text-sm text-gray-500">
          Cada dato importante en la plataforma está vinculado a una fuente. Esto garantiza la trazabilidad: cualquier persona puede preguntar "¿De dónde salió este dato?" y encontrar la respuesta aquí.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((source) => (
          <div key={source.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-gray-900 truncate">{source.name}</h3>
                <span className={`text-xs font-medium px-2 py-0.5 rounded inline-block mt-1 ${sourceTypeColors[source.source_type] || 'bg-gray-100 text-gray-600'}`}>
                  {sourceTypeLabels[source.source_type] || source.source_type}
                </span>
              </div>
            </div>
            {source.url && (
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-madesa-600 hover:underline flex items-center gap-1 mt-3 truncate">
                <ExternalLink size={12} /> {source.url}
              </a>
            )}
            {source.observations && <p className="text-xs text-gray-400 mt-2">{source.observations}</p>}
            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-400">Registros vinculados</span>
              <span className="font-display font-bold text-gray-900">{usageCounts[source.id] || 0}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
