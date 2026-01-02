import { Product } from '@/types/products';
import { Flavor } from '@/types/flavors';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ProductFlavorAssociation {
  product_flavor_id: number;
  product_id: number;
  flavor_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  product: Product;
  flavor: Flavor;
}

export interface CreateProductFlavorData {
  product_id: number;
  flavor_id: number;
  is_active?: boolean;
}

type ApiSuccess<T> = { success: boolean; message?: string; data: T };

class ProductFlavorsService {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('naxos_auth_token') : null;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: 'Error de conexión',
      }));
      throw new Error(errorData.message || `Error ${response.status}`);
    }

    return response.json();
  }

  // ============================================================
  // ✅ MÉTODOS QUE USAREMOS EN EL COMPONENTE NUEVO (CRUD REAL)
  // ============================================================

  /** Lista todas las asociaciones con estado (is_active) desde BD */
  async getAllAssociations(): Promise<ProductFlavorAssociation[]> {
    const res = await ProductFlavorsService.request<ApiSuccess<ProductFlavorAssociation[]>>(
      '/api/product-flavors'
    );
    return res.data;
  }

  /** Crea una asociación (producto+sabor+estado) en BD */
  async createAssociation(payload: CreateProductFlavorData): Promise<ProductFlavorAssociation> {
    const res = await ProductFlavorsService.request<ApiSuccess<ProductFlavorAssociation>>(
      '/api/product-flavors',
      {
        method: 'POST',
        body: JSON.stringify({
          product_id: payload.product_id,
          flavor_id: payload.flavor_id,
          is_active: payload.is_active ?? true,
        }),
      }
    );
    return res.data;
  }

  /** Actualiza SOLO el estado (is_active) por ID (product_flavor_id) */
  async updateAssociation(id: number, payload: { is_active: boolean }): Promise<ProductFlavorAssociation> {
    const res = await ProductFlavorsService.request<ApiSuccess<ProductFlavorAssociation>>(
      `/api/product-flavors/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ is_active: payload.is_active }),
      }
    );
    return res.data;
  }

  /** Elimina una asociación por ID */
  async deleteAssociation(id: number): Promise<void> {
    await ProductFlavorsService.request(`/api/product-flavors/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================================
  // 🟡 MÉTODOS EXISTENTES (los dejo por compatibilidad)
  //    pero en el componente nuevo NO los usaremos para estados.
  // ============================================================

  // Alias del nombre antiguo
  async getAllProductFlavors(): Promise<ProductFlavorAssociation[]> {
    return this.getAllAssociations();
  }

  async createProductFlavor(data: CreateProductFlavorData): Promise<ProductFlavorAssociation> {
    return this.createAssociation(data);
  }

  async updateProductFlavor(id: number, is_active: boolean): Promise<ProductFlavorAssociation> {
    return this.updateAssociation(id, { is_active });
  }

  async deleteProductFlavor(id: number): Promise<void> {
    return this.deleteAssociation(id);
  }

  // Obtener sabores de un producto específico (si tu backend lo soporta)
  async getProductFlavors(productId: number): Promise<Flavor[]> {
    // OJO: tu backend puede devolver { data: Flavor[] } o { flavors: Flavor[] }.
    // Este método lo mantengo como lo tenías, pero ya no es necesario para el CRUD de estado.
    const data = await ProductFlavorsService.request<{ success: boolean; flavors: Flavor[] }>(
      `/api/product-flavors/products/${productId}/flavors`
    );
    return data.flavors;
  }

  async getFlavorProducts(flavorId: number): Promise<Product[]> {
    const data = await ProductFlavorsService.request<{ success: boolean; products: Product[] }>(
      `/api/product-flavors/flavors/${flavorId}/products`
    );
    return data.products;
  }

  // Compatibilidad (NO recomendado para estado)
  async associateFlavorsToProduct(productId: number, flavorIds: number[]): Promise<void> {
    await ProductFlavorsService.request(`/api/product-flavors/products/${productId}/flavors`, {
      method: 'POST',
      body: JSON.stringify({ flavor_ids: flavorIds }),
    });
  }

  async removeFlavorFromProduct(productId: number, flavorId: number): Promise<void> {
    await ProductFlavorsService.request(
      `/api/product-flavors/products/${productId}/flavors/${flavorId}`,
      { method: 'DELETE' }
    );
  }

  async deleteProductFlavors(
    productId: number
  ): Promise<{ success: boolean; message: string; deletedCount: number }> {
    const result = await ProductFlavorsService.request<{
      success: boolean;
      message: string;
      deletedCount: number;
    }>(`/api/product-flavors/products/${productId}`, { method: 'DELETE' });
    return result;
  }

  async deleteFlavorProducts(
    flavorId: number
  ): Promise<{ success: boolean; message: string; deletedCount: number }> {
    const result = await ProductFlavorsService.request<{
      success: boolean;
      message: string;
      deletedCount: number;
    }>(`/api/product-flavors/flavors/${flavorId}`, { method: 'DELETE' });
    return result;
  }
}

export const productFlavorsService = new ProductFlavorsService();
export default productFlavorsService;
