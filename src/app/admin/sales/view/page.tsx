'use client';

import { useState, useEffect } from 'react';
import { salesService, type Sale } from '@/services/salesService';

export default function ViewSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<number | null>(null);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await salesService.getAllSales();
      console.log('Datos recibidos del API:', data);
      console.log('Tipo de dato:', typeof data);
      console.log('Es array?:', Array.isArray(data));
      
      // Si data es un objeto con propiedad sales, usar esa
      // Si es un array directamente, usarlo
      // Si es un objeto con otra estructura, buscar el array
      let salesArray = [];
      if (Array.isArray(data)) {
        salesArray = data;
      } else if (data && typeof data === 'object') {
        // Buscar propiedades que puedan contener el array de ventas
        if (Array.isArray(data.sales)) {
          salesArray = data.sales;
        } else if (Array.isArray(data.data)) {
          salesArray = data.data;
        } else if (Array.isArray(data.results)) {
          salesArray = data.results;
        } else {
          // Si no encuentra arrays, mostrar el objeto completo para depuración
          console.log('Estructura del objeto:', Object.keys(data));
          salesArray = [];
        }
      }
      
      setSales(salesArray);
    } catch (err) {
      console.error('Error loading sales:', err);
      setError('Error al cargar las ventas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!saleToDelete) return;
    
    try {
      await salesService.deleteSale(saleToDelete);
      setSales(sales.filter(sale => sale.sale_id !== saleToDelete));
      setIsDeleteModalOpen(false);
      setSaleToDelete(null);
    } catch (err) {
      setError('Error al eliminar la venta');
      console.error(err);
    }
  };

  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setIsEditModalOpen(true);
  };

  const handleDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailModalOpen(true);
  };

  const confirmDelete = (saleId: number) => {
    setSaleToDelete(saleId);
    setIsDeleteModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Cargando ventas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-2">Ventas Guardadas</h1>
        <p className="text-purple-200">Historial de todas las ventas realizadas</p>
      </div>

      {/* Sales Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden">
        {!sales || sales.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-purple-200 text-lg">No hay ventas registradas</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10 border-b border-white/20">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    ID Venta
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Observación
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {sales.map((sale) => (
                  <tr key={sale.sale_id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white font-medium">#{sale.sale_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-purple-200 text-sm">{formatDate(sale.opened_at)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white font-bold">{formatCurrency(sale.total)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sale.status === 'PAID' 
                          ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
                      }`}>
                        {sale.status === 'PAID' ? 'Pagada' : sale.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-purple-200 text-sm max-w-xs truncate">
                        {sale.observation || 'Sin observación'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDetail(sale)}
                          className="text-green-400 hover:text-green-300 transition-colors"
                          title="Ver detalles"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEdit(sale)}
                          className="text-blue-400 hover:text-blue-300 transition-colors"
                          title="Editar venta"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => confirmDelete(sale.sale_id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                          title="Eliminar venta"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-white/20">
            <h3 className="text-xl font-bold text-white mb-4">Confirmar Eliminación</h3>
            <p className="text-purple-200 mb-6">
              ¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Eliminar
              </button>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSaleToDelete(null);
                }}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Editar Venta #{selectedSale.sale_id}</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sale Details */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">Fecha</label>
                  <div className="text-white">{formatDate(selectedSale.opened_at)}</div>
                </div>
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">Total</label>
                  <div className="text-white font-bold">{formatCurrency(selectedSale.total)}</div>
                </div>
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">Observación</label>
                <textarea
                  value={selectedSale.observation || ''}
                  onChange={(e) => setSelectedSale({...selectedSale, observation: e.target.value})}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Agregar observación..."
                />
              </div>

              {/* Items */}
              <div>
                <h4 className="text-white font-medium mb-3">Productos</h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-medium">
                            {item.product_name} - {item.variant_name}
                          </div>
                          {item.flavor_name && (
                            <div className="text-purple-300 text-sm">
                              Sabor: {item.flavor_name}
                            </div>
                          )}
                          <div className="text-purple-200 text-sm">
                            {item.quantity} × {formatCurrency(item.unit_price)}
                          </div>
                        </div>
                        <div className="text-white font-medium">
                          {formatCurrency(item.line_total)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments */}
              <div>
                <h4 className="text-white font-medium mb-3">Métodos de pago</h4>
                <div className="space-y-2">
                  {selectedSale.payments.map((payment, index) => (
                    <div key={index} className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2">
                      <span className="text-purple-200">
                        {payment.method}
                        {payment.reference && ` (${payment.reference})`}
                      </span>
                      <span className="text-white font-medium">
                        {formatCurrency(payment.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-6 max-w-4xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Detalles de Venta #{selectedSale.sale_id}</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sale Header */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-purple-300 text-xs font-medium mb-1">ID Venta</label>
                  <div className="text-white font-bold">#{selectedSale.sale_id}</div>
                </div>
                <div>
                  <label className="block text-purple-300 text-xs font-medium mb-1">Fecha</label>
                  <div className="text-white">{formatDate(selectedSale.opened_at)}</div>
                </div>
                <div>
                  <label className="block text-purple-300 text-xs font-medium mb-1">Total</label>
                  <div className="text-white font-bold text-lg">{formatCurrency(selectedSale.total)}</div>
                </div>
                <div>
                  <label className="block text-purple-300 text-xs font-medium mb-1">Estado</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedSale.status === 'PAID' 
                      ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
                  }`}>
                    {selectedSale.status === 'PAID' ? 'Pagada' : selectedSale.status}
                  </span>
                </div>
              </div>
              {selectedSale.observation && (
                <div className="mt-4">
                  <label className="block text-purple-300 text-xs font-medium mb-1">Observación</label>
                  <div className="text-purple-200">{selectedSale.observation}</div>
                </div>
              )}
            </div>

            {/* Products Section */}
            <div className="mb-6">
              <h4 className="text-white font-bold text-lg mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Productos Vendidos
              </h4>
              <div className="space-y-3">
                {selectedSale.items && Array.isArray(selectedSale.items) && selectedSale.items.length > 0 ? (
                  selectedSale.items.map((item, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-white font-bold text-lg mb-2">
                            {item.product_name || 'Producto sin nombre'}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-purple-300">Tamaño/Variante:</span>
                              <div className="text-white font-medium">{item.variant_name || 'N/A'}</div>
                            </div>
                            {item.flavor_name && (
                              <div>
                                <span className="text-purple-300">Sabor:</span>
                                <div className="text-white font-medium">{item.flavor_name}</div>
                              </div>
                            )}
                            <div>
                              <span className="text-purple-300">Cantidad:</span>
                              <div className="text-white font-medium">{item.quantity || 0}</div>
                            </div>
                            <div>
                              <span className="text-purple-300">Precio Unitario:</span>
                              <div className="text-white font-medium">{formatCurrency(item.unit_price || 0)}</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-purple-300 text-sm">Subtotal</div>
                          <div className="text-white font-bold text-lg">{formatCurrency(item.line_total || 0)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                    <div className="text-purple-200">No hay productos registrados para esta venta</div>
                  </div>
                )}
              </div>
            </div>

            {/* Payments Section */}
            <div>
              <h4 className="text-white font-bold text-lg mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Métodos de Pago
              </h4>
              <div className="space-y-2">
                {selectedSale.payments && Array.isArray(selectedSale.payments) && selectedSale.payments.length > 0 ? (
                  selectedSale.payments.map((payment, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3 flex justify-between items-center border border-white/10">
                      <div>
                        <div className="text-white font-medium">{payment.method || 'Método no especificado'}</div>
                        {payment.reference && (
                          <div className="text-purple-300 text-sm">Referencia: {payment.reference}</div>
                        )}
                      </div>
                      <div className="text-white font-bold">{formatCurrency(payment.amount || 0)}</div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10 text-center">
                    <div className="text-purple-200">No hay métodos de pago registrados para esta venta</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
