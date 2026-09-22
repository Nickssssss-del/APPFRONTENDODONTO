import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, X } from 'lucide-react';
import { useApp } from '../store';

export type TourStep = {
  id: string;
  targetSelector: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  offset?: { x: number; y: number };
};

export type TourConfig = {
  key: string;
  steps: TourStep[];
  storageKey: string;
};

type TourContextType = {
  startTour: (config: TourConfig) => void;
  isTourActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep | null;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
};

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error('useTour must be used within TourProvider');
  return ctx;
}

type TourProviderProps = {
  children: ReactNode;
};

function getElementPosition(selector: string): DOMRect | null {
  const element = document.querySelector(selector);
  return element?.getBoundingClientRect() || null;
}

export function TourProvider({ children }: TourProviderProps) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [storageKey, setStorageKey] = useState('');
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const currentStep = steps[currentStepIndex] || null;

  const updateTargetRect = useCallback(() => {
    if (currentStep) {
      const rect = getElementPosition(currentStep.targetSelector);
      setTargetRect(rect);
    }
  }, [currentStep]);

  useEffect(() => {
    updateTargetRect();
    const handleResize = () => updateTargetRect();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateTargetRect]);

  const skipTour = useCallback(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, 'true');
    }
    setIsTourActive(false);
    setSteps([]);
    setStorageKey('');
    setCurrentStepIndex(0);
    document.body.style.overflow = '';
  }, [storageKey]);

  const startTour = useCallback((config: TourConfig) => {
    const hasSeenTour = localStorage.getItem(config.storageKey);
    if (hasSeenTour) return;

    setSteps(config.steps);
    setStorageKey(config.storageKey);
    setCurrentStepIndex(0);
    setIsTourActive(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      skipTour();
    }
  }, [currentStepIndex, steps.length, skipTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const contextValue: TourContextType = {
    startTour,
    isTourActive,
    currentStepIndex,
    currentStep,
    nextStep,
    prevStep,
    skipTour,
  };

  return (
    <TourContext.Provider value={contextValue}>
      {children}
      <AnimatePresence>
        {isTourActive && currentStep && (
          <TourOverlay
            step={currentStep}
            stepIndex={currentStepIndex}
            totalSteps={steps.length}
            targetRect={targetRect}
            onNext={nextStep}
            onPrev={prevStep}
            onSkip={skipTour}
          />
        )}
      </AnimatePresence>
    </TourContext.Provider>
  );
}

type TourOverlayProps = {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
};

function TourOverlay({ step, stepIndex, totalSteps, targetRect, onNext, onPrev, onSkip }: TourOverlayProps) {
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [tooltipPlacement, setTooltipPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');

  useEffect(() => {
    if (!targetRect) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = 280;
    const tooltipHeight = 140;
    const gap = 12;

    const positions = [
      { name: 'bottom' as const, x: targetRect.left + targetRect.width / 2 - tooltipWidth / 2, y: targetRect.bottom + gap },
      { name: 'top' as const, x: targetRect.left + targetRect.width / 2 - tooltipWidth / 2, y: targetRect.top - tooltipHeight - gap },
      { name: 'right' as const, x: targetRect.right + gap, y: targetRect.top + targetRect.height / 2 - tooltipHeight / 2 },
      { name: 'left' as const, x: targetRect.left - tooltipWidth - gap, y: targetRect.top + targetRect.height / 2 - tooltipHeight / 2 },
    ];

    for (const pos of positions) {
      const fitsX = pos.x >= 16 && pos.x + tooltipWidth <= viewportWidth - 16;
      const fitsY = pos.y >= 16 && pos.y + tooltipHeight <= viewportHeight - 16;
      if (fitsX && fitsY) {
        setTooltipPosition({ x: pos.x, y: pos.y });
        setTooltipPlacement(pos.name);
        return;
      }
    }

    setTooltipPosition({ x: Math.max(16, Math.min(viewportWidth - tooltipWidth - 16, targetRect.left + targetRect.width / 2 - tooltipWidth / 2)), y: Math.max(16, Math.min(viewportHeight - tooltipHeight - 16, targetRect.bottom + gap)) });
    setTooltipPlacement('bottom');
  }, [targetRect, step]);

  const arrowPositions: Record<string, { x: string; y: string; transform: string }> = {
    top: { x: '50%', y: '100%', transform: 'translateX(-50%) rotate(180deg)' },
    bottom: { x: '50%', y: '0', transform: 'translateX(-50%)' },
    left: { x: '100%', y: '50%', transform: 'translateY(-50%) rotate(90deg)' },
    right: { x: '0', y: '50%', transform: 'translateY(-50%) rotate(-90deg)' },
  };

  const arrowStyle = arrowPositions[tooltipPlacement];

  const highlightStyle = targetRect
    ? {
        top: targetRect.top - 4,
        left: targetRect.left - 4,
        width: targetRect.width + 8,
        height: targetRect.height + 8,
      }
    : {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] pointer-events-none"
      onClick={onSkip}
    >
      <div
        className="absolute inset-0 bg-slatey-900/70 backdrop-blur-sm"
        style={{
          clipPath: targetRect
            ? `polygon(
                0 0,
                100% 0,
                100% 100%,
                0 100%,
                0 0,
                ${highlightStyle.left}px ${highlightStyle.top}px,
                ${highlightStyle.left + highlightStyle.width}px ${highlightStyle.top}px,
                ${highlightStyle.left + highlightStyle.width}px ${highlightStyle.top + highlightStyle.height}px,
                ${highlightStyle.left}px ${highlightStyle.top + highlightStyle.height}px,
                ${highlightStyle.left}px ${highlightStyle.top}px
              )`
            : 'none',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {targetRect && (
        <motion.div
          initial={{ boxShadow: '0 0 0 4px rgba(59, 130, 246, 0)' }}
          animate={{ boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 20px 8px rgba(59, 130, 246, 0.3)' }}
          transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
          className="fixed pointer-events-none rounded-xl"
          style={{
            top: highlightStyle.top,
            left: highlightStyle.left,
            width: highlightStyle.width,
            height: highlightStyle.height,
            zIndex: 101,
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -10 }}
        className="fixed pointer-events-auto z-[102] w-[280px] bg-white rounded-2xl shadow-2xl border border-slatey-100 p-4"
        style={{
          left: tooltipPosition.x,
          top: tooltipPosition.y,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <div
            className="absolute w-2 h-2 bg-white border-l border-t border-slatey-100 rotate-45"
            style={{
              left: arrowStyle.x,
              top: arrowStyle.y,
              transform: arrowStyle.transform,
            }}
          />
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="text-sm font-bold text-slatey-900">{step.title}</p>
                <p className="text-xs text-slatey-500 mt-0.5">{step.description}</p>
              </div>
              <button
                onClick={onSkip}
                className="p-1 rounded-lg hover:bg-slatey-100 transition-colors text-slatey-400 flex-shrink-0"
                aria-label="Saltar tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slatey-100">
              <div className="flex gap-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: i === stepIndex ? 1.2 : 1 }}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === stepIndex ? 'bg-primary-500' : 'bg-slatey-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                {stepIndex > 0 && (
                  <button
                    onClick={onPrev}
                    className="text-xs font-semibold text-slatey-500 hover:text-slatey-700 px-3 py-1.5 rounded-xl hover:bg-slatey-100 transition-colors"
                  >
                    Anterior
                  </button>
                )}
                <button
                  onClick={onNext}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 transition-colors active:scale-[0.98]"
                >
                  {stepIndex === totalSteps - 1 ? 'Finalizar' : 'Siguiente'}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function TourTrigger({ config, triggerScreen }: { config: TourConfig; triggerScreen: string }) {
  const { startTour, isTourActive } = useTour();
  const { screen } = useApp();

  useEffect(() => {
    if (screen === triggerScreen && !isTourActive) {
      const hasSeenTour = localStorage.getItem(config.storageKey);
      if (!hasSeenTour) {
        const timer = setTimeout(() => startTour(config), 500);
        return () => clearTimeout(timer);
      }
    }
  }, [screen, triggerScreen, isTourActive, config, startTour]);

  return null;
}