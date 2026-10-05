/*
# Agregar países de operación y año de fundación por competidor

## Objetivo
Permite registrar cuántos años lleva cada competidor en el mercado y en qué países opera,
con los años de operación en cada país, para mostrar un panel visual de banderas.

## Tablas nuevas
1. `competitor_countries`
   - `id` uuid PK
   - `competitor_id` uuid FK → competitors(id) ON DELETE CASCADE
   - `country_code` text — código ISO 3166-1 alpha-2 (CO, AR, MX, etc.)
   - `country_name` text — nombre legible (Colombia, Argentina, México...)
   - `years_operating` integer — años que lleva operando en ese país
   - `created_at` timestamptz

## Columnas nuevas en tablas existentes
1. `competitors.founded_year` integer — año de fundación de la empresa

## Seguridad
- RLS habilitado en `competitor_countries` con CRUD para anon + authenticated (app sin login).
- `competitors` ya tiene RLS; la nueva columna queda protegida por las mismas políticas.

## Integridad
- No se eliminan ni modifican datos existentes.
- Todas las columnas nuevas son nullable.
*/

ALTER TABLE public.competitors
ADD COLUMN IF NOT EXISTS founded_year integer;

CREATE TABLE IF NOT EXISTS public.competitor_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid NOT NULL REFERENCES public.competitors(id) ON DELETE CASCADE,
  country_code text NOT NULL,
  country_name text NOT NULL,
  years_operating integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.competitor_countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_competitor_countries" ON public.competitor_countries;
CREATE POLICY "anon_select_competitor_countries"
ON public.competitor_countries FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_competitor_countries" ON public.competitor_countries;
CREATE POLICY "anon_insert_competitor_countries"
ON public.competitor_countries FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_competitor_countries" ON public.competitor_countries;
CREATE POLICY "anon_update_competitor_countries"
ON public.competitor_countries FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_competitor_countries" ON public.competitor_countries;
CREATE POLICY "anon_delete_competitor_countries"
ON public.competitor_countries FOR DELETE
TO anon, authenticated USING (true);
