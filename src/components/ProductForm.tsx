'use client';

import React, { useState, useEffect } from 'react';
import { Product, Category, ProductFormData, ProductFormProps, ProductFormErrors } from '@/types/products';

export default function ProductForm({ 
  initialData, 
  categories, 
  onSubmit, 
  onCancel, 
  loading = false, 
  mode 
}: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    category_id: 0,
    name: '',
    description: '',
    image_url: '',
    is_active: true,
    flavor_ids: []
  });

  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Inicializar formulario con datos existentes
  useEffect(() => {
    if (initialData) {
      setFormData({
        category_id: initialData.category_id,
        name: initialData.name,
        description: initialData.description || '',
        image_url: initialData.image_url || '',
        is_active: initialData.is_active,
        flavor_ids: initialData.flavors?.map(f => f.flavor_id) || []
      });
    }
  }, [initialData]);

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'category_id':
        if (!value || value === 0) {
          return 'La categoría es obligatoria';
        }
        break;
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'El nombre debe tener al menos 2 caracteres';
        }
        if (value.trim().length > 200) {
          return 'El nombre no puede exceder 200 caracteres';
        }
        break;
      case 'description':
        if (value && value.length > 1000) {
          return 'La descripción no puede exceder 1000 caracteres';
        }
        break;
      case 'image_url':
        if (value && !isValidUrl(value)) {
          return 'Debe ser una URL válida';
        }
        break;
    }
    return undefined;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    const newValue = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : type === 'number' 
        ? parseInt(value) || 0
        : value;

    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Validación en tiempo real
    const error = validateField(name, newValue);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    const error = validateField(name, formData[name as keyof ProductFormData]);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ProductFormErrors = {};
    
    Object.keys(formData).forEach(key => {
      if (key !== 'flavor_ids') { // Los sabores son opcionales
        const error = validateField(key, formData[key as keyof ProductFormData]);
        if (error) {
          newErrors[key as keyof ProductFormErrors] = error;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      try {
        console.log('🔄 Guardando producto...', formData);
        await onSubmit(formData);
        console.log('✅ Producto guardado correctamente');
      } catch (error) {
        console.error('❌ Error al guardar producto:', error);
        throw error;
      }
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return touched[fieldName] ? errors[fieldName as keyof ProductFormErrors] : undefined;
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {mode === 'create' ? 'Crear Nuevo Producto' : 'Editar Producto'}
        </h2>
        <p className="text-white/70">
          {mode === 'create' 
            ? 'Completa los datos del producto que deseas agregar' 
            : 'Modifica los datos del producto seleccionado'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Categoría */}
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-white mb-2">
            Categoría <span className="text-red-400">*</span>
          </label>
          <select
            id="category_id"
            name="category_id"
            value={formData.category_id}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={loading}
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-200 ${
              getFieldError('category_id') 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-white/20 focus:ring-purple-500 focus:border-transparent'
            }`}
          >
            <option value={0} disabled className="bg-gray-800 text-white">
              Seleccionar categoría
            </option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id} className="bg-gray-800 text-white">
                {category.name}
              </option>
            ))}
          </select>
          {getFieldError('category_id') && (
            <p className="mt-2 text-sm text-red-400">{getFieldError('category_id')}</p>
          )}
        </div>

        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
            Nombre del Producto <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={loading}
            placeholder="Ej: Margarita Clásica"
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-200 ${
              getFieldError('name') 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-white/20 focus:ring-purple-500 focus:border-transparent'
            }`}
          />
          {getFieldError('name') && (
            <p className="mt-2 text-sm text-red-400">{getFieldError('name')}</p>
          )}
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={loading}
            rows={3}
            placeholder="Descripción opcional del producto..."
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
              getFieldError('description') 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-white/20 focus:ring-purple-500 focus:border-transparent'
            }`}
          />
          {getFieldError('description') && (
            <p className="mt-2 text-sm text-red-400">{getFieldError('description')}</p>
          )}
        </div>

        {/* URL de Imagen */}
        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-white mb-2">
            URL de Imagen
          </label>
          <input
            type="url"
            id="image_url"
            name="image_url"
            value={formData.image_url}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={loading}
            placeholder="https://ejemplo.com/imagen.jpg"
            className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-200 ${
              getFieldError('image_url') 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-white/20 focus:ring-purple-500 focus:border-transparent'
            }`}
          />
          {getFieldError('image_url') && (
            <p className="mt-2 text-sm text-red-400">{getFieldError('image_url')}</p>
          )}
        </div>

        {/* Nota sobre Sabores */}
        <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-purple-300 font-medium mb-1">Gestión de Sabores</h4>
              <p className="text-purple-200/80 text-sm">
                Los sabores se gestionan por separado después de crear el producto. 
                Puedes asociar sabores disponibles una vez que el producto esté creado.
              </p>
            </div>
          </div>
        </div>

        {/* Estado activo */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
            disabled={loading}
            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-white/20 rounded bg-white/5"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-white">
            Producto activo (visible en el menú)
          </label>
        </div>

        {/* Botones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {mode === 'create' ? 'Crear Producto' : 'Actualizar Producto'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
