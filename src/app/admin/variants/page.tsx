'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '@/components/ConfirmDialog';
import type { Product, Variant, VariantFormData } from '@/types/products';
import { variantsService } from '@/services/variantService';
import { ProductsService } from '@/services/productsService';

const PAGE_SIZE = 10;

type ViewMode = 'list' | 'create' | 'edit';

export default function VariantsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [view, setView] = useState<ViewMode>('list');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const [editingVariantId, setEditingVariantId] = useState<number | null>(null);

  const [form, setForm] = useState<VariantFormData>({
    product_id: 0,
    variant_name: '',
    ounces: null,
    toppings: 0,
    sku: null,
    image_url: null,
    price: 0,
    is_active: true
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    variantId: number | null;
    label: string;
  }>({ isOpen: false, variantId: null, label: '' });

  const loadAll = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const [pRes, vRes] = await Promise.all([
        ProductsService.getProducts(),
        variantsService.getAll()
      ]);

      const pList = pRes?.success ? (pRes.data ?? []) : [];
      setProducts(pList);
      setVariants(vRes ?? []);

      if (Array.isArray(pList) && pList.length > 0) {
        const current = form.product_id || 0;
        const exists = current > 0 && pList.some((x) => x.product_id === current);
        if (!exists) setForm((prev) => ({ ...prev, product_id: pList[0].product_id }));
      }

      if (pRes?.success === false) setError(pRes?.message || 'Error cargando productos');
    } catch (e: any) {
      setError(e?.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredVariants = useMemo(() => {
    if (!normalizedQuery) return variants;

    return variants.filter((v: any) => {
      const vn = (v.variant_name || '').toLowerCase();
      const pn = (v.product?.name || '').toLowerCase();
      const pid = String(v.product_id ?? '');
      return vn.includes(normalizedQuery) || pn.includes(normalizedQuery) || pid.includes(normalizedQuery);
    });
  }, [variants, normalizedQuery]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredVariants.length / PAGE_SIZE)),
    [filteredVariants.length]
  );

  const paginatedVariants = useMemo(() => {
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    return filteredVariants.slice(start, end);
  }, [filteredVariants, page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  const backToList = () => {
    setView('list');
    setEditingVariantId(null);
    setError(null);
    setSuccess(null);
  };

  const openCreate = () => {
    setView('create');
    setEditingVariantId(null);
    setError(null);
    setSuccess(null);
    setForm((prev) => ({
      product_id: prev.product_id || (products[0]?.product_id ?? 0),
      variant_name: '',
      ounces: null,
      toppings: 0,
      sku: null,
      image_url: null,
      price: 0,
      is_active: true
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (v: Variant) => {
    setView('edit');
    setEditingVariantId(v.variant_id);
    setError(null);
    setSuccess(null);
    setForm({
      product_id: v.product_id,
      variant_name: v.variant_name ?? '',
      ounces: v.ounces ?? null,
      toppings: Number.isFinite(v.toppings) ? v.toppings : 0,
      sku: v.sku ?? null,
      image_url: v.image_url ?? null,
      price: Number.isFinite(v.price) ? v.price : 0,
      is_active: !!v.is_active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = (): string | null => {
    if (!form.product_id || form.product_id <= 0) return 'Selecciona un producto.';
    if (!form.variant_name?.trim()) return 'El nombre de la variante es obligatorio.';
    const price = Number(form.price ?? 0);
    if (!Number.isFinite(price) || price < 0) return 'El precio debe ser un número mayor o igual a 0.';
    if (form.ounces !== null && form.ounces !== undefined && String(form.ounces).trim() !== '') {
      const oz = Number(form.ounces);
      if (!Number.isInteger(oz) || oz <= 0) return 'Ounces debe ser un entero positivo o vacío.';
    }
    const tops = Number(form.toppings ?? 0);
    if (!Number.isInteger(tops) || tops < 0) return 'Toppings debe ser un entero 0 o mayor.';
    if (form.image_url && String(form.image_url).trim() && !/^https?:\/\/.+/i.test(String(form.image_url).trim())) {
      return 'Image URL debe ser una URL válida o vacío.';
    }
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validation = validateForm();
    if (validation) {
      setError(validation);
      return;
    }

    const payload: VariantFormData = {
      product_id: Number(form.product_id),
      variant_name: String(form.variant_name).trim(),
      ounces:
        form.ounces === null || form.ounces === undefined || String(form.ounces).trim() === ''
          ? null
          : Number(form.ounces),
      toppings: Number(form.toppings ?? 0),
      sku: form.sku && String(form.sku).trim() ? String(form.sku).trim() : null,
      image_url: form.image_url && String(form.image_url).trim() ? String(form.image_url).trim() : null,
      price: Number(form.price ?? 0),
      is_active: !!form.is_active
    };

    try {
      setSubmitting(true);

      if (view === 'create') {
        await variantsService.create(payload);
        setSuccess('Variante creada exitosamente.');
      } else {
        if (!editingVariantId) throw new Error('ID de variante inválido');
        await variantsService.update(editingVariantId, payload);
        setSuccess('Variante actualizada exitosamente.');
      }

      await loadAll();
      backToList();
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar la variante');
    } finally {
      setSubmitting(false);
    }
  };

  const requestDelete = (v: any) => {
    const productName = v.product?.name || `Producto #${v.product_id}`;
    setConfirmDialog({
      isOpen: true,
      variantId: v.variant_id,
      label: `${v.variant_name} (${productName})`
    });
  };

  const confirmDelete = async () => {
    if (!confirmDialog.variantId) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      await variantsService.remove(confirmDialog.variantId);

      setSuccess('Variante eliminada exitosamente.');
      setConfirmDialog({ isOpen: false, variantId: null, label: '' });

      await loadAll();
      setView('list');
    } catch (e: any) {
      setError(e?.message || 'No se pudo eliminar la variante');
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '0.00');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Variantes</h1>
            <p className="text-white/70">Gestión de variantes por producto</p>
          </div>

          {view === 'list' ? (
            <button
              onClick={openCreate}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200"
            >
              Crear Variante
            </button>
          ) : (
            <button
              onClick={backToList}
              className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-all duration-200 border border-white/20"
            >
              Volver a la tabla
            </button>
          )}
        </div>

        {(error || success) && (
          <div
            className={`backdrop-blur-lg rounded-2xl p-4 border ${
              error ? 'bg-red-500/20 border-red-500/30' : 'bg-green-500/20 border-green-500/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <svg className={`w-5 h-5 ${error ? 'text-red-300' : 'text-green-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={error ? 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'} />
              </svg>
              <p className={`${error ? 'text-red-200' : 'text-green-200'}`}>{error || success}</p>
              <button onClick={() => { setError(null); setSuccess(null); }} className={`ml-auto ${error ? 'text-red-300 hover:text-red-200' : 'text-green-300 hover:text-green-200'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {view !== 'list' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{view === 'create' ? 'Crear variante' : 'Editar variante'}</h2>
              {view === 'edit' && <span className="text-white/70 text-sm">ID: {editingVariantId}</span>}
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-white/80 mb-2 font-medium">Producto</label>
                  <select
                    value={form.product_id || 0}
                    onChange={(e) => setForm((prev) => ({ ...prev, product_id: Number(e.target.value) }))}
                    disabled={loading || submitting}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value={0} className="text-black">
                      {loading ? 'Cargando...' : '-- Selecciona un producto --'}
                    </option>
                    {products.map((p) => (
                      <option key={p.product_id} value={p.product_id} className="text-black">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Nombre de variante *</label>
                  <input
                    value={form.variant_name ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, variant_name: e.target.value }))}
                    disabled={loading || submitting}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: 12oz / Grande / Botella..."
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Precio *</label>
                  <input
                    value={String(form.price ?? 0)}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    inputMode="decimal"
                    disabled={loading || submitting}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Ounces</label>
                  <input
                    value={form.ounces === null || form.ounces === undefined ? '' : String(form.ounces)}
                    onChange={(e) => setForm((prev) => ({ ...prev, ounces: e.target.value.trim() === '' ? null : Number(e.target.value) }))}
                    inputMode="numeric"
                    disabled={loading || submitting}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ej: 12"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">Toppings</label>
                  <input
                    value={String(form.toppings ?? 0)}
                    onChange={(e) => setForm((prev) => ({ ...prev, toppings: e.target.value === '' ? 0 : Number(e.target.value) }))}
                    inputMode="numeric"
                    disabled={loading || submitting}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-white/80 mb-2 font-medium">SKU</label>
                  <input
                    value={form.sku ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                    disabled={loading || submitting}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Opcional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-white/80 mb-2 font-medium">Image URL</label>
                  <input
                    value={form.image_url ?? ''}
                    onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                    disabled={loading || submitting}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="inline-flex items-center gap-3 text-white/80 font-medium">
                    <input
                      type="checkbox"
                      checked={!!form.is_active}
                      onChange={(e) => setForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                      disabled={loading || submitting}
                      className="w-5 h-5"
                    />
                    Activo
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={loading || submitting}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Guardando...' : view === 'create' ? 'Crear' : 'Actualizar'}
                </button>

                <button
                  type="button"
                  onClick={backToList}
                  disabled={loading || submitting}
                  className="px-6 py-3 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-all duration-200 border border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {view === 'list' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-white">Listado de variantes</h2>
                <p className="text-white/60 text-sm">
                  {filteredVariants.length} resultado(s) · Página {page} de {totalPages}
                </p>
              </div>

              <div className="w-full lg:w-96">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar por variante, producto o product_id..."
                  className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-4 py-3 text-white/80 font-semibold">Producto</th>
                    <th className="px-4 py-3 text-white/80 font-semibold">Variante</th>
                    <th className="px-4 py-3 text-white/80 font-semibold">Precio</th>
                    <th className="px-4 py-3 text-white/80 font-semibold">Ounces</th>
                    <th className="px-4 py-3 text-white/80 font-semibold">SKU</th>
                    <th className="px-4 py-3 text-white/80 font-semibold">Activo</th>
                    <th className="px-4 py-3 text-white/80 font-semibold text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-4 text-white/70" colSpan={7}>
                        Cargando...
                      </td>
                    </tr>
                  ) : paginatedVariants.length === 0 ? (
                    <tr>
                      <td className="px-4 py-4 text-white/70" colSpan={7}>
                        No hay variantes para mostrar.
                      </td>
                    </tr>
                  ) : (
                    paginatedVariants.map((v: any) => {
                      const productName = v.product?.name || `Producto #${v.product_id}`;
                      return (
                        <tr key={v.variant_id} className="border-t border-white/10">
                          <td className="px-4 py-3 text-white/90">{productName}</td>
                          <td className="px-4 py-3 text-white/90">{v.variant_name}</td>
                          <td className="px-4 py-3 text-white/90">${formatMoney(Number(v.price))}</td>
                          <td className="px-4 py-3 text-white/90">{v.ounces ?? '-'}</td>
                          <td className="px-4 py-3 text-white/90">{v.sku ?? '-'}</td>
                          <td className="px-4 py-3 text-white/90">{v.is_active ? 'Sí' : 'No'}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => openEdit(v)}
                                className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white border border-white/15 transition"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => requestDelete(v)}
                                className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white border border-red-500/30 transition"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              <div className="text-white/70 text-sm">
                Página <span className="text-white font-semibold">{page}</span> de{' '}
                <span className="text-white font-semibold">{totalPages}</span>
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog({ isOpen: false, variantId: null, label: '' })}
          onConfirm={confirmDelete}
          title="Eliminar Variante"
          message={`¿Estás seguro de que deseas eliminar la variante "${confirmDialog.label}"? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
          isLoading={submitting}
        />
      </div>
    </div>
  );
}
