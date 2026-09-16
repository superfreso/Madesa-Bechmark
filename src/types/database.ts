export interface Competitor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  country: string;
  description: string | null;
  is_active: boolean;
  is_madesa: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  competitor_id: string;
  category_id: string;
  name: string;
  product_url: string | null;
  sku: string | null;
  description: string | null;
  width_cm: number | null;
  height_cm: number | null;
  depth_cm: number | null;
  material: string | null;
  num_doors: number | null;
  num_drawers: number | null;
  capacity_seats: number | null;
  features: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AnalysisPeriod {
  id: string;
  name: string;
  period_code: string;
  start_date: string | null;
  end_date: string | null;
  updated_at: string;
  responsible: string | null;
  observations: string | null;
  status: string;
  sort_order: number;
  created_at: string;
}

export interface Source {
  id: string;
  name: string;
  source_type: string;
  url: string | null;
  observations: string | null;
  created_at: string;
}

export interface PriceRecord {
  id: string;
  product_id: string;
  period_id: string;
  source_id: string | null;
  normal_price: number;
  promo_price: number | null;
  currency: string;
  query_date: string;
  status: string;
  url: string | null;
  observations: string | null;
  created_at: string;
}

export interface CommercialCondition {
  id: string;
  competitor_id: string;
  period_id: string;
  source_id: string | null;
  condition_type: string;
  availability: string | null;
  value: number | null;
  coverage: string | null;
  duration: string | null;
  conditions: string | null;
  exclusions: string | null;
  estimated_time: string | null;
  query_date: string;
  url: string | null;
  observations: string | null;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  competitor_id: string;
  period_id: string;
  source_id: string | null;
  method_name: string;
  method_type: string | null;
  num_installments: number | null;
  interest_free_installments: number | null;
  interest_installments: number | null;
  interest_rate: number | null;
  min_amount: number | null;
  max_amount: number | null;
  participating_banks: string | null;
  requirements: string | null;
  conditions: string | null;
  valid_from: string | null;
  valid_to: string | null;
  query_date: string;
  url: string | null;
  observations: string | null;
  variable_fields: string[] | null;
  created_at: string;
}

export interface TrafficRecord {
  id: string;
  competitor_id: string;
  period_id: string;
  source_id: string | null;
  domain: string;
  estimated_visits: number | null;
  mobile_traffic_pct: number | null;
  desktop_traffic_pct: number | null;
  mom_growth_pct: number | null;
  yoy_growth_pct: number | null;
  ranking: number | null;
  query_date: string;
  observations: string | null;
  created_at: string;
}

export interface PriceRecordWithDetails extends PriceRecord {
  products?: Product;
  competitors?: Competitor;
  categories?: Category;
  analysis_periods?: AnalysisPeriod;
}

export interface ProductWithDetails extends Product {
  competitors?: Competitor;
  categories?: Category;
}
