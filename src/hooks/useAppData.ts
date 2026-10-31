import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Competitor, Category, AnalysisPeriod } from '@/types/database';

interface AppData {
  competitors: Competitor[];
  categories: Category[];
  periods: AnalysisPeriod[];
  loading: boolean;
  error: string | null;
}

export function useAppData(): AppData {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [periods, setPeriods] = useState<AnalysisPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [compRes, catRes, perRes] = await Promise.all([
          supabase.from('competitors').select('*').order('is_madesa', { ascending: false }).order('name'),
          supabase.from('categories').select('*').order('name'),
          supabase.from('analysis_periods').select('*').order('sort_order'),
        ]);
        const failed = [compRes, catRes, perRes].find((r) => r.error);
        if (failed?.error) {
          setError(failed.error.message);
          return;
        }
        setCompetitors(compRes.data || []);
        setCategories(catRes.data || []);
        setPeriods(perRes.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { competitors, categories, periods, loading, error };
}
