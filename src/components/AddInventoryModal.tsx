'use client';

import React, { useState, useEffect } from 'react';
import { InventoryLocation, MovementData } from '@/types/inventory';
import { InventoryService } from '@/services/inventoryService';

interface AddInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  locations: InventoryLocation[];
  onSuccess: () => void;
}

interface ProductVariantItem {
  variant_id: number;
  variant_name: string;
  product_name: string;
}

export default function AddInventoryModal({
  isOpen,
  onClose,
  locations,
  onSuccess
}: AddInventoryModalProps) {
  const [productVariants, setProductVariants] = useState<ProductVariantItem[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
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

  useEffect(() => {
    if (isOpen) {
      loadProductVariants();
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

  const loadProductVariants = async () => {
    try {
      const response = await InventoryService.getAllVariants();
      const variants = (response.variants || []).map((variant) => ({
        variant_id: variant.variant_id,
        variant_name: variant.variant_name,
        product_name: variant.product?.name || 'Producto sin nombre'
      }));
      setProductVariants(variants);
    } catch (err) {
      setProductVariants([]);
    }
  };

  const resetForm = () => {
    setSelectedVariantId(null);
    setSelectedLocation(null);
    setQuantity('');
    setReason('Ingreso inicial al inventario');
    setBarcode('');
    setExpiryDate('');
    setSupplier('');
    setCost('');
    setBatchNumber('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedVariantId || !selectedLocation || !quantity) {
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

      const selectedVariant = productVariants.find(v => v.variant_id === selectedVariantId);
      const displayItemName = selectedVariant
        ? `${selectedVariant.product_name} - ${selectedVariant.variant_name}`
        : 'Producto seleccionado';

      const detailedReason = [
        `Item: ${displayItemName}`,
        reason.trim(),
        barcode && `Código: ${barcode}`,
        expiryDate && `Vence: ${expiryDate}`,
        supplier && `Proveedor: ${supplier}`,
        cost && `Costo: $${cost}`,
        batchNumber && `Lote: ${batchNumber}`
      ].filter(Boolean).join(' | ');

      const movementData: MovementData = {
        location_id: selectedLocation,
        variant_id: selectedVariantId,
        movement_type: 'PURCHASE',
        qty_change: qty,
        reason: detailedReason
      };

      await InventoryService.createMovement(movementData);

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al agregar al inventario');
    } finally {
      setLoading(false);
    }
  };

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
              {/* Product/Variant Selection */}
              <div className="mb-6">
                <label className="block text-white/70 text-sm mb-2">Producto / Variante *</label>
                <select
                  value={selectedVariantId || ''}
                  onChange={(e) => setSelectedVariantId(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="" className="bg-slate-800">Selecciona un producto/variante...</option>
                  {productVariants.map((variant) => (
                    <option key={variant.variant_id} value={variant.variant_id} className="bg-slate-800">
                      {variant.product_name} - {variant.variant_name}
                    </option>
                  ))}
                </select>
              </div>

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
                    (Array.isArray(locations) ? locations : []).filter(loc => loc.is_active).map((location) => (
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
