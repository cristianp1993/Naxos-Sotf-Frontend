'use client';

import React, { useEffect, useState } from 'react';
import { InventoryStock, InventoryLocation } from '@/types/inventory';
import { InventoryService } from '@/services/inventoryService';
import InventoryTable from '@/components/InventoryTable';
import StockAdjustmentModal from '@/components/StockAdjustmentModal';
import AddInventoryModal from '@/components/AddInventoryModal';

export default function InventoryPage() {
  const [stock, setStock] = useState<InventoryStock[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stockAdjustmentItem, setStockAdjustmentItem] = useState<InventoryStock | null>(null);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedLocation !== undefined) {
      loadStockByLocation(selectedLocation);
    } else {
      loadAllStock();
    }
  }, [selectedLocation]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [locationsResponse] = await Promise.all([
        InventoryService.getLocations()
      ]);

      if (!locationsResponse.success) {
        setError(locationsResponse.message || 'Error al cargar ubicaciones');
        setLocations([]);
      } else {
        setLocations(locationsResponse.data);
      }

      await loadAllStock();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const loadAllStock = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get stock from all active locations
      const activeLocations = locations.filter(loc => loc.is_active);
      const stockPromises = activeLocations.map(location => 
        InventoryService.getStockByLocation(location.location_id)
      );

      const responses = await Promise.all(stockPromises);
      const allStock = responses.flatMap(response => 
        response.success ? response.data : []
      );

      setStock(allStock);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const loadStockByLocation = async (locationId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await InventoryService.getStockByLocation(locationId);
      
      if (!response.success) {
        setError(response.message || 'Error al cargar inventario');
        setStock([]);
      } else {
        setStock(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = (item: InventoryStock) => {
    setStockAdjustmentItem(item);
    setShowStockModal(true);
  };

  const handleStockAdjustmentSuccess = () => {
    if (selectedLocation !== undefined) {
      loadStockByLocation(selectedLocation);
    } else {
      loadAllStock();
    }
  };

  const handleCloseStockModal = () => {
    setShowStockModal(false);
    setStockAdjustmentItem(null);
  };

  const handleAddInventory = () => {
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleAddInventorySuccess = () => {
    if (selectedLocation !== undefined) {
      loadStockByLocation(selectedLocation);
    } else {
      loadAllStock();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Inventario</h1>
              <p className="text-white/70">Gestiona el stock de productos por ubicación</p>
            </div>
            
            <button
              onClick={handleAddInventory}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar al Inventario
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="text-red-200 font-medium">Error</h3>
                    <p className="text-red-300 text-sm">{error}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setError(null)} 
                  className="text-red-400 hover:text-red-300"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Inventory Table */}
          <InventoryTable
            stock={stock}
            locations={locations}
            loading={loading}
            onAdjustStock={handleAdjustStock}
            selectedLocation={selectedLocation}
            onLocationChange={(locationId) => setSelectedLocation(locationId || undefined)}
          />

          {/* Quick Stats */}
          {!loading && stock.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total Productos</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {new Set(stock.map(item => item.product_id)).size}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Total Unidades</p>
                    <p className="text-3xl font-bold text-white mt-1">
                      {stock.reduce((sum, item) => sum + item.qty_on_hand, 0)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">Stock Crítico</p>
                    <p className="text-3xl font-bold text-red-400 mt-1">
                      {stock.filter(item => item.qty_on_hand <= 5).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && stock.length === 0 && !error && (
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
              <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No hay inventario</h3>
              <p className="text-white/60 mb-6">
                {selectedLocation 
                  ? 'No hay productos registrados en esta ubicación'
                  : 'No hay productos registrados en el inventario'
                }
              </p>
              {selectedLocation && (
                <button
                  onClick={() => setSelectedLocation(undefined)}
                  className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
                >
                  Ver todas las ubicaciones
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stock Adjustment Modal */}
        <StockAdjustmentModal
          isOpen={showStockModal}
          onClose={handleCloseStockModal}
          stockItem={stockAdjustmentItem}
          locations={locations}
          onSuccess={handleStockAdjustmentSuccess}
        />

        {/* Add Inventory Modal */}
        <AddInventoryModal
          isOpen={showAddModal}
          onClose={handleCloseAddModal}
          locations={locations}
          onSuccess={handleAddInventorySuccess}
        />
      </div>
    </div>
  );
}
