'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { expenseService, Expense } from '@/services/expenseService';

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter states
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterConcept, setFilterConcept] = useState('');
  
  // Accordion states
  const [isFiltersOpen, setIsFiltersOpen] = useState(true);
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [isConceptTotalsOpen, setIsConceptTotalsOpen] = useState(true);
  
  // Form states
  const [formData, setFormData] = useState({
    expense_date: new Date().toISOString().split('T')[0],
    concept: '',
    description: '',
    amount: ''
  });

  // Estados para el buscador de conceptos
  const [conceptSearch, setConceptSearch] = useState('');
  const [showConceptDropdown, setShowConceptDropdown] = useState(false);

  // Opciones predefinidas para el concepto
  const conceptOptions = [
    'NÓMINA',
    'MANTENIMIENTO', 
    'COMPRAS INSUMOS',
    'COMPRAS EMPAQUE',
    'COMPRAS LÍQUIDOS',
    'COMPRAS DULCES',
    'TRANSPORTE',
    'SERVICIOS',
    'MARKETING',
    'LIMPIEZA',
    'OTROS'
  ];

  // Filtrar conceptos basados en la búsqueda
  const filteredConcepts = conceptOptions.filter(concept =>
    concept.toLowerCase().includes(conceptSearch.toLowerCase())
  );
  
  const toast = useToast();

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const data = await expenseService.getAllExpenses();
      setExpenses(data);
    } catch (err: any) {
      console.error('Error loading expenses:', err);
      setError(err.message || 'Error al cargar los gastos');
    } finally {
      setLoading(false);
    }
  };

  // Filter expenses by date range and concept
  const getFilteredExpenses = () => {
    return expenses.filter(expense => {
      let matches = true;
      
      // Filter by date range
      if (filterStartDate) {
        matches = matches && expense.expense_date >= filterStartDate;
      }
      
      if (filterEndDate) {
        matches = matches && expense.expense_date <= filterEndDate;
      }
      
      // Filter by concept
      if (filterConcept) {
        matches = matches && expense.concept.toLowerCase().includes(filterConcept.toLowerCase());
      }
      
      return matches;
    });
  };

  // Get paginated data
  const getPaginatedExpenses = () => {
    const filteredExpenses = getFilteredExpenses();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredExpenses.slice(startIndex, endIndex);
  };

  // Calculate pagination info
  const filteredExpenses = getFilteredExpenses();
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = getPaginatedExpenses();
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, filteredExpenses.length);

  // Calculate total sum of filtered expenses
  const getFilteredTotal = () => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  // Calculate totals by concept
  const getConceptTotals = () => {
    const totals: Record<string, number> = {};
    
    filteredExpenses.forEach(expense => {
      if (!totals[expense.concept]) {
        totals[expense.concept] = 0;
      }
      totals[expense.concept] += expense.amount;
    });
    
    return totals;
  };

  const filteredTotal = getFilteredTotal();
  const conceptTotals = getConceptTotals();

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const resetForm = () => {
    setFormData({
      expense_date: new Date().toISOString().split('T')[0],
      concept: '',
      description: '',
      amount: ''
    });
    setConceptSearch('');
    setShowConceptDropdown(false);
  };

  const handleConceptSelect = (concept: string) => {
    setFormData({ ...formData, concept });
    setConceptSearch(concept);
    setShowConceptDropdown(false);
  };

  const handleConceptInputChange = (value: string) => {
    setConceptSearch(value);
    setShowConceptDropdown(true);
  };

  const handleCreate = () => {
    resetForm();
    setSelectedExpense(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      expense_date: expense.expense_date,
      concept: expense.concept,
      description: expense.description || '',
      amount: expense.amount.toString()
    });
    setConceptSearch(expense.concept);
    setShowConceptDropdown(false);
    setIsEditModalOpen(true);
  };

  const confirmDelete = (expenseId: number) => {
    setExpenseToDelete(expenseId);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (selectedExpense) {
        // Update
        await expenseService.updateExpense(selectedExpense.id, payload);
        toast.success('Gasto actualizado correctamente');
        setIsEditModalOpen(false);
      } else {
        // Create
        await expenseService.createExpense(payload);
        toast.success('Gasto creado correctamente');
        setIsCreateModalOpen(false);
      }
      
      resetForm();
      setSelectedExpense(null);
      loadExpenses();
    } catch (err: any) {
      console.error('Error saving expense:', err);
      toast.error(err.message || 'Error al guardar el gasto');
    }
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    
    try {
      await expenseService.deleteExpense(expenseToDelete);
      setExpenses(expenses.filter(expense => expense.id !== expenseToDelete));
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
      toast.success('Gasto eliminado correctamente');
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
      toast.error(err.message || 'Error al eliminar el gasto');
    }
  };

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
      month: '2-digit',
      day: '2-digit'
    });
  };

  const calculateTotal = () => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.concept-selector')) {
        setShowConceptDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando gastos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-white/20 mb-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Gestión de Gastos</h1>
            <p className="text-purple-200 text-sm sm:text-base">Control y registro de gastos operativos</p>
          </div>
          <button
            onClick={handleCreate}
            className="px-4 py-2 sm:px-6 sm:py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-colors text-sm sm:text-base"
          >
            Nuevo Gasto
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 mb-6">
        <div 
          className="flex justify-between items-center p-4 sm:p-6 cursor-pointer hover:bg-white/5 transition-colors rounded-t-3xl"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
          <h3 className="text-white font-bold text-base sm:text-lg">Filtrar Gastos</h3>
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
            {/* Date and Concept Filters */}
            <div className="mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <label className="block text-purple-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    Fecha Inicio (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    Fecha Fin (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-purple-300 text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                    Concepto
                  </label>
                  <select
                    value={filterConcept}
                    onChange={(e) => setFilterConcept(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-2 bg-purple-600/30 border border-purple-400/30 rounded-xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm"
                  >
                    <option value="" className="bg-purple-600/50">Todos los conceptos</option>
                    {conceptOptions.map((option) => (
                      <option key={option} value={option} className="bg-purple-600/50">
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setFilterStartDate('');
                      setFilterEndDate('');
                      setFilterConcept('');
                      setCurrentPage(1);
                    }}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors text-sm sm:text-base"
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
                </select>
              </div>
              
              {filteredExpenses.length > 0 && (
                <div className="text-purple-200 text-xs sm:text-sm">
                  Mostrando {startIndex} a {endIndex} de {filteredExpenses.length} gastos
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 mb-6">
        <div 
          className="flex justify-between items-center p-4 sm:p-6 cursor-pointer hover:bg-white/5 transition-colors rounded-t-3xl"
          onClick={() => setIsStatsOpen(!isStatsOpen)}
        >
          <h3 className="text-white font-bold text-base sm:text-lg">Resumen de Gastos</h3>
          <svg 
            className={`w-5 h-5 text-white transition-transform duration-200 ${isStatsOpen ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {isStatsOpen && (
          <div className="p-4 sm:p-6 pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-white/20">
                <div className="text-purple-300 text-sm sm:text-base mb-2">Total de Gastos {filterStartDate || filterEndDate || filterConcept ? '(Filtrados)' : '(General)'}</div>
                <div className="text-white text-2xl sm:text-3xl font-bold">{filteredExpenses.length}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-white/20">
                <div className="text-purple-300 text-sm sm:text-base mb-2">Monto Total {filterStartDate || filterEndDate || filterConcept ? '(Filtrado)' : '(General)'}</div>
                <div className="text-white text-2xl sm:text-3xl font-bold">{formatCurrency(filteredTotal)}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-white/20">
                <div className="text-purple-300 text-sm sm:text-base mb-2">Promedio por Gasto</div>
                <div className="text-white text-2xl sm:text-3xl font-bold">
                  {filteredExpenses.length > 0 ? formatCurrency(filteredTotal / filteredExpenses.length) : formatCurrency(0)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Concept Totals */}
      {Object.keys(conceptTotals).length > 0 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 mb-6">
          <div 
            className="flex justify-between items-center p-4 sm:p-6 cursor-pointer hover:bg-white/5 transition-colors rounded-t-3xl"
            onClick={() => setIsConceptTotalsOpen(!isConceptTotalsOpen)}
          >
            <h3 className="text-white font-bold text-lg">Totales por Concepto</h3>
            <svg 
              className={`w-5 h-5 text-white transition-transform duration-200 ${isConceptTotalsOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          
          {isConceptTotalsOpen && (
            <div className="p-4 sm:p-6 pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                {Object.entries(conceptTotals).map(([concept, total]) => (
                  <div key={concept} className="bg-purple-600/20 rounded-lg p-2 sm:p-3 border border-purple-400/30 hover:bg-purple-600/30 transition-colors">
                    <div className="text-purple-200 text-xs mb-1 truncate" title={concept}>{concept}</div>
                    <div className="text-white font-bold text-sm">{formatCurrency(total)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Concepto
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider hidden sm:table-cell">
                  Descripción
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-medium text-purple-200 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paginatedExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-purple-200 text-xs sm:text-sm">{formatDate(expense.expense_date)}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-white font-medium text-sm sm:text-base">{expense.concept}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                    <div className="text-purple-200 text-sm max-w-xs truncate" title={expense.description || ''}>
                      {expense.description || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="text-white font-bold text-sm sm:text-base">{formatCurrency(expense.amount)}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="text-blue-300 hover:text-white transition-colors"
                        title="Editar gasto"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => confirmDelete(expense.id)}
                        className="text-red-300 hover:text-white transition-colors"
                        title="Eliminar gasto"
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

        {!expenses || expenses.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="text-purple-200 text-lg mb-2">No hay gastos registrados</div>
            <div className="text-purple-300 text-sm">Crea tu primer gasto usando el botón "Nuevo Gasto"</div>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <div className="text-purple-200 text-lg mb-2">No hay gastos que coincidan con los filtros</div>
            <div className="text-purple-300 text-sm">Intenta con otros filtros o limpia los filtros actuales</div>
          </div>
        ) : null}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-white/20">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="text-purple-200 text-sm">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Anterior
              </button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg transition-colors ${
                      page === currentPage 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-md mx-auto border border-white/20">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">
              {selectedExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  Fecha
                </label>
                <input
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  Concepto
                </label>
                <div className="relative concept-selector">
                  <input
                    type="text"
                    value={conceptSearch}
                    onChange={(e) => handleConceptInputChange(e.target.value)}
                    onFocus={() => setShowConceptDropdown(true)}
                    className="w-full px-3 py-2 bg-slate-700 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Buscar o seleccionar concepto..."
                    required
                  />
                  {showConceptDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-purple-600/90 border border-purple-400/30 rounded-lg shadow-lg max-h-48 overflow-y-auto backdrop-blur-sm">
                      {filteredConcepts.length > 0 ? (
                        filteredConcepts.map((concept) => (
                          <div
                            key={concept}
                            onClick={() => handleConceptSelect(concept)}
                            className="px-3 py-2 text-white hover:bg-purple-700 cursor-pointer transition-colors"
                          >
                            {concept}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-purple-200">
                          No se encontraron conceptos
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Descripción detallada del gasto (opcional)"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  Monto
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  {selectedExpense ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                    setSelectedExpense(null);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl p-4 sm:p-6 w-full max-w-sm mx-auto border border-white/20">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Confirmar Eliminación</h3>
            <p className="text-purple-200 text-sm sm:text-base mb-4 sm:mb-6">
              ¿Estás seguro de que deseas eliminar este gasto? Esta acción no se puede deshacer.
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
                  setExpenseToDelete(null);
                }}
                className="w-full sm:w-full bg-white/10 hover:bg-white/20 text-white font-medium py-2 sm:py-3 px-4 rounded-xl transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
