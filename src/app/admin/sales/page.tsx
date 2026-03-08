'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { fetchMenu } from '@/services/api';
import { salesService } from '@/services/salesService';
import { loyaltyService } from '@/services/loyaltyService';
import { AuthService } from '@/services/authService';
import type { MenuData, Product, Variant } from '@/types/menu';
import type { CreateFullSalePayload } from '@/services/salesService';
import type { LoyaltySearchMember } from '@/types/loyalty';
import { useToast } from '@/components/ui/toast';
import LoyaltyCustomerSearch from '@/components/LoyaltyCustomerSearch';

type CartItem = {
  productId: number;
  productName: string;
  variantId: number;
  variantName: string;
  flavor: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  isPromo2x1?: boolean;
  promoReference?: string | null;
};

type PaymentMethodKey = 'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO';

type PaymentEntry = {
  method: PaymentMethodKey;
  amount: string; // string para el input, se convierte a number al enviar
  reference?: string | null;
};

const PAYMENT_METHODS: { key: PaymentMethodKey; icon: string; label: string }[] = [
  { key: 'EFECTIVO', icon: '💵', label: 'Efectivo' },
  { key: 'TRANSFERENCIA', icon: '📱', label: 'Transferencia' },
  { key: 'TARJETA', icon: '💳', label: 'Tarjeta' },
  { key: 'OTRO', icon: '💰', label: 'Otro' },
];

export default function SalesPage() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeStep, setActiveStep] = useState<'select' | 'payment'>('select');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [observation, setObservation] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [is2x1Promo, setIs2x1Promo] = useState<boolean>(false);
  const [promoCounter, setPromoCounter] = useState<number>(0);
  const [currentPromoReference, setCurrentPromoReference] = useState<string | null>(null);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [loyaltyMember, setLoyaltyMember] = useState<LoyaltySearchMember | null>(null);
  const toast = useToast();

  // Cargar menú
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await fetchMenu();
        setMenuData(data);
      } catch (err) {
        setError('Error al cargar la carta. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    loadMenu();
  }, []);

  // Resetear referencia de promoción cuando se desactiva el checkbox
  useEffect(() => {
    if (!is2x1Promo) {
      setCurrentPromoReference(null);
    }
  }, [is2x1Promo]);

  const getVariantsForProduct = (productId: number): Variant[] =>
    menuData?.variantes?.filter((v) => v.product_id == productId) || [];

  const getFlavorsForProduct = (productId: number): string[] => {
    const flavorData = menuData?.sabores?.find((f) => f.product_id == productId);
    return flavorData?.sabores_activos || [];
  };

  const productsByCategory = useMemo(() => {
    if (!menuData?.productos) return {};
    return menuData.productos.reduce((acc, p) => {
      const key = p.categoria || 'Otros';
      if (!acc[key]) acc[key] = [];
      acc[key].push(p);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [menuData]);

  const orderedCategories = useMemo(() => {
    const categories = Object.keys(productsByCategory);
    const priority = ['Granizados', 'granizados', 'Granizado', 'granizado'];
    return [
      ...priority.filter((c) => categories.includes(c)),
      ...categories.filter((c) => !priority.includes(c)).sort(),
    ].filter(Boolean);
  }, [productsByCategory]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Granizados: '🥤',
      granizados: '🍧',
      Sodas: '🥤',
      Cervezas: '🍺',
      Jugos: '🧃',
      Batidos: '🥤',
      Bebidas: '🍹',
      Otros: '✨',
    };
    return icons[category] || '🍹';
  };

  const getChipGradient = (category: string) => {
    const gradients: Record<string, string> = {
      Granizados: 'from-violet-500/35 via-fuchsia-500/25 to-amber-400/20',
      granizados: 'from-violet-500/35 via-fuchsia-500/25 to-amber-400/20',
      Sodas: 'from-sky-500/30 via-cyan-500/22 to-indigo-500/22',
      Cervezas: 'from-amber-500/28 via-orange-500/20 to-rose-500/20',
      Jugos: 'from-emerald-500/26 via-lime-500/20 to-teal-500/22',
      Batidos: 'from-pink-500/28 via-fuchsia-500/20 to-violet-500/22',
      Bebidas: 'from-indigo-500/28 via-violet-500/20 to-fuchsia-500/22',
      Otros: 'from-slate-400/20 via-gray-400/16 to-zinc-400/16',
    };
    return gradients[category] || 'from-violet-500/35 via-fuchsia-500/25 to-amber-400/20';
  };

  const formatRD = (value: number) => `$${Math.round(value).toLocaleString('es-DO')}`;

  // === ACCIONES ===

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedFlavor(null);
    setSelectedVariant(null);
    setQuantity('1');
  };

  const handleSelectFlavor = (flavor: string) => {
    setSelectedFlavor(flavor);
  };

  const handleSelectVariant = (variant: Variant) => {
    setSelectedVariant(variant);
  };

  const addToCart = () => {
    if (!selectedProduct || !selectedVariant) {
      toast.error('Debe seleccionar un producto y un tamaño');
      return;
    }

    // Validar si el producto tiene sabores disponibles y no se ha seleccionado uno
    const availableFlavors = getFlavorsForProduct(selectedProduct.product_id);
    if (availableFlavors.length > 0 && !selectedFlavor) {
      toast.error('Debe seleccionar un sabor para este producto');
      return;
    }

    // Validar cantidad
    const quantityNum = parseInt(quantity, 10);
    if (!quantity || quantityNum <= 0 || isNaN(quantityNum)) {
      toast.error('Debe ingresar una cantidad válida');
      return;
    }

    // Validación para promoción 2x1: mismo tamaño requerido
    if (is2x1Promo && currentPromoReference) {
      const existingPromoItems = cart.filter(item => 
        item.isPromo2x1 && item.promoReference === currentPromoReference
      );
      
      if (existingPromoItems.length > 0) {
        const firstPromoItem = existingPromoItems[0];
        if (firstPromoItem.variantId !== selectedVariant.variant_id) {
          toast.error(`❌ La promoción 2x1 debe ser del mismo tamaño. Ya tienes ${firstPromoItem.variantName} en esta promoción.`);
          return;
        }
      }
    }

    const unitPrice = Number(selectedVariant.precio_actual ?? 0);
    let lineTotal = Number((unitPrice * quantityNum).toFixed(2));
    let promoReference: string | null = null;

    // Si es promoción 2x1
    if (is2x1Promo) {
      // Crear o usar la referencia global de promoción
      if (!currentPromoReference) {
        setPromoCounter(prev => prev + 1);
        const newReference = `2x1_${Date.now()}_${promoCounter + 1}`;
        setCurrentPromoReference(newReference);
        promoReference = newReference;
      } else {
        promoReference = currentPromoReference;
      }
      
      // Calcular cuántos se pagan
      const paidQuantity = Math.ceil(quantityNum / 2);
      lineTotal = Number((unitPrice * paidQuantity).toFixed(2));
    }

    const newItem: CartItem = {
      productId: selectedProduct.product_id,
      productName: selectedProduct.name,
      variantId: selectedVariant.variant_id,
      variantName: selectedVariant.variant_name,
      flavor: selectedFlavor,
      quantity: quantityNum,
      unitPrice: is2x1Promo ? (lineTotal / quantityNum) : unitPrice,
      lineTotal,
      isPromo2x1: is2x1Promo,
      promoReference
    };

    setCart((prev) => [...prev, newItem]);
    
    // Mostrar toast de éxito con información de promoción
    const promoText = is2x1Promo ? ' (2x1)' : '';
    toast.success(`${selectedVariant.variant_name} ${selectedFlavor ? `(${selectedFlavor})` : ''}${promoText} agregado al carrito`);
    
    // Auto-scroll al carrito
    setTimeout(() => {
      const cartElement = document.getElementById('cart-summary');
      if (cartElement) {
        cartElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    
    // Reset selection
    setSelectedProduct(null);
    setSelectedFlavor(null);
    setSelectedVariant(null);
    setQuantity('1');
    // NO resetear is2x1Promo para permitir agregar múltiples items con la misma promoción
    setActiveStep('select');
  };

  const removeFromCart = (index: number) => {
    const itemToRemove = cart[index];
    
    // Verificar si se está eliminando un elemento de una promoción 2x1
    if (itemToRemove.isPromo2x1 && itemToRemove.promoReference) {
      const samePromoItems = cart.filter(item => 
        item.isPromo2x1 && 
        item.promoReference === itemToRemove.promoReference &&
        item !== itemToRemove
      );
      
      if (samePromoItems.length === 1) {
        // Quedará una promoción incompleta
        const remainingItem = samePromoItems[0];
        toast.warning(`⚠️ Eliminaste un elemento 2x1. La promoción quedará incompleta. Debes agregar otro ${remainingItem.variantName} o eliminar el elemento restante.`);
      }
    }
    
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setIs2x1Promo(false);
    setPromoCounter(0);
    setCurrentPromoReference(null);
  };

  const startNewPromo = () => {
    setCurrentPromoReference(null);
    toast.info('🎯 Nueva promoción 2x1 iniciada. Agrega productos del mismo tamaño.');
  };

  // Función para agrupar promociones 2x1 y calcular totales correctos
  const getProcessedCart = (): CartItem[] => {
    const processedItems: CartItem[] = [];
    const promoGroups: { [key: string]: CartItem[] } = {};
    
    // Agrupar items por referencia de promoción
    cart.forEach(item => {
      if (item.isPromo2x1 && item.promoReference) {
        if (!promoGroups[item.promoReference]) {
          promoGroups[item.promoReference] = [];
        }
        promoGroups[item.promoReference].push(item);
      } else {
        processedItems.push(item);
      }
    });
    
    // Procesar cada grupo de promoción 2x1
    Object.keys(promoGroups).forEach(ref => {
      const groupItems = promoGroups[ref];
      
      if (groupItems.length === 2) {
        // Es una promoción 2x1 válida: el primero con precio normal, el segundo en 0
        const firstItem = { ...groupItems[0] };
        const secondItem = { ...groupItems[1] };
        
        // El primer item mantiene su precio
        firstItem.lineTotal = firstItem.unitPrice * firstItem.quantity;
        
        // El segundo item va en $0
        secondItem.unitPrice = 0;
        secondItem.lineTotal = 0;
        
        processedItems.push(firstItem, secondItem);
      } else {
        // Si no es un par completo, todos pagan precio normal
        groupItems.forEach(item => {
          processedItems.push(item);
        });
      }
    });
    
    return processedItems;
  };

  const processedCart = getProcessedCart();
  const total = processedCart.reduce((sum, item) => sum + item.lineTotal, 0);
  // Función para generar observación automática con promociones
  const generateAutoObservation = () => {
    const promoGroups: { [key: string]: CartItem[] } = {};
    
    // Agrupar items por referencia de promoción
    cart.forEach(item => {
      if (item.isPromo2x1 && item.promoReference) {
        if (!promoGroups[item.promoReference]) {
          promoGroups[item.promoReference] = [];
        }
        promoGroups[item.promoReference].push(item);
      }
    });
    
    if (Object.keys(promoGroups).length === 0) {
      return '';
    }
    
    const promoDetails = Object.keys(promoGroups).map(ref => {
      const group = promoGroups[ref];
      const firstItem = group[0];
      return `${firstItem.variantName} 2x1 (${group.map(item => item.flavor || 'Sin sabor').join(' + ')})`;
    });
    
    return `Promo 2x1 incluida: ${promoDetails.join(', ')}`;
  };

  // Actualizar observación automáticamente cuando cambia el carrito
  useEffect(() => {
    if (!observation) { // Solo si el campo está vacío
      const autoObs = generateAutoObservation();
      if (autoObs) {
        setObservation(autoObs);
      }
    }
  }, [cart]);

  const proceedToPayment = () => {
    if (cart.length === 0) return;

    // Validar que no haya promociones 2x1 incompletas
    const promoGroups: { [key: string]: CartItem[] } = {};
    
    cart.forEach(item => {
      if (item.isPromo2x1 && item.promoReference) {
        if (!promoGroups[item.promoReference]) {
          promoGroups[item.promoReference] = [];
        }
        promoGroups[item.promoReference].push(item);
      }
    });
    
    // Verificar si alguna promoción está incompleta (solo 1 elemento)
    const incompletePromos = Object.keys(promoGroups).filter(ref => 
      promoGroups[ref].length === 1
    );
    
    if (incompletePromos.length > 0) {
      const incompleteItem = promoGroups[incompletePromos[0]][0];
      toast.error(`❌ Promoción 2x1 incompleta. Debes agregar otro ${incompleteItem.variantName} para completar la promoción o eliminar el elemento actual.`);
      return;
    }

    setActiveStep('payment');
  };

  // ── Pagos divididos ──────────────────────────────────────────────
  const totalPaid = useMemo(() =>
    payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
    [payments]
  );

  const remaining = useMemo(() => Math.round((total - totalPaid) * 100) / 100, [total, totalPaid]);

  const paymentStatus: 'incomplete' | 'exact' | 'exceeded' = useMemo(() => {
    if (Math.abs(remaining) < 1) return 'exact';
    return remaining > 0 ? 'incomplete' : 'exceeded';
  }, [remaining]);

  const addPaymentMethod = useCallback((method: PaymentMethodKey) => {
    const currentRemaining = total - payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const prefill = payments.length === 0 ? total : Math.max(0, Math.round(currentRemaining));
    setPayments(prev => [...prev, { method, amount: prefill > 0 ? String(prefill) : '', reference: null }]);
  }, [payments, total]);

  const updatePaymentAmount = useCallback((index: number, amount: string) => {
    setPayments(prev => prev.map((p, i) => i === index ? { ...p, amount } : p));
  }, []);

  const removePayment = useCallback((index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const goBackToSelection = () => {
    setActiveStep('select');
    setSubmitting(false);
  };

  const getFlavorIdByName = (flavorName: string, productId: number): number | null => {
    if (!flavorName || !productId) return null;
    
    const flavorData = menuData?.sabores?.find((f) => f.product_id == productId);
    if (!flavorData) return null;
    
    //console.log('🔍 DEBUG - Flavor data completo para producto', productId, ':', JSON.stringify(flavorData, null, 2));
    //console.log('🔍 DEBUG - Buscando sabor:', flavorName);
    
    // Buscar el sabor en el array de sabores_activos
    const flavorIndex = flavorData.sabores_activos?.indexOf(flavorName);
    const result = flavorIndex !== undefined && flavorIndex >= 0 ? flavorIndex + 1 : null; // +1 porque los IDs empiezan en 1
    
    //console.log('🔍 DEBUG - Flavor ID encontrado:', result);
    return result;
  };

  const handleSubmitSale = async () => {
    if (cart.length === 0 || submitting || payments.length === 0 || paymentStatus !== 'exact') return;

    setSubmitting(true);
    try {
      const payload: CreateFullSalePayload = {
        location_id: 1,
        observation: observation.trim() || null,
        items: processedCart.map((item) => ({
          variant_id: item.variantId,
          flavor_name: item.flavor || null,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          is_promo_2x1: item.isPromo2x1 || false,
          promo_reference: item.promoReference || null
        })),
        payments: payments.map(p => ({
          method: p.method,
          amount: parseFloat(p.amount) || 0,
          reference: p.method === 'TRANSFERENCIA' ? 'Referencia pendiente' : null,
        })),
      };

      const saleResult = await salesService.createFullSale(payload);

      // Acumular puntos si loyalty está activo y hay cliente seleccionado
      if (loyaltyEnabled && loyaltyMember && total >= 1000) {
        try {
          const token = AuthService.getToken();
          if (token) {
            const loyaltyRes = await loyaltyService.addPoints({
              member_id: loyaltyMember.id,
              sale_amount: total,
              reference_id: saleResult?.sale?.sale_id?.toString() || undefined,
            }, token);
            toast.success(`¡Venta registrada! ⭐ ${loyaltyRes.points_added} puntos acumulados para ${loyaltyMember.full_name}. Saldo: ${loyaltyRes.new_balance}`, 5000);
          } else {
            toast.success('¡Venta registrada exitosamente!');
            toast.warning('No se pudieron acumular puntos: sesión no válida.');
          }
        } catch (loyaltyErr: any) {
          toast.success('¡Venta registrada exitosamente!');
          toast.warning(`Puntos no acumulados: ${loyaltyErr.message || 'Error desconocido'}`);
        }
      } else {
        toast.success('¡Venta registrada exitosamente!');
      }

      setCart([]);
      setObservation('');
      setPayments([]);
      setActiveStep('select');
      setPromoCounter(0);
      setCurrentPromoReference(null);
      setLoyaltyEnabled(false);
      setLoyaltyMember(null);
    } catch (err: any) {
      console.error('❌ Error en venta:', err);
      toast.error(err.message || 'Error al registrar la venta');
    } finally {
      setSubmitting(false);
    }
  };

  // === RENDER ===

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-14 w-14">
            <div className="h-14 w-14 rounded-full border-4 border-white/20 border-t-purple-400 animate-spin" />
            <div className="absolute inset-0 grid place-items-center">
              <img
                src="/logo-naxos.jpg"
                alt="Logo NAXOS"
                className="h-9 w-9 rounded-full object-cover border border-white/20 shadow-lg"
              />
            </div>
          </div>
          <p className="text-purple-200 font-semibold">Cargando carta...</p>
          <p className="text-purple-300/80 text-sm mt-1">preparando sabores 😋</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white/10 border border-white/20 p-6 text-center backdrop-blur-lg">
          <div className="text-5xl mb-3 text-yellow-400">😵‍💫</div>
          <p className="text-purple-100 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-24">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl font-black tracking-wide neon-title">NAXOS</h1>
            <button
              onClick={() => cart.length > 0 && setActiveStep('payment')}
              disabled={cart.length === 0}
              className={`px-4 py-2 rounded-xl font-bold ${
                cart.length > 0
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              💳 Pagar ({cart.length})
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 relative z-10">
        {/* Carrito resumen (siempre visible en móvil) */}
        {cart.length > 0 && (
          <div id="cart-summary" className="mb-6 rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-lg shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-black text-purple-100">Carrito</h3>
              <button
                onClick={clearCart}
                className="text-xs text-red-400 hover:text-red-300 font-medium"
              >
                🗑️ Limpiar
              </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {processedCart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <div className="text-purple-200">
                      {item.quantity}x {item.variantName} {item.flavor ? `(${item.flavor})` : ''}
                      {item.isPromo2x1 && (
                        <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-400/30">
                          2x1
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{formatRD(item.lineTotal)}</span>
                    <button
                      onClick={() => removeFromCart(idx)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-lg transition-colors"
                      title="Eliminar producto"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-white/20 text-right">
              <span className="text-2xl font-black text-white">{formatRD(total)}</span>
            </div>
          </div>
        )}

        {activeStep === 'select' && (
          <>
            {selectedProduct ? (
              <div className="space-y-6">
                {/* Volver */}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="flex items-center text-purple-300 hover:text-purple-100 font-bold"
                >
                  ← Volver a productos
                </button>

                {/* Sabores */}
                <section>
                  <h2 className="text-2xl font-black text-purple-100 mb-3">Selecciona un sabor</h2>
                  {getFlavorsForProduct(selectedProduct.product_id).length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {getFlavorsForProduct(selectedProduct.product_id).map((flavor) => (
                        <button
                          key={flavor}
                          onClick={() => handleSelectFlavor(flavor)}
                          className={`px-4 py-2 rounded-full font-black text-sm transition-all ${
                            selectedFlavor === flavor
                              ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white shadow-lg border-2 border-green-300'
                              : 'bg-white/10 text-purple-200 border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          {flavor}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-purple-300">Sin sabores disponibles</p>
                  )}
                </section>

                {/* Tamaños */}
                <section>
                  <h2 className="text-2xl font-black text-purple-100 mb-3">Elige tamaño</h2>
                  <div className="space-y-3">
                    {getVariantsForProduct(selectedProduct.product_id).map((v) => {
                      const price = Number(v.precio_actual ?? 0);
                      return (
                        <button
                          key={v.variant_id}
                          onClick={() => handleSelectVariant(v)}
                          disabled={!price}
                          className={`w-full text-left p-4 rounded-2xl border transition-all ${
                            selectedVariant?.variant_id === v.variant_id
                              ? 'border-green-400 bg-green-500/20 shadow-lg'
                              : 'border-white/20 bg-white/10 hover:bg-white/20'
                          } ${!price ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-black text-purple-100">{v.variant_name}</div>
                              <div className="text-xs text-purple-300">
                                {v.ounces} oz • {v.toppings ?? 0} toppings
                              </div>
                            </div>
                            <span className="font-black text-white">{formatRD(price)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Cantidad y agregar */}
                {selectedVariant && (
                  <section className="space-y-4">
                    <div>
                      <label className="block text-purple-200 font-bold mb-2">Cantidad</label>
                      <div className="relative">
                        <div className="flex items-center">
                          <button
                            type="button"
                            onClick={() => {
                              const currentQty = parseInt(quantity, 10) || 1;
                              setQuantity(String(Math.max(1, currentQty - 1)));
                            }}
                            className="p-3 rounded-l-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                            </svg>
                          </button>
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={quantity}
                            onChange={(e) => {
                              setQuantity(e.target.value);
                            }}
                            onFocus={(e) => e.target.select()}
                            className="flex-1 p-3 bg-white/10 border-t border-b border-white/20 text-white text-center focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const currentQty = parseInt(quantity, 10) || 1;
                              setQuantity(String(currentQty + 1));
                            }}
                            className="p-3 rounded-r-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Promoción 2x1 */}
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <input
                        type="checkbox"
                        id="promo-2x1"
                        checked={is2x1Promo}
                        onChange={(e) => setIs2x1Promo(e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500 focus:ring-2"
                      />
                      <label htmlFor="promo-2x1" className="text-purple-200 font-medium cursor-pointer select-none">
                        🎯 Promoción 2x1
                        <span className="text-xs text-purple-300 ml-2">
                          (Lleva 2, paga 1)
                        </span>
                      </label>
                      {is2x1Promo && currentPromoReference && (
                        <button
                          onClick={startNewPromo}
                          className="ml-auto px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium rounded-lg transition-colors"
                          title="Iniciar nueva promoción"
                        >
                          🔄 Nueva promo
                        </button>
                      )}
                    </div>

                    <button
                      onClick={addToCart}
                      disabled={!selectedVariant || submitting}
                      className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-black rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all"
                    >
                      ➕ Agregar al carrito
                    </button>
                  </section>
                )}
              </div>
            ) : (
              // Lista de productos
              <div className="space-y-8">
                {orderedCategories.map((category) => (
                  <section key={category}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{getCategoryIcon(category)}</span>
                      <h2 className="text-2xl font-black text-purple-100">{category}</h2>
                    </div>
                    <div className="space-y-3">
                      {productsByCategory[category]?.map((product) => (
                        <button
                          key={product.product_id}
                          onClick={() => handleSelectProduct(product)}
                          className="w-full text-left p-4 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 transition-colors"
                        >
                          <div className="font-black text-purple-100">{product.name}</div>
                          <div className="text-xs text-purple-300 mt-1">
                            {getVariantsForProduct(product.product_id).length} tamaños
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}

        {activeStep === 'payment' && (
          <div className="space-y-5">
            <button
              onClick={goBackToSelection}
              className="flex items-center text-purple-300 hover:text-purple-100 font-bold mb-2"
            >
              ← Volver a selección
            </button>

            {/* Agregar método de pago */}
            <div>
              <label className="block text-purple-200 font-bold mb-2">
                {payments.length === 0 ? 'Método de pago' : 'Agregar otro medio'}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => addPaymentMethod(m.key)}
                    className="p-2.5 rounded-xl font-bold transition-all flex flex-col items-center justify-center min-h-[56px] bg-white/10 text-purple-200 border border-white/20 hover:bg-white/20 active:scale-95"
                  >
                    <span className="text-lg mb-0.5">{m.icon}</span>
                    <span className="text-[10px] sm:text-xs leading-tight text-center break-words max-w-full">
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de pagos agregados */}
            {payments.length > 0 && (
              <div className="space-y-2">
                <label className="block text-purple-200 font-bold text-sm">Pagos</label>
                {payments.map((p, idx) => {
                  const meta = PAYMENT_METHODS.find(m => m.key === p.method)!;
                  return (
                    <div key={idx} className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 p-3">
                      <span className="text-lg shrink-0">{meta.icon}</span>
                      <span className="text-xs font-bold text-purple-200 w-[72px] shrink-0 truncate">{meta.label}</span>
                      <div className="relative flex-1 min-w-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-sm font-bold">$</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={p.amount}
                          onChange={(e) => updatePaymentAmount(idx, e.target.value)}
                          className="w-full pl-7 pr-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </div>
                      <button
                        onClick={() => removePayment(idx)}
                        className="p-2 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 transition-colors shrink-0"
                        title="Quitar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Resumen de pagos */}
            {payments.length > 0 && (
              <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300 font-medium">Total venta</span>
                  <span className="text-white font-black">${total.toLocaleString('es-CO')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-purple-300 font-medium">Pagado</span>
                  <span className="text-white font-black">${totalPaid.toLocaleString('es-CO')}</span>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                  {paymentStatus === 'exact' && (
                    <>
                      <span className="text-emerald-400 font-bold">✅ Pago completo</span>
                      <span className="text-emerald-400 font-black">$0</span>
                    </>
                  )}
                  {paymentStatus === 'incomplete' && (
                    <>
                      <span className="text-yellow-400 font-bold">Faltan</span>
                      <span className="text-yellow-300 font-black">${remaining.toLocaleString('es-CO')}</span>
                    </>
                  )}
                  {paymentStatus === 'exceeded' && (
                    <>
                      <span className="text-red-400 font-bold">Excede en</span>
                      <span className="text-red-400 font-black">${Math.abs(remaining).toLocaleString('es-CO')}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Observación */}
            <div>
              <label className="block text-purple-200 font-bold mb-2">Observación (opcional)</label>
              <textarea
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                placeholder="Ej: Venta ya realizada, cliente especial, etc..."
                rows={2}
                className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {/* Toggle acumular puntos */}
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={loyaltyEnabled}
                    onChange={(e) => {
                      setLoyaltyEnabled(e.target.checked);
                      if (!e.target.checked) setLoyaltyMember(null);
                    }}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${loyaltyEnabled ? 'bg-yellow-500' : 'bg-white/20'}`}>
                    <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${loyaltyEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                </div>
                <span className="text-purple-200 font-bold text-sm">⭐ ¿Acumula puntos?</span>
                {loyaltyEnabled && total >= 1000 && (
                  <span className="ml-auto text-xs font-bold text-yellow-300 bg-yellow-500/15 px-2 py-1 rounded-lg">
                    +{Math.floor(total / 1000)} pts
                  </span>
                )}
              </label>

              {loyaltyEnabled && (
                <div className="pt-1">
                  <LoyaltyCustomerSearch
                    onSelect={(m) => setLoyaltyMember(m)}
                    onClear={() => setLoyaltyMember(null)}
                    selectedMember={loyaltyMember}
                    compact
                  />
                </div>
              )}
            </div>

            {/* Botón de confirmación */}
            <button
              onClick={handleSubmitSale}
              disabled={submitting || cart.length === 0 || payments.length === 0 || paymentStatus !== 'exact'}
              className={`w-full py-4 font-black rounded-xl transition-all ${
                submitting || payments.length === 0 || paymentStatus !== 'exact'
                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
              }`}
            >
              {submitting ? 'Procesando...' : '✅ Confirmar Venta'}
            </button>
          </div>
        )}
      </main>

      {/* Estilos globales (igual que en tu menú) */}
      <style jsx global>{`
        .neon-title {
          color: transparent;
          background-image: linear-gradient(90deg, #a78bfa, #ec4899, #fde047);
          -webkit-background-clip: text;
          background-clip: text;
          text-shadow: 0 0 18px rgba(167, 139, 250, 0.55), 0 0 26px rgba(236, 72, 153, 0.45),
            0 0 40px rgba(253, 224, 71, 0.35);
        }

        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      {/* Toast Notifications */}
      <toast.ToastComponent />
    </div>
  );
}
