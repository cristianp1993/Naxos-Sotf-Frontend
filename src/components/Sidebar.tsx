'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';

// Iconos SVG para el sidebar
const DashboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z"
    />
  </svg>
);

const ProductIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

const CategoryIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
    />
  </svg>
);

const FlavorIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
    />
  </svg>
);

const LinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
    />
  </svg>
);

// Icono simple para Variantes (puedes cambiarlo si quieres)
const VariantsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 7h6M4 17h6M14 7h6M14 17h6M10 7v10M14 7v10"
    />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
);

const InventoryIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

const OrdersIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
    />
  </svg>
);

const ReportsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const LogoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[];
  description?: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'menu',
    label: 'Carta/Menú',
    icon: ProductIcon,
    path: '/carta',
    roles: ['ADMIN', 'MANAGER', 'CASHIER', 'VIEWER'],
    description: 'Ver carta de productos'
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: DashboardIcon,
    path: '/admin',
    roles: ['ADMIN'],
    description: 'Vista general del sistema'
  },

  // ✅ "Productos" ya no va como item normal: ahora es un submenú colapsable.

  {
    id: 'users',
    label: 'Usuarios',
    icon: UsersIcon,
    path: '/admin/users',
    roles: ['ADMIN'],
    description: 'Gestión de usuarios'
  },

  // ✅ "Categorías" ya NO va aquí: se movió dentro de Productos.

  {
    id: 'inventory',
    label: 'Inventario',
    icon: InventoryIcon,
    path: '/admin/inventory',
    roles: ['ADMIN'],
    description: 'Control de stock'
  },
  {
    id: 'orders',
    label: 'Ventas',
    icon: OrdersIcon,
    path: '/pos',
    roles: ['ADMIN', 'MANAGER', 'CASHIER'],
    description: 'Realizar pedidos'
  },
  {
    id: 'reports',
    label: 'Reportes',
    icon: ReportsIcon,
    path: '/admin/reports',
    roles: ['ADMIN'],
    description: 'Reportes y estadísticas'
  }
];

// ✅ Subitems del collapsable "Productos" (incluye Categorías)
const productSubItems: MenuItem[] = [
  {
    id: 'products-inner',
    label: 'Producto',
    icon: ProductIcon,
    path: '/admin/products',
    roles: ['ADMIN'],
    description: 'Gestión de productos'
  },
  {
    id: 'categories-inner',
    label: 'Categorías',
    icon: CategoryIcon,
    path: '/admin/categories',
    roles: ['ADMIN'],
    description: 'Categorías de productos'
  },
  {
    id: 'flavors',
    label: 'Sabores',
    icon: FlavorIcon,
    path: '/admin/flavors',
    roles: ['ADMIN'],
    description: 'Gestión de sabores'
  },
  {
    id: 'product-flavors',
    label: 'Asociar Sabores',
    icon: LinkIcon,
    path: '/admin/product-flavors',
    roles: ['ADMIN'],
    description: 'Vincular sabores a productos'
  },
  {
    id: 'variants',
    label: 'Variantes',
    icon: VariantsIcon,
    path: '/admin/variants', // 👈 ajusta si tu ruta es otra
    roles: ['ADMIN'],
    description: 'Variantes por producto'
  }
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(true);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (!user) return null;

  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(user.role));
  const filteredProductSubItems = productSubItems.filter((item) => item.roles.includes(user.role));

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const isActive = (path: string) => {
    if (path === '/admin') return pathname === '/admin';
    if (path === '/pos') return pathname.startsWith('/pos');
    if (path === '/carta') return pathname.startsWith('/carta');
    return pathname.startsWith(path);
  };

  const isProductsSectionActive = filteredProductSubItems.some((s) => isActive(s.path));

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 
        ${collapsed ? 'w-20' : 'w-80'}
        bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 
        transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 
        transition-all duration-300 ease-in-out lg:transition-none
        border-r border-white/10 backdrop-blur-xl
        flex flex-col h-full max-h-screen
      `}
      >
        {/* Header */}
        <div className={`border-b border-white/10 ${collapsed ? 'p-4' : 'p-6'}`}>
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M8 21h8M12 17v4M7 3h10l1 5H6l1-5z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              {!collapsed && (
                <div>
                  <h2 className="text-white font-bold text-lg">NAXOS</h2>
                  <p className="text-purple-300 text-sm">Panel de Control</p>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Desktop toggle button */}
              <button
                onClick={onToggle}
                className="hidden lg:flex text-purple-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                title={collapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
              >
                {collapsed ? (
                  <ChevronRightIcon className="w-5 h-5" />
                ) : (
                  <ChevronLeftIcon className="w-5 h-5" />
                )}
              </button>

              {/* Mobile close button */}
              <button
                onClick={() => setIsOpen(false)}
                className="lg:hidden text-purple-300 hover:text-white transition-colors"
              >
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {/* Items normales */}
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigation(item.path)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl mb-2 transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-purple-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}

          {/* ✅ Collapsable: Productos */}
          {filteredProductSubItems.length > 0 && (
            <div className="mb-2">
              <button
                onClick={() => setProductsOpen((v) => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 ${
                  isProductsSectionActive
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-purple-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <ProductIcon className="w-5 h-5" />
                  {!collapsed && <span className="font-medium">Productos</span>}
                </div>

                {!collapsed && (
                  <ChevronDownIcon
                    className={`w-5 h-5 transition-transform duration-200 ${productsOpen ? 'rotate-180' : 'rotate-0'}`}
                  />
                )}
              </button>

              {/* Submenu */}
              {!collapsed && productsOpen && (
                <div className="mt-2 ml-4 pl-2 border-l border-white/10">
                  {filteredProductSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    return (
                      <button
                        key={sub.path}
                        onClick={() => handleNavigation(sub.path)}
                        className={`w-full flex items-center space-x-3 px-4 py-2 rounded-xl mb-2 transition-all duration-200 ${
                          isActive(sub.path)
                            ? 'bg-white/15 text-white'
                            : 'text-purple-200 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <SubIcon className="w-5 h-5" />
                        <span className="font-medium">{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Logout Button */}
        <div className={`p-4 ${collapsed ? 'flex justify-center' : 'flex flex-col items-center'} border-t border-white/10`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogoutIcon className="w-5 h-5 text-purple-300" />
            {!collapsed && <span className="text-purple-300 font-medium">Cerrar Sesión</span>}
          </button>
        </div>
      </div>
    </>
  );
}
