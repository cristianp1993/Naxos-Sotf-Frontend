'use client';

import { useCallback, useEffect, useState } from 'react';
import { loyaltyService } from '@/services/loyaltyService';
import { AuthService } from '@/services/authService';
import type { LoyaltySearchMember, Reward } from '@/types/loyalty';
import { useToast } from '@/components/ui/toast';
import LoyaltyCustomerSearch from '@/components/LoyaltyCustomerSearch';

type RedeemMode = 'reward' | 'manual';

export default function RedeemPage() {
  const toast = useToast();

  // Estado del cliente
  const [selectedMember, setSelectedMember] = useState<LoyaltySearchMember | null>(null);

  // Catálogo de premios
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);

  // Modo de redención
  const [redeemMode, setRedeemMode] = useState<RedeemMode>('reward');

  // Redimir por premio
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);

  // Redimir por puntos manuales
  const [manualPoints, setManualPoints] = useState('');
  const [manualDescription, setManualDescription] = useState('');

  // Estado de envío
  const [submitting, setSubmitting] = useState(false);

  // Cargar catálogo
  useEffect(() => {
    const load = async () => {
      try {
        const res = await loyaltyService.getRewards();
        setRewards(res.rewards);
      } catch {
        toast.warning('No se pudo cargar el catálogo de premios.');
      } finally {
        setRewardsLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectMember = useCallback((member: LoyaltySearchMember) => {
    setSelectedMember(member);
    setSelectedReward(null);
    setManualPoints('');
  }, []);

  const handleClearMember = useCallback(() => {
    setSelectedMember(null);
    setSelectedReward(null);
    setManualPoints('');
  }, []);

  const canRedeem = (): boolean => {
    if (!selectedMember || selectedMember.points_balance <= 0) return false;
    if (redeemMode === 'reward') {
      return !!selectedReward && selectedMember.points_balance >= selectedReward.points_cost;
    }
    const pts = parseInt(manualPoints, 10);
    return !isNaN(pts) && pts > 0 && pts <= selectedMember.points_balance;
  };

  const handleRedeem = async () => {
    if (!selectedMember || submitting) return;

    const token = AuthService.getToken();
    if (!token) {
      toast.error('Sesión no válida. Inicia sesión nuevamente.');
      return;
    }

    setSubmitting(true);
    try {
      if (redeemMode === 'reward' && selectedReward) {
        const res = await loyaltyService.redeem({
          member_id: selectedMember.id,
          reward_id: selectedReward.id,
        }, token);

        toast.success(`✅ ${res.points_spent} puntos redimidos para ${selectedMember.full_name}. Premio: ${res.reward_name}. Saldo: ${res.new_balance}`, 5000);

        // Actualizar saldo local
        setSelectedMember({ ...selectedMember, points_balance: res.new_balance });
        setSelectedReward(null);
      } else {
        const pts = parseInt(manualPoints, 10);
        if (isNaN(pts) || pts <= 0) {
          toast.error('Ingresa una cantidad válida de puntos.');
          setSubmitting(false);
          return;
        }

        const res = await loyaltyService.redeem({
          member_id: selectedMember.id,
          points_to_redeem: pts,
          description: manualDescription.trim() || undefined,
        }, token);

        toast.success(`✅ ${res.points_spent} puntos redimidos para ${selectedMember.full_name}. Saldo restante: ${res.new_balance}`, 5000);

        setSelectedMember({ ...selectedMember, points_balance: res.new_balance });
        setManualPoints('');
        setManualDescription('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al redimir puntos.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/10 border-b border-white/20">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <h1 className="text-2xl sm:text-3xl font-black text-purple-100">⭐ Redimir Puntos</h1>
          <p className="text-purple-300 text-sm mt-1">Busca al cliente y redime sus puntos por premios</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">

        {/* Buscar cliente */}
        <section className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-lg p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-400/30 to-indigo-500/20 border border-white/20 grid place-items-center text-xl">
              🔍
            </div>
            <h2 className="text-xl font-black text-purple-100">Buscar Cliente</h2>
          </div>
          <LoyaltyCustomerSearch
            onSelect={handleSelectMember}
            onClear={handleClearMember}
            selectedMember={selectedMember}
          />
        </section>

        {/* Formulario de redención — solo si hay cliente seleccionado */}
        {selectedMember && (
          <>
            {selectedMember.points_balance <= 0 ? (
              <section className="rounded-3xl border border-yellow-400/20 bg-yellow-500/10 backdrop-blur-lg p-5 shadow-xl text-center">
                <p className="text-yellow-200 font-bold text-sm">⚠️ Este cliente no tiene puntos disponibles para redimir.</p>
              </section>
            ) : (
              <>
                {/* Selector de modo */}
                <section className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-lg p-5 shadow-xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-pink-400/30 to-rose-500/20 border border-white/20 grid place-items-center text-xl">
                      🎁
                    </div>
                    <h2 className="text-xl font-black text-purple-100">Tipo de Redención</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-5">
                    <button
                      onClick={() => { setRedeemMode('reward'); setManualPoints(''); }}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        redeemMode === 'reward'
                          ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg border-2 border-pink-300'
                          : 'bg-white/10 text-purple-200 border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      🎁 Por Premio
                    </button>
                    <button
                      onClick={() => { setRedeemMode('manual'); setSelectedReward(null); }}
                      className={`p-3 rounded-xl font-bold text-sm transition-all ${
                        redeemMode === 'manual'
                          ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg border-2 border-purple-300'
                          : 'bg-white/10 text-purple-200 border border-white/20 hover:bg-white/20'
                      }`}
                    >
                      🔢 Por Puntos
                    </button>
                  </div>

                  {/* Modo: Por premio */}
                  {redeemMode === 'reward' && (
                    <div className="space-y-3">
                      {rewardsLoading ? (
                        <div className="flex justify-center py-6">
                          <div className="h-8 w-8 rounded-full border-3 border-white/20 border-t-purple-400 animate-spin" />
                        </div>
                      ) : rewards.length === 0 ? (
                        <p className="text-purple-300 text-sm text-center py-4">No hay premios disponibles en el catálogo.</p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {rewards.map((reward) => {
                            const affordable = selectedMember.points_balance >= reward.points_cost;
                            const isSelected = selectedReward?.id === reward.id;
                            return (
                              <button
                                key={reward.id}
                                onClick={() => affordable && setSelectedReward(isSelected ? null : reward)}
                                disabled={!affordable}
                                className={`text-left p-4 rounded-2xl border transition-all ${
                                  isSelected
                                    ? 'border-green-400 bg-green-500/20 shadow-lg ring-1 ring-green-400/30'
                                    : affordable
                                      ? 'border-white/20 bg-white/5 hover:bg-white/10'
                                      : 'border-white/10 bg-white/5 opacity-50 cursor-not-allowed'
                                }`}
                              >
                                <p className="text-white font-bold text-sm">{reward.reward_name}</p>
                                <div className="flex items-baseline gap-1 mt-1">
                                  <span className={`text-lg font-black ${affordable ? 'text-yellow-300' : 'text-purple-400'}`}>
                                    {reward.points_cost}
                                  </span>
                                  <span className="text-xs text-purple-300 font-bold">pts</span>
                                </div>
                                {!affordable && (
                                  <p className="text-red-400/80 text-[11px] mt-1">Puntos insuficientes</p>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Modo: Por puntos */}
                  {redeemMode === 'manual' && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-purple-300 mb-1">
                          Puntos a redimir (máx. {selectedMember.points_balance})
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={selectedMember.points_balance}
                          value={manualPoints}
                          onChange={(e) => setManualPoints(e.target.value)}
                          placeholder="Ej: 50"
                          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-purple-400/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                        {manualPoints && parseInt(manualPoints, 10) > selectedMember.points_balance && (
                          <p className="text-red-400 text-xs mt-1 font-medium">Excede el saldo disponible.</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-purple-300 mb-1">Descripción (opcional)</label>
                        <input
                          type="text"
                          value={manualDescription}
                          onChange={(e) => setManualDescription(e.target.value)}
                          placeholder="Ej: Canje especial, cortesía..."
                          className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-purple-400/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* Resumen y confirmar */}
                <section className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-lg p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-purple-100">Resumen</h3>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-300">Cliente</span>
                      <span className="text-white font-bold">{selectedMember.full_name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-300">Saldo actual</span>
                      <span className="text-yellow-300 font-black">{selectedMember.points_balance} pts</span>
                    </div>
                    {redeemMode === 'reward' && selectedReward && (
                      <>
                        <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                          <span className="text-purple-300">Premio</span>
                          <span className="text-white font-bold">{selectedReward.reward_name}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-300">Costo</span>
                          <span className="text-red-400 font-black">-{selectedReward.points_cost} pts</span>
                        </div>
                        <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                          <span className="text-purple-300">Saldo restante</span>
                          <span className="text-emerald-400 font-black">
                            {selectedMember.points_balance - selectedReward.points_cost} pts
                          </span>
                        </div>
                      </>
                    )}
                    {redeemMode === 'manual' && manualPoints && parseInt(manualPoints, 10) > 0 && (
                      <>
                        <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                          <span className="text-purple-300">Puntos a redimir</span>
                          <span className="text-red-400 font-black">-{manualPoints} pts</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-purple-300">Saldo restante</span>
                          <span className="text-emerald-400 font-black">
                            {selectedMember.points_balance - parseInt(manualPoints, 10)} pts
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleRedeem}
                    disabled={!canRedeem() || submitting}
                    className={`w-full py-4 font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                      !canRedeem() || submitting
                        ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      '✅ Confirmar Redención'
                    )}
                  </button>
                </section>
              </>
            )}
          </>
        )}
      </main>

      <toast.ToastComponent />
    </div>
  );
}
