'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category, ProductFormData } from '@/types/products';
import { ProductsService } from '@/services/productsService';
import ConfirmDialog from '@/components/ConfirmDialog';
import ProductsTable from '@/components/ProductsTable';
import ProductForm from '@/components/ProductForm';

type ViewMode = 'list' | 'create' | 'edit';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentView, setCurrentView] = useState<ViewMode>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Estados para el diálogo de confirmación
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    productId: null as number | null,
    productName: '',
    type: 'danger' as 'danger' | 'warning' | 'info'
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [productsResponse, categoriesResponse] = await Promise.all([
        ProductsService.getProducts(),
        ProductsService.getCategories()
      ]);

      if (productsResponse.success) {
        setProducts(productsResponse.data);
      } else {
        setError('Error al cargar productos');
      }

      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data);
      } else {
        setError('Error al cargar categorías');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setCurrentView('create');
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('edit');
  };

  const handleDelete = (productId: number) => {
    const product = products.find(p => p.product_id === productId);
    if (product) {
      setConfirmDialog({
        isOpen: true,
        productId,
        productName: product.name,
        type: 'danger'
      });
    }
  };

  const confirmDelete = async () => {
    if (!confirmDialog.productId) return;

    try {
      setSubmitting(true);
      await ProductsService.deleteProduct(confirmDialog.productId);
      
      // Actualizar lista local
      setProducts(prev => prev.filter(p => p.product_id !== confirmDialog.productId));
      
      setConfirmDialog({ isOpen: false, productId: null, productName: '', type: 'danger' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar producto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (formData: ProductFormData) => {
    try {
      setSubmitting(true);
      setError(null);

      if (currentView === 'create') {
        const response = await ProductsService.createProduct(formData);
        if (response.success) {
          setProducts(prev => [...prev, response.data].sort((a, b) => a.product_id - b.product_id));
          setCurrentView('list');
        } else {
          setError(response.message || 'Error al crear producto');
        }
      } else if (currentView === 'edit' && selectedProduct) {
        const response = await ProductsService.updateProduct(selectedProduct.product_id, formData);
        if (response.success) {
          setProducts(prev => prev.map(p => 
            p.product_id === selectedProduct.product_id ? response.data : p
          ));
          setCurrentView('list');
          setSelectedProduct(null);
        } else {
          setError(response.message || 'Error al actualizar producto');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedProduct(null);
    setError(null);
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, productId: null, productName: '', type: 'danger' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Productos</h1>
          <p className="text-white/70">Gestiona el catálogo de productos del menú</p>
        </div>
        
        {currentView === 'list' && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nuevo Producto
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-red-200 font-medium">Error</h3>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {currentView === 'list' && (
        <ProductsTable
          products={products}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      )}

      {currentView === 'create' && (
        <ProductForm
          categories={categories}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          loading={submitting}
          mode="create"
        />
      )}

      {currentView === 'edit' && selectedProduct && (
        <ProductForm
          initialData={selectedProduct}
          categories={categories}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          loading={submitting}
          mode="edit"
        />
      )}

      {/* Botón de volver al listado */}
      {(currentView === 'create' || currentView === 'edit') && (
        <div className="flex justify-center">
          <button
            onClick={handleCancel}
            className="inline-flex items-center px-4 py-2 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al listado
          </button>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={closeConfirmDialog}
        onConfirm={confirmDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar el producto "${confirmDialog.productName}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type={confirmDialog.type}
        isLoading={submitting}
      />
    </div>
  );
}
