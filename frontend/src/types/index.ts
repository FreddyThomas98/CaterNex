export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'SALESPERSON' | 'KITCHEN' | 'ACCOUNTS';

export interface Tenant {
  id: number;
  name: string;
  slug: string;
  tagline?: string;
  logo_path?: string;
  phone1?: string;
  phone2?: string;
  email?: string;
  location1?: string;
  location2?: string;
  website?: string;
  gst_number?: string;
  quotation_prefix: string;
  default_terms?: string;
  currency_symbol: string;
  date_format: string;
  is_active: number;
  created_at?: string;
  item_count?: number;
  quotation_count?: number;
  event_count?: number;
  admin_email?: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  max_discount_pct: number;
  tenant_id?: number | null;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  display_order: number;
  is_active: number;
  item_count?: number;
}

export type ServiceType = 'STANDARD' | 'LIVE_COUNTER' | 'STATION' | 'SPECIAL';
export type PricingUnit = 'PER_PERSON' | 'PER_PLATE' | 'PER_KG' | 'PER_LITRE' | 'PER_PIECE' | 'PER_EVENT' | 'FIXED_QUANTITY';

export interface MenuItem {
  id: number;
  category_id?: number;
  category_name?: string;
  name: string;
  description?: string;
  image_url?: string;
  service_type: ServiceType;
  pricing_unit: PricingUnit;
  selling_price: number | null;
  food_cost?: number;
  labour_cost?: number;
  packaging_cost?: number;
  overhead_cost?: number;
  is_demo_price: number;
  is_seasonal: number;
  is_active: number;
  display_order: number;
  ingredient_count?: number;
}

export interface Package {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  default_price: number;
  pricing_unit: PricingUnit;
  is_active: number;
}

export interface Addon {
  id: number;
  name: string;
  description?: string;
  image_url?: string;
  service_type?: string;
  selling_price: number;
  pricing_unit: string;
  internal_cost?: number;
  is_active: number;
}

export interface Client {
  id: number;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  address?: string;
  gst_number?: string;
  notes?: string;
  created_at?: string;
  quotations?: Quotation[];
  events?: CateringEvent[];
}

export interface CateringEvent {
  id: number;
  client_id: number;
  client_name?: string;
  client_phone?: string;
  event_type: string;
  event_date: string;
  event_time?: string;
  venue: string;
  venue_address?: string;
  guest_count: number;
  status: 'PLANNING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  special_notes?: string;
  created_at?: string;
}

export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  menu_item_id?: number;
  item_name_snapshot: string;
  category_snapshot?: string;
  service_type_snapshot?: ServiceType;
  pricing_unit_snapshot?: PricingUnit;
  selling_price_snapshot: number;
  quantity: number;
  line_total: number;
}

export interface QuotationAddon {
  id?: number;
  quotation_id?: number;
  addon_id?: number;
  name_snapshot: string;
  pricing_unit_snapshot: string;
  selling_price_snapshot: number;
  quantity: number;
  line_total: number;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'UNDER_REVIEW' | 'APPROVED' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';

export interface Quotation {
  id: number;
  quotation_number: string;
  client_id: number;
  client_name?: string;
  client_company?: string;
  client_phone?: string;
  client_email?: string;
  client_address?: string;
  event_id?: number;
  event_type?: string;
  event_date?: string;
  event_time?: string;
  venue?: string;
  venue_address?: string;
  guest_count: number;
  subtotal: number;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  discount_amount: number;
  tax_percentage: number;
  tax_amount: number;
  grand_total: number;
  status: QuotationStatus;
  terms_and_conditions?: string;
  special_notes?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  items?: QuotationItem[];
  addons?: QuotationAddon[];
  client?: Client;
  event?: CateringEvent;
}

export interface CompanySettings {
  id: number;
  company_name: string;
  tagline: string;
  phone1: string;
  phone2: string;
  email: string;
  location1: string;
  location2: string;
  website: string;
  gst_number: string;
  quotation_prefix: string;
  default_terms: string;
  currency_symbol: string;
  date_format: string;
  logo_path: string;
}

export interface CostingItem {
  id: number;
  name: string;
  pricing_unit: string;
  selling_price: number;
  food_cost: number;
  labour_cost: number;
  packaging_cost: number;
  overhead_cost: number;
  total_internal_cost: number;
  internal_profit: number;
  margin_pct: number;
}

export interface CostingOverview {
  item_count: number;
  average_margin_pct: number;
  items: CostingItem[];
}

export interface Ingredient {
  id: number;
  name: string;
  category: string;
  unit: string;
  purchase_price: number;
  wastage_pct: number;
  effective_cost: number;
  supplier?: string;
  status: string;
}

export interface RecipeIngredient {
  id?: number;
  recipe_id?: number;
  ingredient_id: number;
  ingredient_name?: string;
  ingredient_category?: string;
  quantity: number;
  unit: string;
  notes?: string;
  line_cost?: number;
  purchase_price?: number;
  wastage_pct?: number;
  supplier?: string;
}

export interface Recipe {
  id?: number;
  menu_item_id: number;
  dish_name?: string;
  category_name?: string;
  portion_yield: number;
  instructions?: string;
  prep_time_mins?: number;
  total_batch_cost?: number;
  cost_per_portion?: number;
  ingredients: RecipeIngredient[];
}

export interface PurchaseItem {
  ingredient_id: number;
  ingredient_name: string;
  category: string;
  unit: string;
  unit_price: number;
  quantity_required: number;
  total_price: number;
  supplier?: string;
  dishes_used_in: string[];
  is_purchased: number;
  quantity_purchased?: number;
  notes?: string;
}

export interface EventPurchaseList {
  total_estimated_cost: number;
  total_items_count: number;
  categories_grouped: Record<string, PurchaseItem[]>;
  items: PurchaseItem[];
  missing_recipes: { dish_name: string; reason: string }[];
  event?: CateringEvent;
  quotation?: Quotation;
  guest_count: number;
}

export interface LabourType {
  id: number;
  title: string;
  daily_wage: number;
  hourly_wage?: number;
  working_hours: number;
  staff_ratio_guests?: number;
  calculation_method: string;
  status: string;
}

export interface PackagingItem {
  id: number;
  name: string;
  unit_cost: number;
  unit: string;
  default_qty_per_guest: number;
  calculation_method: string;
  status: string;
}

export interface OverheadRule {
  id: number;
  name: string;
  calculation_type: string;
  value: number;
  status: string;
}

export interface DashboardMetrics {
  total_quotations: number;
  confirmed_events: number;
  draft_quotations: number;
  sent_quotations: number;
  total_pipeline_value: number;
  confirmed_revenue: number;
  avg_price_per_person: number;
  estimated_margin_pct?: number | null;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recent_quotations: Quotation[];
  upcoming_events: CateringEvent[];
  status_breakdown: { status: string; count: number; value: number }[];
}
