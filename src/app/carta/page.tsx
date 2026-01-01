'use client';

import { useState, useEffect } from 'react';
import { fetchMenu } from '@/services/api';
import { MenuData, Product, Variant, Flavor } from '@/types/menu';
import Image from 'next/image';

export default function MenuPage() {
  const [menuData, setMenuData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const data = await fetchMenu();
        setMenuData(data);
      } catch (err) {
        setError('Error al cargar el menú. Por favor, intenta de nuevo.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  // Función para obtener variantes de un producto
  const getVariantsForProduct = (productId: number): Variant[] => {
    return menuData?.variantes.filter(v => v.product_id === productId) || [];
  };

  // Función para obtener sabores de un producto
  const getFlavorsForProduct = (productId: number): string[] => {
    const flavorData = menuData?.sabores.find(f => f.product_id === productId);
    return flavorData?.sabores_activos || [];
  };

  // Agrupar productos por categoría
  const productsByCategory = menuData?.productos.reduce((acc, product) => {
    if (!acc[product.categoria]) {
      acc[product.categoria] = [];
    }
    acc[product.categoria].push(product);
    return acc;
  }, {} as Record<string, Product[]>) || {};

  // Función para ordenar categorías (Granizados primero)
  const getOrderedCategories = () => {
    const categories = Object.keys(productsByCategory);
    const priorityCategories = ['Granizados', 'granizados', 'Granizado', 'granizado'];
    
    // Ordenar categorías con prioridad para Granizados
    const sortedCategories = [
      ...priorityCategories.filter(cat => categories.includes(cat)),
      ...categories.filter(cat => !priorityCategories.includes(cat)).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
    ];
    
    return [...new Set(sortedCategories)];
  };

  // Función para obtener el emoji de la categoría
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Granizados': '🍧',
      'Sodas': '🥤',
      'Cervezas': '🍺',
      'Jugos': '🧃',
      'Batidos': '🥤',
      'Bebidas': '🥃',
      'default': '🍹'
    };
    return icons[category] || icons['default'];
  };

  // Función para obtener colores del gradiente por categoría
  const getCategoryGradient = (category: string) => {
    const gradients: Record<string, string> = {
      'Granizados': 'from-pink-400 via-purple-400 to-indigo-500',
      'Sodas': 'from-cyan-400 via-blue-400 to-teal-500',
      'Cervezas': 'from-yellow-400 via-orange-400 to-red-500',
      'Jugos': 'from-green-400 via-emerald-400 to-teal-500',
      'Batidos': 'from-purple-400 via-pink-400 to-rose-500',
      'Bebidas': 'from-amber-400 via-orange-400 to-yellow-500',
      'default': 'from-violet-400 via-purple-400 to-indigo-500'
    };
    return gradients[category] || gradients['default'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">🍹</span>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Cargando menú delicioso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-xl">
          <div className="text-6xl mb-4">😞</div>
          <p className="text-gray-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Cocktail Icons */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-8 h-8 text-purple-400 opacity-30 animate-float">🍹</div>
        <div className="absolute top-40 right-32 w-6 h-6 text-yellow-400 opacity-40 animate-float animation-delay-1000">🍧</div>
        <div className="absolute bottom-32 left-16 w-7 h-7 text-pink-400 opacity-35 animate-float animation-delay-2000">🥤</div>
        <div className="absolute top-60 right-20 w-5 h-5 text-blue-400 opacity-30 animate-float animation-delay-3000">🧃</div>
      </div>

      {/* Header Profesional con Título Impactante */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-indigo-900/95 via-purple-900/95 to-pink-900/95 backdrop-blur-lg border-b border-white/20 shadow-2xl">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            {/* Logo y Título Principal */}
            <div className="flex flex-col items-center justify-center gap-6">
              <div className="relative">
                <h1 className="text-6xl md:text-8xl font-black relative tracking-wider">
                  {/* Múltiples capas de efectos neón */}
                  <span className="absolute inset-0 text-6xl md:text-8xl font-black blur-xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 animate-pulse opacity-40"></span>
                  <span className="absolute inset-0 text-6xl md:text-8xl font-black blur-lg bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 animate-pulse animation-delay-500 opacity-60"></span>
                  <span className="absolute inset-0 text-6xl md:text-8xl font-black blur-md bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 animate-pulse animation-delay-1000 opacity-50"></span>
                  
                  {/* Texto principal con gradiente dinámico */}
                  <span className="relative bg-gradient-to-r from-cyan-400 via-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse font-black tracking-wider drop-shadow-2xl">
                    NAXOS
                  </span>
                  
                  {/* Efectos de brillo adicionales */}
                  <span className="absolute inset-0 text-6xl md:text-8xl font-black bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent animate-pulse animation-delay-1500 opacity-80"></span>
                </h1>
                
                {/* Efectos de luz ambiente */}
                <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500 via-blue-500 via-purple-500 to-pink-500 rounded-full opacity-20 animate-ping animation-delay-2000 blur-2xl"></div>
                <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full opacity-30 animate-ping animation-delay-2500 blur-xl"></div>
                
                {/* Línea decorativa */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-white to-transparent opacity-60 animate-pulse"></div>
              </div>
              
              {/* Subtítulo con estilo premium */}
              <div className="text-center mt-4">
                <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-full px-6 py-3 border border-white/30">
                  <span className="text-2xl">🍹</span>
                  <p className="text-xl md:text-2xl font-bold text-white tracking-wide">
                    Carta Premium de Bebidas
                  </p>
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-white/80 font-medium mt-2 text-lg">
                  Sabores únicos • Calidad excepcional
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {getOrderedCategories().map((category) => {
          const products = productsByCategory[category];
          
          // Recopilar todos los sabores únicos de la categoría
          const categoryFlavors = new Set<string>();
          products.forEach(product => {
            const flavors = getFlavorsForProduct(product.product_id);
            flavors.forEach(flavor => categoryFlavors.add(flavor));
          });

          return (
            <div key={category} className="mb-16">
              {/* Header de Categoría Premium */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-6 bg-gradient-to-r from-white/95 to-white/90 backdrop-blur-md rounded-3xl px-10 py-8 shadow-2xl border border-white/60 hover:shadow-3xl transition-all duration-500 hover:scale-105">
                  <div className="relative">
                    <span className="text-5xl filter drop-shadow-lg">{getCategoryIcon(category)}</span>
                    <div className="absolute -inset-2 bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 rounded-full opacity-20 animate-pulse"></div>
                  </div>
                  <div>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-2 tracking-wide">
                      {category}
                    </h2>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse"></div>
                      <p className="text-gray-600 font-bold">
                        {products.length} producto{products.length !== 1 ? 's' : ''} premium
                      </p>
                      <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full animate-pulse animation-delay-500"></div>
                    </div>
                  </div>
                </div>
                
                {/* Sabores de la Categoría */}
                {categoryFlavors.size > 0 && (
                  <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                    <h3 className="text-base font-bold text-gray-700 mb-4 text-center flex items-center justify-center gap-2">
                      <span>🍓</span>
                      <span>Sabores disponibles</span>
                      <span>🍓</span>
                    </h3>
                    <div className="flex flex-wrap justify-center gap-3">
                      {Array.from(categoryFlavors).map((flavor, index) => (
                        <span
                          key={index}
                          className={`inline-block px-4 py-2 text-sm font-semibold rounded-full bg-gradient-to-r ${getCategoryGradient(category)} text-white shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105`}
                        >
                          {flavor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Grid de Productos Mejorado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {products.map((product) => {
                  const variants = getVariantsForProduct(product.product_id);
                  const flavors = getFlavorsForProduct(product.product_id);

                  return (
                    <div
                      key={product.product_id}
                      className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-md rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden group border border-white/60 hover:border-purple-200 hover:scale-[1.02] transform"
                    >
                      {/* Imagen del Producto con Efectos Premium */}
                      <div className="relative h-64 bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full relative">
                            <div className="text-8xl opacity-60 filter drop-shadow-lg">{getCategoryIcon(category)}</div>
                            <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
                          </div>
                        )}
                        
                        {/* Badge de Variantes Mejorado */}
                        <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 backdrop-blur-sm rounded-full px-4 py-2 shadow-xl border border-white/30">
                          <span className="text-sm font-bold text-white flex items-center gap-1">
                            <span>📏</span>
                            {variants.length} tamaño{variants.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        
                        {/* Efecto de luz en la esquina */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/30 to-transparent rounded-bl-full"></div>
                      </div>

                      {/* Contenido de la Card */}
                      <div className="p-8">
                        {/* Título y Descripción Premium */}
                        <div className="mb-8">
                          <h3 className="text-2xl font-black text-gray-800 mb-4 group-hover:text-purple-600 transition-colors duration-300 tracking-wide">
                            {product.name}
                          </h3>
                          {product.description && (
                            <div className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-4 border-l-4 border-purple-400">
                              <p className="text-gray-700 leading-relaxed font-medium">
                                {product.description}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Sabores del Producto (si tiene) */}
                        {flavors.length > 0 && (
                          <div className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-lg">🍓</span>
                              <h4 className="text-sm font-black text-gray-700 uppercase tracking-wide">
                                Sabores Disponibles
                              </h4>
                              <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {flavors.map((flavor, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 px-4 py-3 text-sm font-bold rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:border-purple-300 hover:shadow-md transition-all duration-200"
                                >
                                  <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                                  <span className="text-purple-700">{flavor}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Variantes Premium */}
                        <div className="space-y-5">
                          <div className="flex items-center gap-2 mb-6">
                            <span className="text-lg">📏</span>
                            <h4 className="text-sm font-black text-gray-700 uppercase tracking-wide">
                              Tamaños y Precios
                            </h4>
                            <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
                          </div>
                          {variants.map((variant) => (
                            <div
                              key={variant.variant_id}
                              className="relative bg-gradient-to-br from-white via-gray-50 to-white rounded-3xl p-6 border-2 border-gray-100 hover:border-purple-300 hover:shadow-2xl transition-all duration-300 overflow-hidden group"
                            >
                              {/* Efecto de fondo */}
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              
                              <div className="relative flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-4 mb-4">
                                    <span className="font-black text-xl text-gray-800 tracking-wide">
                                      {variant.variant_name}
                                    </span>
                                    {variant.ounces && (
                                      <span className="text-sm bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 px-4 py-2 rounded-full font-bold border border-blue-200 shadow-sm">
                                        {variant.ounces}oz
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Información de Toppings Premium */}
                                  <div className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-3 border border-orange-200">
                                    <span className="text-orange-600 text-lg">🧁</span>
                                    <span className="text-sm font-bold text-gray-700">
                                      Toppings incluidos:
                                    </span>
                                    <span className="text-sm font-black text-orange-600 bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
                                      {variant.toppings} {variant.toppings === 1 ? 'topping' : 'toppings'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="text-right ml-6">
                                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl px-6 py-3 shadow-xl">
                                    <span className="text-2xl font-black">
                                      ${Number(variant.precio_actual).toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </main>

      {/* Footer Premium */}
      <footer className="bg-gradient-to-r from-indigo-900/95 via-purple-900/95 to-pink-900/95 backdrop-blur-md mt-20 py-16 border-t border-white/20">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-8">
            <div className="text-6xl mb-6 filter drop-shadow-lg">🍹</div>
            <h3 className="text-3xl font-black text-white mb-4 tracking-wide">
              ¡Gracias por visitarnos!
            </h3>
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-6 py-3 border border-white/30">
              <p className="text-white font-bold text-lg">
                Disfruta nuestros productos frescos y naturales
              </p>
            </div>
            <p className="text-white/70 font-medium mt-4 text-lg">
              Hecho con amor en Naxos • Calidad garantizada
            </p>
          </div>
          
          {/* Información adicional */}
          <div className="border-t border-white/20 pt-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🌿</div>
                <h4 className="text-white font-bold mb-2">Ingredientes Naturales</h4>
                <p className="text-white/70 text-sm">Productos frescos y de la mejor calidad</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl mb-3">⚡</div>
                <h4 className="text-white font-bold mb-2">Servicio Rápido</h4>
                <p className="text-white/70 text-sm">Preparamos tu pedido al instante</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl mb-3">💝</div>
                <h4 className="text-white font-bold mb-2">Experiencia Única</h4>
                <p className="text-white/70 text-sm">Sabores que no encontrarás en otro lugar</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
