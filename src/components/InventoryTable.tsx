'use client';

import React, { useState } from 'react';
import { InventoryStock, InventoryLocation } from '@/types/inventory';

interface InventoryTableProps {
  stock: InventoryStock[];
  locations: InventoryLocation[];
  loading?: boolean;
  onEdit?: (item: InventoryStock) => void;
  onAdjustStock?: (item: InventoryStock) => void;
  selectedLocation?: number;
  onLocationChange?: (locationId: number) => void;
}

export default function InventoryTable({
  stock,
  locations,
  loading = false,
  onEdit,
  onAdjustStock,
  selectedLocation,
  onLocationChange
}: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStock = stock.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.product_name?.toLowerCase().includes(searchLower) ||
      item.variant_name?.toLowerCase().includes(searchLower) ||
      item.category_name?.toLowerCase().includes(searchLower) ||
      item.sku?.toLowerCase().includes(searchLower)
    );
  });

  const getStockStatus = (quantity: number) => {
    if (quantity <= 5) return { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Crítico' };
    if (quantity <= 20) return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Bajo' };
    return { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Normal' };
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-white text-lg">Cargando inventario...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Inventario Actual</h2>
          <p className="text-white/70 text-sm">
            {filteredStock.length} productos encontrados
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Location Filter */}
          {onLocationChange && (
            <select
              value={selectedLocation || ''}
              onChange={(e) => onLocationChange(Number(e.target.value))}
              className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Todas las ubicaciones</option>
              {locations.map((location) => (
                <option key={location.location_id} value={location.location_id}>
                  {location.name}
                </option>
              ))}
            </select>
          )}

          {/* Search */}
          <div className="relative flex-1 lg:flex-initial">
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <svg className="absolute left-3 top-3.5 w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-3 px-4 text-white/70 font-semibold">Producto</th>
              <th className="text-left py-3 px-4 text-white/70 font-semibold">Variante</th>
              <th className="text-left py-3 px-4 text-white/70 font-semibold">Categoría</th>
              <th className="text-left py-3 px-4 text-white/70 font-semibold">SKU</th>
              <th className="text-left py-3 px-4 text-white/70 font-semibold">Ubicación</th>
              <th className="text-center py-3 px-4 text-white/70 font-semibold">Stock</th>
              <th className="text-center py-3 px-4 text-white/70 font-semibold">Estado</th>
              <th className="text-center py-3 px-4 text-white/70 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-white/50">
                  {searchTerm ? 'No se encontraron productos con esos criterios' : 'No hay productos en el inventario'}
                </td>
              </tr>
            ) : (
              filteredStock.map((item) => {
                const status = getStockStatus(item.qty_on_hand);
                return (
                  <tr key={`${item.variant_id}-${item.location_id}`} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-white font-medium">{item.product_name}</div>
                        <div className="text-white/40 text-xs">ID: {item.product_id}</div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <div className="text-white">{item.variant_name}</div>
                        {item.ounces && (
                          <div className="text-white/40 text-xs">{item.ounces} oz</div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white/80">{item.category_name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white/60 font-mono text-sm">{item.sku || '-'}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-white/80">{item.location_name}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-lg font-semibold text-white">{item.qty_on_hand}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {onAdjustStock && (
                          <button
                            onClick={() => onAdjustStock(item)}
                            className="p-2 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border border-blue-500/25 transition-colors"
                            title="Ajustar Stock"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        )}
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                            title="Ver detalles"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {filteredStock.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {filteredStock.reduce((sum, item) => sum + item.qty_on_hand, 0)}
              </div>
              <div className="text-white/60 text-sm">Total Unidades</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {filteredStock.filter(item => item.qty_on_hand > 20).length}
              </div>
              <div className="text-white/60 text-sm">Stock Normal</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {filteredStock.filter(item => item.qty_on_hand > 5 && item.qty_on_hand <= 20).length}
              </div>
              <div className="text-white/60 text-sm">Stock Bajo</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-400">
                {filteredStock.filter(item => item.qty_on_hand <= 5).length}
              </div>
              <div className="text-white/60 text-sm">Stock Crítico</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
