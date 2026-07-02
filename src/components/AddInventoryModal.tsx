'use client';

import React, { useState, useEffect } from 'react';
import { InventoryLocation, StockUpdateData, MovementData } from '@/types/inventory';
import { InventoryService } from '@/services/inventoryService';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: InventoryLocation[];
  onSuccess: () => void;
}

interface InventoryItem {
  id: string;
  name: string;
  type: 'predefined' | 'custom';
  sku?: string;
  description?: string;
}

export default function AddInventoryModal({
  isOpen,
  onClose,
  locations,
  onSuccess
}: AddInventoryModalProps) {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [customItemName, setCustomItemName] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null);
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('Ingreso inicial al inventario');
  const [barcode, setBarcode] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [supplier, setSupplier] = useState('');
  const [cost, setCost] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCustomItem, setUseCustomItem] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInventoryItems();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body);
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${window.scrollY}px`;
    document.body.style.width = '100%';
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(window.getComputedStyle(document.body).top || '0') * -1);
    };
  }, [isOpen]);

  const loadInventoryItems = () => {
    // Insumos comunes para un negocio de bebidas/negocio
    const predefinedItems: InventoryItem[] = [
      { id: 'plastic-8oz', name: 'Plástico 8 oz', type: 'predefined', description: 'Vasos plásticos de 8 onzas' },
      { id: 'plastic-10oz', name: 'Plástico 10 oz', type: 'predefined', description: 'Vasos plásticos de 10 onzas' },
      { id: 'plastic-16oz', name: 'Plástico 16 oz', type: 'predefined', description: 'Vasos plásticos de 16 onzas' },
      { id: 'plastic-24oz', name: 'Plástico 24 oz', type: 'predefined', description: 'Vasos plásticos de 24 onzas' },
      { id: 'bolsas-dulces', name: 'Bolsas de Dulces', type: 'predefined', description: 'Bolsas pequeñas para dulces' },
      { id: 'bolsas-liquidos', name: 'Bolsas de Líquidos', type: 'predefined', description: 'Bolsas para bebidas líquidas' },
      { id: 'latas-cerveza', name: 'Latas de Cerveza', type: 'predefined', description: 'Latas vacías de cerveza' },
      { id: 'tapas-plastic', name: 'Tapas de Plástico', type: 'predefined', description: 'Tapas para vasos plásticos' },
      { id: 'popotes', name: 'Popotes/Pajillas', type: 'predefined', description: 'Popotes de plástico' },
      { id: 'servilletas', name: 'Servilletas', type: 'predefined', description: 'Servilletas de papel' },
      { id: 'hielo', name: 'Hielo', type: 'predefined', description: 'Hielo en bolsa' },
      { id: 'limpieza', name: 'Productos de Limpieza', type: 'predefined', description: 'Artículos de limpieza' }
    ];
    
    setInventoryItems(predefinedItems);
  };

  const resetForm = () => {
    setSelectedItem(null);
    setCustomItemName('');
    setSelectedLocation(null);
    setQuantity('');
    setReason('Ingreso inicial al inventario');
    setBarcode('');
    setExpiryDate('');
    setSupplier('');
    setCost('');
    setBatchNumber('');
    setError(null);
    setUseCustomItem(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemName = useCustomItem ? customItemName.trim() : selectedItem;
    if (!itemName || !selectedLocation || !quantity) {
      setError('Debe completar todos los campos obligatorios');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('La cantidad debe ser un número mayor a 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Para inventario de insumos, usamos variant_id = 0 (genérico) y guardamos el nombre en el reason
      const detailedReason = [
        `Item: ${itemName}`,
        reason.trim(),
        barcode && `Código: ${barcode}`,
        expiryDate && `Vence: ${expiryDate}`,
        supplier && `Proveedor: ${supplier}`,
        cost && `Costo: $${cost}`,
        batchNumber && `Lote: ${batchNumber}`
      ].filter(Boolean).join(' | ');

      // Usamos variant_id = 999999 para items de inventario genéricos
      await InventoryService.updateStock({
        location_id: selectedLocation,
        variant_id: 999999,
        qty_on_hand: qty
      });

      await InventoryService.createMovement({
        location_id: selectedLocation,
        variant_id: 999999,
        movement_type: 'PURCHASE',
        qty_change: qty,
        reason: detailedReason
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar al inventario');
    } finally {
      setLoading(false);
    }
  };

  const selectedItemData = inventoryItems.find(item => item.id === selectedItem);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-8 p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/20 bg-slate-900/80 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="text-white text-lg font-semibold">Agregar al Inventario</h3>
            <p className="text-white/50 text-sm">Registra nuevos productos en el stock</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white/80"
            aria-label="Cerrar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
              {/* Item Type Selection */}
              <div className="mb-6">
                <label className="block text-white/70 text-sm mb-2">Tipo de Item</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomItem(false);
                      setSelectedItem(null);
                    }}
                    className={`p-3 rounded-xl border transition-all ${
                      !useCustomItem
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium">Item Predefinido</div>
                    <div className="text-xs opacity-70">Seleccionar de lista</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomItem(true);
                      setSelectedItem(null);
                    }}
                    className={`p-3 rounded-xl border transition-all ${
                      useCustomItem
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="font-medium">Item Personalizado</div>
                    <div className="text-xs opacity-70">Escribir nombre</div>
                  </button>
                </div>
              </div>

              {/* Item Selection */}
              {!useCustomItem ? (
                <div className="mb-6">
                  <label className="block text-white/70 text-sm mb-2">Item del Inventario *</label>
                  <select
                    value={selectedItem || ''}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="" className="bg-slate-800">Selecciona un item...</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id} className="bg-slate-800">
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mb-6">
                  <label className="block text-white/70 text-sm mb-2">Nombre del Item *</label>
                  <input
                    type="text"
                    value={customItemName}
                    onChange={(e) => setCustomItemName(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: Vasos de vidrio 12oz"
                    required
                  />
                </div>
              )}

              {/* Selected Item Info */}
              {selectedItemData && !useCustomItem && (
                <div className="bg-white/5 rounded-xl p-4 mb-6">
                  <div className="text-white/60 text-sm mb-1">Descripción</div>
                  <div className="text-white font-medium">{selectedItemData.description}</div>
                </div>
              )}

              {/* Location Selection */}
              <div className="mb-6">
                <label className="block text-white/70 text-sm mb-2">Ubicación *</label>
                <select
                  value={selectedLocation || ''}
                  onChange={(e) => setSelectedLocation(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="" className="bg-slate-800">Selecciona una ubicación...</option>
                  {locations.length === 0 ? (
                    <option value="1" className="bg-slate-800">Bodega Principal</option>
                  ) : (
                    locations.filter(loc => loc.is_active).map((location) => (
                      <option key={location.location_id} value={location.location_id} className="bg-slate-800">
                        {location.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-white/70 text-sm mb-2">Cantidad *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="0.000"
                  required
                />
              </div>

              {/* Additional Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Barcode */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Código de Barras</label>
                  <input
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="1234567890123"
                  />
                </div>

                {/* Expiry Date */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Supplier */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Proveedor</label>
                  <input
                    type="text"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Nombre del proveedor"
                  />
                </div>

                {/* Cost */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">Costo Unitario</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Batch Number */}
                <div className="md:col-span-2">
                  <label className="block text-white/70 text-sm mb-2">Número de Lote</label>
                  <input
                    type="text"
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Lote-2024-001"
                  />
                </div>
              </div>

              {/* Reason */}
              <div className="mb-6">
                <label className="block text-white/70 text-sm mb-2">Motivo *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                  placeholder="Especifique el motivo del ingreso..."
                  required
                />
              </div>

              {/* Error */}
              {error && (
                <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium disabled:opacity-50"
                >
                  {loading ? 'Agregando...' : 'Agregar al Inventario'}
                </button>
              </div>
        </form>
      </div>
    </div>
  );
}
