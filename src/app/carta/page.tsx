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

  const formatRD = (value: number) => `RD$${Math.round(value).toLocaleString('es-DO')}`;

  const getVariantsForProduct = (productId: number): Variant[] =>
    menuData?.variantes?.filter((v) => v.product_id === productId) || [];

  const getFlavorsForProduct = (productId: number): string[] => {
    const flavorData = menuData?.sabores?.find((f) => f.product_id === productId);
    return flavorData?.sabores_activos || [];
  };

  // Agrupar productos por categoría
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
      Granizados: '🍧',
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
      Granizados: 'from-pink-500 via-fuchsia-500 to-violet-500',
      granizados: 'from-pink-500 via-fuchsia-500 to-violet-500',
      Sodas: 'from-cyan-500 via-sky-500 to-blue-500',
      Cervezas: 'from-amber-500 via-orange-500 to-red-500',
      Jugos: 'from-emerald-500 via-lime-500 to-teal-500',
      Batidos: 'from-rose-500 via-pink-500 to-fuchsia-500',
      Bebidas: 'from-indigo-500 via-violet-500 to-fuchsia-500',
      Otros: 'from-slate-500 via-gray-500 to-zinc-500',
      default: 'from-indigo-500 via-violet-500 to-fuchsia-500',
    };
    return gradients[category] || gradients.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060316] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-14 w-14">
            <div className="h-14 w-14 rounded-full border-4 border-white/25 border-t-white animate-spin" />
            <div className="absolute inset-0 grid place-items-center text-2xl">🍧</div>
          </div>
          <p className="text-white font-semibold">Cargando carta...</p>
          <p className="text-white/80 text-sm mt-1">preparando sabores 😋</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#060316] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl bg-white/10 border border-white/20 p-6 text-center shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          <div className="text-5xl mb-3">😵‍💫</div>
          <p className="text-white font-semibold">{error}</p>
          <p className="text-white/80 text-sm mt-2">Revisa el endpoint /menu/public y el CORS.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#060316]">
      {/* Fondo candy neon (MÁS VIVO, menos oscuro) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="candy-bg" />
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="orb orb-c" />
        <div className="orb orb-d" />
        <div className="sparkles" />

        {/* Dulces flotando */}
        <div className="float-candy fc1">🍭</div>
        <div className="float-candy fc2">🍬</div>
        <div className="float-candy fc3">🧁</div>
        <div className="float-candy fc4">🍓</div>
        <div className="float-candy fc5">🍧</div>
      </div>

      {/* Header NAXOS */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="rounded-3xl border border-white/20 bg-white/12 px-4 py-4 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
            <div className="text-center">
              <h1 className="text-5xl sm:text-6xl font-black tracking-[0.18em] neon-title">
                NAXOS
              </h1>
              <p className="mt-2 text-white/90 text-sm sm:text-base font-semibold">
                Granizados • bebidas frías • sabores únicos ✨
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 pb-20">
        {orderedCategories.map((category) => {
          const products = productsByCategory[category] || [];

          return (
            <section key={category} className="mb-10">
              {/* Card categoría */}
              <div className="rounded-3xl border border-white/20 bg-white/12 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-white/15 border border-white/20 grid place-items-center text-2xl">
                    {getCategoryIcon(category)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                      {category}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Productos de la categoría */}
              <div className="mt-4 space-y-4">
                {products.map((product) => {
                  const variants = getVariantsForProduct(product.product_id);
                  const flavors = getFlavorsForProduct(product.product_id);

                  return (
                    <article
                      key={product.product_id}
                      className="rounded-3xl border border-white/20 bg-white/12 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)]"
                    >
                      {/* Header del producto */}
                      <div className="flex items-start gap-3">
                        {/* ✅ Ya NO estrella. Ícono neutral */}
                        <div className="h-10 w-10 rounded-2xl bg-white/15 border border-white/20 grid place-items-center">
                          <span className="text-lg">🍧</span>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl sm:text-2xl font-black text-white">
                            {product.name}
                          </h3>

                          {/* ✅ Descripción aquí (como pediste) */}
                          {product.description && (
                            <p className="mt-1 text-white/90 text-sm leading-relaxed">
                              {product.description}
                            </p>
                          )}

                          {/* ✅ Bloque “Sabores” en vez de “Granizado por tamaño” */}
                          {flavors.length > 0 && (
                            <div className="mt-3">
                              <div className="text-sm font-black text-white">Sabores</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {flavors.map((flavor) => (
                                  <span
                                    key={flavor}
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black text-white border border-white/20 bg-gradient-to-r ${getChipGradient(
                                      category
                                    )} shadow-[0_18px_40px_rgba(0,0,0,0.35)]`}
                                  >
                                    <span>🍓</span>
                                    <span className="tracking-wide">{flavor}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 rounded-2xl border border-white/20 bg-white/12 px-3 py-2 text-right">
                          <div className="text-xs text-white/90 font-bold">Tamaños</div>
                          <div className="text-white font-black text-lg">{variants.length}</div>
                        </div>
                      </div>

                      {/* Tabla */}
                      <div className="mt-5 rounded-2xl border border-white/20 overflow-hidden">
                        <div className="grid grid-cols-12 bg-white/15 px-3 py-3 text-[11px] font-black text-white tracking-wide uppercase">
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
                                className="grid grid-cols-12 px-3 py-3 bg-white/8 hover:bg-white/12 transition-colors"
                              >
                                <div className="col-span-5">
                                  <div className="text-white font-black text-base">
                                    {v.variant_name}
                                  </div>
                                  <div className="text-xs text-white/90 mt-0.5">
                                    🍬 {v.toppings ?? 0} topping{(v.toppings ?? 0) === 1 ? '' : 's'}
                                  </div>
                                </div>

                                <div className="col-span-2 text-center text-white font-bold">
                                  {v.ounces ?? '—'}
                                </div>

                                <div className="col-span-2 text-center">
                                  <span className="inline-flex items-center justify-center min-w-[2.25rem] rounded-full bg-white/15 border border-white/20 px-2 py-1 text-xs font-black text-white">
                                    {v.toppings ?? 0}
                                  </span>
                                </div>

                                <div className="col-span-3 text-right">
                                  <span className="inline-flex items-center justify-end w-full rounded-xl px-3 py-2 font-black border border-white/20 bg-gradient-to-r from-emerald-400/35 via-green-400/25 to-lime-300/20 text-white shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                                    {hasPrice ? formatRD(Number(v.precio_actual)) : 'Consultar'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-white/90">
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

      <footer className="border-t border-white/20 bg-white/10 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-8 text-center">
          <div className="text-4xl">🍧</div>
          <p className="mt-2 text-white font-black text-lg">¡Gracias por elegir NAXOS!</p>
          <p className="mt-1 text-white/90 text-sm">Hecho con amor • sabores que brillan ✨</p>
        </div>
      </footer>

      {/* CSS */}
      <style jsx global>{`
        .neon-title {
          color: transparent;
          background-image: linear-gradient(90deg, #22d3ee, #a78bfa, #fb7185, #fde047);
          -webkit-background-clip: text;
          background-clip: text;
          text-shadow:
            0 0 18px rgba(34, 211, 238, 0.55),
            0 0 26px rgba(167, 139, 250, 0.45),
            0 0 40px rgba(251, 113, 133, 0.35);
        }

        /* Fondo: más color y menos “black overlay” */
        .candy-bg {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(1100px 650px at 15% 10%, rgba(59, 130, 246, 0.42), transparent 60%),
            radial-gradient(1000px 700px at 85% 15%, rgba(244, 114, 182, 0.50), transparent 60%),
            radial-gradient(1000px 700px at 50% 85%, rgba(34, 211, 238, 0.42), transparent 60%),
            radial-gradient(900px 600px at 20% 80%, rgba(250, 204, 21, 0.30), transparent 65%),
            linear-gradient(180deg, rgba(10, 6, 30, 0.40), rgba(6, 3, 22, 0.50));
        }

        .orb {
          position: absolute;
          width: 620px;
          height: 620px;
          border-radius: 9999px;
          filter: blur(70px);
          opacity: 0.42;
          mix-blend-mode: screen;
          animation: floaty 10s ease-in-out infinite;
        }

        .orb-a {
          top: -180px;
          left: -220px;
          background: radial-gradient(circle at 30% 30%, rgba(251,113,133,1), rgba(167,139,250,0.55), transparent 72%);
        }
        .orb-b {
          top: 160px;
          right: -260px;
          background: radial-gradient(circle at 30% 30%, rgba(34,211,238,1), rgba(16,185,129,0.35), transparent 72%);
          animation-delay: 1.6s;
        }
        .orb-c {
          bottom: -260px;
          left: 12%;
          background: radial-gradient(circle at 30% 30%, rgba(250,204,21,0.95), rgba(251,113,133,0.35), transparent 72%);
          animation-delay: 3.2s;
        }
        .orb-d {
          bottom: 120px;
          right: 12%;
          background: radial-gradient(circle at 30% 30%, rgba(59,130,246,0.95), rgba(167,139,250,0.35), transparent 72%);
          animation-delay: 2.4s;
        }

        @keyframes floaty {
          0%, 100% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(0,18px,0) scale(1.04); }
        }

        .sparkles {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(circle at 18% 22%, rgba(255,255,255,0.35) 0 1px, transparent 2px),
            radial-gradient(circle at 72% 18%, rgba(255,255,255,0.25) 0 1px, transparent 2px),
            radial-gradient(circle at 55% 62%, rgba(255,255,255,0.22) 0 1px, transparent 2px),
            radial-gradient(circle at 22% 76%, rgba(255,255,255,0.28) 0 1px, transparent 2px),
            radial-gradient(circle at 86% 78%, rgba(255,255,255,0.20) 0 1px, transparent 2px);
          opacity: 0.34;
          animation: twinkle 6s ease-in-out infinite;
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.26; }
          50% { opacity: 0.38; }
        }

        /* Dulces flotando */
        .float-candy {
          position: absolute;
          opacity: 0.22;
          filter: drop-shadow(0 0 18px rgba(255,255,255,0.20));
          animation: candyFloat 9s ease-in-out infinite;
          transform: translateZ(0);
          user-select: none;
        }
        .fc1 { top: 12%; left: 8%; font-size: 32px; animation-delay: 0s; }
        .fc2 { top: 18%; right: 10%; font-size: 28px; animation-delay: 1.2s; }
        .fc3 { top: 62%; left: 6%; font-size: 30px; animation-delay: 2.1s; }
        .fc4 { bottom: 18%; right: 14%; font-size: 28px; animation-delay: 2.8s; }
        .fc5 { bottom: 8%; left: 40%; font-size: 34px; opacity: 0.18; animation-delay: 3.3s; }

        @keyframes candyFloat {
          0%, 100% { transform: translate3d(0, 0, 0) rotate(-3deg); }
          50% { transform: translate3d(0, 14px, 0) rotate(3deg); }
        }
      `}</style>
    </div>
  );
}
