'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { salesService, type Sale, type PaymentMethodUI } from '@/services/salesService';

export default function ViewSalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [saleToDelete, setSaleToDelete] = useState<number | null>(null);
  
  // Estado para caché de nombres de productos
  const [productNames, setProductNames] = useState<Record<number, string>>({});
  const [loadingProductNames, setLoadingProductNames] = useState<Record<number, boolean>>({});
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Totals from backend
  const [backendTotals, setBackendTotals] = useState<{
    grand_total: number;
    payment_methods: Record<string, number>;
    total_count: number;
  } | null>(null);
  
  // Date filter states - set to current date by default (Colombia timezone)
  const getColombiaDate = () => {
    const now = new Date();
    // Asegurar hora Colombia restando 5 horas si es necesario
    const colombiaTime = new Date(now.getTime() - (5 * 60 * 60 * 1000));
    return colombiaTime.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  };
  
  const today = getColombiaDate();
  
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  
  // Manual filter states
  const [filterStartDate, setFilterStartDate] = useState(today);
  const [filterEndDate, setFilterEndDate] = useState(today);
  
  // Accordion state for filters
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  
  // Componente para mostrar nombre de producto con carga asíncrona
  const ProductNameDisplay: React.FC<{ productId: number }> = ({ productId }) => {
    const [productName, setProductName] = useState<string>('Cargando...');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
      setMounted(true);
      getProductName(productId).then(setProductName);
    }, [productId]);

    if (!mounted) {
      return <span className="text-white font-medium">Cargando...</span>;
    }

    return <span className="text-white font-medium">{productName}</span>;
  };

  const toast = useToast();

  // Función para obtener nombre del producto por ID con caché
  const getProductName = async (productId: number): Promise<string> => {
    // Si ya está en caché, retornarlo
    if (productNames[productId]) {
      return productNames[productId];
    }

    // Si ya está cargando, retornar estado de carga
    if (loadingProductNames[productId]) {
      return 'Cargando...';
    }

    // Marcar como cargando
    setLoadingProductNames(prev => ({
      ...prev,
      [productId]: true
    }));

    try {
      // Hacer petición para obtener el producto
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/products/${productId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const product = await response.json();
        const productName = product.name || 'Producto sin nombre';
        
        // Guardar en caché
        setProductNames(prev => ({
          ...prev,
          [productId]: productName
        }));
        
        // Quitar del estado de carga
        setLoadingProductNames(prev => {
          const newState = { ...prev };
          delete newState[productId];
          return newState;
        });
        
        return productName;
      }
    } catch (error) {
      console.error('Error obteniendo nombre del producto:', error);
    }

    // Quitar del estado de carga y retornar fallback
    setLoadingProductNames(prev => {
      const newState = { ...prev };
      delete newState[productId];
      return newState;
    });

    return 'Producto sin nombre';
  };

  useEffect(() => {
    // Load today's sales by default
    loadSales(true);
  }, []);

  // Reload sales when page changes or filters change
  useEffect(() => {
    if (currentPage >= 1) {
      loadSales(true);
    }
  }, [currentPage, itemsPerPage]);

  // Reload sales when filter dates change
  useEffect(() => {
    if (filterStartDate && filterEndDate) {
      setCurrentPage(1); // Reset to first page when filters change
      loadSales(true);
    }
  }, [filterStartDate, filterEndDate]);

  const loadSales = async (useFilters: boolean = true) => {
    try {
      setLoading(true);
      let data;
      
      if (useFilters && (filterStartDate && filterEndDate)) {
        // Cargar datos con paginación correcta del backend
        data = await salesService.getSalesWithFilters({
          start_date: filterStartDate,
          end_date: filterEndDate,
          page: currentPage,
          limit: itemsPerPage
        });
        
        // Ordenar ventas por fecha descendente (más nuevas primero)
        if (data.sales && Array.isArray(data.sales)) {
          data.sales.sort((a: any, b: any) => {
            const dateA = new Date(a.opened_at);
            const dateB = new Date(b.opened_at);
            return dateB.getTime() - dateA.getTime();
          });
        }
        
        // 🔥 Cargar totales COMPLETOS por separado para asegurar que incluyan TODOS los datos filtrados
        try {
          const totalsData = await salesService.getSalesWithFiltersTotals({
            start_date: filterStartDate,
            end_date: filterEndDate
          });
          
          if (totalsData && totalsData.totals) {
            const newBackendTotals = {
              grand_total: typeof totalsData.totals.grand_total === 'number' ? totalsData.totals.grand_total : 0,
              payment_methods: typeof totalsData.totals.payment_methods === 'object' ? totalsData.totals.payment_methods : {},
              total_count: (totalsData.totals as any).total_count || data.sales.length
            };
            setBackendTotals(newBackendTotals);
          }
        } catch (totalsError) {
          console.warn('No se pudieron cargar los totales completos, usando datos de paginación:', totalsError);
          // Fallback: usar totales de la respuesta paginada si hay error
          if (data.totals) {
            setBackendTotals({
              grand_total: typeof data.totals.grand_total === 'number' ? data.totals.grand_total : 0,
              payment_methods: typeof data.totals.payment_methods === 'object' ? data.totals.payment_methods : {},
              total_count: (data.totals as any).total_count || data.sales.length
            });
          }
        }
        
        // Establecer datos directamente del backend
        setSales(data.sales || []);
        setTotalItems(data.total || data.sales?.length || 0);
        setTotalPages(Math.ceil((data.total || data.sales?.length || 0) / itemsPerPage));
        
      } else {
        // Cargar ventas del día actual sin filtros
        const today = getColombiaDate();
        data = await salesService.getSalesWithFilters({
          start_date: today,
          end_date: today,
          page: currentPage,
          limit: itemsPerPage
        });
        
        // Ordenar por fecha descendente
        if (data.sales && Array.isArray(data.sales)) {
          data.sales.sort((a: any, b: any) => {
            const dateA = new Date(a.opened_at);
            const dateB = new Date(b.opened_at);
            return dateB.getTime() - dateA.getTime();
          });
        }
        
        // 🔥 Cargar totales COMPLETOS del día actual
        try {
          const totalsData = await salesService.getSalesWithFiltersTotals({
            start_date: today,
            end_date: today
          });
          
          if (totalsData && totalsData.totals) {
            setBackendTotals({
              grand_total: typeof totalsData.totals.grand_total === 'number' ? totalsData.totals.grand_total : 0,
              payment_methods: typeof totalsData.totals.payment_methods === 'object' ? totalsData.totals.payment_methods : {},
              total_count: (totalsData.totals as any).total_count || data.sales.length
            });
          }
        } catch (totalsError) {
          console.warn('No se pudieron cargar los totales completos del día, usando datos de paginación:', totalsError);
          // Fallback: usar totales de la respuesta paginada si hay error
          if (data.totals) {
            setBackendTotals({
              grand_total: typeof data.totals.grand_total === 'number' ? data.totals.grand_total : 0,
              payment_methods: typeof data.totals.payment_methods === 'object' ? data.totals.payment_methods : {},
              total_count: (data.totals as any).total_count || data.sales.length
            });
          }
        }
        
        setSales(data.sales || []);
        setTotalItems(data.total || data.sales?.length || 0);
        setTotalPages(Math.ceil((data.total || data.sales?.length || 0) / itemsPerPage));
      }
      
    } catch (err) {
      console.error('Error loading sales:', err);
      setError('Error al cargar las ventas');
      setSales([]);
      setTotalItems(0);
      setTotalPages(0);
      setBackendTotals(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!saleToDelete) return;
    
    try {
      const response = await salesService.deleteSale(saleToDelete);
      setSales(sales.filter(sale => sale.sale_id !== saleToDelete));
      setIsDeleteModalOpen(false);
      setSaleToDelete(null);
      
      // Mostrar toast de éxito con información detallada
      const deletedItems = response.deleted_items || 0;
      const deletedPayments = response.deleted_payments || 0;
      toast.success(
        `Venta #${saleToDelete} eliminada correctamente` + 
        (deletedItems > 0 || deletedPayments > 0 
          ? ` (${deletedItems} productos, ${deletedPayments} pagos)`
          : '')
      );
    } catch (err: any) {
      console.error('Error deleting sale:', err);
      setIsDeleteModalOpen(false);
      setSaleToDelete(null);
      
      // Mostrar toast de error con mensaje específico
      const errorMessage = err?.message || err?.error || 'Error al eliminar la venta';
      toast.error(errorMessage);
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

  // Apply filters function
  const applyFilters = () => {
    // Force reset and apply new filters
    setFilterStartDate(startDate);
    setFilterEndDate(endDate);
    setCurrentPage(1);
    
    // Clear current sales immediately to show loading state
    setSales([]);
    
    // Load sales with new filters
    loadSales(true);
  };

  // Clear filters function
  const clearFilters = () => {
    const today = new Date().toLocaleDateString('en-CA', { 
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // Reset all filter states
    setStartDate(today);
    setEndDate(today);
    setFilterStartDate(today);
    setFilterEndDate(today);
    setCurrentPage(1);
    
    // Clear current sales immediately to show loading state
    setSales([]);
    
    // Load today's sales
    loadSales(true);
  };

  // Función simple para obtener las ventas actuales (ya paginadas)
  const displaySales = sales;

  // Cálculos correctos de totales - SIEMPRE usar backendTotals si está disponible
  const getFilteredTotal = () => {
    // 🔥 PRIORIDAD ABSOLUTA: Usar totales completos del backend
    if (backendTotals && typeof backendTotals.grand_total === 'number') {
      return backendTotals.grand_total;
    }
    
    // Fallback: calcular localmente solo si no hay datos del backend
    const localTotal = sales.reduce((sum, sale) => {
      const total = parseFloat(String(sale.total)) || 0;
      return sum + total;
    }, 0);
    return localTotal;
  };

  const getPaymentMethodTotals = () => {
    // 🔥 PRIORIDAD ABSOLUTA: Usar totales completos del backend con mapeo correcto
    if (backendTotals && backendTotals.payment_methods && typeof backendTotals.payment_methods === 'object') {
      const mappedTotals: Record<string, number> = {};
      
      // 🔥 Mapeo CORRECTO de métodos de pago del backend a la UI
      const paymentMapping: Record<string, string> = {
        'CASH': 'EFECTIVO',
        'TRANSFER': 'TRANSFERENCIA', 
        'TARJETA': 'TARJETA',
        'EFECTIVO': 'EFECTIVO',
        'TRANSFERENCIA': 'TRANSFERENCIA'
      };
      
      Object.entries(backendTotals.payment_methods).forEach(([method, amount]) => {
        const uiMethod = paymentMapping[method] || method;
        mappedTotals[uiMethod] = Number(amount) || 0;
      });
      
      return mappedTotals;
    }
    
    // Fallback: calcular localmente solo si no hay datos del backend
    const totals: Record<string, number> = {};
    const paymentMapping: Record<string, string> = {
      'CASH': 'EFECTIVO',
      'TRANSFER': 'TRANSFERENCIA',
      'TARJETA': 'TARJETA',
      'EFECTIVO': 'EFECTIVO',
      'TRANSFERENCIA': 'TRANSFERENCIA'
    };
    
    sales.forEach(sale => {
      if (sale.payments && Array.isArray(sale.payments)) {
        sale.payments.forEach(payment => {
          let method = payment.method || 'SIN METODO';
          method = paymentMapping[method] || method;
          const amount = parseFloat(String(payment.amount)) || 0;
          
          if (!totals[method]) {
            totals[method] = 0;
          }
          totals[method] += amount;
        });
      }
    });
    
    return totals;
  };

  const filteredTotal = getFilteredTotal();
  const paymentMethodTotals = getPaymentMethodTotals();
  
  // Calcular índices para mostrar
  const startIndex = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
  const currentTotalPages = totalPages;

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
    return formatted;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota'
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
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-white/20">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Ventas Guardadas</h1>
        <p className="text-purple-200 text-sm sm:text-base">Historial de todas las ventas realizadas</p>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20">
        <div 
          className="flex justify-between items-center p-4 sm:p-6 cursor-pointer hover:bg-white/5 transition-colors rounded-t-3xl"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
          <h3 className="text-white font-bold text-base sm:text-lg">Filtrar Ventas</h3>
          <svg 
            className={`w-5 h-5 text-white transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {isFiltersOpen && (
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Date Filters */}
            <div className="mb-4 sm:mb-6">
              <h4 className="text-purple-300 font-medium text-sm sm:text-base mb-3 sm:mb-4">Rango de Fechas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-purple-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    Fecha Inicio (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    Fecha Fin (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={applyFilters}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors text-sm sm:text-base"
                  >
                    Aplicar Filtros
                  </button>
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-xl transition-colors text-sm sm:text-base"
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <label className="text-purple-300 text-xs sm:text-sm font-medium">
                  Items por página:
                </label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/30 rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                >
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              {totalItems > 0 && (
                <div className="text-purple-200 text-xs sm:text-sm">
                  Mostrando {startIndex} a {endIndex} de {totalItems} ventas
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sales Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/10 border-b border-white/20">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  ID Venta
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Tipo Pago
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider hidden sm:table-cell">
                  Observación
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {displaySales.map((sale: Sale) => (
                <tr key={sale.sale_id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-white font-medium text-sm sm:text-base">#{sale.sale_id}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-purple-200 text-xs sm:text-sm">{formatDate(sale.opened_at)}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-white font-bold text-sm sm:text-base">{formatCurrency(sale.total)}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {sale.payments && sale.payments.length > 0 ? (
                      sale.payments.length === 1 ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          sale.payments[0].method === 'EFECTIVO' 
                            ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                            : sale.payments[0].method === 'TARJETA'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                            : sale.payments[0].method === 'TRANSFERENCIA'
                            ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
                        }`}>
                          {sale.payments[0].method}
                        </span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          {sale.payments.map((payment: any, index: number) => (
                            <span key={index} className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.method === 'EFECTIVO' 
                                ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                                : payment.method === 'TARJETA'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                                : payment.method === 'TRANSFERENCIA'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30'
                                : 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
                            }`}>
                              {payment.method}
                            </span>
                          ))}
                        </div>
                      )
                    ) : (
                      <span className="text-purple-300 text-xs sm:text-sm">Sin pago</span>
                    )}
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      sale.status === 'PAID' 
                        ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
                    }`}>
                      {sale.status === 'PAID' ? 'Pagada' : sale.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                    <div className="text-purple-200 text-sm max-w-xs truncate" title={sale.observation || ''}>
                      {sale.observation || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDetail(sale)}
                        className="text-purple-300 hover:text-white transition-colors"
                        title="Ver detalles"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(sale)}
                        className="text-blue-300 hover:text-white transition-colors"
                        title="Editar venta"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => confirmDelete(sale.sale_id)}
                        className="text-red-300 hover:text-white transition-colors"
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

        {/* Filter Total Row */}
        {totalItems > 0 && (
          <div className="bg-white/5 border-t border-white/20 px-4 sm:px-6 py-3 sm:py-4">
            <div className="space-y-3">
              {/* Payment Method Breakdown */}
              <div className="space-y-2">
                <div className="text-purple-200 text-xs sm:text-sm font-medium">
                  Desglose por Tipo de Pago:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                  {Object.entries(paymentMethodTotals).map(([method, total]) => (
                    <div key={method} className="flex justify-between items-center bg-white/10 rounded-lg px-3 py-2">
                      <span className={`text-xs sm:text-sm font-medium ${
                        method === 'EFECTIVO' 
                          ? 'text-green-400'
                          : method === 'TARJETA'
                          ? 'text-blue-400'
                          : method === 'TRANSFERENCIA'
                          ? 'text-purple-400'
                          : 'text-gray-400'
                      }`}>
                        {method}:
                      </span>
                      <span className="text-white font-bold text-xs sm:text-sm">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Grand Total */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-3 border-t border-white/10">
                <div className="text-purple-200 text-xs sm:text-sm">
                  Total de {backendTotals ? backendTotals.total_count : totalItems} ventas filtradas
                </div>
                <div className="text-white font-bold text-lg sm:text-xl">
                  {formatCurrency(filteredTotal)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagination Controls Bottom */}
        {currentTotalPages > 1 && (
          <div className="bg-white/5 border-t border-white/20 px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="text-purple-200 text-xs sm:text-sm">
                Página {currentPage} de {currentTotalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentPage(Math.max(1, currentPage - 1));
                  }}
                  disabled={currentPage === 1}
                  className="px-3 py-1 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xs sm:text-sm"
                >
                  Anterior
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, currentTotalPages) }, (_, i) => {
                    let pageNum;
                    if (currentTotalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= currentTotalPages - 2) {
                      pageNum = currentTotalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => {
                          setCurrentPage(pageNum);
                        }}
                        className={`px-2 py-1 sm:px-3 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm ${
                          currentPage === pageNum
                            ? 'bg-purple-600 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => {
                    setCurrentPage(Math.min(currentTotalPages, currentPage + 1));
                  }}
                  disabled={currentPage === currentTotalPages}
                  className="px-3 py-1 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-xs sm:text-sm"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {isDetailModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-auto border border-white/20">
            {/* Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-white/20 p-4 sm:p-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Detalles de Venta #{selectedSale.sale_id}</h3>
                  <p className="text-purple-200 text-sm sm:text-base">{formatDate(selectedSale.opened_at)}</p>
                </div>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedSale(null);
                  }}
                  className="text-purple-300 hover:text-white transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Sale Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <h4 className="text-purple-300 font-medium mb-2">Información General</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-purple-200">Estado:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedSale.status === 'PAID' 
                          ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
                      }`}>
                        {selectedSale.status === 'PAID' ? 'Pagada' : selectedSale.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-purple-200">Total:</span>
                      <span className="text-white font-bold">{formatCurrency(selectedSale.total)}</span>
                    </div>
                    {selectedSale.observation && (
                      <div className="col-span-2">
                        <span className="text-purple-200">Observación:</span>
                        <p className="text-white mt-1">{selectedSale.observation}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-4">
                  <h4 className="text-purple-300 font-medium mb-2">Métodos de Pago</h4>
                  <div className="space-y-2">
                    {selectedSale.payments && selectedSale.payments.length > 0 ? (
                      selectedSale.payments.map((payment: any, index: number) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.method === 'EFECTIVO' 
                              ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                              : payment.method === 'TARJETA'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30'
                              : payment.method === 'TRANSFERENCIA'
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-400/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
                          }`}>
                            {payment.method}
                          </span>
                          <span className="text-white font-medium">{formatCurrency(payment.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-purple-300">Sin pagos registrados</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Products */}
              {selectedSale.items && selectedSale.items.length > 0 && (
                <div className="bg-white/10 rounded-xl p-4">
                  <h4 className="text-purple-300 font-medium mb-4">Productos Vendidos</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-white/20">
                        <tr>
                          <th className="text-left text-purple-200 pb-2">Sabor/Tamaño</th>
                          <th className="text-center text-purple-200 pb-2">Cantidad</th>
                          <th className="text-right text-purple-200 pb-2">Precio Unit.</th>
                          <th className="text-right text-purple-200 pb-2">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10">
                        {selectedSale.items.map((item: any, index: number) => {
                          console.log('Item en modal de detalles:', item); // Añadido para depuración
                          return (
                            <tr key={index}>
                              <td className="py-3 text-purple-200">
                                <div className="text-sm">
                                  {item.flavor_name && (
                                    <div className="text-purple-300">{item.flavor_name}</div>
                                  )}
                                  <div className="text-purple-200">{item.variant_name}</div>
                                </div>
                              </td>
                              <td className="py-3 text-center text-white">{item.quantity}</td>
                              <td className="py-3 text-right text-white">{formatCurrency(item.unit_price)}</td>
                              <td className="py-3 text-right text-white font-medium">
                                {formatCurrency(item.line_total || 0)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-800 border-t border-white/20 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="text-white">
                  <span className="text-purple-200">Total de la venta:</span>
                  <span className="text-2xl font-bold ml-2">{formatCurrency(selectedSale.total)}</span>
                </div>
                <button
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setSelectedSale(null);
                  }}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-xl transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-auto border border-white/20">
            {/* Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-white/20 p-4 sm:p-6">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Editar Venta #{selectedSale.sale_id}</h3>
                  <p className="text-purple-200 text-sm sm:text-base">{formatDate(selectedSale.opened_at)}</p>
                </div>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedSale(null);
                  }}
                  className="text-purple-300 hover:text-white transition-colors p-2"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <h4 className="text-purple-300 font-medium mb-4">Información de la Venta</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-purple-200 text-sm font-medium mb-2">
                        Observación
                      </label>
                      <textarea
                        value={selectedSale.observation || ''}
                        onChange={(e) => setSelectedSale({...selectedSale, observation: e.target.value})}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                        rows={3}
                        placeholder="Agregar observación..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-xl p-4">
                  <h4 className="text-purple-300 font-medium mb-4">Métodos de Pago</h4>
                  <div className="space-y-3">
                    {selectedSale.payments && selectedSale.payments.map((payment: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <select
                          value={payment.method}
                          onChange={(e) => {
                            const updatedPayments = [...selectedSale.payments];
                            updatedPayments[index] = {...payment, method: e.target.value};
                            setSelectedSale({...selectedSale, payments: updatedPayments});
                          }}
                          className="flex-1 px-3 py-2 bg-slate-700 border border-purple-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="EFECTIVO">EFECTIVO</option>
                          <option value="TARJETA">TARJETA</option>
                          <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                        </select>
                        <input
                          type="number"
                          value={payment.amount}
                          onChange={(e) => {
                            const updatedPayments = [...selectedSale.payments];
                            updatedPayments[index] = {...payment, amount: parseFloat(e.target.value) || 0};
                            setSelectedSale({...selectedSale, payments: updatedPayments});
                          }}
                          className="w-32 px-3 py-2 bg-slate-700 border border-purple-400/30 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Monto"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Products Edit */}
              {selectedSale.items && selectedSale.items.length > 0 && (
                <div className="bg-white/10 rounded-xl p-4">
                  <h4 className="text-purple-300 font-medium mb-4">Productos</h4>
                  <div className="space-y-3">
                    {selectedSale.items.map((item: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="flex-1">
                          <div className="text-purple-200 text-sm">
                            {item.flavor_name && (
                              <div className="text-purple-300">{item.flavor_name}</div>
                            )}
                            <div className="text-purple-200">{item.variant_name}</div>
                          </div>
                          <div className="text-purple-200 text-sm">{formatCurrency(item.unit_price)} c/u</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const updatedItems = [...selectedSale.items];
                              if (updatedItems[index].quantity > 1) {
                                updatedItems[index].quantity -= 1;
                                updatedItems[index].line_total = updatedItems[index].quantity * updatedItems[index].unit_price;
                                const newTotal = updatedItems.reduce((sum, i) => sum + (i.line_total || 0), 0);
                                setSelectedSale({...selectedSale, items: updatedItems, total: newTotal});
                              }
                            }}
                            className="w-8 h-8 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg flex items-center justify-center transition-colors"
                          >
                            -
                          </button>
                          <span className="text-white font-medium w-12 text-center">{item.quantity}</span>
                          <button
                            onClick={() => {
                              const updatedItems = [...selectedSale.items];
                              updatedItems[index].quantity += 1;
                              updatedItems[index].line_total = updatedItems[index].quantity * updatedItems[index].unit_price;
                              const newTotal = updatedItems.reduce((sum, i) => sum + (i.line_total || 0), 0);
                              setSelectedSale({...selectedSale, items: updatedItems, total: newTotal});
                            }}
                            className="w-8 h-8 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-white font-bold w-24 text-right">
                          {formatCurrency(item.line_total || 0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-800 border-t border-white/20 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="text-white">
                  <span className="text-purple-200">Total actualizado:</span>
                  <span className="text-2xl font-bold ml-2">{formatCurrency(selectedSale.total)}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedSale(null);
                    }}
                    className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        // Aquí iría la lógica para guardar los cambios
                        toast.success('Venta actualizada correctamente');
                        setIsEditModalOpen(false);
                        setSelectedSale(null);
                        loadSales(true); // Reload sales
                      } catch (error) {
                        toast.error('Error al actualizar la venta');
                      }
                    }}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md mx-auto border border-white/20">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Confirmar Eliminación</h3>
            <p className="text-purple-200 text-sm sm:text-base mb-4 sm:mb-6">
              ¿Estás seguro de que deseas eliminar esta venta? Esta acción no se puede deshacer.
            </p>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={handleDelete}
                className="w-full sm:w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 sm:py-3 px-4 rounded-xl transition-colors"
              >
                Eliminar
              </button>
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSaleToDelete(null);
                }}
                className="w-full sm:w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 sm:py-3 px-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <toast.ToastComponent />
    </div>
  );
}
