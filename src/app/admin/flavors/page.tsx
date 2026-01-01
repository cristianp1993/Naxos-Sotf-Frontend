'use client';

import React, { useState, useEffect } from 'react';
import { Flavor } from '@/types/flavors';
import { flavorsService } from '@/services/flavorsService';
import FlavorForm from '@/components/FlavorForm';
import FlavorManager from '@/components/FlavorManager';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';

export default function FlavorsPage() {
  const { user } = useAuth();
  const [flavors, setFlavors] = useState<Flavor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingFlavor, setEditingFlavor] = useState<Flavor | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; flavor: Flavor | null }>({
    isOpen: false,
    flavor: null
  });
  const [saving, setSaving] = useState(false);

  // Cargar sabores
  const loadFlavors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await flavorsService.getAllFlavors();
      setFlavors(data);
    } catch (err) {
      console.error('Error cargando sabores:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar sabores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlavors();
  }, []);

  // Crear sabor
  const handleCreate = async (formData: { name: string }) => {
    try {
      setSaving(true);
      await flavorsService.createFlavor(formData);
      await loadFlavors();
      setShowForm(false);
    } catch (err) {
      console.error('Error creando sabor:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Actualizar sabor
  const handleUpdate = async (formData: { name: string }) => {
    if (!editingFlavor) return;
    
    try {
      setSaving(true);
      await flavorsService.updateFlavor(editingFlavor.flavor_id, formData);
      await loadFlavors();
      setEditingFlavor(null);
    } catch (err) {
      console.error('Error actualizando sabor:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Eliminar sabor
  const handleDelete = async (flavor: Flavor) => {
    try {
      await flavorsService.deleteFlavor(flavor.flavor_id);
      await loadFlavors();
      setDeleteDialog({ isOpen: false, flavor: null });
    } catch (err) {
      console.error('Error eliminando sabor:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar sabor');
    }
  };

  // Editar sabor
  const handleEdit = (flavor: Flavor) => {
    setEditingFlavor(flavor);
  };

  // Cancelar edición
  const handleCancel = () => {
    setShowForm(false);
    setEditingFlavor(null);
  };

  // Verificar permisos
  if (!user || (user.role !== 'ADMIN')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <svg className="w-16 h-16 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h2>
            <p className="text-white/70">
              No tienes permisos suficientes para gestionar sabores.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Gestión de Sabores</h1>
              <p className="text-white/70">
                Administra los sabores disponibles para los productos
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Sabor
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulario */}
          {(showForm || editingFlavor) && (
            <div>
              <FlavorForm
                initialData={editingFlavor}
                onSubmit={editingFlavor ? handleUpdate : handleCreate}
                onCancel={handleCancel}
                loading={saving}
                mode={editingFlavor ? 'edit' : 'create'}
              />
            </div>
          )}

          {/* Lista de sabores */}
          <div>
           <FlavorManager
            flavors={flavors}
            loading={loading}
            onEdit={handleEdit}
            onDelete={(flavor: Flavor) => setDeleteDialog({ isOpen: true, flavor })}
          />
          </div>
        </div>

        {/* Dialog de confirmación para eliminar */}
        <ConfirmDialog
  isOpen={deleteDialog.isOpen}
  title="Eliminar Sabor"
  message={
    deleteDialog.flavor
      ? `¿Estás seguro de que deseas eliminar el sabor "${deleteDialog.flavor.name}"? Esta acción no se puede deshacer.`
      : ''
  }
  confirmText="Eliminar"
  cancelText="Cancelar"
  onConfirm={() => deleteDialog.flavor && handleDelete(deleteDialog.flavor)}
  onClose={() => setDeleteDialog({ isOpen: false, flavor: null })}
  type="danger"
  isLoading={false}
/>

      </div>
    </div>
  );
}
