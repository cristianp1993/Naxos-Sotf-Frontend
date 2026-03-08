import { API_URL } from '@/services/api';
import type {
  RegisterMemberPayload,
  RegisterMemberResponse,
  CheckPointsResponse,
  RewardsResponse,
  AddPointsPayload,
  AddPointsResponse,
  RedeemPayload,
  RedeemResponse,
  SearchMembersResponse,
} from '@/types/loyalty';

async function loyaltyFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data?.message || data?.error || data?.details?.join(', ') || 'Error en la solicitud';
    throw new Error(msg);
  }

  return data as T;
}

export const loyaltyService = {
  /** Registra un nuevo miembro en el programa de puntos */
  register: (payload: RegisterMemberPayload) =>
    loyaltyFetch<RegisterMemberResponse>('/api/loyalty/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  /** Consulta pública de puntos por teléfono o cédula */
  checkPoints: (query: string) =>
    loyaltyFetch<CheckPointsResponse>(`/api/loyalty/check-points?query=${encodeURIComponent(query)}`),

  /** Obtiene el catálogo activo de recompensas */
  getRewards: () =>
    loyaltyFetch<RewardsResponse>('/api/loyalty/rewards'),

  /** (Protegida) Busca miembros por nombre, teléfono o cédula */
  searchMembers: (query: string, token: string) =>
    loyaltyFetch<SearchMembersResponse>(`/api/loyalty/search?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** (Protegida) Suma puntos a un miembro */
  addPoints: (payload: AddPointsPayload, token: string) =>
    loyaltyFetch<AddPointsResponse>('/api/loyalty/add-points', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${token}` },
    }),

  /** (Protegida) Redime un premio */
  redeem: (payload: RedeemPayload, token: string) =>
    loyaltyFetch<RedeemResponse>('/api/loyalty/redeem', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${token}` },
    }),
};
