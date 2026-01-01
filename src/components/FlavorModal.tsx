'use client';

import React, { useState, useEffect } from 'react';
import { Flavor, FlavorFormData, FlavorModalProps } from '@/types/flavors';
import flavorsService from '@/services/flavorsService';

const FlavorModal: React.FC<FlavorModalProps> = ({
  isOpen,
  onClose,
  flavors,
  productFlavors,
  onSave,
  loading = false
}) => {
  const [localFlavors, setLocalFlavors] = useState<Flavor[]>(flavors);
  const [selectedFlavorIds, setSelectedFlavorIds] = useState<number[]>(productFlavors);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<Flavor | null>(null);
  const [formData, setFormData] = useState<FlavorFormData>({ name: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setLocalFlavors(flavors);
    setSelectedFlavorIds(productFlavors);
  }, [flavors, productFlavors]);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setShowCreateForm(false);
      setEditingFlavor(null);
      setFormData({ name: '' });
      setFormErrors({});
      setSearchTerm('');
    }
  }, [isOpen]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'El nombre del sabor es obligatorio';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'El nombre debe tener al menos 2 caracteres';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'El nombre no puede exceder 100 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateFlavor = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const newFlavor = await flavorsService.createFlavor(formData);
      setLocalFlavors(prev => [...prev, newFlavor].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData({ name: '' });
      setShowCreateForm(false);
    } catch (error: any) {
      setFormErrors({ name: error.message || 'Error al crear el sabor' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFlavor = async () => {
    if (!editingFlavor || !validateForm()) return;

    setIsLoading(true);
    try {
      const updatedFlavor = await flavorsService.updateFlavor(editingFlavor.flavor_id, formData);
      setLocalFlavors(prev => 
        prev.map(f => f.flavor_id === editingFlavor.flavor_id ? updatedFlavor : f)
            .sort((a, b) => a.name.localeCompare(b.name))
      );
      setFormData({ name: '' });
      setEditingFlavor(null);
    } catch (error: any) {
      setFormErrors({ name: error.message || 'Error al actualizar el sabor' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFlavor = async (flavorId: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este sabor?')) return;

    setIsLoading(true);
    try {
      await flavorsService.deleteFlavor(flavorId);
      setLocalFlavors(prev => prev.filter(f => f.flavor_id !== flavorId));
      setSelectedFlavorIds(prev => prev.filter(id => id !== flavorId));
    } catch (error: any) {
      alert('Error al eliminar el sabor: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (flavor: Flavor) => {
    setEditingFlavor(flavor);
    setFormData({ name: flavor.name });
    setFormErrors({});
  };

  const cancelEdit = () => {
    setEditingFlavor(null);
    setFormData({ name: '' });
    setFormErrors({});
  };

  const handleFlavorToggle = (flavorId: number) => {
    setSelectedFlavorIds(prev => 
      prev.includes(flavorId) 
        ? prev.filter(id => id !== flavorId)
        : [...prev, flavorId]
    );
  };

  const handleSave = () => {
    onSave(selectedFlavorIds);
    onClose();
  };

  const filteredFlavors = localFlavors.filter(flavor =>
    flavor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Gestionar Sabores</h2>
              <p className="text-purple-100">Crear, editar y asociar sabores a productos</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Search and Create */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Buscar sabores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Sabor
            </button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Crear Nuevo Sabor
              </h3>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Nombre del sabor..."
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateFlavor}
                    disabled={isLoading}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Creando...' : 'Crear'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ name: '' });
                      setFormErrors({});
                    }}
                    disabled={isLoading}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-xl font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
              {formErrors.name && (
                <p className="mt-2 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
          )}

          {/* Flavors List */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              Sabores Disponibles ({filteredFlavors.length})
            </h3>
            
            {filteredFlavors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p>No se encontraron sabores</p>
              </div>
            ) : (
              filteredFlavors.map((flavor) => (
                <div
                  key={flavor.flavor_id}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-200 ${
                    selectedFlavorIds.includes(flavor.flavor_id)
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedFlavorIds.includes(flavor.flavor_id)}
                        onChange={() => handleFlavorToggle(flavor.flavor_id)}
                        className="w-5 h-5 text-purple-600 bg-white border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                      />
                    </label>
                    
                    <div className="flex-1">
                      {editingFlavor?.flavor_id === flavor.flavor_id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ name: e.target.value })}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            onClick={handleUpdateFlavor}
                            disabled={isLoading}
                            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                          >
                            {isLoading ? '...' : 'Guardar'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={isLoading}
                            className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-medium text-gray-800">{flavor.name}</h4>
                          <p className="text-sm text-gray-500">
                            ID: {flavor.flavor_id}
                          </p>
                        </div>
                      )}
                      {formErrors.name && editingFlavor?.flavor_id === flavor.flavor_id && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                      )}
                    </div>
                  </div>
                  
                  {editingFlavor?.flavor_id !== flavor.flavor_id && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(flavor)}
                        disabled={isLoading}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Editar sabor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteFlavor(flavor.flavor_id)}
                        disabled={isLoading}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                        title="Eliminar sabor"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || loading}
            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlavorModal;
