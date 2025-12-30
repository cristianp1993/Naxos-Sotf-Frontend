'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import LoginPage from './login/page';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Si el usuario está autenticado, se puede redirigir a /carta
    // Por ahora mantenemos el login siempre visible
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando...</div>
      </div>
    );
  }

  return <LoginPage />;
}
