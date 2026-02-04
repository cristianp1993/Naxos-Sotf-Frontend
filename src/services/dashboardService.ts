import { API_URL } from '@/services/api';
import { AuthService } from '@/services/authService';

export interface DashboardStats {
  totalSabores: number;
  ventasHoy: {
    cantidad: number;
    total: number;
  };
  topProducto: {
    product_name: string;
    total_vendido: number;
    total_unidades: number;
  } | null;
  topVariante: {
    variant_name: string;
    product_name: string;
    total_vendido: number;
    total_unidades: number;
  } | null;
  topSabor: {
    flavor_name: string;
    total_vendido: number;
    total_unidades: number;
  } | null;
}

export interface DashboardResponse {
  message: string;
  data: DashboardStats;
}

export const dashboardService = {
  async getStats(): Promise<DashboardResponse> {
    try {
      const token = AuthService.getToken();
      const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }
};
