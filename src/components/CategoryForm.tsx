'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Category } from '@/types/categories';

interface CategoryFormProps {
  initialData?: Category | null;
  onSubmit: (data: { name: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

export default function CategoryForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode
}: CategoryFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name ?? ''
  });

  const [errors, setErrors] = useState<{ name?: string }>({});
  const [touched, setTouched] = useState<{ name: boolean }>({ name: false });

  // Ref para el input del nombre
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus cuando se cambia a modo edición
  useEffect(() => {
    if (mode === 'edit' && nameInputRef.current) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select(); // Seleccionar el texto para facilitar la edición
      }, 100);
    }
  }, [mode, initialData]);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value || value.trim().length < 2) {
          return 'El nombre debe tener al menos 2 caracteres';
        }
        if (value.trim().length > 100) {
          return 'El nombre no puede exceder 100 caracteres';
        }
        break;
    }
    return undefined;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validación en tiempo real
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));

    const error = validateField(name, formData[name as keyof typeof formData]);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { name?: string } = {};

    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key as keyof typeof newErrors] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      await onSubmit(formData);
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return touched[fieldName as keyof typeof touched] ? errors[fieldName as keyof typeof errors] : undefined;
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {mode === 'create' ? 'Crear Nueva Categoría' : 'Editar Categoría'}
        </h2>
        <p className="text-white/70">
          {mode === 'create'
            ? 'Completa los datos de la categoría que deseas agregar'
            : 'Modifica los datos de la categoría seleccionada'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
            Nombre de la Categoría <span className="text-red-400">*</span>
          </label>
          <input
            ref={nameInputRef}
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={loading}
            placeholder="Ej: Bebidas, Snacks, Postres"
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
                {mode === 'create' ? 'Crear Categoría' : 'Actualizar Categoría'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
