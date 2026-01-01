import { Product, Category, ProductFormData, ProductsApiResponse, ProductApiResponse, CategoriesApiResponse } from '@/types/products';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ProductsService {
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

  // Obtener todos los productos
  static async getProducts(): Promise<ProductsApiResponse> {
    return this.request<ProductsApiResponse>('/api/products');
  }

  // Obtener producto por ID
  static async getProduct(id: number): Promise<ProductApiResponse> {
    return this.request<ProductApiResponse>(`/api/products/${id}`);
  }

  // Crear nuevo producto
  static async createProduct(data: ProductFormData): Promise<ProductApiResponse> {
    return this.request<ProductApiResponse>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Actualizar producto
  static async updateProduct(id: number, data: ProductFormData): Promise<ProductApiResponse> {
    return this.request<ProductApiResponse>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Eliminar producto
  static async deleteProduct(id: number): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Obtener categorías
  static async getCategories(): Promise<CategoriesApiResponse> {
    return this.request<CategoriesApiResponse>('/api/products/categories');
  }
}
