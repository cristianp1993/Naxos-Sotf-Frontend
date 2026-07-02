'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loyaltyService } from '@/services/loyaltyService';
import { AuthService } from '@/services/authService';
import type { LoyaltySearchMember, Reward } from '@/types/loyalty';
import { useToast } from '@/components/ui/toast';
import LoyaltyCustomerSearch from '@/components/LoyaltyCustomerSearch';
import { useAuth } from '@/hooks/useAuth';

type RedeemMode = 'reward' | 'manual';

export default function RedeemPage() {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // ── Cliente unificado ──
  const [selectedMember, setSelectedMember] = useState<LoyaltySearchMember | null>(null);

  // ── Lista de miembros (ADMIN) ──
  const [members, setMembers] = useState<LoyaltySearchMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Redención ──
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rewardsLoading, setRewardsLoading] = useState(true);
  const [redeemMode, setRedeemMode] = useState<RedeemMode>('reward');
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [manualPoints, setManualPoints] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Asignar Puntos (solo ADMIN) ──
  const [assignPoints, setAssignPoints] = useState('');
  const [assignDescription, setAssignDescription] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Cargar catálogo de premios
  useEffect(() => {
    loyaltyService.getRewards()
      .then((res) => setRewards(res.rewards))
      .catch(() => toast.warning('No se pudo cargar el catálogo de premios.'))
      .finally(() => setRewardsLoading(false));
  }, []);

  // Cargar lista completa de miembros (solo ADMIN)
  useEffect(() => {
    if (!isAdmin) return;
    const token = AuthService.getToken();
    if (!token) return;
    setMembersLoading(true);
    loyaltyService.listMembers(token)
      .then((res) => setMembers(res.members))
      .catch(() => toast.warning('No se pudo cargar la lista de miembros.'))
      .finally(() => setMembersLoading(false));
  }, [isAdmin]);

  const handleAdminSearch = (q: string) => {
    setSearchQuery(q);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    const token = AuthService.getToken();
    if (!token) return;
    searchDebounceRef.current = setTimeout(async () => {
      setMembersLoading(true);
      try {
        const res = await loyaltyService.listMembers(token, q || undefined);
        setMembers(res.members);
      } catch { /* silently ignore */ }
      finally { setMembersLoading(false); }
    }, 300);
  };

  const handleSelectMember = useCallback((member: LoyaltySearchMember) => {
    setSelectedMember(member);
    setSelectedReward(null);
    setManualPoints('');
    setAssignPoints('');
    setAssignDescription('');
  }, []);

  const handleClearMember = useCallback(() => {
    setSelectedMember(null);
    setSelectedReward(null);
    setManualPoints('');
    setAssignPoints('');
    setAssignDescription('');
  }, []);

  const handleAssignSubmit = async () => {
    if (!selectedMember || assigning) return;
    const pts = parseInt(assignPoints, 10);
    if (isNaN(pts) || pts <= 0) {
      toast.error('Ingresa una cantidad válida de puntos.');
      return;
    }
    const token = AuthService.getToken();
    if (!token) { toast.error('Sesión no válida.'); return; }
    setAssigning(true);
    try {
      const res = await loyaltyService.assignPoints(
        { member_id: selectedMember.id, points_to_assign: pts, description: assignDescription.trim() || undefined },
        token,
      );
      toast.success(`✅ ${pts} puntos asignados a ${selectedMember.full_name}. Nuevo saldo: ${res.new_balance} pts`, 5000);
      const updated = { ...selectedMember, points_balance: res.new_balance };
      setSelectedMember(updated);
      setMembers((prev) =>
        prev.map((m) => m.id === selectedMember.id ? { ...m, points_balance: res.new_balance } : m)
          .sort((a, b) => b.points_balance - a.points_balance),
      );
      setAssignPoints('');
      setAssignDescription('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al asignar puntos.');
    } finally {
      setAssigning(false);
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-black text-purple-100">⭐ Puntos de Lealtad</h1>
          <p className="text-purple-300 text-sm mt-1">Gestiona canjes y asignación de puntos</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">

        {/* ── Selección de cliente unificada ── */}
        <section className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-lg p-5 shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-400/30 to-indigo-500/20 border border-white/20 grid place-items-center text-xl">
              🔍
            </div>
            <div>
              <h2 className="text-xl font-black text-purple-100">Seleccionar Cliente</h2>
              {isAdmin && !selectedMember && (
                <p className="text-purple-400 text-xs mt-0.5">Listado por mayor a menor saldo — toca para seleccionar</p>
              )}
            </div>
          </div>

          {/* Tarjeta de cliente seleccionado (compartida) */}
          {selectedMember ? (
            <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-emerald-600/15 to-green-600/10 p-4">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-yellow-400/40 to-amber-500/30 border border-yellow-400/30 grid place-items-center text-xl shadow-md">
                  ⭐
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm truncate">{selectedMember.full_name}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-purple-300">
                    {selectedMember.phone_number && <span>📱 {selectedMember.phone_number}</span>}
                    {selectedMember.document_id && <span>🪪 {selectedMember.document_id}</span>}
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-lg font-black text-yellow-300">{selectedMember.points_balance}</span>
                    <span className="text-xs font-bold text-purple-300">puntos</span>
                  </div>
                </div>
                <button
                  onClick={handleClearMember}
                  className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
                  title="Quitar cliente"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ) : isAdmin ? (
            /* ADMIN: lista completa + buscador */
            <>
              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleAdminSearch(e.target.value)}
                  placeholder="Buscar por nombre, teléfono o cédula..."
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-purple-400/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all pr-10"
                />
                {membersLoading && (
                  <div className="absolute right-3 top-3">
                    <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-purple-400 animate-spin" />
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                {membersLoading && members.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-purple-400 animate-spin" />
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-center text-purple-300 text-sm py-6">No se encontraron miembros.</p>
                ) : (
                  <div className="overflow-y-auto max-h-80">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-2 px-4 py-2 border-b border-white/10 text-[11px] font-black text-purple-400 uppercase tracking-wide sticky top-0 bg-slate-900/90 backdrop-blur-sm">
                      <span>#</span>
                      <span>Cliente</span>
                      <span className="text-right">Puntos</span>
                    </div>
                    {members.map((member, i) => (
                      <button
                        key={member.id}
                        onClick={() => handleSelectMember(member)}
                        className="w-full text-left px-4 py-3 hover:bg-white/10 active:bg-white/15 transition-colors border-b border-white/5 last:border-b-0"
                      >
                        <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
                          <span className="text-[10px] font-black text-purple-500 w-5 text-center shrink-0">{i + 1}</span>
                          <div className="min-w-0">
                            <p className="text-white font-bold text-sm truncate">{member.full_name}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-purple-300 mt-0.5">
                              {member.document_id && <span>🪪 {member.document_id}</span>}
                              {member.phone_number && <span>📱 {member.phone_number}</span>}
                            </div>
                          </div>
                          <div className="flex items-baseline gap-1 shrink-0">
                            <span className="text-sm font-black text-yellow-300">{member.points_balance}</span>
                            <span className="text-[10px] text-purple-400 font-bold">pts</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* CASHIER: buscador por nombre/teléfono/cédula */
            <LoyaltyCustomerSearch
              onSelect={handleSelectMember}
              onClear={handleClearMember}
              selectedMember={selectedMember}
            />
          )}
        </section>

        {/* ── Secciones post-selección ── */}
        {selectedMember && (
          <>
            {/* Redención */}
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
            {/* ── Asignar Puntos (ADMIN) ── */}
            {isAdmin && (
              <section className="rounded-3xl border border-blue-400/30 bg-white/10 backdrop-blur-lg p-5 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-400/40 to-indigo-500/30 border border-blue-400/30 grid place-items-center text-xl">
                    ➕
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-purple-100">Asignar Puntos</h2>
                    <p className="text-purple-400 text-xs">Suma puntos manualmente al cliente seleccionado</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-purple-300 mb-1">Puntos a asignar</label>
                    <input
                      type="number"
                      min="1"
                      value={assignPoints}
                      onChange={(e) => setAssignPoints(e.target.value)}
                      placeholder="Ej: 10"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-purple-400/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                    {assignPoints && parseInt(assignPoints, 10) > 0 && (
                      <p className="text-blue-300 text-xs mt-1 font-medium">
                        Nuevo saldo: <span className="text-yellow-300 font-black">{selectedMember.points_balance + parseInt(assignPoints, 10)}</span> pts
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-purple-300 mb-1">Descripción (opcional)</label>
                    <input
                      type="text"
                      value={assignDescription}
                      onChange={(e) => setAssignDescription(e.target.value)}
                      placeholder="Ej: Venta no registrada, bonificación..."
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-purple-400/60 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    />
                  </div>
                  <button
                    onClick={handleAssignSubmit}
                    disabled={assigning || !assignPoints || parseInt(assignPoints, 10) <= 0}
                    className={`w-full py-4 font-black rounded-xl transition-all flex items-center justify-center gap-2 ${
                      assigning || !assignPoints || parseInt(assignPoints, 10) <= 0
                        ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 shadow-lg'
                    }`}
                  >
                    {assigning ? (
                      <><div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />Asignando...</>
                    ) : (
                      '➕ Confirmar Asignación'
                    )}
                  </button>
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <toast.ToastComponent />
    </div>
  );
}
