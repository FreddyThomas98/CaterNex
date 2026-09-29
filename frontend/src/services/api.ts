import {
  User, Category, MenuItem, Package, Addon, Client, CateringEvent,
  Quotation, CompanySettings, CostingOverview, Ingredient, LabourType,
  PackagingItem, OverheadRule, DashboardData
} from '../types';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('bandco_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const err = await response.json();
      errorMsg = err.detail || errorMsg;
    } catch {
      errorMsg = response.statusText;
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  getUsers: () => request<User[]>('/auth/users'),

  // Settings
  getSettings: () => request<CompanySettings>('/settings'),
  updateSettings: (data: Partial<CompanySettings>) =>
    request<CompanySettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Categories
  getCategories: () => request<Category[]>('/categories'),
  createCategory: (cat: Partial<Category>) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(cat) }),
  updateCategory: (id: number, cat: Partial<Category>) =>
    request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(cat) }),
  deleteCategory: (id: number) =>
    request<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' }),

  // Menu Items
  getMenuItems: (params?: { category_id?: number; search?: string; service_type?: string; active_only?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category_id) q.set('category_id', String(params.category_id));
    if (params?.search) q.set('search', params.search);
    if (params?.service_type) q.set('service_type', params.service_type);
    if (params?.active_only) q.set('active_only', 'true');
    return request<MenuItem[]>(`/menu-items?${q.toString()}`);
  },
  getMenuItem: (id: number) => request<MenuItem>(`/menu-items/${id}`),
  createMenuItem: (item: Partial<MenuItem>) =>
    request<MenuItem>('/menu-items', { method: 'POST', body: JSON.stringify(item) }),
  updateMenuItem: (id: number, item: Partial<MenuItem>) =>
    request<MenuItem>(`/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteMenuItem: (id: number) =>
    request<{ success: boolean }>(`/menu-items/${id}`, { method: 'DELETE' }),

  // Pricing
  updatePrice: (menu_item_id: number, selling_price: number, reason?: string) =>
    request<{ success: boolean; old_price: number; new_price: number }>(`/pricing/${menu_item_id}`, {
      method: 'PUT',
      body: JSON.stringify({ selling_price, reason })
    }),
  getPriceHistory: (menu_item_id: number) =>
    request<any[]>(`/pricing/history/${menu_item_id}`),

  // Packages & Addons
  getPackages: () => request<Package[]>('/packages'),
  getAddons: () => request<Addon[]>('/addons'),

  // Clients
  getClients: (search?: string) => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    return request<Client[]>(`/clients${q}`);
  },
  getClient: (id: number) => request<Client>(`/clients/${id}`),
  createClient: (client: Partial<Client>) =>
    request<Client>('/clients', { method: 'POST', body: JSON.stringify(client) }),
  updateClient: (id: number, client: Partial<Client>) =>
    request<Client>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(client) }),
  deleteClient: (id: number) =>
    request<{ success: boolean }>(`/clients/${id}`, { method: 'DELETE' }),

  // Events
  getEvents: (status?: string) => {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return request<CateringEvent[]>(`/events${q}`);
  },
  createEvent: (ev: Partial<CateringEvent>) =>
    request<CateringEvent>('/events', { method: 'POST', body: JSON.stringify(ev) }),
  updateEvent: (id: number, ev: Partial<CateringEvent>) =>
    request<CateringEvent>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(ev) }),
  deleteEvent: (id: number) =>
    request<{ success: boolean }>(`/events/${id}`, { method: 'DELETE' }),

  // Quotations
  getQuotations: (params?: { status?: string; client_id?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.status) q.set('status', params.status);
    if (params?.client_id) q.set('client_id', String(params.client_id));
    if (params?.search) q.set('search', params.search);
    return request<Quotation[]>(`/quotations?${q.toString()}`);
  },
  getQuotation: (id: number) => request<Quotation>(`/quotations/${id}`),
  createQuotation: (payload: any) =>
    request<{ id: number; quotation_number: string; grand_total: number }>('/quotations', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateQuotationStatus: (id: number, status: string) =>
    request<{ success: boolean; status: string }>(`/quotations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
  duplicateQuotation: (id: number) =>
    request<{ id: number; quotation_number: string }>(`/quotations/${id}/duplicate`, {
      method: 'POST'
    }),
  deleteQuotation: (id: number) =>
    request<{ success: boolean }>(`/quotations/${id}`, { method: 'DELETE' }),
  getPublicQuotation: (quotation_number: string) =>
    request<Quotation>(`/quotations/public/${quotation_number}`),

  // Costing Engine (Admin & Manager Only)
  getCostingOverview: () => request<CostingOverview>('/costing/overview'),
  updateItemCost: (id: number, data: { food_cost?: number; labour_cost?: number; packaging_cost?: number; overhead_cost?: number; selling_price?: number }) =>
    request<any>(`/costing/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getIngredients: () => request<Ingredient[]>('/costing/ingredients'),
  createIngredient: (data: Partial<Ingredient>) =>
    request<Ingredient>('/costing/ingredients', { method: 'POST', body: JSON.stringify(data) }),
  getLabour: () => request<LabourType[]>('/costing/labour'),
  getPackaging: () => request<PackagingItem[]>('/costing/packaging'),
  getOverheads: () => request<OverheadRule[]>('/costing/overheads'),

  // Reports
  getDashboard: () => request<DashboardData>('/reports/dashboard'),
};
