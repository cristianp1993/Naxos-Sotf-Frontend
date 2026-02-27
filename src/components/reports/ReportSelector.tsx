import React, { useState } from 'react';
import { ReportConfig, getReportCategories, getReportsByCategory } from '@/services/reportRegistry';

interface ReportSelectorProps {
  selectedReport: ReportConfig | null;
  onReportSelect: (report: ReportConfig) => void;
  loading?: boolean;
}

export const ReportSelector: React.FC<ReportSelectorProps> = ({ 
  selectedReport, 
  onReportSelect, 
  loading = false 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const categories = getReportCategories();
  const filteredReports = selectedCategory === 'all' 
    ? [] // Mostrar todos cuando se selecciona "all"
    : getReportsByCategory(selectedCategory as any);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setIsDropdownOpen(false);
  };

  const handleReportSelect = (report: ReportConfig) => {
    onReportSelect(report);
    setIsDropdownOpen(false);
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'financial': return '💰';
      case 'inventory': return '📦';
      case 'sales': return '📊';
      case 'operations': return '⚙️';
      default: return '📋';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20">
      <div className="p-4 sm:p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Seleccionar Reporte</h2>
        
        {/* Selected Report Display */}
        <div className="mb-6">
          {selectedReport ? (
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{selectedReport.icon}</span>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedReport.name}</h3>
                    <p className="text-purple-100 text-sm">{selectedReport.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={loading}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 disabled:opacity-50 rounded-lg transition-colors"
                >
                  Cambiar
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/10 border border-white/20 rounded-2xl p-6 text-center">
              <span className="text-4xl mb-3 block">📊</span>
              <h3 className="text-white font-semibold mb-2">Selecciona un reporte</h3>
              <p className="text-purple-200 text-sm mb-4">
                Elige el tipo de reporte que deseas generar
              </p>
              <button
                onClick={() => setIsDropdownOpen(true)}
                disabled={loading}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-xl transition-colors"
              >
                Seleccionar Reporte
              </button>
            </div>
          )}
        </div>

        {/* Dropdown Selector */}
        {isDropdownOpen && (
          <div className="relative">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsDropdownOpen(false)}
            />
            
            {/* Dropdown Content */}
            <div className="absolute top-0 left-0 right-0 bg-slate-800 rounded-2xl border border-white/20 shadow-2xl z-50 max-h-96 overflow-hidden">
              <div className="p-4 border-b border-white/20">
                <h3 className="text-white font-semibold mb-3">Categorías</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className={`p-3 rounded-xl transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-purple-300 hover:bg-white/20'
                    }`}
                  >
                    <span className="text-lg mb-1 block">📋</span>
                    <span className="text-xs">Todos</span>
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`p-3 rounded-xl transition-all ${
                        selectedCategory === category.id
                          ? 'bg-purple-600 text-white'
                          : 'bg-white/10 text-purple-300 hover:bg-white/20'
                      }`}
                    >
                      <span className="text-lg mb-1 block">{getCategoryIcon(category.id)}</span>
                      <span className="text-xs">{category.name}</span>
                      <span className="text-xs opacity-75 block">({category.count})</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedCategory !== 'all' && (
                <div className="p-4 max-h-64 overflow-y-auto">
                  <h4 className="text-white font-medium mb-3">
                    Reportes de {categories.find(c => c.id === selectedCategory)?.name}
                  </h4>
                  <div className="space-y-2">
                    {filteredReports.map((report) => (
                      <button
                        key={report.id}
                        onClick={() => handleReportSelect(report)}
                        className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-left group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl group-hover:scale-110 transition-transform">
                              {report.icon}
                            </span>
                            <div>
                              <h4 className="text-white font-medium">{report.name}</h4>
                              <p className="text-purple-200 text-xs">{report.description}</p>
                            </div>
                          </div>
                          <div className="text-purple-400 group-hover:text-white transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Download formats badges */}
                        <div className="flex gap-2 mt-2">
                          {report.downloadFormats.map((format) => (
                            <span 
                              key={format}
                              className="text-xs bg-purple-500/30 text-purple-300 px-2 py-1 rounded-full"
                            >
                              {format.toUpperCase()}
                            </span>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Close button */}
              <div className="p-4 border-t border-white/20">
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente de filtros dinámicos basado en el reporte seleccionado
interface ReportFiltersProps {
  config: ReportConfig;
  filters: Record<string, any>;
  onFiltersChange: (filters: Record<string, any>) => void;
  loading?: boolean;
}

export const ReportFilters: React.FC<ReportFiltersProps> = ({ 
  config, 
  filters, 
  onFiltersChange, 
  loading = false 
}) => {
  const today = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20">
      <div className="p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Filtros del Reporte</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Range Filter */}
          {config.requiresDateRange && (
            <>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  Fecha Inicio
                </label>
                <input
                  type="date"
                  value={filters.start_date || today}
                  onChange={(e) => handleFilterChange('start_date', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-purple-300 text-sm font-medium mb-2">
                  Fecha Fin
                </label>
                <input
                  type="date"
                  value={filters.end_date || today}
                  onChange={(e) => handleFilterChange('end_date', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
            </>
          )}

          {/* Location Filter */}
          {config.requiresLocation && (
            <div>
              <label className="block text-purple-300 text-sm font-medium mb-2">
                Ubicación
              </label>
              <select
                value={filters.location_id || ''}
                onChange={(e) => handleFilterChange('location_id', e.target.value ? parseInt(e.target.value) : undefined)}
                disabled={loading}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">Todas las ubicaciones</option>
                <option value="1">Ubicación 1</option>
                <option value="2">Ubicación 2</option>
              </select>
            </div>
          )}
        </div>

        {/* Download Options */}
        <div className="mt-6 pt-6 border-t border-white/20">
          <h4 className="text-white font-medium mb-3">Opciones de Descarga</h4>
          <div className="flex flex-wrap gap-2">
            {config.downloadFormats.map((format) => (
              <button
                key={format}
                disabled={loading}
                className={`px-4 py-2 font-medium rounded-xl transition-all ${
                  format === 'pdf' 
                    ? 'bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white'
                    : 'bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white'
                }`}
              >
                Descargar {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
