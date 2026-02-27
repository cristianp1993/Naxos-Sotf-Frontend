import React from 'react';
import { ReportConfig, ReportData } from '@/services/reportRegistry';

// Interfaz para los componentes de reporte
export interface ReportComponentProps {
  config: ReportConfig;
  data: ReportData;
  loading?: boolean;
}

// Componente genérico para renderizar cualquier reporte
export const ReportRenderer: React.FC<ReportComponentProps> = ({ config, data, loading }) => {
  if (loading) {
    return <ReportLoadingState config={config} />;
  }

  // Renderizar basado en el tipo de reporte
  switch (config.id) {
    case 'cash-flow':
      return <CashFlowReport data={data} />;
    case 'inventory-movements':
      return <InventoryMovementsReport data={data} />;
    case 'sales-summary':
      return <SalesSummaryReport data={data} />;
    case 'product-performance':
      return <ProductPerformanceReport data={data} />;
    case 'expense-analysis':
      return <ExpenseAnalysisReport data={data} />;
    case 'shift-performance':
      return <ShiftPerformanceReport data={data} />;
    default:
      return <UnknownReport config={config} />;
  }
};

// Componente de carga
const ReportLoadingState: React.FC<{ config: ReportConfig }> = ({ config }) => (
  <div className="space-y-6">
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{config.icon}</span>
        <div>
          <h2 className="text-xl font-semibold text-white">{config.name}</h2>
          <p className="text-purple-200 text-sm">{config.description}</p>
        </div>
      </div>
    </div>
    
    {/* Skeleton loaders */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20 animate-pulse">
          <div className="h-4 bg-white/20 rounded mb-2"></div>
          <div className="h-8 bg-white/20 rounded"></div>
        </div>
      ))}
    </div>
    
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 animate-pulse">
      <div className="p-6">
        <div className="h-6 bg-white/20 rounded mb-4"></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Componente para reportes desconocidos
const UnknownReport: React.FC<{ config: ReportConfig }> = ({ config }) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
    <div className="text-center">
      <span className="text-4xl mb-4 block">{config.icon}</span>
      <h3 className="text-xl font-semibold text-white mb-2">{config.name}</h3>
      <p className="text-purple-200 mb-4">{config.description}</p>
      <div className="bg-yellow-500/20 border border-yellow-400/30 rounded-xl p-4">
        <p className="text-yellow-300 text-sm">
          Este reporte está configurado pero aún no tiene un componente de visualización.
          <br />
          Por favor, contacta al desarrollador para implementar la vista de este reporte.
        </p>
      </div>
    </div>
  </div>
);

// Componente específico para Flujo de Caja
const CashFlowReport: React.FC<{ data: ReportData }> = ({ data }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
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
                {formatCurrency(data.resumen?.total_ingresos || 0)}
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
                {formatCurrency(data.resumen?.total_egresos || 0)}
              </p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`bg-gradient-to-r ${data.resumen?.resultado === 'POSITIVO' ? 'from-green-600 to-emerald-600' : 'from-red-600 to-orange-600'} rounded-2xl p-4 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-xs sm:text-sm">Diferencia</p>
              <p className="text-xl sm:text-2xl font-bold">
                {formatCurrency(data.resumen?.diferencia || 0)}
              </p>
              <p className={`text-xs font-medium ${getResultColor(data.resumen?.resultado || '')}`}>
                {data.resumen?.resultado || 'N/A'}
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
                {data.ventas?.total_ventas || 0}
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
      {data.ventas?.desglose_pagos && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-white/20">
          <h3 className="text-lg font-semibold text-white mb-4">Desglose por Método de Pago</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(data.ventas.desglose_pagos).map(([method, info]: [string, any]) => (
              <div key={method} className={`${
                method === 'efectivo' ? 'bg-green-500/20 border border-green-400/30' :
                method === 'transferencia' ? 'bg-blue-500/20 border border-blue-400/30' :
                method === 'tarjeta' ? 'bg-purple-500/20 border border-purple-400/30' :
                'bg-gray-500/20 border border-gray-400/30'
              } rounded-xl p-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium capitalize ${
                    method === 'efectivo' ? 'text-green-400' :
                    method === 'transferencia' ? 'text-blue-400' :
                    method === 'tarjeta' ? 'text-purple-400' :
                    'text-gray-400'
                  }`}>
                    {method === 'efectivo' ? 'Efectivo' :
                     method === 'transferencia' ? 'Transferencia' :
                     method === 'tarjeta' ? 'Tarjeta' : 'Otro'}
                  </span>
                  <span className="text-white text-xs bg-white/20 px-2 py-1 rounded-full">
                    {info.cantidad} ventas
                  </span>
                </div>
                <p className="text-white text-lg font-bold">
                  {formatCurrency(info.total)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales by Size */}
      {data.ventas_por_tamaño && data.ventas_por_tamaño.length > 0 && (
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
                  {data.ventas_por_tamaño.map((size: any, index: number) => (
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
      )}

      {/* Expense Details */}
      {data.gastos?.detalle && data.gastos.detalle.length > 0 && (
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
                  {data.gastos.detalle.map((expense: any, index: number) => (
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
      )}

      {/* Period Info */}
      {data.periodo && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 border border-white/20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h4 className="text-white font-medium mb-1">Período del Reporte</h4>
              <p className="text-purple-200 text-sm">
                {formatDate(data.periodo.start_date)} - {formatDate(data.periodo.end_date)}
              </p>
            </div>
            <div className={`px-4 py-2 rounded-xl border ${getResultBgColor(data.resumen?.resultado || '')}`}>
              <p className={`text-sm font-medium ${getResultColor(data.resumen?.resultado || '')}`}>
                Resultado: {data.resumen?.resultado || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Placeholders para otros reportes (se pueden implementar más adelante)
const InventoryMovementsReport: React.FC<{ data: ReportData }> = ({ data }) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
    <h3 className="text-xl font-semibold text-white mb-4">Movimientos de Inventario</h3>
    <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
      <p className="text-blue-300">Reporte de movimientos de inventario - Implementación pendiente</p>
    </div>
  </div>
);

const SalesSummaryReport: React.FC<{ data: ReportData }> = ({ data }) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
    <h3 className="text-xl font-semibold text-white mb-4">Resumen de Ventas</h3>
    <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
      <p className="text-blue-300">Reporte de resumen de ventas - Implementación pendiente</p>
    </div>
  </div>
);

const ProductPerformanceReport: React.FC<{ data: ReportData }> = ({ data }) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
    <h3 className="text-xl font-semibold text-white mb-4">Rendimiento de Productos</h3>
    <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
      <p className="text-blue-300">Reporte de rendimiento de productos - Implementación pendiente</p>
    </div>
  </div>
);

const ExpenseAnalysisReport: React.FC<{ data: ReportData }> = ({ data }) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
    <h3 className="text-xl font-semibold text-white mb-4">Análisis de Gastos</h3>
    <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
      <p className="text-blue-300">Reporte de análisis de gastos - Implementación pendiente</p>
    </div>
  </div>
);

const ShiftPerformanceReport: React.FC<{ data: ReportData }> = ({ data }) => (
  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
    <h3 className="text-xl font-semibold text-white mb-4">Rendimiento de Turnos</h3>
    <div className="bg-blue-500/20 border border-blue-400/30 rounded-xl p-4">
      <p className="text-blue-300">Reporte de rendimiento de turnos - Implementación pendiente</p>
    </div>
  </div>
);
