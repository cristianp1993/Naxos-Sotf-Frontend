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

  // Helper functions to get related data
  const getVariantsForProduct = (productId: number): Variant[] => {
    return menuData?.variantes.filter(v => v.product_id === productId) || [];
  };

  const getFlavorsForProduct = (productId: number): string[] => {
    const flavorData = menuData?.sabores.find(f => f.product_id === productId);
    return flavorData?.sabores_activos || [];
  };

  // Group products by category
  const productsByCategory = menuData?.productos.reduce((acc, product) => {
    if (!acc[product.categoria]) {
      acc[product.categoria] = [];
    }
    acc[product.categoria].push(product);
    return acc;
  }, {} as Record<string, Product[]>) || {};

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando menú delicioso...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">❌</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              🍹 NAXOS
            </h1>
            <p className="text-lg md:text-xl text-gray-600 font-medium">
              Granizados Artesanales
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Frescos • Naturales • Deliciosos
            </p>
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="container mx-auto px-4 py-8">
        {Object.entries(productsByCategory).map(([category, products]) => (
          <div key={category} className="mb-12">
            {/* Category Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                {category}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-pink-400 mx-auto rounded-full"></div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const variants = getVariantsForProduct(product.product_id);
                const flavors = getFlavorsForProduct(product.product_id);

                return (
                  <div
                    key={product.product_id}
                    className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-6xl">🍹</div>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                        <span className="text-xs font-semibold text-gray-700">
                          {variants.length} tamaño{variants.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                        {product.name}
                      </h3>

                      {product.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      {/* Variants */}
                      <div className="space-y-3 mb-4">
                        {variants.map((variant) => (
                          <div key={variant.variant_id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                            <div>
                              <span className="font-medium text-gray-800">
                                {variant.variant_name}
                              </span>
                              {variant.ounces && (
                                <span className="text-xs text-gray-500 ml-2">
                                  ({variant.ounces}oz)
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-lg text-blue-600">
                              ${Number(variant.precio_actual).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Flavors */}
                      {flavors.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Sabores disponibles:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {flavors.map((flavor, index) => (
                              <span
                                key={index}
                                className="inline-block bg-gradient-to-r from-pink-100 to-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full font-medium"
                              >
                                {flavor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm mt-16 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600 mb-2">
            🍹 Disfruta de nuestros granizados artesanales 🍹
          </p>
          <p className="text-sm text-gray-500">
            Hechos con los mejores ingredientes naturales
          </p>
        </div>
      </footer>
    </div>
  );
}
