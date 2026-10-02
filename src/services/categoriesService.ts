import { Category, CategoryFormData } from '@/types/categories';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class CategoriesService {
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

  // ==================== CATEGORÍAS ====================

  // Obtener todas las categorías
  async getAllCategories(): Promise<Category[]> {
    try {
      const data = await CategoriesService.request<{ categories: Category[] }>('/api/categories');
      return data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Crear categoría
  async createCategory(data: CategoryFormData): Promise<Category> {
    try {
      const result = await CategoriesService.request<{ category: Category }>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return result.category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Actualizar categoría
  async updateCategory(id: number, data: CategoryFormData): Promise<Category> {
    try {
      const result = await CategoriesService.request<{ category: Category }>(`/api/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      return result.category;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Eliminar categoría
  async deleteCategory(id: number): Promise<void> {
    try {
      await CategoriesService.request(`/api/categories/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }
}

export const categoriesService = new CategoriesService();
export default categoriesService;
