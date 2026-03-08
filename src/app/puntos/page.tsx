'use client';

import { useCallback, useEffect, useState } from 'react';
import { loyaltyService } from '@/services/loyaltyService';
import type { Reward } from '@/types/loyalty';

// ── Componente Toast para notificaciones ────────────────────────────
type ToastType = 'success' | 'error' | 'info';

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

let toastIdCounter = 0;

function ToastContainer({ toasts, onRemove }: { toasts: ToastData[]; onRemove: (id: number) => void }) {
  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 flex flex-col gap-2">
      {toasts.map((t) => {
        const bg =
          t.type === 'success'
            ? 'from-emerald-600/90 to-green-700/90 border-emerald-400/40'
            : t.type === 'error'
              ? 'from-red-600/90 to-rose-700/90 border-red-400/40'
              : 'from-blue-600/90 to-indigo-700/90 border-blue-400/40';

        const icon = t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️';

        return (
          <div
            key={t.id}
            className={`rounded-2xl border bg-gradient-to-r ${bg} backdrop-blur-xl px-4 py-3 shadow-2xl animate-slide-up flex items-start gap-3`}
          >
            <span className="text-lg mt-0.5">{icon}</span>
            <p className="text-white text-sm font-semibold flex-1">{t.message}</p>
            <button
              onClick={() => onRemove(t.id)}
              className="text-white/60 hover:text-white text-lg leading-none font-bold"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente Spinner ──────────────────────────────────────────────
function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-5 w-5' : 'h-8 w-8';
  return (
    <div className={`${dim} rounded-full border-3 border-white/20 border-t-purple-400 animate-spin`} />
  );
}

// ── Tamaños de granizados (hardcoded para catálogo visual) ──────────
const GRANIZADO_SIZES: { name: string; emoji: string; gradient: string }[] = [
  { name: 'Mini', emoji: '🥤', gradient: 'from-sky-500/30 to-cyan-500/20' },
  { name: 'Pequeño', emoji: '🧊', gradient: 'from-emerald-500/30 to-green-500/20' },
  { name: 'Mediano', emoji: '🍧', gradient: 'from-amber-500/30 to-yellow-500/20' },
  { name: 'Grande', emoji: '🍹', gradient: 'from-pink-500/30 to-rose-500/20' },
];

// ── Página principal ────────────────────────────────────────────────
export default function PuntosPage() {
  // Toast state
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Sección: Registro ─────────────────────────────────────────────
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDoc, setRegDoc] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = regName.trim();
    const phone = regPhone.replace(/\D/g, '');
    const doc = regDoc.replace(/\D/g, '');

    if (!name) {
      showToast('El nombre es obligatorio.', 'error');
      return;
    }
    if (!phone && !doc) {
      showToast('Debes ingresar al menos teléfono o cédula.', 'error');
      return;
    }

    setRegLoading(true);
    try {
      const res = await loyaltyService.register({
        full_name: name,
        ...(phone ? { phone_number: phone } : {}),
        ...(doc ? { document_id: doc } : {}),
      });
      showToast(res.message, 'success');
      setRegName('');
      setRegPhone('');
      setRegDoc('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al registrar.';
      showToast(msg, 'error');
    } finally {
      setRegLoading(false);
    }
  };

  // ── Sección: Consultar puntos ─────────────────────────────────────
  const [checkQuery, setCheckQuery] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<{ name: string; balance: number } | null>(null);

  const handleCheckPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = checkQuery.replace(/\D/g, '');

    if (!q || q.length < 5) {
      showToast('Ingresa un teléfono o cédula válido (mín. 5 dígitos).', 'error');
      return;
    }

    setCheckLoading(true);
    setCheckResult(null);
    try {
      const res = await loyaltyService.checkPoints(q);
      setCheckResult({
        name: res.member.full_name,
        balance: res.member.points_balance,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se encontró el miembro.';
      showToast(msg, 'error');
    } finally {
      setCheckLoading(false);
    }
  };

  // ── Sección: Catálogo de premios ──────────────────────────────────
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await loyaltyService.getRewards();
        setRewards(res.rewards);
      } catch {
        // Si falla, dejamos vacío; se mostrarán los tamaños hardcoded
      } finally {
        setRewardsLoading(false);
      }
    };
    load();
  }, []);

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Blobs decorativos */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="mx-auto max-w-lg px-4 py-4">
          <div className="rounded-3xl border border-white/20 bg-white/10 px-4 py-4 shadow-xl text-center">
            <h1 className="text-4xl sm:text-5xl font-black tracking-[0.18em] neon-title">NAXOS</h1>
            <p className="mt-1 text-purple-200 text-sm font-semibold">
              Programa de Puntos y Recompensas ⭐
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 pb-24 relative z-10 space-y-6">

        {/* ── Sección: Info rápida ───────────────────────────────── */}
        <section className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-lg p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-yellow-400/30 to-amber-500/20 border border-white/20 grid place-items-center text-xl">
              💡
            </div>
            <h2 className="text-xl font-black text-purple-100">¿Cómo funciona?</h2>
          </div>
          <div className="space-y-2 text-sm text-purple-200">
            <p>🎯 Por cada <strong className="text-white">$1.000 COP</strong> en compras, acumulas <strong className="text-yellow-300">1 punto</strong>.</p>
            <p>🎁 Acumula puntos y canjéalos por <strong className="text-white">granizados gratis</strong>.</p>
            <p>📱 Consulta tu saldo en cualquier momento con tu teléfono o cédula.</p>
          </div>
        </section>

        {/* ── Sección: Registro ──────────────────────────────────── */}
        <section className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-lg p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-400/30 to-green-500/20 border border-white/20 grid place-items-center text-xl">
              📝
            </div>
            <h2 className="text-xl font-black text-purple-100">Registrarme</h2>
          </div>

          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1">Nombre completo *</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-purple-400/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1">Teléfono</label>
              <input
                type="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej: 3101234567"
                maxLength={15}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-purple-400/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1">Cédula</label>
              <input
                type="text"
                value={regDoc}
                onChange={(e) => setRegDoc(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej: 1234567890"
                maxLength={20}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-purple-400/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all"
              />
            </div>
            <p className="text-[11px] text-purple-400">* Debes ingresar al menos teléfono o cédula.</p>
            <button
              type="submit"
              disabled={regLoading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-white font-black text-sm shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center gap-2"
            >
              {regLoading ? <Spinner size="sm" /> : null}
              {regLoading ? 'Registrando...' : 'Registrarme'}
            </button>
          </form>
        </section>

        {/* ── Sección: Consultar puntos ──────────────────────────── */}
        <section className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-lg p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-400/30 to-indigo-500/20 border border-white/20 grid place-items-center text-xl">
              🔍
            </div>
            <h2 className="text-xl font-black text-purple-100">Consultar Puntos</h2>
          </div>

          <form onSubmit={handleCheckPoints} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-purple-300 mb-1">Teléfono o Cédula</label>
              <input
                type="text"
                value={checkQuery}
                onChange={(e) => setCheckQuery(e.target.value.replace(/\D/g, ''))}
                placeholder="Ingresa tu teléfono o cédula"
                maxLength={20}
                className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-purple-400/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={checkLoading}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 text-white font-black text-sm shadow-lg shadow-blue-900/30 transition-all flex items-center justify-center gap-2"
            >
              {checkLoading ? <Spinner size="sm" /> : null}
              {checkLoading ? 'Consultando...' : 'Consultar'}
            </button>
          </form>

          {/* Resultado de consulta */}
          {checkResult && (
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-emerald-600/20 to-green-600/10 p-4 animate-slide-up">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-yellow-400/40 to-amber-500/30 border border-yellow-400/30 grid place-items-center text-2xl shadow-lg">
                  ⭐
                </div>
                <div className="flex-1">
                  <p className="text-white font-black text-lg">{checkResult.name}</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-yellow-300">{checkResult.balance}</span>
                    <span className="text-sm font-bold text-purple-300">puntos</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* ── Sección: Catálogo de premios ───────────────────────── */}
        <section className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-lg p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-pink-400/30 to-rose-500/20 border border-white/20 grid place-items-center text-xl">
              🎁
            </div>
            <h2 className="text-xl font-black text-purple-100">Catálogo de Premios</h2>
          </div>

          {rewardsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(rewards.length > 0 ? rewards : []).map((reward, idx) => {
                const sizeInfo = GRANIZADO_SIZES[idx] || GRANIZADO_SIZES[0];
                return (
                  <div
                    key={reward.id}
                    className={`rounded-2xl border border-white/20 bg-gradient-to-br ${sizeInfo.gradient} p-4 shadow-lg hover-lift text-center`}
                  >
                    <div className="text-4xl mb-2">{sizeInfo.emoji}</div>
                    <h3 className="text-white font-black text-base">{reward.reward_name}</h3>
                    <div className="mt-2 inline-flex items-center gap-1 rounded-xl bg-white/10 border border-white/20 px-3 py-1.5">
                      <span className="text-yellow-300 font-black text-lg">{reward.points_cost}</span>
                      <span className="text-purple-300 text-xs font-bold">pts</span>
                    </div>
                  </div>
                );
              })}

              {/* Fallback si no hay rewards en BD */}
              {rewards.length === 0 && !rewardsLoading && (
                <>
                  {[
                    { name: 'Granizado Mini', cost: 100 },
                    { name: 'Granizado Pequeño', cost: 120 },
                    { name: 'Granizado Mediano', cost: 160 },
                    { name: 'Granizado Grande', cost: 220 },
                  ].map((item, idx) => {
                    const sizeInfo = GRANIZADO_SIZES[idx];
                    return (
                      <div
                        key={item.name}
                        className={`rounded-2xl border border-white/20 bg-gradient-to-br ${sizeInfo.gradient} p-4 shadow-lg hover-lift text-center`}
                      >
                        <div className="text-4xl mb-2">{sizeInfo.emoji}</div>
                        <h3 className="text-white font-black text-base">{item.name}</h3>
                        <div className="mt-2 inline-flex items-center gap-1 rounded-xl bg-white/10 border border-white/20 px-3 py-1.5">
                          <span className="text-yellow-300 font-black text-lg">{item.cost}</span>
                          <span className="text-purple-300 text-xs font-bold">pts</span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          <p className="mt-4 text-[11px] text-purple-400 text-center">
            * Presenta tu teléfono o cédula al momento de canjear. Sujeto a disponibilidad.
          </p>
        </section>

        {/* ── Sección: Tabla de acumulación ──────────────────────── */}
        <section className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-lg p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-violet-400/30 to-purple-500/20 border border-white/20 grid place-items-center text-xl">
              📊
            </div>
            <h2 className="text-xl font-black text-purple-100">¿Cuántos puntos gano?</h2>
          </div>
          <div className="rounded-2xl border border-white/20 overflow-hidden">
            <div className="grid grid-cols-2 bg-white/10 px-4 py-3">
              <span className="text-xs font-black text-purple-200 uppercase tracking-wide">Compra</span>
              <span className="text-xs font-black text-purple-200 uppercase tracking-wide text-right">Puntos</span>
            </div>
            <div className="divide-y divide-white/10">
              {[
                { amount: '$5.000', points: '5' },
                { amount: '$10.000', points: '10' },
                { amount: '$20.000', points: '20' },
                { amount: '$50.000', points: '50' },
              ].map((row) => (
                <div key={row.amount} className="grid grid-cols-2 px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors">
                  <span className="text-purple-100 font-bold text-sm">{row.amount} COP</span>
                  <span className="text-yellow-300 font-black text-sm text-right">+{row.points} ⭐</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/20 bg-white/10 backdrop-blur-xl relative z-10">
        <div className="mx-auto max-w-lg px-4 py-6 text-center">
          <div className="inline-block rounded-2xl overflow-hidden shadow-lg bg-white/5 p-2 mb-2">
            <img
              src="/logo-naxos.jpg"
              alt="Logo NAXOS"
              className="h-20 w-auto object-contain rounded-xl"
              draggable={false}
            />
          </div>
          <p className="text-purple-100 font-black text-sm">Programa de Puntos NAXOS</p>
          <p className="text-purple-300 text-xs mt-1">Acumula, canjea y disfruta ✨</p>
        </div>
      </footer>
    </div>
  );
}
