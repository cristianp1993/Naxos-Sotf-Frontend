'use client';

import { useEffect, useRef, useState } from 'react';
import { AuthService } from '@/services/authService';

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  onSessionExpired: () => void;
}

// Caracteres sin ambigüedades (sin 0/O, 1/l/I) para que sea fácil de leer y escribir
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%*?-_';

function randomIndex(max: number): number {
  const buf = new Uint32Array(1);
  // Rechazo para evitar sesgo de módulo
  const limit = Math.floor(0xffffffff / max) * max;
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= limit);
  return buf[0] % max;
}

function generateSecurePassword(length = 14): string {
  const all = LOWER + UPPER + DIGITS + SYMBOLS;
  const chars = [
    LOWER[randomIndex(LOWER.length)],
    UPPER[randomIndex(UPPER.length)],
    DIGITS[randomIndex(DIGITS.length)],
    SYMBOLS[randomIndex(SYMBOLS.length)],
  ];
  while (chars.length < length) chars.push(all[randomIndex(all.length)]);
  // Fisher-Yates
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

// Debe coincidir con la validación del backend
const RULES = [
  { id: 'len', label: 'Mínimo 8 caracteres', test: (p: string) => p.length >= 8 && p.length <= 72 },
  { id: 'upper', label: 'Al menos una letra mayúscula', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'special', label: 'Al menos un carácter especial (!@#$%*?-_ …)', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function strengthOf(p: string): { score: number; label: string; color: string } {
  if (!p) return { score: 0, label: '', color: 'bg-white/10' };
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) score++;
  if (/\d/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 2) return { score: 1, label: 'Débil', color: 'bg-red-500' };
  if (score <= 3) return { score: 2, label: 'Aceptable', color: 'bg-yellow-500' };
  if (score <= 4) return { score: 3, label: 'Buena', color: 'bg-lime-500' };
  return { score: 4, label: 'Muy segura', color: 'bg-green-500' };
}

const EyeIcon = ({ off }: { off?: boolean }) => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    {off ? (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    ) : (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    )}
  </svg>
);

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: string;
  inputRef?: React.Ref<HTMLInputElement>;
  invalid?: boolean;
}

function PasswordField({ id, label, value, onChange, visible, onToggle, autoComplete, inputRef, invalid }: PasswordFieldProps) {
  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-purple-200 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={72}
          aria-invalid={invalid || undefined}
          // text-base (16px) evita el zoom automático en iOS
          className={`w-full h-12 pl-4 pr-12 rounded-xl bg-white/10 text-white text-base placeholder-purple-300/50 border outline-none transition-colors focus:bg-white/15 ${
            invalid ? 'border-red-400' : 'border-white/15 focus:border-purple-400'
          }`}
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-purple-300 hover:text-white"
        >
          <EyeIcon off={visible} />
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordModal({ open, onClose, onSessionExpired }: ChangePasswordModalProps) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // El padre monta el modal solo cuando está abierto, así el estado siempre arranca limpio
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => firstInputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [open]);

  // Bloquear scroll del fondo y cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, submitting, onClose]);

  if (!open) return null;

  const rulesOk = RULES.every((r) => r.test(next));
  const matches = next.length > 0 && next === confirm;
  const differs = next !== current;
  const canSubmit = current.length > 0 && rulesOk && matches && differs && !submitting;
  const strength = strengthOf(next);

  const handleGenerate = () => {
    const pwd = generateSecurePassword();
    setNext(pwd);
    setConfirm(pwd);
    setShowNew(true);
    setCopied(false);
    setError('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(next);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permiso de portapapeles: la contraseña ya está visible para copiarla a mano
      setShowNew(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    const result = await AuthService.changePassword(current, next);
    setSubmitting(false);

    if (result.sessionExpired) {
      onClose();
      onSessionExpired();
      return;
    }
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSuccess(true);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-gradient-to-b from-slate-900 to-purple-950 border border-white/10 rounded-t-3xl sm:rounded-2xl shadow-2xl pb-[env(safe-area-inset-bottom)]"
      >
        {/* Handle visual en móvil */}
        <div className="sm:hidden flex justify-center pt-3">
          <span className="w-10 h-1.5 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between px-5 pt-4 sm:pt-5">
          <h2 id="change-password-title" className="text-lg font-bold text-white">
            🔒 Cambiar contraseña
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Cerrar"
            className="w-10 h-10 -mr-2 flex items-center justify-center rounded-full text-purple-300 hover:text-white hover:bg-white/10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {success ? (
          <div className="px-5 pt-6 pb-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center text-3xl">✅</div>
            <p className="mt-4 text-white font-semibold text-lg">¡Contraseña actualizada!</p>
            <p className="mt-1 text-purple-200 text-sm">Úsala la próxima vez que inicies sesión.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold active:scale-[0.98] transition-transform"
            >
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-5 pt-4 pb-6 space-y-4" noValidate>
            <PasswordField
              id="cp-current"
              label="Contraseña actual"
              value={current}
              onChange={(v) => {
                setCurrent(v);
                setError('');
              }}
              visible={showCurrent}
              onToggle={() => setShowCurrent((v) => !v)}
              autoComplete="current-password"
              inputRef={firstInputRef}
            />

            <div>
              <div className="flex items-end justify-between gap-2 mb-1.5">
                <label htmlFor="cp-new" className="text-sm font-medium text-purple-200">Nueva contraseña</label>
                <button
                  type="button"
                  onClick={handleGenerate}
                  className="text-sm font-semibold text-pink-300 hover:text-pink-200 px-2 py-1 -my-1 rounded-lg hover:bg-white/10"
                >
                  ✨ Generar segura
                </button>
              </div>
              <PasswordField
                id="cp-new"
                label=""
                value={next}
                onChange={(v) => {
                  setNext(v);
                  setCopied(false);
                  setError('');
                }}
                visible={showNew}
                onToggle={() => setShowNew((v) => !v)}
                autoComplete="new-password"
                invalid={next.length > 0 && (!rulesOk || !differs)}
              />

              {/* Medidor de fortaleza */}
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 grid grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <span
                      key={i}
                      className={`h-1.5 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-white/10'}`}
                    />
                  ))}
                </div>
                <span className="text-xs text-purple-200 w-20 text-right">{strength.label}</span>
              </div>

              {next && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="mt-2 text-xs font-medium text-purple-200 hover:text-white underline underline-offset-2"
                >
                  {copied ? '✓ Copiada al portapapeles' : 'Copiar contraseña'}
                </button>
              )}

              <ul className="mt-2 space-y-1">
                {RULES.map((r) => {
                  const ok = r.test(next);
                  return (
                    <li key={r.id} className={`text-xs flex items-center gap-1.5 ${ok ? 'text-green-300' : 'text-purple-300/70'}`}>
                      <span aria-hidden="true">{ok ? '✓' : '•'}</span>
                      {r.label}
                    </li>
                  );
                })}
                {next.length > 0 && !differs && (
                  <li className="text-xs text-red-300">Debe ser diferente a la actual</li>
                )}
              </ul>
            </div>

            <div>
              <PasswordField
                id="cp-confirm"
                label="Confirmar nueva contraseña"
                value={confirm}
                onChange={(v) => {
                  setConfirm(v);
                  setError('');
                }}
                visible={showNew}
                onToggle={() => setShowNew((v) => !v)}
                autoComplete="new-password"
                invalid={confirm.length > 0 && !matches}
              />
              {confirm.length > 0 && !matches && (
                <p className="mt-1.5 text-xs text-red-300">Las contraseñas no coinciden</p>
              )}
            </div>

            {error && (
              <div role="alert" className="rounded-xl bg-red-500/15 border border-red-400/40 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              {submitting && (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {submitting ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
