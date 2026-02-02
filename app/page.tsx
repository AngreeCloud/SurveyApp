'use client';

import { useState, useEffect } from 'react';
import { Smile, Meh, Frown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [showThankYou, setShowThankYou] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleFeedback = async (level: 'Muito Satisfeito' | 'Satisfeito' | 'Insatisfeito') => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime;

    // Bloquear se menos de 2 segundos desde o último clique
    if (timeSinceLastClick < 2000 && lastClickTime !== 0) {
      setIsBlocked(true);
      setTimeout(() => setIsBlocked(false), 2000);
      return;
    }

    setLastClickTime(now);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ satisfaction_level: level }),
      });

      if (response.ok) {
        setShowThankYou(true);
        setTimeout(() => setShowThankYou(false), 3000);
      }
    } catch (error) {
      console.error('[v0] Error submitting feedback:', error);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Thank You Toast */}
      {showThankYou && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top duration-300">
          <p className="text-xl font-semibold text-center">Obrigado pelo seu feedback!</p>
        </div>
      )}

      {/* Blocked Warning */}
      {isBlocked && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-top duration-300">
          <p className="text-xl font-semibold text-center">Aguarde um momento antes de avaliar novamente</p>
        </div>
      )}

      {/* Header */}
      <div className="p-6 md:p-8 text-center">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-800 text-balance">
          Como avalia a sua experiência?
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mt-2">
          A sua opinião é muito importante para nós
        </p>
      </div>

      {/* Feedback Buttons */}
      <div className="flex-1 flex flex-col gap-4 p-4 md:p-6 max-w-6xl mx-auto w-full">
        <Button
          onClick={() => handleFeedback('Muito Satisfeito')}
          className="flex-1 min-h-[140px] md:min-h-[180px] bg-emerald-500 hover:bg-emerald-600 text-white text-2xl md:text-4xl font-bold rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          disabled={isBlocked}
        >
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <Smile className="w-12 h-12 md:w-16 md:h-16" />
            <span>Muito Satisfeito</span>
          </div>
        </Button>

        <Button
          onClick={() => handleFeedback('Satisfeito')}
          className="flex-1 min-h-[140px] md:min-h-[180px] bg-amber-500 hover:bg-amber-600 text-white text-2xl md:text-4xl font-bold rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          disabled={isBlocked}
        >
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <Meh className="w-12 h-12 md:w-16 md:h-16" />
            <span>Satisfeito</span>
          </div>
        </Button>

        <Button
          onClick={() => handleFeedback('Insatisfeito')}
          className="flex-1 min-h-[140px] md:min-h-[180px] bg-rose-500 hover:bg-rose-600 text-white text-2xl md:text-4xl font-bold rounded-3xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          disabled={isBlocked}
        >
          <div className="flex flex-col items-center gap-3 md:gap-4">
            <Frown className="w-12 h-12 md:w-16 md:h-16" />
            <span>Insatisfeito</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
