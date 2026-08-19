'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  const [variantQuery, setVariantQuery] = useState('');
  const [showVariantOptions, setShowVariantOptions] = useState(false);
  const variantBoxRef = useRef<HTMLDivElement>(null);
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

  // Cerrar el listado de variantes al clicar fuera del selector
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (variantBoxRef.current && !variantBoxRef.current.contains(e.target as Node)) {
        setShowVariantOptions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setVariantQuery('');
    setShowVariantOptions(false);
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

  const obtenerEtiquetaVariante = (variante: ProductVariantItem) =>
    `${variante.product_name} - ${variante.variant_name}`;

  // Cuando ya hay una variante elegida se muestra el listado completo al reabrirlo
  const textoBusqueda = selectedVariantId ? '' : variantQuery.trim().toLowerCase();
  const variantesFiltradas = textoBusqueda
    ? productVariants.filter((variante) =>
        obtenerEtiquetaVariante(variante).toLowerCase().includes(textoBusqueda)
      )
    : productVariants;

  const seleccionarVariante = (variante: ProductVariantItem) => {
    setSelectedVariantId(variante.variant_id);
    setVariantQuery(obtenerEtiquetaVariante(variante));
    setShowVariantOptions(false);
  };

  const handleVariantQueryChange = (valor: string) => {
    setVariantQuery(valor);
    setSelectedVariantId(null);
    setShowVariantOptions(true);
  };

  const handleVariantKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowVariantOptions(false);
      return;
    }
    // Evita enviar el formulario y selecciona la primera coincidencia
    if (e.key === 'Enter' && showVariantOptions && variantesFiltradas.length > 0) {
      e.preventDefault();
      seleccionarVariante(variantesFiltradas[0]);
    }
  };

  const limpiarVariante = () => {
    setSelectedVariantId(null);
    setVariantQuery('');
    setShowVariantOptions(true);
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
              {/* Product/Variant Selection con buscador */}
              <div className="mb-6" ref={variantBoxRef}>
                <label className="block text-white/70 text-sm mb-2">Producto / Variante *</label>
                <div className="relative">
                  <input
                    type="text"
                    value={variantQuery}
                    onChange={(e) => handleVariantQueryChange(e.target.value)}
                    onFocus={(e) => {
                      setShowVariantOptions(true);
                      // Con una variante ya elegida se resalta el texto para reemplazarlo al escribir
                      if (selectedVariantId) e.target.select();
                    }}
                    onKeyDown={handleVariantKeyDown}
                    placeholder="Escribe para buscar un producto o variante..."
                    autoComplete="off"
                    className="w-full px-4 py-3 pr-10 bg-slate-800 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  {variantQuery ? (
                    <button
                      type="button"
                      onClick={limpiarVariante}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10"
                      aria-label="Limpiar búsqueda"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  ) : (
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
                    </svg>
                  )}

                  {showVariantOptions && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-white/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                      {variantesFiltradas.length === 0 ? (
                        <p className="px-4 py-3 text-white/60 text-sm">
                          {productVariants.length === 0
                            ? 'No se pudieron cargar los productos'
                            : 'Sin resultados para esa búsqueda'}
                        </p>
                      ) : (
                        variantesFiltradas.map((variante) => (
                          <button
                            key={variante.variant_id}
                            type="button"
                            onClick={() => seleccionarVariante(variante)}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-white/5 last:border-b-0 hover:bg-white/10 ${
                              selectedVariantId === variante.variant_id ? 'bg-purple-600/25 text-white' : 'text-white/90'
                            }`}
                          >
                            <span className="font-medium">{variante.product_name}</span>
                            <span className="text-white/50"> - {variante.variant_name}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
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
