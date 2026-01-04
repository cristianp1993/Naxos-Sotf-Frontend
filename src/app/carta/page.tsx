'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchMenu } from '@/services/api';
import type { MenuData, Product, Variant } from '@/types/menu';

type ApiResponse = { message?: string; menu?: MenuData } | MenuData;

export default function MenuPage() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Slider state (NUEVO)
  const [sliderImages, setSliderImages] = useState<string[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);

  // ✅ Parallax (NUEVO)
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [parallax, setParallax] = useState({ y: 0, scale: 1.01 });

  useEffect(() => {
    if (menuData) {
      // console.log('Productos:', menuData.productos);
      // console.log('Sabores por producto:', menuData.sabores);
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

  // ✅ Descubre imágenes /public/slider/naxos{n}.jpeg dinámicamente (NUEVO)
  useEffect(() => {
    let cancelled = false;

    const discoverImages = async () => {
      const found: string[] = [];
      const MAX = 60; // por si algún día subes más de 12

      for (let i = 1; i <= MAX; i++) {
        const path = `/slider/naxos${i}.jpeg`;
        try {
          const res = await fetch(path, { method: 'HEAD' });
          if (!res.ok) break; // secuencial: si falla uno, ya no hay más
          found.push(path);
        } catch {
          break;
        }
      }

      if (!cancelled) {
        setSliderImages(found);
        setActiveSlide(0);
      }
    };

    discoverImages();

    return () => {
      cancelled = true;
    };
  }, []);

  // ✅ Autoplay del slider (NUEVO)
  useEffect(() => {
    if (!sliderImages.length) return;

    const t = window.setInterval(() => {
      setActiveSlide((s) => (s + 1) % sliderImages.length);
    }, 4200);

    return () => window.clearInterval(t);
  }, [sliderImages.length]);

  // ✅ Parallax suave (NUEVO)
  useEffect(() => {
    let raf = 0;

    const update = () => {
      const el = sliderRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 0;

      // centro relativo (-1..1)
      const center = (rect.top + rect.height / 2 - vh / 2) / (vh / 2);

      // movimiento sutil
      const y = Math.round(center * 12);

      // escala mínima fija (sin zoom agresivo)
      const scale = 1.01;

      setParallax({ y, scale });
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
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
      default: '🍹',
    };
    return icons[category] || icons.default;
  };

  // ✅ NUEVO: gradientes más elegantes y coherentes con la paleta (menos “flashy”)
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
      default: 'from-violet-500/35 via-fuchsia-500/25 to-amber-400/20',
    };
    return gradients[category] || gradients.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-14 w-14">
            <div className="h-14 w-14 rounded-full border-4 border-white/20 border-t-purple-400 animate-spin" />

            {/* ✅ LOGO dentro del spinner (NUEVO) */}
            <div className="absolute inset-0 grid place-items-center">
              <img
                src="/logo-naxos.jpg"
                alt="Logo NAXOS"
                className="h-9 w-9 rounded-full object-cover border border-white/20 shadow-lg"
                draggable={false}
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

      {/* ✅ SLIDER después del header (NUEVO) */}
      {sliderImages.length > 0 && (
        <section ref={sliderRef} className="mx-auto max-w-3xl px-4 pt-4 relative z-10">
          <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-lg shadow-xl overflow-hidden">
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/8]">
              {/* Fondo “premium” para cuando la imagen es contain */}
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-purple-950/35 to-slate-950/70" />
                <div className="absolute -inset-10 bg-gradient-to-r from-purple-500/18 via-pink-500/12 to-yellow-500/14 blur-2xl opacity-80" />
              </div>

              {/* Imagen activa (sin recorte) */}
              <img
                key={sliderImages[activeSlide]}
                src={sliderImages[activeSlide]}
                alt={`NAXOS slide ${activeSlide + 1}`}
                className="absolute inset-0 h-full w-full object-contain slider-hero"
                style={{
                  transform: `translateY(${parallax.y}px) scale(${parallax.scale}) translateZ(0)`,
                }}
                draggable={false}
              />

              {/* Difuminado bordes + integración al fondo */}
              <div className="absolute inset-0 slider-vignette pointer-events-none" />

              {/* Overlay suave para lectura */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-slate-900/10 to-transparent" />

              {/* Badge */}
              <div className="absolute left-4 top-4 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-xl shadow-lg">
                <p className="text-purple-100 text-xs font-black tracking-wide">✨ Momentos NAXOS</p>
              </div>

              {/* Dots */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4">
                {sliderImages.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Ir a slide ${i + 1}`}
                    onClick={() => setActiveSlide(i)}
                    className={[
                      'h-2.5 w-2.5 rounded-full border border-white/30 transition-all',
                      i === activeSlide ? 'bg-white/80 scale-110' : 'bg-white/20 hover:bg-white/35',
                    ].join(' ')}
                  />
                ))}
              </div>

              {/* Controles */}
              <button
                type="button"
                aria-label="Anterior"
                onClick={() => setActiveSlide((s) => (s - 1 + sliderImages.length) % sliderImages.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg px-3 py-2 text-purple-100 font-black hover:bg-white/15 transition-colors"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                onClick={() => setActiveSlide((s) => (s + 1) % sliderImages.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl shadow-lg px-3 py-2 text-purple-100 font-black hover:bg-white/15 transition-colors"
              >
                ›
              </button>
            </div>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-3xl px-4 py-6 pb-20 relative z-10">
        {orderedCategories.map((category) => {
          const products = productsByCategory[category] || [];

          return (
            <section key={category} className="mb-10">
              <div className="mt-4 space-y-4">
                {products.map((product) => {
                  const variants = getVariantsForProduct(product.product_id);
                  const flavors = getFlavorsForProduct(product.product_id);
                  // console.log('Product ID:', product.product_id, 'Flavors:', flavors);

                  return (
                    <article
                      key={product.product_id}
                      className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-lg shadow-xl"
                    >
                      <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-lg shadow-xl mb-4">
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

                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/20 grid place-items-center text-purple-400">
                          <span className="text-lg">🍹</span>
                        </div>

                        <div className="flex-1">
                          <h3 className="text-xl sm:text-2xl font-black text-purple-100">Sabores</h3>

                          {/* ✅ BLOQUE DE SABORES (colores mejorados) */}
                          {flavors.length > 0 && (
                            <div className="mt-3">
                              <div className="mt-2 flex flex-wrap gap-2">
                                {flavors.map((flavor) => (
                                  <span
                                    key={flavor}
                                    className={[
                                      'inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black',
                                      'text-purple-50 border border-white/20',
                                      'bg-gradient-to-r',
                                      getChipGradient(category),
                                      'shadow-lg shadow-black/10',
                                      'backdrop-blur-sm',
                                      'ring-1 ring-white/10',
                                      'transition-transform duration-200 hover:scale-[1.02]',
                                    ].join(' ')}
                                  >
                                    <span className="opacity-90">🥤</span>
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
                                  <div className="text-purple-100 font-black text-base">{v.variant_name}</div>
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

      {/* Animaciones globales (copiadas del login) + slider */}
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
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }

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

        /* ✅ Slider: entrada suave + mejora “percepción de calidad” */
        @keyframes naxosSlideIn {
          0% { opacity: 0; transform: translateY(6px) scale(1.01); filter: blur(1.5px); }
          55% { opacity: 1; transform: translateY(0px) scale(1.01); filter: blur(0px); }
          100% { opacity: 1; transform: translateY(0px) scale(1.01); filter: blur(0px); }
        }
        .slider-hero {
          animation: naxosSlideIn 900ms ease-out;
          will-change: transform, opacity, filter;
          backface-visibility: hidden;
          transform-style: preserve-3d;
          image-rendering: auto;
          filter: contrast(1.06) saturate(1.08);
        }

        /* ✅ Difuminado en bordes (vignette + mask suave) */
        .slider-vignette {
          background:
            radial-gradient(ellipse at center,
              rgba(0,0,0,0) 55%,
              rgba(0,0,0,0.35) 80%,
              rgba(0,0,0,0.55) 100%
            );
          /* máscara para un fade aún más suave (compatibilidad: webkit + standard) */
          -webkit-mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%);
          mask-image: radial-gradient(ellipse at center, rgba(0,0,0,1) 70%, rgba(0,0,0,0) 100%);
          opacity: 0.95;
        }
      `}</style>
    </div>
  );
}
