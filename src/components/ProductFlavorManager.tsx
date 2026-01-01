'use client';

import React, { useState, useEffect } from 'react';
import { Flavor } from '@/types/flavors';
import FlavorModal from './FlavorModal';
import flavorsService from '@/services/flavorsService';

interface Product {
  product_id: number;
  name: string;
}

interface ProductFlavorManagerProps {
  product: Product;
  onFlavorsChanged?: () => void;
}

export default function ProductFlavorManager({ product, onFlavorsChanged }: ProductFlavorManagerProps) {
  const [availableFlavors, setAvailableFlavors] = useState<Flavor[]>([]);
  const [productFlavors, setProductFlavors] = useState<Flavor[]>([]);
  const [showFlavorModal, setShowFlavorModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFlavors();
    loadProductFlavors();
  }, [product.product_id]);

  const loadFlavors = async () => {
    try {
      setLoading(true);
      const flavors = await flavorsService.getAllFlavors();
      setAvailableFlavors(flavors);
      console.log('✅ Sabores disponibles cargados:', flavors.length);
    } catch (error) {
      console.error('❌ Error loading flavors:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProductFlavors = async () => {
    try {
      setLoading(true);
      const flavors = await flavorsService.getProductFlavors(product.product_id);
      setProductFlavors(flavors);
      console.log('✅ Sabores del producto cargados:', flavors.length);
    } catch (error) {
      console.error('❌ Error loading product flavors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFlavorSave = async (flavorIds: number[]) => {
    try {
      console.log('🔗 Asociando sabores al producto:', product.product_id, flavorIds);
      
      setLoading(true);
      await flavorsService.associateFlavorsToProduct(product.product_id, flavorIds);
      
      // Recargar sabores del producto
      await loadProductFlavors();
      
      console.log('✅ Sabores asociados correctamente al producto');
      
      // Notificar al componente padre
      if (onFlavorsChanged) {
        onFlavorsChanged();
      }
    } catch (error) {
      console.error('❌ Error al asociar sabores:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeFlavor = async (flavorId: number) => {
    try {
      console.log('🗑️ Removiendo sabor del producto:', product.product_id, flavorId);
      
      setLoading(true);
      await flavorsService.removeFlavorFromProduct(product.product_id, flavorId);
      
      // Recargar sabores del producto
      await loadProductFlavors();
      
      console.log('✅ Sabor removido correctamente del producto');
      
      // Notificar al componente padre
      if (onFlavorsChanged) {
        onFlavorsChanged();
      }
    } catch (error) {
      console.error('❌ Error al remover sabor:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFlavorIds = (): number[] => {
    return productFlavors.map(flavor => flavor.flavor_id);
  };

  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-2">
          Gestión de Sabores
        </h3>
        <p className="text-white/70">
          Producto: <span className="font-medium">{product.name}</span>
        </p>
      </div>

      {/* Lista de sabores actuales */}
      {productFlavors.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-medium text-white">
              Sabores actuales ({productFlavors.length})
            </h4>
            <button
              onClick={() => setShowFlavorModal(true)}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Gestionar Sabores
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {productFlavors.map((flavor) => (
              <div
                key={flavor.flavor_id}
                className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600/20 border border-purple-500/30 rounded-xl text-white text-sm"
              >
                <span>{flavor.name}</span>
                <button
                  onClick={() => removeFlavor(flavor.flavor_id)}
                  disabled={loading}
                  className="text-white/70 hover:text-white transition-colors disabled:opacity-50"
                  title="Quitar sabor"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border border-white/20 border-dashed rounded-xl">
          <svg className="w-12 h-12 mx-auto text-white/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="text-white/50 text-sm mb-2">
            {loading ? 'Cargando sabores...' : 'No hay sabores asociados'}
          </p>
          <button
            onClick={() => setShowFlavorModal(true)}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 text-sm"
          >
            Agregar Sabores
          </button>
        </div>
      )}

      {/* Modal de Sabores */}
      {showFlavorModal && (
        <FlavorModal
          isOpen={showFlavorModal}
          onClose={() => setShowFlavorModal(false)}
          flavors={availableFlavors}
          productFlavors={getFlavorIds()}
          onSave={handleFlavorSave}
          loading={loading}
        />
      )}
    </div>
  );
}
