// services/salesService.ts
import { API_URL } from '@/services/api';
import { AuthService } from '@/services/authService'; 

export type PaymentMethodUI = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO'; 

export type CreateFullSalePayload = {
  location_id: number;
  observation?: string | null;
  items: Array<{
    variant_id: number;
    flavor_id?: number | null;
    quantity: number;
    unit_price?: number;
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
  }>;
  payments: Array<{
    method: string;
    amount: number;
    reference: string | null;
  }>;
};
