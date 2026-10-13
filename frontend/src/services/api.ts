import {
  User, Category, MenuItem, Package, Addon, Client, CateringEvent,
  Quotation, CompanySettings, CostingOverview, Ingredient, LabourType,
  PackagingItem, OverheadRule, DashboardData, Tenant, Recipe, EventPurchaseList,
  CutleryMasterItem
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('catering_token') || localStorage.getItem('bandco_token') || '1:ADMIN:catering';
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`
  };
  const activeTenantId = localStorage.getItem('active_tenant_id');
  if (activeTenantId) {
    headers['X-Tenant-ID'] = activeTenantId;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeaders(),
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
    request<{ token: string; user: User; tenant: Tenant | null }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  getUsers: () => request<User[]>('/auth/users'),

  // Multi-Tenancy (Super Admin)
  getTenants: () => request<Tenant[]>('/tenants'),
  createTenant: (payload: any) =>
    request<Tenant>('/tenants', { method: 'POST', body: JSON.stringify(payload) }),
  getTenant: (id: number) => request<Tenant>(`/tenants/${id}`),
  updateTenant: (id: number, payload: any) =>
    request<Tenant>(`/tenants/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTenant: (id: number) =>
    request<{ status: string; id: number; name: string }>(`/tenants/${id}`, { method: 'DELETE' }),
  createTenantAdmin: (id: number, payload: any) =>
    request<any>(`/tenants/${id}/admin-user`, { method: 'POST', body: JSON.stringify(payload) }),
  getTenantUsers: (tenantId: number) =>
    request<User[]>(`/tenants/${tenantId}/users`),
  createTenantUser: (tenantId: number, payload: { full_name: string; email: string; password: string; role: string }) =>
    request<User>(`/tenants/${tenantId}/users`, { method: 'POST', body: JSON.stringify(payload) }),
  updateTenantUser: (tenantId: number, userId: number, payload: { full_name?: string; email?: string; password?: string; role?: string; is_active?: number }) =>
    request<User>(`/tenants/${tenantId}/users/${userId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTenantUser: (tenantId: number, userId: number) =>
    request<{ status: string; id: number }>(`/tenants/${tenantId}/users/${userId}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request<CompanySettings>('/settings'),
  updateSettings: (data: Partial<CompanySettings>) =>
    request<CompanySettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Categories
  getCategories: (hideEmpty?: boolean) => request<Category[]>(`/categories${hideEmpty ? '?hide_empty=true' : ''}`),
  createCategory: (cat: Partial<Category>) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(cat) }),
  updateCategory: (id: number, cat: Partial<Category>) =>
    request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(cat) }),
  deleteCategory: (id: number) =>
    request<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' }),

  // Cutlery Master
  getCutleryMaster: () => request<CutleryMasterItem[]>('/cutlery-master'),
  createCutleryMasterItem: (data: Partial<CutleryMasterItem>) =>
    request<CutleryMasterItem>('/cutlery-master', { method: 'POST', body: JSON.stringify(data) }),
  updateCutleryMasterItem: (id: number, data: Partial<CutleryMasterItem>) =>
    request<CutleryMasterItem>(`/cutlery-master/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCutleryMasterItem: (id: number) =>
    request<{ success: boolean }>(`/cutlery-master/${id}`, { method: 'DELETE' }),

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
  
  // File Uploads
  uploadImage: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const headers = getAuthHeaders();
    delete (headers as any)['Content-Type'];

    const res = await fetch('/api/upload-image', {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    return res.json();
  },

  uploadLogo: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const headers = getAuthHeaders();
    delete (headers as any)['Content-Type'];

    const res = await fetch('/api/upload-logo', {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Logo upload failed');
    return res.json();
  },

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
  updateQuotation: (id: number, payload: any) =>
    request<{ id: number; quotation_number: string; grand_total: number }>(`/quotations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  updateQuotationStatus: (id: number, status: string) =>
    request<{ success: boolean; status: string }>(`/quotations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),
  deleteQuotation: (id: number) =>
    request<{ success: boolean }>(`/quotations/${id}`, { method: 'DELETE' }),

  // Recipes & Ingredients
  getIngredients: (category?: string) => {
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    return request<Ingredient[]>(`/ingredients${q}`);
  },
  createIngredient: (data: Partial<Ingredient>) =>
    request<Ingredient>('/ingredients', { method: 'POST', body: JSON.stringify(data) }),
  updateIngredient: (id: number, data: Partial<Ingredient>) =>
    request<Ingredient>(`/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteIngredient: (id: number) =>
    request<{ success: boolean }>(`/ingredients/${id}`, { method: 'DELETE' }),

  getRecipes: () => request<Recipe[]>('/recipes'),
  getRecipeByMenuItem: (menuItemId: number) =>
    request<Recipe>(`/recipes/item/${menuItemId}`),
  saveRecipe: (recipeData: any) =>
    request<{ success: boolean; recipe_id: number; cost_per_portion: number }>('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipeData)
    }),
  deleteRecipe: (id: number) =>
    request<{ success: boolean }>(`/recipes/${id}`, { method: 'DELETE' }),

  // Automated Purchase / Procurement Lists
  getEventPurchaseList: (eventId: number) =>
    request<EventPurchaseList>(`/events/${eventId}/purchase-list`),
  getQuotationPurchaseList: (quotationId: number) =>
    request<EventPurchaseList>(`/quotations/${quotationId}/purchase-list`),
  saveEventPurchaseList: (eventId: number, payload: any) =>
    request<{ success: boolean }>(`/events/${eventId}/save-purchase-list`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getPurchaseListPdfUrl: (eventId: number) =>
    `/api/events/${eventId}/purchase-list/pdf`,
  getQuotationPurchaseListPdfUrl: (quotationId: number) =>
    `/api/quotations/${quotationId}/purchase-list/pdf`,
  downloadQuotationPdf: async (quotationId: number, filename?: string) => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
      const response = await fetch(`/api/quotations/${quotationId}/pdf`, { headers });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `Quotation-${quotationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (e) {
      window.open(`/api/quotations/${quotationId}/pdf`, '_blank');
    }
  },

  // Costing Engine
  getCostingOverview: () => request<CostingOverview>('/costing/overview'),
  updateItemCost: (id: number, data: { food_cost?: number; labour_cost?: number; packaging_cost?: number; overhead_cost?: number; selling_price?: number }) =>
    request<any>(`/costing/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getLabour: () => request<LabourType[]>('/costing/labour'),
  getPackaging: () => request<PackagingItem[]>('/costing/packaging'),
  getOverheads: () => request<OverheadRule[]>('/costing/overheads'),

  // Reports
  getDashboard: () => request<DashboardData>('/reports/dashboard'),
};
