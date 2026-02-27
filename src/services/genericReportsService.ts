import { API_URL } from '@/services/api';
import { AuthService } from '@/services/authService';
import { ReportConfig, ReportFilters, ReportResponse } from './reportRegistry';
import { getReportConfig, REPORT_REGISTRY, getReportsByCategory } from './reportRegistry';

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? AuthService.getToken() : null;

  console.log(`🔍 Reports API - Haciendo petición a: ${API_URL}${path}`);
  console.log(`🔍 Reports API - Token existe: ${!!token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));
  
  console.log(`🔍 Reports API - Respuesta status: ${res.status}`);
  console.log(`🔍 Reports API - Respuesta data:`, data);

  if (!res.ok) {
      const msg = data?.message || data?.error || 'Error en la solicitud';
      console.error(`❌ Error en Reports API: ${msg}`);
      console.error(`❌ Status: ${res.status}`);
      console.error(`❌ Respuesta completa:`, data);
      throw new Error(msg);
    }

  return data as T;
}

export class ReportService {
  private config: ReportConfig;

  constructor(config: ReportConfig) {
    this.config = config;
  }

  // Método genérico para generar cualquier tipo de reporte
  async generateReport(filters: ReportFilters): Promise<ReportResponse> {
    const params = new URLSearchParams();
    
    // Agregar filtros dinámicamente
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = `/api/reports/${this.config.id}${queryString ? '?' + queryString : ''}`;
    
    return apiFetch<ReportResponse>(url, {
      method: 'GET',
    });
  }

  // Método genérico para descargar cualquier tipo de reporte
  async downloadReport(filters: ReportFilters, format: 'pdf' | 'excel'): Promise<ReportResponse> {
    const params = new URLSearchParams();
    
    // Agregar filtros dinámicamente
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });
    
    params.append('format', format);
    
    const queryString = params.toString();
    const url = `/api/reports/${this.config.id}/download${queryString ? '?' + queryString : ''}`;
    
    return apiFetch<ReportResponse>(url, {
      method: 'GET',
    });
  }

  // Getters para la configuración
  getConfig(): ReportConfig {
    return this.config;
  }

  requiresDateRange(): boolean {
    return this.config.requiresDateRange;
  }

  getDownloadFormats(): ('pdf' | 'excel')[] {
    return this.config.downloadFormats;
  }
}

// Factory para crear servicios de reportes
export class ReportServiceFactory {
  private static services = new Map<string, ReportService>();

  static getService(reportId: string): ReportService {
    const config = getReportConfig(reportId);
    
    if (!config) {
      throw new Error(`Reporte con ID '${reportId}' no encontrado`);
    }

    // Cache del servicio para reutilizar
    if (!this.services.has(reportId)) {
      this.services.set(reportId, new ReportService(config));
    }

    return this.services.get(reportId)!;
  }

  static getAllServices(): ReportService[] {
    return REPORT_REGISTRY.map((config: ReportConfig) => this.getService(config.id));
  }

  static getServicesByCategory(category: string): ReportService[] {
    const configs = getReportsByCategory(category as 'financial' | 'inventory' | 'sales' | 'operations');
    return configs.map((config: ReportConfig) => this.getService(config.id));
  }
}

// Servicio principal de reportes para compatibilidad con código existente
export const reportsService = {
  // Métodos específicos para flujo de caja (compatibilidad)
  getCashFlowReport: (filters: { start_date: string; end_date: string }) => {
    const service = ReportServiceFactory.getService('cash-flow');
    return service.generateReport(filters);
  },

  downloadCashFlowReport: (filters: { start_date: string; end_date: string; format: 'pdf' | 'excel' }) => {
    const service = ReportServiceFactory.getService('cash-flow');
    return service.downloadReport(filters, filters.format);
  },

  // Métodos genéricos para nuevos reportes
  generateReport: (reportId: string, filters: ReportFilters) => {
    const service = ReportServiceFactory.getService(reportId);
    return service.generateReport(filters);
  },

  downloadReport: (reportId: string, filters: ReportFilters, format: 'pdf' | 'excel') => {
    const service = ReportServiceFactory.getService(reportId);
    return service.downloadReport(filters, format);
  },

  // Utilidades
  getFactory: () => ReportServiceFactory,
  getService: (reportId: string) => ReportServiceFactory.getService(reportId)
};
