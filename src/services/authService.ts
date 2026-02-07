export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  user_id: number;
  username: string;
  email?: string;
  role: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

interface TokenPayload {
  userId: number;
  username: string;
  role: string;
  exp?: number;
  iat?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class AuthService {
  private static TOKEN_KEY = 'naxos_auth_token';
  private static USER_KEY = 'naxos_user';

  // Validar si el token ha expirado
  static isTokenExpired(token: string): boolean {
    try {
      const payload = this.parseToken(token);
      if (!payload.exp) return false; // Si no hay exp, asumimos que no expira
      
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true; // Si no podemos parsear, asumimos que es inválido
    }
  }

  // Parsear token JWT (sin verificar firma)
  private static parseToken(token: string): TokenPayload {
    const base64Url = token.split('.')[1];
    if (!base64Url) throw new Error('Token inválido');
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  }

  // Validar token actual
  static validateCurrentToken(): { valid: boolean; expired: boolean; needsRefresh: boolean } {
    const token = this.getToken();
    if (!token) return { valid: false, expired: false, needsRefresh: false };
    
    try {
      this.parseToken(token);
      const expired = this.isTokenExpired(token);
      
      // Considerar que necesita refresh si falta menos de 1 hora para expirar
      const payload = this.parseToken(token);
      const needsRefresh = payload.exp ? (payload.exp - Math.floor(Date.now() / 1000)) < 3600 : false;
      
      return { valid: !expired, expired, needsRefresh };
    } catch {
      return { valid: false, expired: true, needsRefresh: false };
    }
  }

  static async login(credentials: LoginCredentials): Promise<AuthResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        this.showErrorToast(errorData.message || 'Error en el login');
        return null;
      }

      const data: AuthResponse = await response.json();
      
      // Validar token antes de guardarlo
      if (this.isTokenExpired(data.token)) {
        this.showErrorToast('El token recibido ya está expirado');
        return null;
      }
      
      // Guardar token y usuario en localStorage
      localStorage.setItem(this.TOKEN_KEY, data.token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
      
      return data;
    } catch (error) {
      console.error('Error en login:', error);
      this.showErrorToast('Error de conexión al servidor');
      return null;
    }
  }

  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    
    // Limpiar cualquier otro dato de sesión
    localStorage.removeItem('token'); // Por si hay tokens antiguos
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static getUser(): User | null {
    const userData = localStorage.getItem(this.USER_KEY);
    return userData ? JSON.parse(userData) : null;
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    const validation = this.validateCurrentToken();
    return validation.valid && !validation.expired;
  }

  static async getProfile(): Promise<User> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Validar token antes de hacer la petición
      const validation = this.validateCurrentToken();
      if (!validation.valid || validation.expired) {
        this.logout();
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        this.logout();
        throw new Error('Tu sesión ha expirado o es inválida');
      }

      if (!response.ok) {
        throw new Error('Error obteniendo perfil');
      }

      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      throw error;
    }
  }

  // Método para limpiar tokens inválidos
  static clearInvalidTokens(): void {
    const validation = this.validateCurrentToken();
    if (!validation.valid || validation.expired) {
      this.logout();
    }
  }

  // Obtener tiempo restante del token en segundos
  static getTokenRemainingTime(): number {
    const token = this.getToken();
    if (!token) return 0;
    
    try {
      const payload = this.parseToken(token);
      if (!payload.exp) return Infinity;
      
      return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
    } catch {
      return 0;
    }
  }

  // Método para mostrar toast de error
  private static showErrorToast(message: string): void {
    if (typeof window !== 'undefined') {
      // Eliminar toast existente si hay uno
      const existingToast = document.getElementById('auth-error-toast');
      if (existingToast) {
        existingToast.remove();
      }

      // Crear nuevo toast
      const toast = document.createElement('div');
      toast.id = 'auth-error-toast';
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
