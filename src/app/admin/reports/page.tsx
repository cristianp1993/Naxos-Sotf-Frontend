'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { reportsService, type CashFlowReport, type SalesSummaryReport } from '@/services/reportsService';

// Tipos de reportes disponibles
const REPORT_TYPES = [
  {
    id: 'cash-flow',
    name: 'Flujo de Caja',
    description: 'Reporte completo de ingresos, egresos y análisis financiero',
    icon: '💰',
    available: true,
    color: 'from-green-600 to-emerald-600'
  },
  {
    id: 'inventory-movements',
    name: 'Movimientos de Inventario',
    description: 'Control de entradas y salidas de productos',
    icon: '📦',
    available: false,
    color: 'from-blue-600 to-cyan-600'
  },
  {
    id: 'sales-summary',
    name: 'Resumen de Ventas',
    description: 'Análisis detallado de ventas por período',
    icon: '📊',
    available: true,
    color: 'from-purple-600 to-pink-600'
  },
  {
    id: 'product-performance',
    name: 'Rendimiento de Productos',
    description: 'Análisis de desempeño por producto y variante',
    icon: '🎯',
    available: false,
    color: 'from-orange-600 to-red-600'
  },
  {
    id: 'expense-analysis',
    name: 'Análisis de Gastos',
    description: 'Desglose detallado de gastos por categoría',
    icon: '💸',
    available: false,
    color: 'from-red-600 to-orange-600'
  },
  {
    id: 'shift-performance',
    name: 'Rendimiento de Turnos',
    description: 'Análisis de productividad por turno y cajero',
    icon: '⏰',
    available: false,
    color: 'from-indigo-600 to-purple-600'
  }
];

// Componentes separados para cada tipo de reporte
const CashFlowReportComponent: React.FC<{ data: CashFlowReport }> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Simplemente formatear el string YYYY-MM-DD directamente sin conversiones de zona horaria
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getResultColor = (resultado: string) => {
    return resultado === 'POSITIVO' ? 'text-green-400' : 'text-red-400';
  };

  const getResultBgColor = (resultado: string) => {
    return resultado === 'POSITIVO' ? 'bg-green-500/20 border-green-400/30' : 'bg-red-500/20 border-red-400/30';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs sm:text-sm">Total Ingresos</p>
              <p className="text-xl sm:text-2xl font-bold">
                {formatCurrency(data.resumen.total_ingresos)}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-xs sm:text-sm">Total Egresos</p>
              <p className="text-xl sm:text-2xl font-bold">
                {formatCurrency(data.resumen.total_egresos)}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-r ${data.resumen.resultado === 'POSITIVO' ? 'from-green-600 to-emerald-600' : 'from-red-600 to-orange-600'} rounded-2xl p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs sm:text-sm">Diferencia</p>
              <p className="text-xl sm:text-2xl font-bold">
                {formatCurrency(data.resumen.diferencia)}
              </p>
              <p className={`text-xs font-medium ${getResultColor(data.resumen.resultado)}`}>
                {data.resumen.resultado}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm">Total Ventas</p>
              <p className="text-xl sm:text-2xl font-bold">
                {data.ventas.total_ventas}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Desglose por Método de Pago</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-500/20 border border-green-400/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-400 text-sm font-medium">Efectivo</span>
              <span className="text-white text-xs bg-green-500/30 px-2 py-1 rounded-full">
                {data.ventas.desglose_pagos.efectivo.cantidad} ventas
              </span>
            </div>
            <p className="text-white text-lg font-bold">
              {formatCurrency(data.ventas.desglose_pagos.efectivo.total)}
            </p>
          </div>

          <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 text-sm font-medium">Transferencia</span>
              <span className="text-white text-xs bg-blue-500/30 px-2 py-1 rounded-full">
                {data.ventas.desglose_pagos.transferencia.cantidad} ventas
              </span>
            </div>
            <p className="text-white text-lg font-bold">
              {formatCurrency(data.ventas.desglose_pagos.transferencia.total)}
            </p>
          </div>

          <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-400 text-sm font-medium">Tarjeta</span>
              <span className="text-white text-xs bg-purple-500/30 px-2 py-1 rounded-full">
                {data.ventas.desglose_pagos.tarjeta.cantidad} ventas
              </span>
            </div>
            <p className="text-white text-lg font-bold">
              {formatCurrency(data.ventas.desglose_pagos.tarjeta.total)}
            </p>
          </div>

          <div className="bg-gray-500/20 border border-gray-400/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-medium">Otro</span>
              <span className="text-white text-xs bg-gray-500/30 px-2 py-1 rounded-full">
                {data.ventas.desglose_pagos.otro.cantidad} ventas
              </span>
            </div>
            <p className="text-white text-lg font-bold">
              {formatCurrency(data.ventas.desglose_pagos.otro.total)}
            </p>
          </div>
        </div>
      </div>

      {/* Sales by Size */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Ventas por Tamaño</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10 border-b border-white/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Tamaño
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Cantidad Vendida
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Total Unidades
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Total Ventas
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.ventas_por_tamaño.map((size, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-white font-medium">{size.tamaño}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-purple-200">{size.cantidad_vendida}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-purple-200">{size.total_unidades}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-white font-bold">
                        {formatCurrency(size.total_ventas)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Expense Details */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20">
        <div className="p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Detalle de Gastos</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10 border-b border-white/20">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Concepto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider hidden sm:table-cell">
                    Descripción
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Monto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {data.gastos.detalle.map((expense, index) => (
                  <tr key={index} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-purple-200 text-sm">
                        {formatDate(expense.fecha)}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-white font-medium">{expense.concepto}</div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="text-purple-200 text-sm max-w-xs truncate" title={expense.descripcion || ''}>
                        {expense.descripcion || 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-red-400 font-bold">
                        {formatCurrency(expense.monto)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Period Info */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 border border-white/20">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h4 className="text-white font-medium mb-1">Período del Reporte</h4>
            <p className="text-purple-200 text-sm">
              {formatDate(data.periodo.startDate)} - {formatDate(data.periodo.endDate)}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-xl border ${getResultBgColor(data.resumen.resultado)}`}>
            <p className={`text-sm font-medium ${getResultColor(data.resumen.resultado)}`}>
              Resultado: {data.resumen.resultado}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SalesSummaryReportComponent: React.FC<{ data: SalesSummaryReport }> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Simplemente formatear el string YYYY-MM-DD directamente sin conversiones de zona horaria
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs sm:text-sm">Total Ventas</p>
              <p className="text-xl sm:text-2xl font-bold">
                {data.resumen.total_ventas || 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm">Valor Total</p>
              <p className="text-xl sm:text-2xl font-bold">
                {formatCurrency(data.resumen.total_ventas_valor || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-xs sm:text-sm">Promedio Venta</p>
              <p className="text-xl sm:text-2xl font-bold">
                {formatCurrency(data.resumen.valor_promedio_venta || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002 2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-xs sm:text-sm">Items Vendidos</p>
              <p className="text-xl sm:text-2xl font-bold">
                {data.resumen.total_items_vendidos || 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0v10m0 0v10m-6 0a2 2 0 01-2 2h-2m2 0v10m-6 0a2 2 0 012-2 0-2 0-2h-2m2 0v10m-6 0a2 2 0 012-2 0-2 0-2" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Desglose por Método de Pago</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.metodos_pago.map((method) => (
            <div key={method.method} className={`
              method.method === 'EFECTIVO' ? 'bg-green-500/20 border border-green-400/30' :
              method.method === 'TRANSFERENCIA' ? 'bg-blue-500/20 border border-blue-400/30' :
              method.method === 'TARJETA' ? 'bg-purple-500/20 border border-purple-400/30' :
              'bg-gray-500/20 border border-gray-400/30'
            } rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-medium capitalize ${
                  method.method === 'EFECTIVO' ? 'text-green-400' :
                  method.method === 'TRANSFERENCIA' ? 'text-blue-400' :
                  method.method === 'TARJETA' ? 'text-purple-400' :
                  'text-gray-400'
                }`}>
                  {method.method === 'EFECTIVO' ? 'Efectivo' :
                   method.method === 'TRANSFERENCIA' ? 'Transferencia' :
                   method.method === 'TARJETA' ? 'Tarjeta' : 'Otro'}
                </span>
                <span className="text-white text-xs bg-white/20 px-2 py-1 rounded-full">
                  {method.cantidad_ventas} ventas
                </span>
              </div>
              <p className="text-white text-lg font-bold">
                {formatCurrency(method.total)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Period Info */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 border border-white/20">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h4 className="text-white font-medium mb-1">Período del Reporte</h4>
            <p className="text-purple-200 text-sm">
              {formatDate(data.periodo.startDate)} - {formatDate(data.periodo.endDate)}
            </p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-400/30">
            <p className="text-sm font-medium text-purple-300">
              Reporte de Ventas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState(REPORT_TYPES[0]); // Por defecto flujo de caja
  const [reportData, setReportData] = useState<CashFlowReport | SalesSummaryReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Date filter states - set to current date by default (Colombia timezone)
  const today = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }); // Format: YYYY-MM-DD in Colombia timezone
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  const toast = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    // Simplemente formatear el string YYYY-MM-DD directamente sin conversiones de zona horaria
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    return date.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleReportSelect = (report: typeof REPORT_TYPES[0]) => {
    if (!report.available) {
      toast.info(`El reporte "${report.name}" estará disponible próximamente`);
      return;
    }
    
    setSelectedReport(report);
    setReportData(null);
    setShowPreview(false);
    setError(null);
    
    // Auto-scroll a los filtros de fecha en móvil
    setTimeout(() => {
      const dateFilters = document.getElementById('date-filters');
      if (dateFilters) {
        dateFilters.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 100);
  };

  const generateReport = async () => {
    if (!selectedReport.available) {
      toast.error('Este reporte aún no está disponible');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Por favor selecciona un rango de fechas');
      return;
    }

    if (startDate > endDate) {
      toast.error('La fecha de inicio no puede ser mayor a la fecha de fin');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Generando reporte:', { reportId: selectedReport.id, startDate, endDate });
      
      // Scroll suave al botón para que el usuario vea el estado de carga
      setTimeout(() => {
        const generateButton = document.querySelector('[data-generate-button]');
        if (generateButton) {
          generateButton.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 100);
      
      // Solo flujo de caja está implementado por ahora
      if (selectedReport.id === 'cash-flow') {
        const response = await reportsService.getCashFlowReport({
          start_date: startDate,
          end_date: endDate
        });
        setReportData(response.data);
        setShowPreview(true);
        toast.success('Reporte de flujo de caja generado exitosamente');
      } else if (selectedReport.id === 'sales-summary') {
        const response = await reportsService.getSalesSummaryReport({
          start_date: startDate,
          end_date: endDate
        });
        setReportData(response.data);
        setShowPreview(true);
        toast.success('Reporte de resumen de ventas generado exitosamente');
      } else {
        // Para otros reportes, mostrar mensaje de próximamente
        toast.info(`El reporte "${selectedReport.name}" estará disponible próximamente`);
      }
      
      // Auto-scroll al reporte preview - mejorado para móvil
      setTimeout(() => {
        const reportPreview = document.getElementById('report-preview');
        if (reportPreview) {
          // En móvil usar block 'start' para asegurar que se vea completo
          const isMobile = window.innerWidth < 768;
          reportPreview.scrollIntoView({ 
            behavior: 'smooth', 
            block: isMobile ? 'start' : 'center',
            inline: 'nearest'
          });
        }
      }, 150); // Un poco más de tiempo para asegurar que el contenido esté renderizado
      
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err?.message || 'Error al generar el reporte');
      toast.error(err?.message || 'Error al generar el reporte');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format: 'pdf' | 'excel') => {
    if (!selectedReport.available) {
      toast.error('Este reporte aún no está disponible');
      return;
    }

    if (!startDate || !endDate) {
      toast.error('Por favor genera un reporte primero');
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔍 Descargando reporte:', { reportId: selectedReport.id, startDate, endDate, format });
      
      // Solo flujo de caja y resumen de ventas están implementados por ahora
      if (selectedReport.id === 'cash-flow') {
        const response = await reportsService.downloadCashFlowReport({
          start_date: startDate,
          end_date: endDate,
          format
        });
        toast.success(`Descarga ${format.toUpperCase()} preparada (implementación pendiente)`);
      } else if (selectedReport.id === 'sales-summary') {
        const response = await reportsService.downloadSalesSummaryReport({
          start_date: startDate,
          end_date: endDate,
          format
        });
        toast.success(`Descarga ${format.toUpperCase()} preparada (implementación pendiente)`);
      } else {
        toast.info(`La descarga para "${selectedReport.name}" estará disponible próximamente`);
      }
      
    } catch (err: any) {
      console.error('Error downloading report:', err);
      toast.error(err?.message || 'Error al descargar el reporte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-white/20">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Centro de Reportes</h1>
        <p className="text-purple-200 text-sm sm:text-base">Selecciona el tipo de reporte que deseas generar</p>
      </div>

      {/* Report Selector */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20">
        <div className="p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Seleccionar Reporte</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REPORT_TYPES.map((report) => (
              <button
                key={report.id}
                onClick={() => handleReportSelect(report)}
                disabled={loading}
                className={`p-4 rounded-xl border transition-all text-left group ${
                  selectedReport.id === report.id
                    ? 'bg-white/20 border-white/40'
                    : report.available
                    ? 'bg-white/10 border-white/20 hover:bg-white/15 hover:border-white/30'
                    : 'bg-white/5 border-white/10 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`text-2xl ${!report.available && 'opacity-50'}`}>
                    {report.icon}
                  </span>
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      selectedReport.id === report.id ? 'text-white' : 
                      report.available ? 'text-purple-200' : 'text-purple-400'
                    }`}>
                      {report.name}
                    </h3>
                  </div>
                  {report.available ? (
                    <span className="px-2 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-green-400 text-xs">
                      Disponible
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-500/20 border border-yellow-400/30 rounded-full text-yellow-400 text-xs">
                      Próximamente
                    </span>
                  )}
                </div>
                <p className={`text-sm ${
                  selectedReport.id === report.id ? 'text-purple-200' : 
                  report.available ? 'text-purple-300' : 'text-purple-400'
                }`}>
                  {report.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Generator - Solo si está disponible */}
      {selectedReport.available && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20">
          <div className="p-4 sm:p-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">{selectedReport.icon}</span>
              <div>
                <h3 className="text-xl font-semibold text-white">{selectedReport.name}</h3>
                <p className="text-purple-200 text-sm">{selectedReport.description}</p>
              </div>
            </div>
            
            {/* Date Filters */}
            <div id="date-filters" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-end">
                <button
                  data-generate-button
                  onClick={generateReport}
                  disabled={loading}
                  className={`w-full px-4 py-2 bg-gradient-to-r ${selectedReport.color} hover:opacity-90 disabled:opacity-50 text-white font-medium rounded-xl transition-all duration-200 text-sm`}
                >
                  {loading ? 'Generando...' : 'Generar Reporte'}
                </button>
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={() => downloadReport('pdf')}
                  disabled={!reportData || loading}
                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm"
                >
                  PDF
                </button>
                <button
                  onClick={() => downloadReport('excel')}
                  disabled={!reportData || loading}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors text-sm"
                >
                  Excel
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Preview - Renderizado dinámico según tipo */}
      {showPreview && reportData && (
        <div id="report-preview" className="space-y-6">
          {selectedReport.id === 'cash-flow' && <CashFlowReportComponent data={reportData as CashFlowReport} />}
          {selectedReport.id === 'sales-summary' && <SalesSummaryReportComponent data={reportData as SalesSummaryReport} />}
        </div>
      )}

      {/* Coming Soon Message for other reports */}
      {selectedReport && !selectedReport.available && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20">
          <div className="p-8 text-center">
            <span className="text-6xl mb-4 block">{selectedReport.icon}</span>
            <h3 className="text-2xl font-bold text-white mb-2">{selectedReport.name}</h3>
            <p className="text-purple-200 text-lg mb-4">{selectedReport.description}</p>
            <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-6 max-w-md mx-auto">
              <span className="text-yellow-400 text-sm font-medium">🚧 Próximamente</span>
              <p className="text-yellow-200 text-sm mt-2">
                Este reporte estará disponible en futuras actualizaciones. Por ahora, puedes usar el reporte de Flujo de Caja que está completamente funcional.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
