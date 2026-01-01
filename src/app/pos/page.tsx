'use client';

export default function POSPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
        <h1 className="text-3xl font-bold text-white mb-2">Punto de Venta</h1>
        <p className="text-purple-200">Sistema de gestión de pedidos y ventas</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Nuevo Pedido</h3>
              <p className="text-green-100 text-sm">Crear un pedido</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-6 text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Ver Pedidos</h3>
              <p className="text-blue-100 text-sm">Lista de pedidos</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Ventas del Día</h3>
              <p className="text-purple-100 text-sm">Resumen de ventas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Current Orders */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20">
        <h2 className="text-xl font-semibold text-white mb-4">Pedidos Activos</h2>
        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">#001</span>
                </div>
                <div>
                  <p className="text-white font-medium">Mesa 5</p>
                  <p className="text-purple-300 text-sm">Granizado de fresa x2</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">$15.000</p>
                <p className="text-green-400 text-sm">En preparación</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">#002</span>
                </div>
                <div>
                  <p className="text-white font-medium">Llevar</p>
                  <p className="text-purple-300 text-sm">Cerveza + Nachos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">$25.000</p>
                <p className="text-green-400 text-sm">Listo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
