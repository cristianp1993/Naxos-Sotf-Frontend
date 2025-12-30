'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFormValidation } from '@/hooks/useFormValidation';

// Iconos SVG simples
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m3.121 3.121l-4.242 4.242M9.878 9.878l-3.121 3.121" />
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CocktailIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 21h8M12 17v4M7 3h10l1 5H6l1-5zM6.5 12.5l2-2 2 2M14.5 12.5l-2-2-2 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const WineIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 2h12v2c0 4.418-3.582 8-8 8s-8-3.582-8-8V2zm4 0l2 18h4l2-18H10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const CoffeeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18 8h1a4 4 0 010 8h-1m2-8h-5a2 2 0 00-2 2v6a2 2 0 002 2h5a2 2 0 002-2V10a2 2 0 00-2-2zm-8 0H6a2 2 0 00-2 2v6a2 2 0 002 2h4a2 2 0 002-2V10a2 2 0 00-2-2zm4-2h4a2 2 0 012 2v1H6V8a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

// Reglas de validación
const validationRules = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/,
    custom: (value: string) => {
      if (value.length < 3) return 'El usuario debe tener al menos 3 caracteres';
      return true;
    }
  },
  password: {
    required: true,
    minLength: 6,
    custom: (value: string) => {
      if (value.length < 6) return 'La contraseña debe tener al menos 6 caracteres';
      return true;
    }
  }
};

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [authError, setAuthError] = useState('');
  
  const { login } = useAuth();
  const {
    getFieldError,
    isFieldValid,
    setFieldTouched,
    validateForm
  } = useFormValidation(validationRules);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setAuthError('');

    // Marcar campos como tocados
    setFieldTouched('username');
    setFieldTouched('password');

    // Validar formulario
    const formData = { username, password };
    if (!validateForm(formData)) {
      setIsLoading(false);
      return;
    }

    try {
      await login(username, password);
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
    if (error || authError) {
      setError('');
      setAuthError('');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (error || authError) {
      setError('');
      setAuthError('');
    }
  };

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
        <CocktailIcon className="absolute top-20 left-20 w-8 h-8 text-purple-400 opacity-30 animate-float" />
        <WineIcon className="absolute top-40 right-32 w-6 h-6 text-yellow-400 opacity-40 animate-float animation-delay-1000" />
        <CoffeeIcon className="absolute bottom-32 left-16 w-7 h-7 text-pink-400 opacity-35 animate-float animation-delay-2000" />
        <CocktailIcon className="absolute top-60 right-20 w-5 h-5 text-blue-400 opacity-30 animate-float animation-delay-3000" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <CocktailIcon className="w-16 h-16 text-purple-400 animate-pulse" />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-pink-500 rounded-full animate-ping"></div>
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-yellow-500 bg-clip-text text-transparent mb-2">
            NAXOS
          </h1>
          <p className="text-xl md:text-2xl text-purple-200 font-light tracking-wider">
            COCTELS
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 animate-slide-up">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="relative group">
                <UserIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                  getFieldError('username') ? 'text-red-400' : 'text-purple-300 group-focus-within:text-purple-400'
                }`} />
                <input
                  type="text"
                  placeholder="Usuario"
                  value={username}
                  onChange={handleUsernameChange}
                  onBlur={() => setFieldTouched('username')}
                  className={`w-full pl-12 pr-4 py-4 bg-white/5 border rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm ${
                    getFieldError('username') 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-purple-500 focus:border-transparent'
                  }`}
                  required
                  disabled={isLoading}
                />
                {getFieldError('username') && (
                  <div className="absolute top-full left-0 right-0 mt-2 text-red-300 text-sm animate-shake">
                    {getFieldError('username')}
                  </div>
                )}
              </div>

              {/* Password Field */}
              <div className="relative group">
                <LockIcon className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors ${
                  getFieldError('password') ? 'text-red-400' : 'text-purple-300 group-focus-within:text-purple-400'
                }`} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => setFieldTouched('password')}
                  className={`w-full pl-12 pr-12 py-4 bg-white/5 border rounded-2xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 transition-all duration-300 backdrop-blur-sm ${
                    getFieldError('password') 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-white/20 focus:ring-purple-500 focus:border-transparent'
                  }`}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-purple-400 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
                {getFieldError('password') && (
                  <div className="absolute top-full left-0 right-0 mt-2 text-red-300 text-sm animate-shake">
                    {getFieldError('password')}
                  </div>
                )}
              </div>

              {/* Auth Error Message */}
              {authError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm animate-shake">
                  {authError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isFieldValid('username') || !isFieldValid('password')}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Autenticando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <CocktailIcon className="w-5 h-5 mr-2" />
                    Ingresar
                  </div>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-purple-300 text-sm">
                Sistema de gestión para bar
              </p>
              <div className="flex justify-center space-x-4 mt-4">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse animation-delay-500"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse animation-delay-1000"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
      </div>
    </div>
  );
}
