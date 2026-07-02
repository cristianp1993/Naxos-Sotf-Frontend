'use client';

import React, { useState, useEffect } from 'react';
import { InventoryStock, InventoryLocation, StockUpdateData, MovementData } from '@/types/inventory';
import { InventoryService } from '@/services/inventoryService';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: InventoryStock | null;
  locations: InventoryLocation[];
  onSuccess: () => void;
}

export default function StockAdjustmentModal({
  isOpen,
  onClose,
  stockItem,
  locations,
  onSuccess
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'set' | 'add' | 'remove'>('set');
  const [newQuantity, setNewQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (stockItem) {
      setNewQuantity(stockItem.qty_on_hand.toString());
      setReason('');
      setAdjustmentType('set');
      setError(null);
    }
  }, [stockItem]);

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  if (!isOpen || !stockItem) return null;

  const calculateFinalQuantity = () => {
    const currentQty = stockItem.qty_on_hand;
    const adjustmentQty = parseFloat(newQuantity) || 0;

    switch (adjustmentType) {
      case 'set':
        return adjustmentQty;
      case 'add':
        return currentQty + adjustmentQty;
      case 'remove':
        return Math.max(0, currentQty - adjustmentQty);
      default:
        return currentQty;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newQuantity || parseFloat(newQuantity) < 0) {
      setError('La cantidad debe ser un número válido y mayor o igual a 0');
      return;
    }

    if (adjustmentType !== 'set' && !reason.trim()) {
      setError('Debe especificar un motivo para el ajuste');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const finalQuantity = calculateFinalQuantity();

      // Update stock
      await InventoryService.updateStock({
        location_id: stockItem.location_id,
        variant_id: stockItem.variant_id,
        qty_on_hand: finalQuantity
      });

      // Create movement record if it's not a direct set operation
      if (adjustmentType !== 'set') {
        const movementType = adjustmentType === 'add' ? 'PURCHASE' : 'ADJUSTMENT';
        const qtyChange = adjustmentType === 'add' ? parseFloat(newQuantity) : -parseFloat(newQuantity);

        await InventoryService.createMovement({
          location_id: stockItem.location_id,
          variant_id: stockItem.variant_id,
          movement_type: movementType,
          qty_change: qtyChange,
          reason: reason.trim()
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al ajustar el stock');
    } finally {
      setLoading(false);
    }
  };

  const finalQuantity = calculateFinalQuantity();
  const difference = finalQuantity - stockItem.qty_on_hand;

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
            <h3 className="text-white text-lg font-semibold">Ajustar Stock</h3>
            <p className="text-white/50 text-sm">
              {stockItem.product_name} - {stockItem.variant_name}
            </p>
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
          {/* Current Stock Info */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-white/60 text-sm">Stock Actual</div>
                <div className="text-2xl font-bold text-white">{stockItem.qty_on_hand}</div>
              </div>
              <div>
                <div className="text-white/60 text-sm">Ubicación</div>
                <div className="text-lg font-semibold text-white">{stockItem.location_name}</div>
              </div>
            </div>
          </div>

          {/* Adjustment Type */}
          <div className="mb-6">
            <label className="block text-white/70 text-sm mb-3">Tipo de Ajuste</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setAdjustmentType('set')}
                className={`p-3 rounded-xl border transition-all ${
                  adjustmentType === 'set'
                    ? 'bg-purple-600 border-purple-500 text-white'
                    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="font-medium">Establecer</div>
                <div className="text-xs opacity-70">Definir cantidad exacta</div>
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`p-3 rounded-xl border transition-all ${
                  adjustmentType === 'add'
                    ? 'bg-green-600 border-green-500 text-white'
                    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="font-medium">Agregar</div>
                <div className="text-xs opacity-70">Sumar al stock actual</div>
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('remove')}
                className={`p-3 rounded-xl border transition-all ${
                  adjustmentType === 'remove'
                    ? 'bg-red-600 border-red-500 text-white'
                    : 'bg-white/5 border-white/20 text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="font-medium">Quitar</div>
                <div className="text-xs opacity-70">Restar al stock actual</div>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="mb-6">
            <label className="block text-white/70 text-sm mb-2">
              {adjustmentType === 'set' ? 'Nueva Cantidad' : 'Cantidad a ' + (adjustmentType === 'add' ? 'Agregar' : 'Quitar')}
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={newQuantity}
              onChange={(e) => setNewQuantity(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="0.000"
              required
            />
          </div>

          {/* Reason */}
          {adjustmentType !== 'set' && (
            <div className="mb-6">
              <label className="block text-white/70 text-sm mb-2">Motivo del Ajuste</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
                placeholder="Especifique el motivo del ajuste..."
                required
              />
            </div>
          )}

          {/* Preview */}
          <div className="bg-white/5 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/60 text-sm mb-1">Stock Final</div>
                <div className={`text-2xl font-bold ${
                  difference > 0 ? 'text-green-400' : difference < 0 ? 'text-red-400' : 'text-white'
                }`}>
                  {finalQuantity}
                </div>
              </div>
              {difference !== 0 && (
                <div className="text-right">
                  <div className="text-white/60 text-sm mb-1">Diferencia</div>
                  <div className={`text-lg font-semibold ${
                    difference > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {difference > 0 ? '+' : ''}{difference}
                  </div>
                </div>
              )}
            </div>
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
              {loading ? 'Procesando...' : 'Confirmar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
