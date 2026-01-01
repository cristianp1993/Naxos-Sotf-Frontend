'use client';

import React, { useState } from 'react';
import { Category } from '@/types/products';

interface SimpleProductFormData {
  category_id: number;
  name: string;
  description: string;
  image_url: string;
  is_active: boolean;
}

interface SimpleProductFormProps {
  categories: Category[];
  onSubmit: (data: SimpleProductFormData) => Promise<any>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
  initialData?: {
    product_id?: number;
    category_id: number;
    name: string;
    description?: string;
    image_url?: string;
    is_active: boolean;
  };
}

export default function SimpleProductForm({ 
  categories, 
  onSubmit, 
  onCancel, 
  loading = false, 
  mode,
  initialData 
}: SimpleProductFormProps) {
  const [formData, setFormData] = useState<SimpleProductFormData>({
    category_id: initialData?.category_id || 0,
    name: initialData?.name || '',
    description: initialData?.description || '',
    image_url: initialData?.image_url || '',
    is_active: initialData?.is_active ?? true
  });

  const [errors, setErrors] = useState<{[K in keyof SimpleProductFormData]?: string}>({});

  const validateField = (name: keyof SimpleProductFormData, value: any): string | undefined => {
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
    const error = validateField(name as keyof SimpleProductFormData, newValue);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos los campos
    const newErrors: {[K in keyof SimpleProductFormData]?: string} = {};
    (Object.keys(formData) as Array<keyof SimpleProductFormData>).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error al guardar producto:', error);
      throw error;
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {mode === 'create' ? 'Crear Nuevo Producto' : 'Editar Producto'}
        </h2>
        <p className="text-white/70">
          {mode === 'create' 
            ? 'Completa los datos básicos del producto' 
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
            disabled={loading}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
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
          {errors.category_id && (
            <p className="mt-2 text-sm text-red-400">{errors.category_id}</p>
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
            disabled={loading}
            placeholder="Ej: Margarita Clásica"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-400">{errors.name}</p>
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
            disabled={loading}
            rows={3}
            placeholder="Descripción opcional del producto..."
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 resize-none"
          />
          {errors.description && (
            <p className="mt-2 text-sm text-red-400">{errors.description}</p>
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
            disabled={loading}
            placeholder="https://ejemplo.com/imagen.jpg"
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
          />
          {errors.image_url && (
            <p className="mt-2 text-sm text-red-400">{errors.image_url}</p>
          )}
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
