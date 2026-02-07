import { API_URL } from './api';
import { AuthService } from './authService';

export interface User {
  user_id: string;
  username: string;
  email: string;
  name: string;
  password_hash?: string;
  role: 'ADMIN' | 'MANAGER';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  name: string;
  password: string;
  role: 'ADMIN' | 'MANAGER';
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  name?: string;
  role?: 'ADMIN' | 'MANAGER';
  is_active?: boolean;
}

class UserService {
  private async request(endpoint: string, options: RequestInit = {}) {
    const token = AuthService.getToken();
    
    // Si no hay token, redirigir al login
    if (!token) {
      AuthService.logout();
      window.location.href = '/login';
      throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
      ...options,
    });

    // Manejar tokens inválidos o expirados
    if (response.status === 401 || response.status === 403) {
      const error = await response.json().catch(() => ({}));
      
      // Limpiar sesión y redirigir al login
      AuthService.logout();
      
      // Mostrar mensaje más claro
      const errorMessage = error.message || 'Tu sesión ha expirado o es inválida';
      
      // Redirigir al login con mensaje de error
      if (typeof window !== 'undefined') {
        window.location.href = `/login?error=${encodeURIComponent(errorMessage)}`;
      }
      
      throw new Error(errorMessage);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getAllUsers(): Promise<User[]> {
    const response = await this.request('/api/auth/users');
    return response.users || [];
  }

  async getUserById(userId: string): Promise<User> {
    return this.request(`/api/users/${userId}`);
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await this.request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      this.showSuccessToast('Usuario creado exitosamente');
      return response.user;
    } catch (error: any) {
      // Manejar errores de validación sin hacer throw
      if (error.message?.includes('email') && error.message?.includes('valid email')) {
        const friendlyMessage = 'El email debe tener un formato válido (ej: correo@ejemplo.com)';
        this.showErrorToast(friendlyMessage);
        return Promise.reject(new Error(friendlyMessage));
      }
      
      if (error.message?.includes('name') && error.message?.includes('3 characters')) {
        const friendlyMessage = 'El nombre completo debe tener al menos 3 caracteres';
        this.showErrorToast(friendlyMessage);
        return Promise.reject(new Error(friendlyMessage));
      }
      
      this.showErrorToast(error.message || 'Error al crear usuario');
      return Promise.reject(error);
    }
  }

  async updateUser(userId: string, userData: UpdateUserRequest): Promise<User> {
    try {
      return await this.request(`/api/auth/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    } catch (error: any) {
      // Manejar errores de validación sin hacer throw
      if (error.message?.includes('email')) {
        const friendlyMessage = error.message.replace('"email" must be a valid email', 'El nombre completo es requerido');
        this.showErrorToast(friendlyMessage);
        return Promise.reject(new Error(friendlyMessage));
      }
      
      this.showErrorToast(error.message || 'Error al actualizar usuario');
      return Promise.reject(error);
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      return await this.request(`/api/auth/users/${userId}`, {
        method: 'DELETE',
      });
    } catch (error: any) {
      this.showErrorToast(error.message || 'Error al eliminar usuario');
      return Promise.reject(error);
    }
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<User> {
    try {
      return await this.request(`/api/auth/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: isActive }),
      });
    } catch (error: any) {
      this.showErrorToast(error.message || 'Error al cambiar estado del usuario');
      return Promise.reject(error);
    }
  }

  // Método para mostrar toast de éxito
  private showSuccessToast(message: string): void {
    if (typeof window !== 'undefined') {
      const existingToast = document.getElementById('success-toast');
      if (existingToast) {
        existingToast.remove();
      }

      const toast = document.createElement('div');
      toast.id = 'success-toast';
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm animate-pulse';
      toast.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <span class="text-sm font-medium">${message}</span>
        </div>
      `;
      
      document.body.appendChild(toast);
      
      setTimeout(() => {
        if (toast && toast.parentNode) {
          toast.remove();
        }
      }, 3000);
    }
  }

  // Método para mostrar toast de error
  private showErrorToast(message: string): void {
    // Crear y mostrar un toast simple
    if (typeof window !== 'undefined') {
      // Eliminar toast existente si hay uno
      const existingToast = document.getElementById('error-toast');
      if (existingToast) {
        existingToast.remove();
      }

      // Crear nuevo toast
      const toast = document.createElement('div');
      toast.id = 'error-toast';
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm animate-pulse';
      toast.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-sm font-medium">${message}</span>
        </div>
      `;
      
      document.body.appendChild(toast);
      
      // Auto-eliminar después de 4 segundos
      setTimeout(() => {
        if (toast && toast.parentNode) {
          toast.remove();
        }
      }, 4000);
    }
  }
}

export const userService = new UserService();
