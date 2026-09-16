/*
# Madesa Benchmark — Full Schema

## Overview
Creates the complete relational schema for the Madesa Benchmark competitive intelligence platform.
All data is stored historically — original records are never overwritten. Averages, medians,
min/max, and comparisons are computed from individual product price records.

## New Tables

1. **competitors** — Competitor companies (Jamar, RTA, Maderkit, IKEA, Tugó, Madesa itself).
   - id, name, logo_url, website, country, description, is_active, is_madesa, created_at.

2. **categories** — Product categories (Closets, Comedores, etc.).
   - id, name, description, is_active, created_at.

3. **products** — Individual products. Entity independent of price.
   - id, competitor_id (FK), category_id (FK), name, product_url, sku, description,
     width_cm, height_cm, depth_cm, material, num_doors, num_drawers, capacity_seats,
     features, is_active, created_at.

4. **analysis_periods** — Research periods (Sept 2026, Oct 2026, etc.).
   - id, name (e.g. "Septiembre 2026"), period_code (e.g. "2026-09"),
     start_date, end_date, updated_at, responsible, observations, status, created_at.

5. **sources** — Data sources for traceability.
   - id, name, source_type (official site, product page, T&C, financing page, Semrush, other),
     url, observations, created_at.

6. **price_records** — Individual price entries per product per period. Never deleted.
   - id, product_id (FK), period_id (FK), source_id (FK nullable),
     normal_price, promo_price, currency, query_date, status, url, observations, created_at.

7. **commercial_conditions** — Warranty, shipping, installation conditions per competitor per period.
   - id, competitor_id (FK), period_id (FK), source_id (FK nullable),
     condition_type (warranty, shipping, installation),
     availability (available/not_available/included),
     value, coverage, duration, conditions, exclusions, estimated_time, query_date, url, observations, created_at.

8. **payment_methods** — Payment method records per competitor per period (historical).
   - id, competitor_id (FK), period_id (FK), source_id (FK nullable),
     method_name, method_type, num_installments, interest_free_installments,
     interest_installments, interest_rate, min_amount, max_amount,
     participating_banks, requirements, conditions, valid_from, valid_to,
     query_date, url, observations, created_at.

9. **traffic_records** — Digital traffic data (Semrush) per competitor per period.
   - id, competitor_id (FK), period_id (FK), source_id (FK nullable),
     domain, estimated_visits, mobile_traffic, desktop_traffic,
     mom_growth, yoy_growth, ranking, query_date, observations, created_at.

## Security
- Single-tenant, no auth. RLS enabled on all tables with anon+authenticated full CRUD.
- Data is intentionally shared/public within the organization.
*/

-- ============ COMPETITORS ============
CREATE TABLE IF NOT EXISTS competitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  website text,
  country text DEFAULT 'Colombia',
  description text,
  is_active boolean NOT NULL DEFAULT true,
  is_madesa boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_competitors_sel" ON competitors;
CREATE POLICY "anon_crud_competitors_sel" ON competitors FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_competitors_ins" ON competitors;
CREATE POLICY "anon_crud_competitors_ins" ON competitors FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_competitors_upd" ON competitors;
CREATE POLICY "anon_crud_competitors_upd" ON competitors FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_competitors_del" ON competitors;
CREATE POLICY "anon_crud_competitors_del" ON competitors FOR DELETE TO anon, authenticated USING (true);

-- ============ CATEGORIES ============
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_categories_sel" ON categories;
CREATE POLICY "anon_crud_categories_sel" ON categories FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_categories_ins" ON categories;
CREATE POLICY "anon_crud_categories_ins" ON categories FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_categories_upd" ON categories;
CREATE POLICY "anon_crud_categories_upd" ON categories FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_categories_del" ON categories;
CREATE POLICY "anon_crud_categories_del" ON categories FOR DELETE TO anon, authenticated USING (true);

-- ============ PRODUCTS ============
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  product_url text,
  sku text,
  description text,
  width_cm numeric,
  height_cm numeric,
  depth_cm numeric,
  material text,
  num_doors integer,
  num_drawers integer,
  capacity_seats integer,
  features text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_products_sel" ON products;
CREATE POLICY "anon_crud_products_sel" ON products FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_products_ins" ON products;
CREATE POLICY "anon_crud_products_ins" ON products FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_products_upd" ON products;
CREATE POLICY "anon_crud_products_upd" ON products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_products_del" ON products;
CREATE POLICY "anon_crud_products_del" ON products FOR DELETE TO anon, authenticated USING (true);

-- ============ ANALYSIS PERIODS ============
CREATE TABLE IF NOT EXISTS analysis_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  period_code text NOT NULL UNIQUE,
  start_date date,
  end_date date,
  updated_at timestamptz DEFAULT now(),
  responsible text,
  observations text,
  status text DEFAULT 'open',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE analysis_periods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_periods_sel" ON analysis_periods;
CREATE POLICY "anon_crud_periods_sel" ON analysis_periods FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_periods_ins" ON analysis_periods;
CREATE POLICY "anon_crud_periods_ins" ON analysis_periods FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_periods_upd" ON analysis_periods;
CREATE POLICY "anon_crud_periods_upd" ON analysis_periods FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_periods_del" ON analysis_periods;
CREATE POLICY "anon_crud_periods_del" ON analysis_periods FOR DELETE TO anon, authenticated USING (true);

-- ============ SOURCES ============
CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'official_site',
  url text,
  observations text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_sources_sel" ON sources;
CREATE POLICY "anon_crud_sources_sel" ON sources FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_sources_ins" ON sources;
CREATE POLICY "anon_crud_sources_ins" ON sources FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_sources_upd" ON sources;
CREATE POLICY "anon_crud_sources_upd" ON sources FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_sources_del" ON sources;
CREATE POLICY "anon_crud_sources_del" ON sources FOR DELETE TO anon, authenticated USING (true);

-- ============ PRICE RECORDS ============
CREATE TABLE IF NOT EXISTS price_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES analysis_periods(id) ON DELETE CASCADE,
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  normal_price numeric NOT NULL,
  promo_price numeric,
  currency text NOT NULL DEFAULT 'COP',
  query_date date NOT NULL DEFAULT CURRENT_DATE,
  status text DEFAULT 'active',
  url text,
  observations text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE price_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_prices_sel" ON price_records;
CREATE POLICY "anon_crud_prices_sel" ON price_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_prices_ins" ON price_records;
CREATE POLICY "anon_crud_prices_ins" ON price_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_prices_upd" ON price_records;
CREATE POLICY "anon_crud_prices_upd" ON price_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_prices_del" ON price_records;
CREATE POLICY "anon_crud_prices_del" ON price_records FOR DELETE TO anon, authenticated USING (true);

-- ============ COMMERCIAL CONDITIONS ============
CREATE TABLE IF NOT EXISTS commercial_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES analysis_periods(id) ON DELETE CASCADE,
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  condition_type text NOT NULL,
  availability text,
  value numeric,
  coverage text,
  duration text,
  conditions text,
  exclusions text,
  estimated_time text,
  query_date date DEFAULT CURRENT_DATE,
  url text,
  observations text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE commercial_conditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_conditions_sel" ON commercial_conditions;
CREATE POLICY "anon_crud_conditions_sel" ON commercial_conditions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_conditions_ins" ON commercial_conditions;
CREATE POLICY "anon_crud_conditions_ins" ON commercial_conditions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_conditions_upd" ON commercial_conditions;
CREATE POLICY "anon_crud_conditions_upd" ON commercial_conditions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_conditions_del" ON commercial_conditions;
CREATE POLICY "anon_crud_conditions_del" ON commercial_conditions FOR DELETE TO anon, authenticated USING (true);

-- ============ PAYMENT METHODS ============
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES analysis_periods(id) ON DELETE CASCADE,
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  method_name text NOT NULL,
  method_type text,
  num_installments integer,
  interest_free_installments integer,
  interest_installments integer,
  interest_rate numeric,
  min_amount numeric,
  max_amount numeric,
  participating_banks text,
  requirements text,
  conditions text,
  valid_from date,
  valid_to date,
  query_date date DEFAULT CURRENT_DATE,
  url text,
  observations text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_paymethods_sel" ON payment_methods;
CREATE POLICY "anon_crud_paymethods_sel" ON payment_methods FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_paymethods_ins" ON payment_methods;
CREATE POLICY "anon_crud_paymethods_ins" ON payment_methods FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_paymethods_upd" ON payment_methods;
CREATE POLICY "anon_crud_paymethods_upd" ON payment_methods FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_paymethods_del" ON payment_methods;
CREATE POLICY "anon_crud_paymethods_del" ON payment_methods FOR DELETE TO anon, authenticated USING (true);

-- ============ TRAFFIC RECORDS ============
CREATE TABLE IF NOT EXISTS traffic_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id uuid NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES analysis_periods(id) ON DELETE CASCADE,
  source_id uuid REFERENCES sources(id) ON DELETE SET NULL,
  domain text NOT NULL,
  estimated_visits integer,
  mobile_traffic_pct numeric,
  desktop_traffic_pct numeric,
  mom_growth_pct numeric,
  yoy_growth_pct numeric,
  ranking integer,
  query_date date DEFAULT CURRENT_DATE,
  observations text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE traffic_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_traffic_sel" ON traffic_records;
CREATE POLICY "anon_crud_traffic_sel" ON traffic_records FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_traffic_ins" ON traffic_records;
CREATE POLICY "anon_crud_traffic_ins" ON traffic_records FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_traffic_upd" ON traffic_records;
CREATE POLICY "anon_crud_traffic_upd" ON traffic_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_traffic_del" ON traffic_records;
CREATE POLICY "anon_crud_traffic_del" ON traffic_records FOR DELETE TO anon, authenticated USING (true);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_products_competitor ON products(competitor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_price_records_product ON price_records(product_id);
CREATE INDEX IF NOT EXISTS idx_price_records_period ON price_records(period_id);
CREATE INDEX IF NOT EXISTS idx_conditions_competitor ON commercial_conditions(competitor_id);
CREATE INDEX IF NOT EXISTS idx_conditions_period ON commercial_conditions(period_id);
CREATE INDEX IF NOT EXISTS idx_paymethods_competitor ON payment_methods(competitor_id);
CREATE INDEX IF NOT EXISTS idx_paymethods_period ON payment_methods(period_id);
CREATE INDEX IF NOT EXISTS idx_traffic_competitor ON traffic_records(competitor_id);
CREATE INDEX IF NOT EXISTS idx_traffic_period ON traffic_records(period_id);
CREATE INDEX IF NOT EXISTS idx_periods_sort ON analysis_periods(sort_order);
