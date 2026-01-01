'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Flavor } from '@/types/flavors';

interface FlavorFormProps {
  initialData?: Flavor | null;
  onSubmit: (data: { name: string }) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  mode: 'create' | 'edit';
}

export default function FlavorForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false, 
  mode 
}: FlavorFormProps) {
  const [formData, setFormData] = useState({
    name: ''
  });

  const [errors, setErrors] = useState<{ name?: string }>({});
  const [touched, setTouched] = useState<{ name: boolean }>({ name: false });

  // Ref para el input del nombre
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inicializar formulario con datos existentes
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name
      });
    }
  }, [initialData]);

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
      try {
        console.log('🔄 Guardando sabor...', formData);
        await onSubmit(formData);
        console.log('✅ Sabor guardado correctamente');
      } catch (error) {
        console.error('❌ Error al guardar sabor:', error);
        throw error;
      }
    }
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return touched[fieldName as keyof typeof touched] ? errors[fieldName as keyof typeof errors] : undefined;
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">
          {mode === 'create' ? 'Crear Nuevo Sabor' : 'Editar Sabor'}
        </h2>
        <p className="text-white/70">
          {mode === 'create' 
            ? 'Completa los datos del sabor que deseas agregar' 
            : 'Modifica los datos del sabor seleccionado'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Nombre */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
            Nombre del Sabor <span className="text-red-400">*</span>
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
            placeholder="Ej: Chocolate, Vainilla, Fresa"
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

        {/* Información adicional
        <div className="bg-purple-600/20 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-purple-300 font-medium mb-1">Información</h4>
              <p className="text-purple-200/80 text-sm">
                El ID del sabor se generará automáticamente. 
                Los sabores se pueden asociar a productos después de crearlos.
              </p>
            </div>
          </div>
        </div> */}

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
                {mode === 'create' ? 'Crear Sabor' : 'Actualizar Sabor'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
