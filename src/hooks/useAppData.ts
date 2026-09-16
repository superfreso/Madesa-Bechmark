import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Competitor, Category, AnalysisPeriod } from '@/types/database';

interface AppData {
  competitors: Competitor[];
  categories: Category[];
  periods: AnalysisPeriod[];
  loading: boolean;
}

export function useAppData(): AppData {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [periods, setPeriods] = useState<AnalysisPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [compRes, catRes, perRes] = await Promise.all([
        supabase.from('competitors').select('*').order('is_madesa', { ascending: false }).order('name'),
        supabase.from('categories').select('*').order('name'),
        supabase.from('analysis_periods').select('*').order('sort_order'),
      ]);
      setCompetitors(compRes.data || []);
      setCategories(catRes.data || []);
      setPeriods(perRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  return { competitors, categories, periods, loading };
}
