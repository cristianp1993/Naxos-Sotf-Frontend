// services/salesService.ts
import { API_URL } from '@/services/api'; 

export type PaymentMethodUI = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO'; 

export type CreateFullSalePayload = {
  location_id: number;
  customer_note?: string | null;
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
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || data?.error || 'Error en la solicitud';
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
};
