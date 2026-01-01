import { Flavor, FlavorFormData, ProductFlavor } from '@/types/flavors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class FlavorsService {
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

  // ==================== SABORES ====================
  
  // Obtener todos los sabores
  async getAllFlavors(): Promise<Flavor[]> {
    try {
      const data = await FlavorsService.request<{ flavors: Flavor[] }>('/api/flavors');
      return data.flavors;
    } catch (error) {
      console.error('Error fetching flavors:', error);
      throw error;
    }
  }

  // Crear sabor
  async createFlavor(data: FlavorFormData): Promise<Flavor> {
    try {
      const result = await FlavorsService.request<{ flavor: Flavor }>('/api/flavors', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result.flavor;
    } catch (error) {
      console.error('Error creating flavor:', error);
      throw error;
    }
  }

  // Actualizar sabor
  async updateFlavor(id: number, data: FlavorFormData): Promise<Flavor> {
    try {
      const result = await FlavorsService.request<{ flavor: Flavor }>(`/api/flavors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return result.flavor;
    } catch (error) {
      console.error('Error updating flavor:', error);
      throw error;
    }
  }

  // Eliminar sabor
  async deleteFlavor(id: number): Promise<void> {
    try {
      await FlavorsService.request(`/api/flavors/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting flavor:', error);
      throw error;
    }
  }

  // Buscar sabores por nombre
  async searchFlavors(query: string): Promise<Flavor[]> {
    try {
      const data = await FlavorsService.request<{ flavors: Flavor[] }>(`/api/flavors/search?q=${encodeURIComponent(query)}`);
      return data.flavors;
    } catch (error) {
      console.error('Error searching flavors:', error);
      throw error;
    }
  }

  // ==================== PRODUCT_FLAVORS ====================
  
  // Obtener sabores asociados a un producto
  async getProductFlavors(productId: number): Promise<Flavor[]> {
    try {
      const data = await FlavorsService.request<{ flavors: Flavor[] }>(`/api/product-flavors/products/${productId}/flavors`);
      return data.flavors;
    } catch (error) {
      console.error('Error fetching product flavors:', error);
      throw error;
    }
  }

  // Asociar sabores a un producto
  async associateFlavorsToProduct(productId: number, flavorIds: number[]): Promise<void> {
    try {
      await FlavorsService.request(`/api/product-flavors/products/${productId}/flavors`, {
        method: 'POST',
        body: JSON.stringify({ flavor_ids: flavorIds }),
      });
    } catch (error) {
      console.error('Error associating flavors to product:', error);
      throw error;
    }
  }

  // Remover sabor de un producto
  async removeFlavorFromProduct(productId: number, flavorId: number): Promise<void> {
    try {
      await FlavorsService.request(`/api/product-flavors/products/${productId}/flavors/${flavorId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error removing flavor from product:', error);
      throw error;
    }
  }
}

export const flavorsService = new FlavorsService();
export default flavorsService;
