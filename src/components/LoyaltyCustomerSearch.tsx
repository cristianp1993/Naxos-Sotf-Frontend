'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { loyaltyService } from '@/services/loyaltyService';
import { AuthService } from '@/services/authService';
import type { LoyaltySearchMember } from '@/types/loyalty';

interface LoyaltyCustomerSearchProps {
  onSelect: (member: LoyaltySearchMember) => void;
  onClear: () => void;
  selectedMember: LoyaltySearchMember | null;
  compact?: boolean;
}

export default function LoyaltyCustomerSearch({
  onSelect,
  onClear,
  selectedMember,
  compact = false,
}: LoyaltyCustomerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LoyaltySearchMember[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cerrar resultados al clicar fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setNoResults(false);
      setShowResults(false);
      return;
    }

    const token = AuthService.getToken();
    if (!token) return;

    setSearching(true);
    setNoResults(false);
    try {
      const res = await loyaltyService.searchMembers(q, token);
      setResults(res.members);
      setNoResults(res.members.length === 0);
      setShowResults(true);
    } catch {
      setResults([]);
      setNoResults(true);
      setShowResults(true);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const handleSelect = (member: LoyaltySearchMember) => {
    onSelect(member);
    setQuery('');
    setResults([]);
    setShowResults(false);
    setNoResults(false);
  };

  const handleClear = () => {
    onClear();
    setQuery('');
    setResults([]);
    setShowResults(false);
    setNoResults(false);
  };

  // Si ya hay un miembro seleccionado, mostrar su tarjeta
  if (selectedMember) {
    return (
      <div className={`rounded-2xl border border-emerald-400/30 bg-gradient-to-r from-emerald-600/15 to-green-600/10 ${compact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center gap-3">
          <div className={`${compact ? 'h-9 w-9' : 'h-11 w-11'} rounded-xl bg-gradient-to-br from-yellow-400/40 to-amber-500/30 border border-yellow-400/30 grid place-items-center text-lg shadow-md`}>
            ⭐
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{selectedMember.full_name}</p>
            <div className="flex items-center gap-2 text-xs text-purple-300">
              {selectedMember.phone_number && <span>📱 {selectedMember.phone_number}</span>}
              {selectedMember.document_id && <span>🪪 {selectedMember.document_id}</span>}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-yellow-300">{selectedMember.points_balance}</span>
              <span className="text-xs font-bold text-purple-300">puntos</span>
            </div>
          </div>
          <button
            onClick={handleClear}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
            title="Quitar cliente"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => { if (results.length > 0 || noResults) setShowResults(true); }}
          placeholder="Buscar por nombre, teléfono o cédula..."
          className={`w-full rounded-xl border border-white/20 bg-white/10 text-white placeholder-purple-400/60 font-medium focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50 transition-all ${compact ? 'px-3 py-2.5 text-sm pr-9' : 'px-4 py-3 text-sm pr-10'}`}
        />
        {searching && (
          <div className={`absolute ${compact ? 'right-2.5 top-2.5' : 'right-3 top-3'}`}>
            <div className="h-5 w-5 rounded-full border-2 border-white/20 border-t-purple-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown de resultados */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 z-30 rounded-xl border border-white/20 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
          {noResults ? (
            <div className="px-4 py-4 text-center">
              <p className="text-purple-300 text-sm font-medium">No se encontró el cliente.</p>
              <p className="text-purple-400/70 text-xs mt-1">
                Invítalo a registrarse en <span className="text-yellow-300 font-bold">/puntos</span>
              </p>
            </div>
          ) : (
            results.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelect(member)}
                className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-bold text-sm truncate">{member.full_name}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-purple-300 mt-0.5">
                      {member.phone_number && <span>📱 {member.phone_number}</span>}
                      {member.document_id && <span>🪪 {member.document_id}</span>}
                    </div>
                  </div>
                  <div className="flex items-baseline gap-1 shrink-0">
                    <span className="text-sm font-black text-yellow-300">{member.points_balance}</span>
                    <span className="text-[10px] text-purple-400 font-bold">pts</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
