'use client';

import React, { useEffect, useMemo, useState } from 'react';
import type { Category, Product, ProductFormData, Variant, VariantFormData } from '@/types/products';
import CollapsibleSection from '@/components/CollapsibleSection';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type Mode = 'create' | 'edit';

interface Props {
  initialData?: Product;
  categories: Category[];
  onSubmit: (data: ProductFormData) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
  mode: Mode;
}

export default function ProductFormCollapsible({
  initialData,
  categories,
  onSubmit,
  onCancel,
  loading = false,
  mode
}: Props) {
  const productId = initialData?.product_id ?? 0;

  const [sectionsOpen, setSectionsOpen] = useState({
    product: true,
    variants: mode === 'edit'
  });

  const toggleSection = (k: keyof typeof sectionsOpen) => {
    setSectionsOpen((p) => ({ ...p, [k]: !p[k] }));
  };

  const [formData, setFormData] = useState<ProductFormData>({
    category_id: 0,
    name: '',
    description: '',
    image_url: '',
    is_active: true,
    flavor_ids: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [variantSubmitting, setVariantSubmitting] = useState(false);
  const [variantError, setVariantError] = useState<string | null>(null);
  const [variantSuccess, setVariantSuccess] = useState<string | null>(null);

  const [variantForm, setVariantForm] = useState<VariantFormData>({
    product_id: productId,
    variant_name: '',
    ounces: null,
    toppings: 0,
    sku: null,
    image_url: null,
    price: 0,
    is_active: true
  });

  const selectedCategoryName = useMemo(() => {
    const c = categories.find((x) => x.category_id === formData.category_id);
    return c?.name ?? '';
  }, [categories, formData.category_id]);

  const isValidUrl = (value: string): boolean => {
    if (!value) return true;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!initialData) return;

    setFormData({
      category_id: initialData.category_id,
      name: initialData.name,
      description: initialData.description || '',
      image_url: initialData.image_url || '',
      is_active: initialData.is_active,
      flavor_ids: initialData.flavors?.map((f) => f.flavor_id) || []
    });

    setVariantForm((p) => ({ ...p, product_id: initialData.product_id }));

    if (mode === 'edit') {
      fetchVariants(initialData.product_id);
    }
  }, [initialData, mode]);

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'category_id':
        if (!value || value === 0) return 'La categoría es obligatoria';
        break;
      case 'name':
        if (!value || value.trim().length < 2) return 'El nombre debe tener al menos 2 caracteres';
        if (value.trim().length > 200) return 'El nombre no puede exceder 200 caracteres';
        break;
      case 'description':
        if (value && value.length > 1000) return 'La descripción no puede exceder 1000 caracteres';
        break;
      case 'image_url':
        if (value && !isValidUrl(value)) return 'Debe ser una URL válida';
        break;
    }
    return undefined;
  };

  const getFieldError = (fieldName: string): string | undefined => {
    return touched[fieldName] ? errors[fieldName] : undefined;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((p) => ({ ...p, [name]: name === 'category_id' ? Number(newValue) : newValue }));
    const err = validateField(name, name === 'category_id' ? Number(newValue) : newValue);
    setErrors((p) => ({ ...p, [name]: err || '' }));
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    const err = validateField(name, (formData as any)[name]);
    setErrors((p) => ({ ...p, [name]: err || '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    (['category_id', 'name', 'description', 'image_url'] as const).forEach((key) => {
      const err = validateField(key, (formData as any)[key]);
      if (err) newErrors[key] = err;
    });
    setErrors(newErrors);
    setTouched((p) => ({
      ...p,
      category_id: true,
      name: true,
      description: true,
      image_url: true
    }));
    return Object.keys(newErrors).length === 0;
  };

  async function fetchVariants(pid: number) {
    setLoadingVariants(true);
    setVariantError(null);

    try {
      const res = await fetch(`${API_URL}/variants/product/${pid}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Error cargando variantes (${res.status})`);
      const data = await res.json();
      const list: Variant[] = data?.variants ?? data?.data ?? [];
      setVariants(list);
    } catch (e: any) {
      setVariantError(e?.message || 'No se pudieron cargar las variantes');
      setVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  }

  const resetVariantForm = () => {
    setVariantForm({
      product_id: productId,
      variant_name: '',
      ounces: null,
      toppings: 0,
      sku: null,
      image_url: null,
      price: 0,
      is_active: true
    });
  };

  const handleVariantInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setVariantForm((p) => ({ ...p, [name]: checked }));
      return;
    }

    if (name === 'toppings') {
      const v = value.trim() === '' ? 0 : Number(value);
      setVariantForm((p) => ({ ...p, toppings: Number.isFinite(v) ? v : 0 }));
      return;
    }

    if (name === 'ounces') {
      const v = value.trim() === '' ? null : Number(value);
      setVariantForm((p) => ({ ...p, ounces: value.trim() === '' ? null : v }));
      return;
    }

    if (name === 'price') {
      const v = value.trim() === '' ? 0 : Number(value);
      setVariantForm((p) => ({ ...p, price: Number.isFinite(v) ? v : 0 }));
      return;
    }

    setVariantForm((p) => ({ ...p, [name]: value }));
  };

  const handleVariantCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVariantForm((p) => ({ ...p, is_active: e.target.checked }));
  };

  const handleCreateVariant = async () => {
    setVariantError(null);
    setVariantSuccess(null);

    if (mode !== 'edit' || !productId) {
      setVariantError('Guarda el producto primero para agregar variantes.');
      return;
    }

    if (!variantForm.variant_name?.trim()) {
      setVariantError('El nombre de la variante es obligatorio.');
      return;
    }

    const payload: VariantFormData = {
      product_id: productId,
      variant_name: variantForm.variant_name.trim(),
      ounces: variantForm.ounces ?? null,
      toppings: variantForm.toppings ?? 0,
      sku: (variantForm.sku ?? '').toString().trim() || null,
      image_url: (variantForm.image_url ?? '').toString().trim() || null,
      price: typeof variantForm.price === 'number' ? variantForm.price : Number(variantForm.price ?? 0),
      is_active: variantForm.is_active ?? true
    };

    if (typeof payload.ounces === 'number' && (!Number.isInteger(payload.ounces) || payload.ounces <= 0)) {
      setVariantError('Ounces debe ser un entero positivo o vacío.');
      return;
    }

    if (typeof payload.toppings === 'number' && (!Number.isFinite(payload.toppings) || payload.toppings < 0)) {
      setVariantError('Toppings debe ser 0 o mayor.');
      return;
    }

    if (typeof payload.price !== 'number' || !Number.isFinite(payload.price) || payload.price < 0) {
      setVariantError('El precio debe ser un número mayor o igual a 0.');
      return;
    }

    if (payload.image_url && !isValidUrl(payload.image_url)) {
      setVariantError('Image URL debe ser una URL válida.');
      return;
    }

    try {
      setVariantSubmitting(true);

      const res = await fetch(`${API_URL}/variants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Error creando variante (${res.status})`);

      setVariantSuccess('Variante creada exitosamente.');
      resetVariantForm();
      await fetchVariants(productId);
    } catch (e: any) {
      setVariantError(e?.message || 'No se pudo crear la variante');
    } finally {
      setVariantSubmitting(false);
    }
  };

  const handleDeleteVariant = async (variantId: number) => {
    if (mode !== 'edit' || !productId) return;

    setVariantError(null);
    setVariantSuccess(null);

    try {
      setVariantSubmitting(true);

      const res = await fetch(`${API_URL}/variants/${variantId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Error eliminando variante (${res.status})`);

      setVariantSuccess('Variante eliminada exitosamente.');
      await fetchVariants(productId);
    } catch (e: any) {
      setVariantError(e?.message || 'No se pudo eliminar la variante');
    } finally {
      setVariantSubmitting(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVariantError(null);
    setVariantSuccess(null);

    if (!validateForm()) return;

    await onSubmit(formData);
    if (mode === 'create') {
      setSectionsOpen((p) => ({ ...p, variants: true }));
    }
  };

  const hasProductData = !!(formData.name && formData.category_id);
  const hasVariants = variants.length > 0;

  return (
    <div className="space-y-6">
      {variantError && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
          <p className="text-red-300 text-sm">{variantError}</p>
        </div>
      )}

      {variantSuccess && (
        <div className="bg-green-500/20 border border-green-500/50 rounded-xl p-4">
          <p className="text-green-300 text-sm">{variantSuccess}</p>
        </div>
      )}

      <form onSubmit={handleProductSubmit} className="space-y-6">
        <CollapsibleSection
          title="Producto Principal"
          isOpen={sectionsOpen.product}
          onToggle={() => toggleSection('product')}
          hasData={hasProductData}
          isRequired={true}
          description={selectedCategoryName ? `Categoría: ${selectedCategoryName}` : 'Información básica del producto'}
          badgeText={mode === 'edit' ? 'Edición' : 'Creación'}
        >
          <div className="space-y-6">
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
                placeholder="Ej: Cerveza"
                className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 transition-all duration-200 ${
                  getFieldError('name')
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-white/20 focus:ring-purple-500 focus:border-transparent'
                }`}
              />
              {getFieldError('name') && <p className="mt-2 text-sm text-red-400">{getFieldError('name')}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                Descripción
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={loading}
                rows={3}
                placeholder="Descripción opcional..."
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

            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-white mb-2">
                Image URL
              </label>
              <input
                type="text"
                id="image_url"
                name="image_url"
                value={formData.image_url || ''}
                onChange={handleInputChange}
                onBlur={handleBlur}
                disabled={loading}
                placeholder="https://..."
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

            <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/5 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-white">Estado</p>
                <p className="text-xs text-white/60">Activa o desactiva el producto</p>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={!!formData.is_active}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="h-5 w-5 accent-purple-600"
                />
                <span className="text-sm text-white/80">{formData.is_active ? 'Activo' : 'Inactivo'}</span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-white/20 text-white/80 hover:bg-white/5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          title="Variantes"
          isOpen={sectionsOpen.variants}
          onToggle={() => toggleSection('variants')}
          hasData={hasVariants}
          description={mode === 'edit' ? 'Crear/eliminar variantes del producto' : 'Guarda el producto para agregar variantes'}
          badgeText={hasVariants ? String(variants.length) : undefined}
        >
          <div className="space-y-6">
            <div className="rounded-xl border border-white/20 bg-white/5 p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Nombre *</label>
                  <input
                    name="variant_name"
                    value={variantForm.variant_name || ''}
                    onChange={handleVariantInputChange}
                    disabled={mode !== 'edit' || !productId || variantSubmitting}
                    placeholder="Ej: Latón"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Precio</label>
                  <input
                    name="price"
                    value={String(variantForm.price ?? 0)}
                    onChange={handleVariantInputChange}
                    disabled={mode !== 'edit' || !productId || variantSubmitting}
                    inputMode="decimal"
                    placeholder="Ej: 10"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Ounces</label>
                  <input
                    name="ounces"
                    value={variantForm.ounces === null || variantForm.ounces === undefined ? '' : String(variantForm.ounces)}
                    onChange={handleVariantInputChange}
                    disabled={mode !== 'edit' || !productId || variantSubmitting}
                    inputMode="numeric"
                    placeholder="Ej: 16"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Toppings</label>
                  <input
                    name="toppings"
                    value={String(variantForm.toppings ?? 0)}
                    onChange={handleVariantInputChange}
                    disabled={mode !== 'edit' || !productId || variantSubmitting}
                    inputMode="numeric"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">SKU</label>
                  <input
                    name="sku"
                    value={(variantForm.sku ?? '') as any}
                    onChange={handleVariantInputChange}
                    disabled={mode !== 'edit' || !productId || variantSubmitting}
                    placeholder="Ej: CERV-LATON-16"
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Image URL</label>
                  <input
                    name="image_url"
                    value={(variantForm.image_url ?? '') as any}
                    onChange={handleVariantInputChange}
                    disabled={mode !== 'edit' || !productId || variantSubmitting}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/5 px-4 py-3 md:col-span-2">
                  <div>
                    <p className="text-sm font-medium text-white">Estado</p>
                    <p className="text-xs text-white/60">Activa o desactiva la variante</p>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!variantForm.is_active}
                      onChange={handleVariantCheckboxChange}
                      disabled={mode !== 'edit' || !productId || variantSubmitting}
                      className="h-5 w-5 accent-purple-600"
                    />
                    <span className="text-sm text-white/80">{variantForm.is_active ? 'Activo' : 'Inactivo'}</span>
                  </label>
                </div>

                <div className="md:col-span-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetVariantForm}
                    disabled={mode !== 'edit' || !productId || variantSubmitting}
                    className="px-4 py-2 rounded-xl border border-white/20 text-white/80 hover:bg-white/5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Limpiar
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateVariant}
                    disabled={mode !== 'edit' || !productId || variantSubmitting}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {variantSubmitting ? 'Guardando...' : 'Crear variante'}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/20 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-semibold">Listado de variantes</p>
                  <p className="text-white/60 text-sm">{productId ? `product_id: ${productId}` : 'product_id: -'}</p>
                </div>
                {mode === 'edit' && productId ? (
                  <button
                    type="button"
                    onClick={() => fetchVariants(productId)}
                    disabled={loadingVariants}
                    className="px-3 py-2 rounded-xl border border-white/20 text-white/80 hover:bg-white/5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingVariants ? 'Actualizando...' : 'Actualizar'}
                  </button>
                ) : null}
              </div>

              <div className="mt-4">
                {mode !== 'edit' || !productId ? (
                  <p className="text-white/60">Guarda el producto para administrar variantes.</p>
                ) : loadingVariants ? (
                  <p className="text-white/60">Cargando variantes...</p>
                ) : variants.length === 0 ? (
                  <p className="text-white/60">No hay variantes registradas.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-white/70 border-b border-white/10">
                          <th className="py-2 pr-3">ID</th>
                          <th className="py-2 pr-3">Variante</th>
                          <th className="py-2 pr-3">Precio</th>
                          <th className="py-2 pr-3">Ounces</th>
                          <th className="py-2 pr-3">SKU</th>
                          <th className="py-2 pr-3">Activo</th>
                          <th className="py-2 pr-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v) => (
                          <tr key={v.variant_id} className="border-b border-white/10">
                            <td className="py-2 pr-3 text-white">{v.variant_id}</td>
                            <td className="py-2 pr-3 text-white">{v.variant_name}</td>
                            <td className="py-2 pr-3 text-white">{(v as any).price ?? 0}</td>
                            <td className="py-2 pr-3 text-white/80">{v.ounces ?? '-'}</td>
                            <td className="py-2 pr-3 text-white/80">{v.sku ?? '-'}</td>
                            <td className="py-2 pr-3 text-white/80">{v.is_active ? 'Sí' : 'No'}</td>
                            <td className="py-2 pr-3">
                              <div className="flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteVariant(v.variant_id)}
                                  disabled={variantSubmitting}
                                  className="px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CollapsibleSection>
      </form>
    </div>
  );
}
