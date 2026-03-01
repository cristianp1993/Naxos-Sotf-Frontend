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
  
  const toast = useToast();

  useEffect(() => {
    // Load today's sales by default
    loadSales(true);
  }, []);

  // Reload sales when page changes or filters change
  useEffect(() => {
    if (currentPage > 1) {
      loadSales(true);
    }
  }, [currentPage]);

  // Reload sales when filter dates change
  useEffect(() => {
    if (filterStartDate && filterEndDate) {
      loadSales(true);
    }
  }, [filterStartDate, filterEndDate]);

  const loadSales = async (useFilters: boolean = true) => {
    try {
      setLoading(true);
      let data;
      
      if (useFilters && (filterStartDate && filterEndDate)) {
        // Use filtered API call
        data = await salesService.getSalesWithFilters({
          start_date: filterStartDate,
          end_date: filterEndDate,
          page: currentPage,
          limit: itemsPerPage
        });
        
        // 🔥 Ordenar ventas por fecha descendente (más nuevas primero)
        if (data.sales && Array.isArray(data.sales)) {
          data.sales.sort((a: any, b: any) => {
            const dateA = new Date(a.opened_at);
            const dateB = new Date(b.opened_at);
            return dateB.getTime() - dateA.getTime(); // Descendente
          });
        }
        
        // 🔥 Si la respuesta principal ya incluye totales, usarlos directamente
        if (data && data.totals) {
          setBackendTotals({
            grand_total: typeof data.totals.grand_total === 'number' ? data.totals.grand_total : 0,
            payment_methods: typeof data.totals.payment_methods === 'object' ? data.totals.payment_methods : {},
            total_count: typeof data.total === 'number' ? data.total : 0
          });
          setTotalItems(typeof data.total === 'number' ? data.total : 0);
          setTotalPages(Math.ceil((typeof data.total === 'number' ? data.total : 0) / itemsPerPage));
        } else {
          // Load totals separately for complete data
          try {
            const totalsData = await salesService.getSalesWithFiltersTotals({
              start_date: filterStartDate,
              end_date: filterEndDate
            });
            
            // 🔥 Asegurarnos que backendTotals siempre tenga los datos correctos
            if (totalsData && totalsData.totals) {
              setBackendTotals({
                grand_total: typeof totalsData.totals.grand_total === 'number' ? totalsData.totals.grand_total : 0,
                payment_methods: typeof totalsData.totals.payment_methods === 'object' ? totalsData.totals.payment_methods : {},
                total_count: typeof totalsData.totals.total_count === 'number' ? totalsData.totals.total_count : 0
              });
              setTotalItems(typeof totalsData.totals.total_count === 'number' ? totalsData.totals.total_count : 0);
              setTotalPages(Math.ceil((typeof totalsData.totals.total_count === 'number' ? totalsData.totals.total_count : 0) / itemsPerPage));
            } else {
              // Si no hay totales, establecer valores por defecto
              setBackendTotals({ grand_total: 0, payment_methods: {}, total_count: 0 });
              setTotalItems(0);
              setTotalPages(1);
            }
          } catch (totalsError) {
            // Si hay error cargando totales, establecer valores por defecto para evitar cálculos locales incorrectos
            setBackendTotals({ grand_total: 0, payment_methods: {}, total_count: 0 });
            setTotalItems(0);
            setTotalPages(1);
          }
        }
      } else {
        // Load all sales without filters (fallback)
        data = await salesService.getAllSales();
        
        // 🔥 Ordenar todas las ventas por fecha descendente
        if (data && Array.isArray(data)) {
          data.sort((a: any, b: any) => {
            const dateA = new Date(a.opened_at);
            const dateB = new Date(b.opened_at);
            return dateB.getTime() - dateA.getTime(); // Descendente
          });
        }
        
        setBackendTotals(null);
      }
      
      // Si data es un objeto con propiedad sales, usar esa
      // Si es un array directamente, usarlo
      // Si es un objeto con otra estructura, buscar el array
      let salesArray: Sale[] = [];
      let totalCount = 0;
      
      if (Array.isArray(data)) {
        salesArray = data;
        totalCount = data.length;
      } else if (data && typeof data === 'object' && data !== null) {
        // Type assertion para poder acceder a las propiedades
        const dataObj = data as Record<string, unknown>;
        // Buscar propiedades que puedan contener el array de ventas
        if (Array.isArray(dataObj.sales)) {
          salesArray = dataObj.sales as Sale[];
          totalCount = (dataObj.total as number) || dataObj.sales.length;
        } else if (Array.isArray(dataObj.data)) {
          salesArray = dataObj.data as Sale[];
          totalCount = (dataObj.total as number) || dataObj.data.length;
        } else if (Array.isArray(dataObj.results)) {
          salesArray = dataObj.results as Sale[];
          totalCount = (dataObj.total as number) || dataObj.results.length;
        } else if (Array.isArray(dataObj.rows)) {
          salesArray = dataObj.rows as Sale[];
          totalCount = (dataObj.count as number) || dataObj.rows.length;
        } else {
          // Si no encuentra arrays, mostrar el objeto completo para depuración
          salesArray = [];
          totalCount = 0;
        }
      }
      
      // Store the total count for pagination
      if (useFilters && (filterStartDate && filterEndDate)) {
        // When using filters, trust the backend pagination
        setSales(salesArray);
      } else {
        // When loading all data, use client-side pagination
        setSales(salesArray);
        setTotalItems(totalCount);
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
      }
      setSales(salesArray);
    } catch (err) {
      setError('Error al cargar las ventas');
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

  // Filter sales by date range
  const getFilteredSales = () => {
    if (!filterStartDate && !filterEndDate) return sales;
    
    const filtered = sales.filter(sale => {
      // Use Colombia local date instead of UTC
      const saleDate = new Date(sale.opened_at);
      const saleDateOnly = saleDate.toLocaleDateString('en-CA', { 
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }); // Format: YYYY-MM-DD in Colombia timezone
      
      let matches = true;
      
      if (filterStartDate) {
        matches = matches && saleDateOnly >= filterStartDate;
      }
      
      if (filterEndDate) {
        matches = matches && saleDateOnly <= filterEndDate;
      }
      
      return matches;
    });
    
    return filtered;
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

  // 🔥 SOLUCIÓN DEFINITIVA: Calcular paginación de forma robusta
  const getPaginatedSales = () => {
    // Siempre usar paginación del backend cuando hay filtros
    if (filterStartDate && filterEndDate) {
      return sales; // Backend ya paginó
    }
    
    // Paginación local solo para ventas sin filtros
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sales.slice(startIndex, endIndex);
  };

  // 🔥 SOLUCIÓN DEFINITIVA: Calcular paginación de forma robusta
  const filteredSales = getFilteredSales();
  const isUsingBackendPagination = filterStartDate && filterEndDate;
  const displaySales = isUsingBackendPagination ? sales : getPaginatedSales();
  
  // 🔥 Calcular totales de forma segura
  const currentTotalItems = isUsingBackendPagination ? 
    (typeof totalItems === 'number' && totalItems >= 0 ? totalItems : 0) : 
    sales.length;
  
  // 🔥 Calcular páginas de forma segura (sin generar páginas extra)
  const currentTotalPages = currentTotalItems > 0 ? 
    Math.ceil(currentTotalItems / itemsPerPage) : 1;
  
  // 🔥 Validar página actual para que no exceda el total
  const validCurrentPage = Math.min(Math.max(1, currentPage), currentTotalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(validCurrentPage * itemsPerPage, currentTotalItems);

  // 🔥 SOLUCIÓN DEFINITIVA: Calcular totales de forma robusta
  const getFilteredTotal = () => {
    // Siempre usar backend totals cuando hay filtros
    if (isUsingBackendPagination && backendTotals && typeof backendTotals.grand_total === 'number') {
      return backendTotals.grand_total;
    }
    
    // Fallback robusto para ventas sin filtros
    return sales.reduce((sum, sale) => {
      const total = typeof sale.total === 'string' ? parseFloat(sale.total) : sale.total;
      return sum + (typeof total === 'number' && !isNaN(total) ? total : 0);
    }, 0);
  };

  // 🔥 SOLUCIÓN DEFINITIVA: Calcular totales por método de pago de forma robusta
  const getPaymentMethodTotals = () => {
    // Siempre usar backend totals cuando hay filtros
    if (isUsingBackendPagination && backendTotals && backendTotals.payment_methods && typeof backendTotals.payment_methods === 'object') {
      const mappedTotals: Record<string, number> = {};
      const paymentMapping: Record<string, string> = {
        'CASH': 'EFECTIVO',
        'TRANSFER': 'TRANSFERENCIA',
        'TARJETA': 'TARJETA',
        'EFECTIVO': 'EFECTIVO',
        'TRANSFERENCIA': 'TRANSFERENCIA'
      };
      
      Object.entries(backendTotals.payment_methods).forEach(([method, amount]) => {
        const uiMethod = paymentMapping[method] || method;
        mappedTotals[uiMethod] = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
      });
      
      return mappedTotals;
    }
    
    // Fallback robusto para ventas sin filtros
    const totals: Record<string, number> = {};
    const paymentMapping: Record<string, string> = {
      'CASH': 'EFECTIVO',
      'TRANSFER': 'TRANSFERENCIA',
      'TARJETA': 'TARJETA'
    };
    
    sales.forEach(sale => {
      if (sale.payments && Array.isArray(sale.payments)) {
        sale.payments.forEach(payment => {
          let method = payment.method || 'SIN METODO';
          method = paymentMapping[method] || method;
          const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
          const validAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
          
          if (!totals[method]) {
            totals[method] = 0;
          }
          totals[method] += validAmount;
        });
      }
    });
    
    return totals;
  };

  const filteredTotal = getFilteredTotal();
  const paymentMethodTotals = getPaymentMethodTotals();

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // 🔥 Recargar ventas cuando cambia la página (solo con filtros)
  useEffect(() => {
    if (filterStartDate && filterEndDate && filterStartDate !== today && filterEndDate !== today) {
      loadSales(true);
    }
  }, [currentPage]);

  const formatCurrency = (amount: number) => {
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
    return formatted;
  };

  const formatDate = (dateString: string) => {
    // 🔥 Ya no transformamos zona horaria - la BD ya devuelve hora Colombia
    const date = new Date(dateString);
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC' // 🔥 Forzar UTC para no restar horas
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
              
              {currentTotalItems > 0 && (
                <div className="text-purple-200 text-xs sm:text-sm">
                  Mostrando {startIndex} a {endIndex} de {currentTotalItems} ventas
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sales Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden">
        {!sales || sales.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="text-purple-200 text-base sm:text-lg">No hay ventas registradas</div>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="text-purple-200 text-base sm:text-lg">No hay ventas que coincidan con los filtros</div>
          </div>
        ) : (
          <>
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
            {currentTotalItems > 0 && (
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
                      Total de {isUsingBackendPagination && backendTotals ? backendTotals.total_count : filteredSales.length} ventas filtradas
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
          </>
        )}
      </div>

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

      {/* Edit Modal */}
      {isEditModalOpen && selectedSale && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 max-w-4xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">Editar Venta #{selectedSale.sale_id}</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-purple-300 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sale Details */}
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">Fecha</label>
                  <div className="text-white text-sm sm:text-base">{formatDate(selectedSale.opened_at)}</div>
                </div>
                <div>
                  <label className="block text-purple-200 text-sm font-medium mb-2">Total</label>
                  <div className="text-white font-bold text-sm sm:text-base">{formatCurrency(selectedSale.total)}</div>
                </div>
              </div>

              <div>
                <label className="block text-purple-200 text-sm font-medium mb-2">Observación</label>
                <textarea
                  value={selectedSale.observation || ''}
                  onChange={(e) => setSelectedSale({...selectedSale, observation: e.target.value})}
                  className="w-full px-3 sm:px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm sm:text-base"
                  rows={3}
                  placeholder="Agregar observación..."
                />
              </div>

              {/* Editable Items */}
              <div>
                <h4 className="text-white font-medium mb-3 text-sm sm:text-base">Productos</h4>
                <div className="space-y-2">
                  {selectedSale.items && selectedSale.items.map((item, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                        <div className="flex-1">
                          <div className="text-white font-medium text-sm sm:text-base mb-2">
                            {item.product_name} - {item.variant_name}
                          </div>
                          {item.flavor_name && (
                            <div className="text-purple-300 text-sm mb-2">
                              Sabor: {item.flavor_name}
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                            <div>
                              <label className="block text-purple-300 text-xs mb-1">Cantidad</label>
                              <input
                                type="number"
                                value={Math.round(item.quantity)}
                                onChange={(e) => {
                                  const newQuantity = parseInt(e.target.value) || 0;
                                  const newItems = [...selectedSale.items];
                                  newItems[index] = {
                                    ...item,
                                    quantity: newQuantity,
                                    line_total: newQuantity * item.unit_price
                                  };
                                  setSelectedSale({
                                    ...selectedSale,
                                    items: newItems,
                                    total: newItems.reduce((sum, i) => sum + i.line_total, 0)
                                  });
                                }}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                min="1"
                                step="1"
                              />
                            </div>
                            <div>
                              <label className="block text-purple-300 text-xs mb-1">Precio Unitario</label>
                              <input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => {
                                  const newPrice = parseFloat(e.target.value) || 0;
                                  const newItems = [...selectedSale.items];
                                  newItems[index] = {
                                    ...item,
                                    unit_price: newPrice,
                                    line_total: item.quantity * newPrice
                                  };
                                  setSelectedSale({
                                    ...selectedSale,
                                    items: newItems,
                                    total: newItems.reduce((sum, i) => sum + i.line_total, 0)
                                  });
                                }}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                min="0"
                                step="0.01"
                              />
                            </div>
                            <div>
                              <label className="block text-purple-300 text-xs mb-1">Subtotal</label>
                              <div className="text-white font-medium text-sm">
                                {formatCurrency(item.line_total)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Editable Payments */}
              <div>
                <h4 className="text-white font-medium mb-3 text-sm sm:text-base">Métodos de pago</h4>
                <div className="space-y-2">
                  {selectedSale.payments && selectedSale.payments.map((payment, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                        <div>
                          <label className="block text-purple-300 text-xs mb-1">Método</label>
                          <select
                            value={payment.method}
                            onChange={(e) => {
                              const newPayments = [...selectedSale.payments];
                              newPayments[index] = {
                                ...payment,
                                method: e.target.value
                              };
                              setSelectedSale({
                                ...selectedSale,
                                payments: newPayments
                              });
                            }}
                            className="w-full px-2 py-1 bg-slate-700/80 hover:bg-slate-600/80 border border-slate-500/50 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                          >
                            <option value="EFECTIVO" className="bg-slate-700 text-white hover:bg-slate-600">EFECTIVO</option>
                            <option value="TARJETA" className="bg-slate-700 text-white hover:bg-slate-600">TARJETA</option>
                            <option value="TRANSFERENCIA" className="bg-slate-700 text-white hover:bg-slate-600">TRANSFERENCIA</option>
                            <option value="OTRO" className="bg-slate-700 text-white hover:bg-slate-600">OTRO</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-purple-300 text-xs mb-1">Monto</label>
                          <input
                            type="number"
                            value={payment.amount}
                            onChange={(e) => {
                              const newAmount = parseFloat(e.target.value) || 0;
                              const newPayments = [...selectedSale.payments];
                              newPayments[index] = {
                                ...payment,
                                amount: newAmount
                              };
                              setSelectedSale({
                                ...selectedSale,
                                payments: newPayments
                              });
                            }}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div>
                          <label className="block text-purple-300 text-xs mb-1">Referencia</label>
                          <input
                            type="text"
                            value={payment.reference || ''}
                            onChange={(e) => {
                              const newPayments = [...selectedSale.payments];
                              newPayments[index] = {
                                ...payment,
                                reference: e.target.value
                              };
                              setSelectedSale({
                                ...selectedSale,
                                payments: newPayments
                              });
                            }}
                            className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Referencia (opcional)"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-6">
              <button
                onClick={async () => {
                  try {
                    // Preparar el payload para el backend - items y pagos
                    const updatePayload = {
                      observation: selectedSale.observation,
                      items: selectedSale.items.map(item => {
                        // Buscar variant_id en diferentes propiedades posibles
                        const itemAny = item as any;
                        const variantId = itemAny.variant_id || itemAny.item_id || itemAny.id || itemAny.sale_item_id;
                        
                        if (!variantId || variantId === 0) {
                          console.warn('⚠️ No variant_id found for item:', item.product_name);
                          // Para items sin variant_id, usamos un placeholder o lanzamos error
                          throw new Error(`No se encontró variant_id para el item: ${item.product_name}`);
                        }
                        
                        return {
                          variant_id: variantId,
                          flavor_name: item.flavor_name || null,
                          quantity: item.quantity,
                          unit_price: item.unit_price
                        };
                      }),
                      payments: selectedSale.payments.map(payment => ({
                        method: payment.method as PaymentMethodUI,
                        amount: payment.amount,
                        reference: payment.reference || null
                      }))
                    };
                    
                    // Validar que haya items y pagos
                    if (updatePayload.items.length === 0) {
                      throw new Error('Se requiere al menos un item');
                    }
                    
                    if (updatePayload.payments.length === 0) {
                      throw new Error('Se requiere al menos un método de pago');
                    }
                    
                    // Llamar al backend para actualizar
                    const response = await salesService.updateSale(selectedSale.sale_id, updatePayload);
                    
                    toast.success('Cambios guardados correctamente');
                    setIsEditModalOpen(false);
                    loadSales(); // Recargar las ventas para ver los cambios
                  } catch (err: any) {
                    console.error('Error al guardar cambios:', err);
                    toast.error(err.message || 'Error al guardar los cambios');
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 sm:py-3 px-4 rounded-xl transition-colors text-sm sm:text-base"
              >
                Guardar Cambios
              </button>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-medium py-2 sm:py-3 px-4 rounded-xl transition-colors text-sm sm:text-base"
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
          <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-sm sm:max-w-md lg:max-w-4xl mx-auto border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white">Detalles de Venta #{selectedSale.sale_id}</h3>
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="text-purple-300 hover:text-white transition-colors p-1"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sale Header */}
            <div className="bg-white/5 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <label className="block text-purple-300 text-xs font-medium mb-1">ID Venta</label>
                  <div className="text-white font-bold text-sm sm:text-base">#{selectedSale.sale_id}</div>
                </div>
                <div>
                  <label className="block text-purple-300 text-xs font-medium mb-1">Fecha</label>
                  <div className="text-white text-xs sm:text-sm">{formatDate(selectedSale.opened_at)}</div>
                </div>
                <div>
                  <label className="block text-purple-300 text-xs font-medium mb-1">Total</label>
                  <div className="text-white font-bold text-sm sm:text-lg">{formatCurrency(selectedSale.total)}</div>
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
                <div className="mt-3 sm:mt-4">
                  <label className="block text-purple-300 text-xs font-medium mb-1">Observación</label>
                  <div className="text-purple-200 text-xs sm:text-sm break-words">{selectedSale.observation}</div>
                </div>
              )}
            </div>

            {/* Products Section */}
            <div className="mb-4 sm:mb-6">
              <h4 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-sm sm:text-base">Productos Vendidos</span>
              </h4>
              <div className="space-y-2 sm:space-y-3">
                {selectedSale.items && Array.isArray(selectedSale.items) && selectedSale.items.length > 0 ? (
                  selectedSale.items.map((item, index) => (
                    <div key={index} className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1">
                          <div className="text-white font-bold text-sm sm:text-lg mb-2">
                            {item.product_name || 'Producto sin nombre'}
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div>
                              <span className="text-purple-300">Tamaño/Variante:</span>
                              <div className="text-white font-medium break-words">{item.variant_name || 'N/A'}</div>
                            </div>
                            {item.flavor_name && (
                              <div>
                                <span className="text-purple-300">Sabor:</span>
                                <div className="text-white font-medium break-words">{item.flavor_name}</div>
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
                        <div className="text-right sm:ml-4">
                          <div className="text-purple-300 text-xs sm:text-sm">Subtotal</div>
                          <div className="text-white font-bold text-sm sm:text-lg">{formatCurrency(item.line_total || 0)}</div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 text-center">
                    <div className="text-purple-200 text-sm sm:text-base">No hay productos registrados para esta venta</div>
                  </div>
                )}
              </div>
            </div>

            {/* Payments Section */}
            <div>
              <h4 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4 flex items-center">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm sm:text-base">Métodos de Pago</span>
              </h4>
              <div className="space-y-2">
                {selectedSale.payments && Array.isArray(selectedSale.payments) && selectedSale.payments.length > 0 ? (
                  selectedSale.payments.map((payment, index) => (
                    <div key={index} className="bg-white/5 rounded-lg p-2 sm:p-3 flex flex-col sm:flex-row sm:justify-between sm:items-center border border-white/10 gap-2">
                      <div className="flex-1">
                        <div className="text-white font-medium text-sm sm:text-base break-words">{payment.method || 'Método no especificado'}</div>
                        {payment.reference && (
                          <div className="text-purple-300 text-xs sm:text-sm break-words">Referencia: {payment.reference}</div>
                        )}
                      </div>
                      <div className="text-white font-bold text-sm sm:text-base sm:text-right">{formatCurrency(payment.amount || 0)}</div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white/5 rounded-lg p-2 sm:p-3 border border-white/10 text-center">
                    <div className="text-purple-200 text-sm sm:text-base">No hay métodos de pago registrados para esta venta</div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-4 sm:mt-6">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 sm:py-3 px-4 sm:px-6 rounded-xl transition-colors text-sm sm:text-base"
              >
                Cerrar
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
