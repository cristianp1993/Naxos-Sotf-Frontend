// Tipos base para todos los reportes
export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'financial' | 'inventory' | 'sales' | 'operations';
  requiresDateRange: boolean;
  requiresLocation?: boolean;
  downloadFormats: ('pdf' | 'excel')[];
}

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  location_id?: number;
  [key: string]: any;
}

export interface ReportData {
  [key: string]: any;
}

export interface ReportResponse {
  message: string;
  data: ReportData;
}

// Registro de reportes disponibles
export const REPORT_REGISTRY: ReportConfig[] = [
  {
    id: 'cash-flow',
    name: 'Flujo de Caja',
    description: 'Reporte completo de ingresos, egresos y análisis financiero',
    icon: '💰',
    category: 'financial',
    requiresDateRange: true,
    downloadFormats: ['pdf', 'excel']
  },
  {
    id: 'inventory-movements',
    name: 'Movimientos de Inventario',
    description: 'Control de entradas y salidas de productos',
    icon: '📦',
    category: 'inventory',
    requiresDateRange: true,
    downloadFormats: ['pdf', 'excel']
  },
  {
    id: 'sales-summary',
    name: 'Resumen de Ventas',
    description: 'Análisis detallado de ventas por período',
    icon: '📊',
    category: 'sales',
    requiresDateRange: true,
    downloadFormats: ['pdf', 'excel']
  },
  {
    id: 'product-performance',
    name: 'Rendimiento de Productos',
    description: 'Análisis de desempeño por producto y variante',
    icon: '🎯',
    category: 'sales',
    requiresDateRange: true,
    downloadFormats: ['pdf', 'excel']
  },
  {
    id: 'expense-analysis',
    name: 'Análisis de Gastos',
    description: 'Desglose detallado de gastos por categoría',
    icon: '💸',
    category: 'financial',
    requiresDateRange: true,
    downloadFormats: ['pdf', 'excel']
  },
  {
    id: 'shift-performance',
    name: 'Rendimiento de Turnos',
    description: 'Análisis de productividad por turno y cajero',
    icon: '⏰',
    category: 'operations',
    requiresDateRange: true,
    downloadFormats: ['pdf', 'excel']
  }
];

// Función para obtener reportes por categoría
export const getReportsByCategory = (category: ReportConfig['category']) => {
  return REPORT_REGISTRY.filter(report => report.category === category);
};

// Función para obtener configuración de reporte
export const getReportConfig = (id: string): ReportConfig | undefined => {
  return REPORT_REGISTRY.find(report => report.id === id);
};

// Función para obtener todas las categorías
export const getReportCategories = () => {
  const categories = [...new Set(REPORT_REGISTRY.map(report => report.category))];
  return categories.map(category => ({
    id: category,
    name: category === 'financial' ? 'Financiero' :
          category === 'inventory' ? 'Inventario' :
          category === 'sales' ? 'Ventas' : 'Operaciones',
    count: REPORT_REGISTRY.filter(report => report.category === category).length
  }));
};
