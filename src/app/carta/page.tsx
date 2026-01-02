'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchMenu } from '@/services/api';
import type { MenuData, Product, Variant } from '@/types/menu';

type ApiResponse = { message?: string; menu?: MenuData } | MenuData;

export default function MenuPage() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (menuData) {
      console.log('Productos:', menuData.productos);
      console.log('Sabores por producto:', menuData.sabores);
    }
  }, [menuData]);
  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data: ApiResponse = await fetchMenu();
        const normalized = (data as any)?.menu ? (data as any).menu : data;
        setMenuData(normalized as MenuData);
      } catch (err) {
        console.error(err);
        setError('Error al cargar la carta. Por favor, intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  const formatRD = (value: number) => `$${Math.round(value).toLocaleString('es-DO')}`;

  const getVariantsForProduct = (productId: number): Variant[] =>
    menuData?.variantes?.filter((v) => v.product_id == productId) || [];

  const getFlavorsForProduct = (productId: number): string[] => {
    const flavorData = menuData?.sabores?.find((f) => f.product_id == productId);
    return flavorData?.sabores_activos || [];
  };

  const productsByCategory: Record<string, Product[]> = useMemo(() => {
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

    const sorted = [
      ...priority.filter((c) => categories.includes(c)),
      ...categories
        .filter((c) => !priority.includes(c))
        .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' })),
    ];

    return Array.from(new Set(sorted));
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
      default: '🍭',
    };
    return icons[category] || icons.default;
  };

  const getChipGradient = (category: string) => {
    const gradients: Record<string, string> = {
      Granizados: 'from-purple-500 via-pink-500 to-yellow-500',
      granizados: 'from-purple-500 via-pink-500 to-yellow-500',
      Sodas: 'from-cyan-500 via-sky-500 to-blue-500',
      Cervezas: 'from-amber-500 via-orange-500 to-red-500',
      Jugos: 'from-emerald-500 via-lime-500 to-teal-500',
      Batidos: 'from-rose-500 via-pink-500 to-purple-500',
      Bebidas: 'from-indigo-500 via-violet-500 to-fuchsia-500',
      Otros: 'from-slate-500 via-gray-500 to-zinc-500',
      default: 'from-purple-500 via-pink-500 to-yellow-500',
    };
    return gradients[category] || gradients.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-14 w-14">
            <div className="h-14 w-14 rounded-full border-4 border-white/20 border-t-purple-400 animate-spin" />
            <div className="absolute inset-0 grid place-items-center text-2xl text-purple-400">🍧</div>
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
          <p className="text-purple-300 text-sm mt-2">Revisa el endpoint /menu/public y el CORS.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Fondo decorativo con blobs similares al login */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>

        {/* Dulces flotando con colores del login */}
        <div className="absolute top-20 left-20 text-purple-400 opacity-30 animate-float">🍭</div>
        <div className="absolute top-40 right-32 text-yellow-400 opacity-40 animate-float animation-delay-1000">🍬</div>
        <div className="absolute bottom-32 left-16 text-pink-400 opacity-35 animate-float animation-delay-2000">🧁</div>
        <div className="absolute top-60 right-20 text-blue-400 opacity-30 animate-float animation-delay-3000">🍓</div>
        <div className="absolute bottom-20 left-1/3 text-purple-300 opacity-25 animate-float animation-delay-2500">🍧</div>
      </div>

      {/* Header NAXOS */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="rounded-3xl border border-white/20 bg-white/10 px-4 py-4 shadow-xl">
            <div className="text-center">
              <h1 className="text-5xl sm:text-6xl font-black tracking-[0.18em] neon-title">
                NAXOS
              </h1>
              <p className="mt-2 text-purple-200 text-sm sm:text-base font-semibold">
                Granizados • bebidas frías • sabores únicos ✨
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-20 relative z-10">
        {orderedCategories.map((category) => {
          const products = productsByCategory[category] || [];

          return (
            <section key={category} className="mb-10">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-lg shadow-xl">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 grid place-items-center text-2xl text-purple-400">
                    {getCategoryIcon(category)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-purple-100 tracking-wide">
                      {category}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {products.map((product) => {
                  const variants = getVariantsForProduct(product.product_id);
                  const flavors = getFlavorsForProduct(product.product_id);
                  console.log('Product ID:', product.product_id, 'Flavors:', flavors);
                  return (
                    <article
                      key={product.product_id}
                      className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-lg shadow-xl"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 grid place-items-center text-purple-400">
                          <span className="text-lg">🍹</span>
                        </div>

                        <div className="flex-1">

                          <h3 className="text-xl sm:text-2xl font-black text-purple-100">
                            Sabores
                          </h3>

                          {/* ✅ BLOQUE DE SABORES (como pediste) */}
                          {flavors.length > 0 && (
                            <div className="mt-3">

                              <div className="mt-2 flex flex-wrap gap-2">
                                {flavors.map((flavor) => (
                                  <span
                                    key={flavor}
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black text-white border border-white/20 bg-gradient-to-r ${getChipGradient(
                                      category
                                    )} shadow-lg`}
                                  >
                                    <span>🥤</span>
                                    <span className="tracking-wide">{flavor}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 text-right">
                          <div className="text-xs text-purple-300 font-bold">Tamaños</div>
                          <div className="text-purple-100 font-black text-lg">{variants.length}</div>
                        </div>
                      </div>

                      {/* Tabla de tamaños */}
                      <div className="mt-5 rounded-2xl border border-white/20 overflow-hidden">
                        <div className="grid grid-cols-12 bg-white/10 px-3 py-3 text-[11px] font-black text-purple-200 tracking-wide uppercase">
                          <div className="col-span-5">Tamaño</div>
                          <div className="col-span-2 text-center">Oz</div>
                          <div className="col-span-2 text-center">Top</div>
                          <div className="col-span-3 text-right">Precio</div>
                        </div>

                        <div className="divide-y divide-white/15">
                          {variants.map((v) => {
                            const hasPrice =
                              v.precio_actual !== null &&
                              v.precio_actual !== undefined &&
                              !Number.isNaN(Number(v.precio_actual));

                            return (
                              <div
                                key={v.variant_id}
                                className="grid grid-cols-12 px-3 py-3 bg-white/5 hover:bg-white/10 transition-colors"
                              >
                                <div className="col-span-5">
                                  <div className="text-purple-100 font-black text-base">
                                    {v.variant_name}
                                  </div>
                                  <div className="text-xs text-purple-300 mt-0.5">
                                    🍬 {v.toppings ?? 0} topping{(v.toppings ?? 0) === 1 ? '' : 's'}
                                  </div>
                                </div>

                                <div className="col-span-2 text-center text-purple-200 font-bold">
                                  {v.ounces ?? '—'}
                                </div>

                                <div className="col-span-2 text-center">
                                  <span className="inline-flex items-center justify-center min-w-[2.25rem] rounded-full bg-white/10 border border-white/20 px-2 py-1 text-xs font-black text-purple-100">
                                    {v.toppings ?? 0}
                                  </span>
                                </div>

                                <div className="col-span-3 text-right">
                                  <span className="inline-flex items-center justify-center w-full rounded-xl px-3 py-2 font-black border border-white/20 bg-gradient-to-r from-purple-500/30 via-pink-500/25 to-yellow-500/20 text-white shadow-lg">
                                    {hasPrice ? formatRD(Number(v.precio_actual)) : 'Consultar'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-purple-300">
                        * Los precios y disponibilidad pueden variar según temporada.
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      <footer className="border-t border-white/20 bg-white/10 backdrop-blur-xl relative z-10">
        <div className="mx-auto max-w-3xl px-2 py-8 text-center">
          {/* Logo con estilos */}
          <div className="inline-block rounded-2xl overflow-hidden shadow-lg bg-white/5 p-2 mb-1">
            <img
              src="/logo-naxos.jpg"
              alt="Logo NAXOS"
              className="h-30 w-auto object-contain rounded-xl transition-transform hover:scale-105"
            />
          </div>

          <p className="mt-0 text-purple-100 font-black text-lg">¡Gracias por elegir NAXOS!</p>
          <p className="mt-1 text-purple-300 text-sm">Hecho con amor • sabores que brillan ✨</p>
        </div>
      </footer>

      {/* Animaciones globales (copiadas del login) */}
      <style jsx global>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.25; }
          50% { transform: translateY(-16px) rotate(5deg); opacity: 0.35; }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animation-delay-1000 { animation-delay: 1s; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-2500 { animation-delay: 2.5s; }
        .animation-delay-3000 { animation-delay: 3s; }

        /* Efecto neón para el título NAXOS */
        .neon-title {
          color: transparent;
          background-image: linear-gradient(90deg, #a78bfa, #ec4899, #fde047);
          -webkit-background-clip: text;
          background-clip: text;
          text-shadow:
            0 0 18px rgba(167, 139, 250, 0.55),
            0 0 26px rgba(236, 72, 153, 0.45),
            0 0 40px rgba(253, 224, 71, 0.35);
        }
      `}</style>
    </div>
  );
}