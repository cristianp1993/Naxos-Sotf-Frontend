'use client';

import { useEffect, useState, useMemo } from 'react';
import { fetchMenu } from '@/services/api';
import { salesService } from '@/services/salesService';
import type { MenuData, Product, Variant } from '@/types/menu';
import type { CreateFullSalePayload } from '@/services/salesService';

type CartItem = {
  productId: number;
  productName: string;
  variantId: number;
  variantName: string;
  flavor: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export default function SalesPage() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeStep, setActiveStep] = useState<'select' | 'payment'>('select');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<'EFECTIVO' | 'TARJETA' | 'TRANSFERENCIA' | 'OTRO'>('EFECTIVO');
  const [submitting, setSubmitting] = useState(false);

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
    setQuantity(1);
  };

  const handleSelectFlavor = (flavor: string) => {
    setSelectedFlavor(flavor);
  };

  const handleSelectVariant = (variant: Variant) => {
    setSelectedVariant(variant);
  };

  const addToCart = () => {
    if (!selectedProduct || !selectedVariant) return;

    const unitPrice = Number(selectedVariant.precio_actual ?? 0);
    const lineTotal = Number((unitPrice * quantity).toFixed(2));

    const newItem: CartItem = {
      productId: selectedProduct.product_id,
      productName: selectedProduct.name,
      variantId: selectedVariant.variant_id,
      variantName: selectedVariant.variant_name,
      flavor: selectedFlavor,
      quantity,
      unitPrice,
      lineTotal,
    };

    setCart((prev) => [...prev, newItem]);
    // Reset selection
    setSelectedProduct(null);
    setSelectedFlavor(null);
    setSelectedVariant(null);
    setQuantity(1);
    setActiveStep('select');
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const total = cart.reduce((sum, item) => sum + item.lineTotal, 0);

  const proceedToPayment = () => {
    if (cart.length === 0) return;
    setActiveStep('payment');
  };

  const goBackToSelection = () => {
    setActiveStep('select');
  };

  const handleSubmitSale = async () => {
    if (cart.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      const payload: CreateFullSalePayload = {
        location_id: 1, // ← Ajusta según tu lógica (puede venir de perfil o settings)
        items: cart.map((item) => ({
          variant_id: item.variantId,
          flavor_id: item.flavor ? null : null, // Backend acepta null si no hay sabor
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
        payments: [
          {
            method: paymentMethod,
            amount: total,
            reference: paymentMethod === 'TRANSFERENCIA' ? 'Referencia pendiente' : null,
          },
        ],
      };

      await salesService.createFullSale(payload);
      alert('¡Venta registrada exitosamente! 🎉');
      setCart([]);
      setActiveStep('select');
    } catch (err: any) {
      alert(err.message || 'Error al registrar la venta');
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
          <div className="mb-6 rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-lg shadow-xl">
            <h3 className="text-lg font-black text-purple-100 mb-2">Carrito</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-purple-200">
                    {item.quantity}x {item.variantName} {item.flavor ? `(${item.flavor})` : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold">{formatRD(item.lineTotal)}</span>
                    <button
                      onClick={() => removeFromCart(idx)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ×
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
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
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
                              ? 'border-purple-400 bg-purple-500/20'
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
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={quantity}
                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                        className="w-full p-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
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
          <div className="space-y-6">
            <button
              onClick={goBackToSelection}
              className="flex items-center text-purple-300 hover:text-purple-100 font-bold mb-4"
            >
              ← Volver a productos
            </button>

            <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-lg shadow-xl">
              <h2 className="text-2xl font-black text-purple-100 mb-4">Método de pago</h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'OTRO'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-4 rounded-xl border font-bold transition-all ${
                      paymentMethod === method
                        ? 'border-purple-400 bg-purple-500/20 text-white'
                        : 'border-white/20 bg-white/10 text-purple-200 hover:bg-white/20'
                    }`}
                  >
                    {method === 'EFECTIVO' && '💵 Efectivo'}
                    {method === 'TARJETA' && '💳 Tarjeta'}
                    {method === 'TRANSFERENCIA' && '📱 Transferencia'}
                    {method === 'OTRO' && '❓ Otro'}
                  </button>
                ))}
              </div>

              <div className="text-center mb-6">
                <p className="text-purple-200">Total a pagar:</p>
                <p className="text-3xl font-black text-white">{formatRD(total)}</p>
              </div>

              <button
                onClick={handleSubmitSale}
                disabled={submitting || cart.length === 0}
                className={`w-full py-4 font-black rounded-xl transition-all ${
                  submitting
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                }`}
              >
                {submitting ? 'Procesando...' : '✅ Confirmar Venta'}
              </button>
            </div>
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
    </div>
  );
}