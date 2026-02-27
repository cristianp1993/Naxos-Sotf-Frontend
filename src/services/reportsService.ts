import { API_URL } from '@/services/api';
import { AuthService } from '@/services/authService';

export type SalesSummaryReport = {
  periodo: {
    start_date: string;
    end_date: string;
    startDate: string;
    endDate: string;
  };
  resumen: {
    total_ventas: number;
    total_ventas_valor: number;
    valor_promedio_venta: number;
    total_items_vendidos: number;
    total_unidades_vendidas: number;
  };
  metodos_pago: Array<{
    method: string;
    cantidad_ventas: number;
    total: number;
    transacciones: number;
  }>;
  top_productos: Array<{
    product_name: string;
    total_ventas_producto: number;
    total_unidades_producto: number;
    total_ventas_producto_valor: number;
    clientes_unicos: number;
  }>;
  top_variantes: Array<{
    variant_name: string;
    product_name: string;
    total_ventas_variante: number;
    total_unidades_variante: number;
    total_ventas_variante_valor: number;
  }>;
  top_sabores: Array<{
    flavor_name: string;
    total_ventas_sabor: number;
    total_unidades_sabor: number;
    total_ventas_sabor_valor: number;
  }>;
  ventas_por_hora: Array<{
    hora: number;
    cantidad_ventas: number;
    total_ventas_hora: number;
    promedio_venta_hora: number;
  }>;
  ventas_por_tamaño: Array<{
    tamaño: string;
    cantidad_vendida: number;
    total_unidades: number;
    total_ventas: number;
    ventas_unicas: number;
  }>;
};

export type SalesSummaryReportResponse = {
  message: string;
  data: SalesSummaryReport;
};

export interface CashFlowReport {
  periodo: {
    start_date: string;
    end_date: string;
    startDate: string;
    endDate: string;
  };
  resumen: {
    total_ingresos: number;
    total_egresos: number;
    diferencia: number;
    resultado: 'POSITIVO' | 'NEGATIVO';
  };
  ventas: {
    total_ventas: number;
    desglose_pagos: {
      efectivo: {
        cantidad: number;
        total: number;
      };
      transferencia: {
        cantidad: number;
        total: number;
      };
      tarjeta: {
        cantidad: number;
        total: number;
      };
      otro: {
        cantidad: number;
        total: number;
      };
    };
  };
  gastos: {
    total_gastos: number;
    detalle: Array<{
      id: number;
      fecha: string;
      concepto: string;
      descripcion: string;
      monto: number;
    }>;
  };
  ventas_por_tamaño: Array<{
    tamaño: string;
    cantidad_vendida: number;
    total_unidades: number;
    total_ventas: number;
  }>;
}

export interface CashFlowReportResponse {
  message: string;
  data: CashFlowReport;
}

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

export const reportsService = {
  getCashFlowReport: (filters: { start_date: string; end_date: string }) => {
    const params = new URLSearchParams();
    params.append('start_date', filters.start_date);
    params.append('end_date', filters.end_date);
    
    const queryString = params.toString();
    const url = `/api/reports/cash-flow?${queryString}`;
    
    return apiFetch<CashFlowReportResponse>(url, {
      method: 'GET',
    });
  },

  downloadCashFlowReport: (filters: { start_date: string; end_date: string; format: 'pdf' | 'excel' }) => {
    const params = new URLSearchParams();
    params.append('start_date', filters.start_date);
    params.append('end_date', filters.end_date);
    params.append('format', filters.format);
    
    const queryString = params.toString();
    const url = `/api/reports/cash-flow/download?${queryString}`;
    
    return apiFetch<CashFlowReportResponse>(url, {
      method: 'GET',
    });
  },

  getSalesSummaryReport: (filters: { start_date: string; end_date: string }) => {
    const params = new URLSearchParams();
    params.append('start_date', filters.start_date);
    params.append('end_date', filters.end_date);
    
    const queryString = params.toString();
    const url = `/api/reports/sales-summary?${queryString}`;
    
    return apiFetch<SalesSummaryReportResponse>(url, {
      method: 'GET',
    });
  },

  downloadSalesSummaryReport: (filters: { start_date: string; end_date: string; format: 'pdf' | 'excel' }) => {
    const params = new URLSearchParams();
    params.append('start_date', filters.start_date);
    params.append('end_date', filters.end_date);
    params.append('format', filters.format);
    
    const queryString = params.toString();
    const url = `/api/reports/sales-summary/download?${queryString}`;
    
    return apiFetch<SalesSummaryReportResponse>(url, {
      method: 'GET',
    });
  }
};
