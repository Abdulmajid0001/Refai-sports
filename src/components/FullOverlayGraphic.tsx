import React from 'react';
import { X } from 'lucide-react';

export function FullOverlayGraphic({ payload, onDismiss }: { payload: Record<string, any>; onDismiss: () => void }) {
  const { content } = payload;

  return (
    <div className="relative w-full max-w-2xl mx-4 bg-[#0a0a1a] rounded-2xl border border-cyan-500/30 p-12 backdrop-blur-xl shadow-[0_0_30px_rgba(0,255,255,0.15)]">
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition"
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div className="text-center">
          <p className="text-white font-display uppercase tracking-wider text-xl whitespace-pre-wrap leading-relaxed">
            {content}
          </p>
        </div>
    </div>
  );
}
