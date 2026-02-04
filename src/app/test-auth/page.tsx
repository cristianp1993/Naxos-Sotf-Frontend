'use client';

import { useState, useEffect } from 'react';
import { AuthService } from '@/services/authService';

export default function TestAuthPage() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    // Verificar token al cargar
    const currentToken = AuthService.getToken();
    const currentUser = AuthService.getUser();
    
    setToken(currentToken);
    setUser(currentUser);
  }, []);

  const testLogin = async () => {
    try {
      setTestResult('Probando login...');
      const result = await AuthService.login({
        username: '1053824943',
        password: '123456'
      });
      
      setTestResult('✅ Login exitoso');
      setToken(result.token);
      setUser(result.user);
      
      console.log('Token guardado:', result.token);
      console.log('Usuario guardado:', result.user);
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      console.error('Error en login:', error);
    }
  };

  const testLogout = () => {
    AuthService.logout();
    setToken(null);
    setUser(null);
    setTestResult('✅ Sesión cerrada');
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔐 Test de Autenticación</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Estado Actual</h2>
          <div className="space-y-2">
            <p><strong>Token:</strong> {token ? '✅ Existe' : '❌ No existe'}</p>
            <p><strong>Usuario:</strong> {user ? JSON.stringify(user) : '❌ No hay usuario'}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Acciones</h2>
          <div className="space-x-4">
            <button
              onClick={testLogin}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              🔄 Test Login (admin)
            </button>
            <button
              onClick={testLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {testResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Resultado</h2>
            <p>{testResult}</p>
          </div>
        )}

        {token && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Token (primeros 50 chars)</h2>
            <p className="font-mono text-sm bg-gray-100 p-2 rounded">
              {token.substring(0, 50)}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
