import {
  InventoryLocation,
  InventoryStock,
  InventoryMovement,
  StockUpdateData,
  MovementData,
  LocationFormData,
  LocationsResponse,
  LocationResponse,
  StockResponse,
  MovementResponse,
  MovementsResponse,
  LowStockResponse,
  InventorySummaryResponse
} from '@/types/inventory';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class InventoryService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('naxos_auth_token');
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Error de conexión'
      }));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    return response.json();
  }

  // ==================== UBICACIONES ====================
  
  static async getLocations(): Promise<LocationsResponse> {
    return this.request<LocationsResponse>('/api/inventory/locations');
  }

  static async createLocation(data: LocationFormData): Promise<LocationResponse> {
    return this.request<LocationResponse>('/api/inventory/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ==================== STOCK ====================
  
  static async getStockByLocation(locationId: number): Promise<StockResponse> {
    return this.request<StockResponse>(`/api/inventory/locations/${locationId}/stock`);
  }

  static async getStockByVariant(variantId: number): Promise<StockResponse> {
    return this.request<StockResponse>(`/api/inventory/variants/${variantId}/stock`);
  }

  static async updateStock(data: StockUpdateData): Promise<{ success: boolean; message: string; data: InventoryStock }> {
    return this.request<{ success: boolean; message: string; data: InventoryStock }>('/api/inventory/stock', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ==================== MOVIMIENTOS ====================
  
  static async createMovement(data: MovementData): Promise<MovementResponse> {
    return this.request<MovementResponse>('/api/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async getMovementHistory(params?: {
    location_id?: number;
    variant_id?: number;
    movement_type?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<MovementsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/inventory/movements/history${queryString ? `?${queryString}` : ''}`;
    
    return this.request<MovementsResponse>(endpoint);
  }

  // ==================== REPORTES ====================
  
  static async getLowStock(params?: {
    location_id?: number;
    threshold?: number;
  }): Promise<LowStockResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/inventory/reports/low-stock${queryString ? `?${queryString}` : ''}`;
    
    return this.request<LowStockResponse>(endpoint);
  }

  static async getInventorySummary(params?: {
    location_id?: number;
  }): Promise<InventorySummaryResponse> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = `/api/inventory/reports/summary${queryString ? `?${queryString}` : ''}`;
    
    return this.request<InventorySummaryResponse>(endpoint);
  }
}
