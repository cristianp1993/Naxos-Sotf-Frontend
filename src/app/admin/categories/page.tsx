'use client';

import React, { useState, useEffect } from 'react';
import { Category } from '@/types/categories';
import { categoriesService } from '@/services/categoriesService';
import CategoryForm from '@/components/CategoryForm';
import CategoryManager from '@/components/CategoryManager';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useAuth } from '@/hooks/useAuth';

export default function CategoriesPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; category: Category | null }>({
    isOpen: false,
    category: null
  });
  const [saving, setSaving] = useState(false);

  // Cargar categorías
  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesService.getAllCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error cargando categorías:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Crear categoría
  const handleCreate = async (formData: { name: string }) => {
    try {
      setSaving(true);
      await categoriesService.createCategory(formData);
      await loadCategories();
      setShowForm(false);
    } catch (err) {
      console.error('Error creando categoría:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Actualizar categoría
  const handleUpdate = async (formData: { name: string }) => {
    if (!editingCategory) return;

    try {
      setSaving(true);
      await categoriesService.updateCategory(editingCategory.category_id, formData);
      await loadCategories();
      setEditingCategory(null);
    } catch (err) {
      console.error('Error actualizando categoría:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Eliminar categoría
  const handleDelete = async (category: Category) => {
    try {
      await categoriesService.deleteCategory(category.category_id);
      await loadCategories();
      setDeleteDialog({ isOpen: false, category: null });
    } catch (err) {
      console.error('Error eliminando categoría:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar categoría');
      setDeleteDialog({ isOpen: false, category: null });
    }
  };

  // Editar categoría
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
  };

  // Cancelar edición
  const handleCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
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
              No tienes permisos suficientes para gestionar categorías.
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
              <h1 className="text-4xl font-bold text-white mb-2">Gestión de Categorías</h1>
              <p className="text-white/70">
                Administra las categorías disponibles para los productos
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Categoría
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
          {(showForm || editingCategory) && (
            <div>
              <CategoryForm
                key={editingCategory ? editingCategory.category_id : 'create'}
                initialData={editingCategory}
                onSubmit={editingCategory ? handleUpdate : handleCreate}
                onCancel={handleCancel}
                loading={saving}
                mode={editingCategory ? 'edit' : 'create'}
              />
            </div>
          )}

          {/* Lista de categorías */}
          <div>
            <CategoryManager
              categories={categories}
              loading={loading}
              onEdit={handleEdit}
              onDelete={(category: Category) => setDeleteDialog({ isOpen: true, category })}
            />
          </div>
        </div>

        {/* Dialog de confirmación para eliminar */}
        <ConfirmDialog
          isOpen={deleteDialog.isOpen}
          title="Eliminar Categoría"
          message={
            deleteDialog.category
              ? `¿Estás seguro de que deseas eliminar la categoría "${deleteDialog.category.name}"? Esta acción no se puede deshacer.`
              : ''
          }
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={() => deleteDialog.category && handleDelete(deleteDialog.category)}
          onClose={() => setDeleteDialog({ isOpen: false, category: null })}
          type="danger"
          isLoading={false}
        />

      </div>
    </div>
  );
}
