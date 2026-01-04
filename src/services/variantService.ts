import type { Variant, VariantFormData } from '@/types/products';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const authHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const variantsService = {
  async getAll(): Promise<Variant[]> {
    const res = await fetch(`${API_URL}/api/variants`, {
      method: 'GET',
      headers: authHeaders(),
      cache: 'no-store'
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Error cargando variantes');

    const list = data?.variants ?? data?.data ?? data?.items ?? data;
    return Array.isArray(list) ? list : [];
  },

  async create(payload: VariantFormData): Promise<Variant> {
    const res = await fetch(`${API_URL}/api/variants`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Error creando variante');

    return data?.variant ?? data?.data ?? data;
  },

  async update(id: number, payload: VariantFormData): Promise<Variant> {
    const res = await fetch(`${API_URL}/api/variants/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Error actualizando variante');

    return data?.variant ?? data?.data ?? data;
  },

  async remove(id: number): Promise<void> {
    const res = await fetch(`${API_URL}/api/variants/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || 'Error eliminando variante');
  }
};
