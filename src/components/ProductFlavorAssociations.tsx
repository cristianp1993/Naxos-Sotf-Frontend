'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Product } from '@/types/products';
import { Flavor } from '@/types/flavors';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ProductsService } from '@/services/productsService';
import { flavorsService } from '@/services/flavorsService';
import { productFlavorsService } from '@/services/productFlavorsService';

// -------------------- Types --------------------
interface ProductFlavorAssociation {
  key: string; // `${product_id}-${flavor_id}`
  product_flavor_id: number;
  product_id: number;
  flavor_id: number;
  is_active: boolean;
  product: Product;
  flavor: Flavor;
}

interface ProductFlavorAssociationsProps {
  onAssociationChanged?: () => void;
}

// -------------------- Small Helpers --------------------
function makeKey(product_id: number, flavor_id: number) {
  return `${product_id}-${flavor_id}`;
}

function clsx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

// -------------------- Toast (no libs) --------------------
type ToastType = 'success' | 'error' | 'info';

type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
};

function ToastViewport({
  toasts,
  onDismiss
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  const typeStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          border: 'border-green-500/30',
          bg: 'bg-green-500/15',
          title: 'text-green-200',
          msg: 'text-green-200/80',
          dot: 'bg-green-400'
        };
      case 'error':
        return {
          border: 'border-red-500/30',
          bg: 'bg-red-500/15',
          title: 'text-red-200',
          msg: 'text-red-200/80',
          dot: 'bg-red-400'
        };
      case 'info':
      default:
        return {
          border: 'border-white/20',
          bg: 'bg-white/10',
          title: 'text-white',
          msg: 'text-white/70',
          dot: 'bg-purple-400'
        };
    }
  };

  return (
    <div className="fixed z-[60] top-4 right-4 flex flex-col gap-3 w-[min(420px,calc(100vw-2rem))]">
      {toasts.map((t) => {
        const s = typeStyles(t.type);
        return (
          <div
            key={t.id}
            className={clsx(
              'rounded-2xl border shadow-2xl backdrop-blur-lg',
              'p-4',
              s.border,
              s.bg
            )}
          >
            <div className="flex items-start gap-3">
              <span className={clsx('mt-1 w-2.5 h-2.5 rounded-full', s.dot)} />
              <div className="flex-1">
                {t.title && <div className={clsx('font-semibold', s.title)}>{t.title}</div>}
                <div className={clsx('text-sm leading-relaxed', s.msg)}>{t.message}</div>
              </div>
              <button
                onClick={() => onDismiss(t.id)}
                className="p-2 rounded-xl hover:bg-white/10 text-white/80"
                aria-label="Cerrar notificación"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// -------------------- UI Bits --------------------
function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border',
        active
          ? 'bg-green-500/15 text-green-200 border-green-500/30'
          : 'bg-yellow-500/15 text-yellow-200 border-yellow-500/30'
      )}
    >
      <span className={clsx('w-2 h-2 rounded-full', active ? 'bg-green-400' : 'bg-yellow-400')} />
      {active ? 'Activa' : 'Inactiva'}
    </span>
  );
}

function ModalShell({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-white/20 bg-slate-900/80 shadow-2xl">
          <div className="p-5 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-white text-lg font-semibold">{title}</h3>
              <p className="text-white/50 text-sm">Configura producto ↔ sabor y su estado.</p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-white/80"
              aria-label="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

// -------------------- Component --------------------
export default function ProductFlavorAssociations({ onAssociationChanged }: ProductFlavorAssociationsProps) {
  const [associations, setAssociations] = useState<ProductFlavorAssociation[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [flavors, setFlavors] = useState<Flavor[]>([]);

  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // create form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    flavor_id: '',
    is_active: true
  });

  // filters
  const [search, setSearch] = useState('');
  const [filterProductId, setFilterProductId] = useState<string>('');

  // confirm delete
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    association: ProductFlavorAssociation | null;
  }>({ isOpen: false, association: null });

  // toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastTimers = useRef<Record<string, number>>({});

  const pushToast = (t: Omit<ToastItem, 'id'>, ttlMs = 3500) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const toast: ToastItem = { id, ...t };
    setToasts((prev) => [toast, ...prev].slice(0, 4)); // max 4 visibles
    const timer = window.setTimeout(() => dismissToast(id), ttlMs);
    toastTimers.current[id] = timer;
  };

  const dismissToast = (id: string) => {
    const timer = toastTimers.current[id];
    if (timer) window.clearTimeout(timer);
    delete toastTimers.current[id];
    setToasts((prev) => prev.filter((x) => x.id !== id));
  };

  useEffect(() => {
    return () => {
      // cleanup timers
      Object.values(toastTimers.current).forEach((t) => window.clearTimeout(t));
      toastTimers.current = {};
    };
  }, []);

  // -------------------- Loaders --------------------
  useEffect(() => {
    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialData = async () => {
    setError(null);
    setBooting(true);
    try {
      setLoading(true);

      const [productsRes, flavorsRes] = await Promise.all([
        ProductsService.getProducts(),
        flavorsService.getAllFlavors()
      ]);

      const allProducts: Product[] = productsRes?.data || [];
      const allFlavors: Flavor[] = Array.isArray(flavorsRes) ? flavorsRes : [];

      setProducts(allProducts);
      setFlavors(allFlavors);

      const assocApi = await productFlavorsService.getAllAssociations();

      const assocList: ProductFlavorAssociation[] = assocApi.map((a) => ({
        key: makeKey(a.product_id, a.flavor_id),
        product_flavor_id: a.product_flavor_id,
        product_id: a.product_id,
        flavor_id: a.flavor_id,
        is_active: a.is_active,
        product: a.product,
        flavor: a.flavor
      }));

      setAssociations(assocList);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Error cargando datos';
      setError(msg);
      pushToast({ type: 'error', title: 'Error', message: msg }, 5000);
    } finally {
      setLoading(false);
      setBooting(false);
    }
  };

  const refreshAssociationsOnly = async () => {
    try {
      setLoading(true);
      setError(null);

      const assocApi = await productFlavorsService.getAllAssociations();

      const assocList: ProductFlavorAssociation[] = assocApi.map((a) => ({
        key: makeKey(a.product_id, a.flavor_id),
        product_flavor_id: a.product_flavor_id,
        product_id: a.product_id,
        flavor_id: a.flavor_id,
        is_active: a.is_active,
        product: a.product,
        flavor: a.flavor
      }));

      setAssociations(assocList);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Error actualizando asociaciones';
      setError(msg);
      pushToast({ type: 'error', title: 'Error', message: msg }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Actions --------------------
  const resetForm = () => {
    setFormData({ product_id: '', flavor_id: '', is_active: true });
  };

  const createOrUpdateAssociation = async () => {
    if (!formData.product_id || !formData.flavor_id) {
      const msg = 'Selecciona un producto y un sabor.';
      setError(msg);
      pushToast({ type: 'info', title: 'Faltan datos', message: msg });
      return;
    }

    const product_id = Number(formData.product_id);
    const flavor_id = Number(formData.flavor_id);

    try {
      setLoading(true);
      setError(null);

      const existing = associations.find(
        (x) => x.product_id === product_id && x.flavor_id === flavor_id
      );

      if (existing) {
        await productFlavorsService.updateAssociation(existing.product_flavor_id, {
          is_active: formData.is_active
        });

        pushToast({
          type: 'success',
          title: 'Actualizado',
          message: `Se actualizó el estado de "${existing.product.name}" ↔ "${existing.flavor.name}".`
        });
      } else {
        // Si tu backend tiene restricción unique (product_id, flavor_id), esto es lo correcto
        const created = await productFlavorsService.createAssociation({
          product_id,
          flavor_id,
          is_active: formData.is_active
        });

        pushToast({
          type: 'success',
          title: 'Guardado',
          message: `Se creó la asociación "${created.product.name}" ↔ "${created.flavor.name}".`
        });
      }

      setShowCreateForm(false);
      resetForm();

      await refreshAssociationsOnly();
      onAssociationChanged?.();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Error guardando la asociación';
      setError(msg);
      pushToast({ type: 'error', title: 'No se pudo guardar', message: msg }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (assoc: ProductFlavorAssociation, newStatus: boolean) => {
    try {
      setLoading(true);
      setError(null);

      await productFlavorsService.updateAssociation(assoc.product_flavor_id, {
        is_active: newStatus
      });

      pushToast({
        type: 'success',
        title: 'Estado actualizado',
        message: `"${assoc.product.name}" ↔ "${assoc.flavor.name}" ahora está ${newStatus ? 'activa' : 'inactiva'}.`
      });

      await refreshAssociationsOnly();
      onAssociationChanged?.();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Error cambiando estado';
      setError(msg);
      pushToast({ type: 'error', title: 'No se pudo actualizar', message: msg }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const deleteAssociation = async (assoc: ProductFlavorAssociation) => {
    try {
      setLoading(true);
      setError(null);

      await productFlavorsService.deleteAssociation(assoc.product_flavor_id);

      setConfirmDelete({ isOpen: false, association: null });

      pushToast({
        type: 'success',
        title: 'Eliminado',
        message: `Se eliminó "${assoc.product.name}" ↔ "${assoc.flavor.name}".`
      });

      await refreshAssociationsOnly();
      onAssociationChanged?.();
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Error eliminando asociación';
      setError(msg);
      pushToast({ type: 'error', title: 'No se pudo eliminar', message: msg }, 5000);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Derived UI --------------------
  const filtered = useMemo(() => {
    let list = associations;

    if (filterProductId) {
      const pid = Number(filterProductId);
      list = list.filter((a) => a.product_id === pid);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) => a.product.name.toLowerCase().includes(q) || a.flavor.name.toLowerCase().includes(q)
      );
    }

    // active first, then product, then flavor
    return [...list].sort((a, b) => {
      if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
      const pn = a.product.name.localeCompare(b.product.name, 'es');
      if (pn !== 0) return pn;
      return a.flavor.name.localeCompare(b.flavor.name, 'es');
    });
  }, [associations, filterProductId, search]);

  const active = filtered.filter((a) => a.is_active);
  const inactive = filtered.filter((a) => !a.is_active);

  // -------------------- Render --------------------
  return (
    <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      {/* Toasts */}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Asociar Sabores a Productos</h2>
          <p className="text-white/70">Crea asociaciones y cambia su estado (se guarda en base de datos).</p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Asociación
        </button>
      </div>

      {/* Error banner (opcional, además del toast) */}
      {error && (
        <div className="mb-6 bg-red-500/20 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-red-400 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por producto o sabor..."
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />

        <select
          value={filterProductId}
          onChange={(e) => setFilterProductId(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="" className="bg-slate-800">
            Todos los productos
          </option>
          {products.map((p) => (
            <option key={p.product_id} value={p.product_id} className="bg-slate-800">
              {p.name}
            </option>
          ))}
        </select>

        <button
          onClick={refreshAssociationsOnly}
          disabled={loading}
          className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {/* Empty / Loading */}
      {booting ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70">Cargando productos, sabores y asociaciones...</p>
        </div>
      ) : associations.length === 0 ? (
        <div className="text-center py-12 border border-white/20 border-dashed rounded-xl">
          <p className="text-white/60 text-lg mb-2">No hay asociaciones</p>
          <p className="text-white/40 text-sm mb-4">Crea la primera asociación producto ↔ sabor.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-medium transition-all duration-200"
          >
            Crear Primera Asociación
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full" />
                Activas ({active.length})
              </h3>
              <span className="text-white/50 text-sm">Mostrando {filtered.length} (filtro aplicado)</span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-white/5">
                    <tr className="text-white/70 text-sm">
                      <th className="px-4 py-3 font-semibold">Producto</th>
                      <th className="px-4 py-3 font-semibold">Sabor</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10">
                    {active.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-white/50">
                          No hay asociaciones activas con los filtros actuales.
                        </td>
                      </tr>
                    ) : (
                      active.map((a) => (
                        <tr key={a.key} className="hover:bg-white/[0.04]">
                          <td className="px-4 py-3">
                            <div className="text-white font-medium">{a.product.name}</div>
                            <div className="text-white/40 text-xs">ID: {a.product_id}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-white font-medium">{a.flavor.name}</div>
                            <div className="text-white/40 text-xs">ID: {a.flavor_id}</div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill active={a.is_active} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                disabled={loading}
                                onClick={() => toggleStatus(a, false)}
                                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm disabled:opacity-50"
                                title="Desactivar"
                              >
                                Desactivar
                              </button>

                              <button
                                disabled={loading}
                                onClick={() => setConfirmDelete({ isOpen: true, association: a })}
                                className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-500/25 disabled:opacity-50"
                                title="Eliminar"
                                aria-label="Eliminar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m3-3h4a1 1 0 011 1v2H9V5a1 1 0 011-1z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Inactive */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <span className="w-3 h-3 bg-yellow-400 rounded-full" />
                Inactivas ({inactive.length})
              </h3>
              
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-white/5">
                    <tr className="text-white/70 text-sm">
                      <th className="px-4 py-3 font-semibold">Producto</th>
                      <th className="px-4 py-3 font-semibold">Sabor</th>
                      <th className="px-4 py-3 font-semibold">Estado</th>
                      <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-white/10">
                    {inactive.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-6 text-center text-white/50">
                          No hay asociaciones inactivas con los filtros actuales.
                        </td>
                      </tr>
                    ) : (
                      inactive.map((a) => (
                        <tr key={a.key} className="hover:bg-white/[0.04]">
                          <td className="px-4 py-3">
                            <div className="text-white font-medium">{a.product.name}</div>
                            <div className="text-white/40 text-xs">ID: {a.product_id}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-white font-medium">{a.flavor.name}</div>
                            <div className="text-white/40 text-xs">ID: {a.flavor_id}</div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusPill active={a.is_active} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                disabled={loading}
                                onClick={() => toggleStatus(a, true)}
                                className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm disabled:opacity-50"
                                title="Activar"
                              >
                                Activar
                              </button>

                              <button
                                disabled={loading}
                                onClick={() => setConfirmDelete({ isOpen: true, association: a })}
                                className="p-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-200 border border-red-500/25 disabled:opacity-50"
                                title="Eliminar"
                                aria-label="Eliminar"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0H7m3-3h4a1 1 0 011 1v2H9V5a1 1 0 011-1z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Create/Update Modal */}
      <ModalShell
        open={showCreateForm}
        title="Nueva Asociación"
        onClose={() => {
          if (!loading) {
            setShowCreateForm(false);
            setError(null);
            resetForm();
          }
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Producto</label>
            <select
              value={formData.product_id}
              onChange={(e) => setFormData((s) => ({ ...s, product_id: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="" className="bg-slate-800">
                Selecciona un producto...
              </option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id} className="bg-slate-800">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Sabor</label>
            <select
              value={formData.flavor_id}
              onChange={(e) => setFormData((s) => ({ ...s, flavor_id: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="" className="bg-slate-800">
                Selecciona un sabor...
              </option>
              {flavors.map((f) => (
                <option key={f.flavor_id} value={f.flavor_id} className="bg-slate-800">
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-3 text-white/80">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData((s) => ({ ...s, is_active: e.target.checked }))}
                className="w-5 h-5 rounded border-white/30 bg-white/10"
              />
              <span>
                Guardar como <span className="font-semibold">{formData.is_active ? 'Activa' : 'Inactiva'}</span>
              </span>
            </label>
            <p className="text-white/45 text-sm mt-1">
              Si la asociación ya existe, se actualizará su estado.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
          <button
            disabled={loading}
            onClick={() => {
              setShowCreateForm(false);
              setError(null);
              resetForm();
            }}
            className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            disabled={loading}
            onClick={createOrUpdateAssociation}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </ModalShell>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={confirmDelete.isOpen}
        title="Eliminar asociación"
        message={
          confirmDelete.association
            ? `¿Seguro que quieres eliminar la asociación "${confirmDelete.association.product.name}" ↔ "${confirmDelete.association.flavor.name}"?`
            : '¿Seguro que quieres eliminar esta asociación?'
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
        isLoading={loading}
        onConfirm={() => {
          if (confirmDelete.association) deleteAssociation(confirmDelete.association);
        }}
        onClose={() => setConfirmDelete({ isOpen: false, association: null })}
      />
    </div>
  );
}
