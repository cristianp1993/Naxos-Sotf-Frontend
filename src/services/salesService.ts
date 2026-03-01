// services/salesService.ts
import { API_URL } from '@/services/api';
import { AuthService } from '@/services/authService'; 

export type PaymentMethodUI = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO'; 

export type CreateFullSalePayload = {
  location_id: number;
  observation?: string | null;
  items: Array<{
    variant_id: number;
    flavor_name?: string | null;
    quantity: number;
    unit_price?: number;
    is_promo_2x1?: boolean;
    promo_reference?: string | null;
  }>;
  payments: Array<{
    method: PaymentMethodUI;
    amount: number;
    reference?: string | null;
  }>;
};

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? AuthService.getToken() : null;

  console.log(`🔍 Haciendo petición a: ${API_URL}${path}`);
  console.log(`🔍 Token existe: ${!!token}`);
  console.log(`🔍 Opciones:`, options);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  
  console.log(`🔍 Respuesta status: ${res.status}`);
  console.log(`🔍 Respuesta data:`, data);

  if (!res.ok) {
      const msg = data?.message || data?.error || 'Error en la solicitud';
      console.error(`❌ Error en API: ${msg}`);
      console.error(`❌ Status: ${res.status}`);
      console.error(`❌ Respuesta completa:`, data);
      throw new Error(msg);
    }

  return data as T;
}

export const salesService = {
  createFullSale: (payload: CreateFullSalePayload) =>
    apiFetch<{ message: string; sale: any }>('/api/sales/full', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getAllSales: () =>
    apiFetch<Sale[]>('/api/sales', {
      method: 'GET',
    }),

  getSalesWithFilters: (filters: { start_date?: string; end_date?: string; page?: number; limit?: number }) => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/api/sales?${queryString}` : '/api/sales';
    
    return apiFetch<{
      sales: Sale[];
      total: number;
      totals: {
        grand_total: number;
        payment_methods: Record<string, number>;
      };
    }>(url, {
      method: 'GET',
    });
  },

  getSalesWithFiltersTotals: (filters: { start_date?: string; end_date?: string }) => {
    const params = new URLSearchParams();
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    params.append('totals_only', 'true');
    
    const queryString = params.toString();
    const url = `/api/sales?${queryString}`;
    
    return apiFetch<{
      totals: {
        grand_total: number;
        payment_methods: Record<string, number>;
        total_count: number;
      };
    }>(url, {
      method: 'GET',
    });
  },

  getSaleById: (id: number) =>
    apiFetch<Sale>(`/api/sales/${id}`, {
      method: 'GET',
    }),

  deleteSale: (id: number) =>
    apiFetch<{ message: string; sale_id: number; deleted_items?: number; deleted_payments?: number }>(`/api/sales/${id}`, {
      method: 'DELETE',
    }),

  updateSale: (id: number, payload: Partial<CreateFullSalePayload>) =>
    apiFetch<{ message: string; sale: Sale }>(`/api/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
};

export type Sale = {
  sale_id: number;
  observation: string | null;
  total: number;
  opened_at: string;
  status: string;
  location_id?: number;
  items: Array<{
    product_name: string;
    variant_name: string;
    flavor_name: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
    is_promo_2x1?: boolean;
    promo_reference?: string | null;
  }>;
  payments: Array<{
    method: string;
    amount: number;
    reference: string | null;
  }>;
};
