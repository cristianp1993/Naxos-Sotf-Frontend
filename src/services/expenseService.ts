// services/expenseService.ts
import { API_URL } from '@/services/api';
import { AuthService } from '@/services/authService'; 

export type Expense = {
  id: number;
  expense_date: string;
  concept: string;
  description: string | null;
  amount: number;
};

export type CreateExpensePayload = {
  expense_date: string;
  concept: string;
  description?: string | null;
  amount: number;
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

export const expenseService = {
  getAllExpenses: () =>
    apiFetch<Expense[]>('/api/expenses', {
      method: 'GET',
    }),

  getExpenseById: (id: number) =>
    apiFetch<Expense>(`/api/expenses/${id}`, {
      method: 'GET',
    }),

  createExpense: (payload: CreateExpensePayload) =>
    apiFetch<{ message: string; expense: Expense }>('/api/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateExpense: (id: number, payload: Partial<CreateExpensePayload>) =>
    apiFetch<{ message: string; expense: Expense }>(`/api/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteExpense: (id: number) =>
    apiFetch<{ message: string; expense_id: number }>(`/api/expenses/${id}`, {
      method: 'DELETE',
    }),

  getExpensesByDateRange: (startDate: string, endDate: string) =>
    apiFetch<Expense[]>(`/api/expenses/range/dates?start_date=${startDate}&end_date=${endDate}`, {
      method: 'GET',
    }),

  getExpensesSummary: (year?: string) => {
    const url = year ? `/api/expenses/summary/monthly?year=${year}` : '/api/expenses/summary/monthly';
    return apiFetch<any[]>(url, {
      method: 'GET',
    });
  },
};
