'use client';

import React, { ReactNode } from 'react';

interface CollapsibleSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
  hasData?: boolean;
  isRequired?: boolean;
  description?: string;
  badgeText?: string;
}

export default function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  className = '',
  hasData = false,
  isRequired = false,
  description,
  badgeText
}: CollapsibleSectionProps) {
  return (
    <div className={`bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden ${className}`}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-white/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-inset"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              {title}
              {isRequired && <span className="text-red-400 ml-1">*</span>}
            </h3>
            
            {/* Badge para estado */}
            {badgeText && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30">
                {badgeText}
              </span>
            )}
            
            {/* Indicador de datos */}
            {hasData && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="ml-1 text-xs text-green-400">Con datos</span>
              </div>
            )}
          </div>
          
          {description && (
            <p className="text-sm text-white/60">{description}</p>
          )}
        </div>
        
        {/* Icono de estado */}
        <div className="flex items-center gap-2">
          <svg
            className={`w-5 h-5 text-white/60 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content */}
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
        <div className="px-6 pb-6">
          {children}
        </div>
      </div>
    </div>
  );
}
