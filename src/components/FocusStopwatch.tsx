import React, { useState, useEffect, useRef } from 'react';
import { useLearning } from '../context/LearningContext';
import { sounds } from '../services/audio';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Flame
} from 'lucide-react';

interface FocusStopwatchProps {
  taskTitle: string;
}

export const FocusStopwatch: React.FC<FocusStopwatchProps> = ({ taskTitle }) => {
  const { recordFocusTime } = useLearning();

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const uncommittedSecondsRef = useRef<number>(0);

  // Interval timer tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
        uncommittedSecondsRef.current += 1;

        // Auto-persist every 30 seconds as safeguard
        if (uncommittedSecondsRef.current >= 30) {
          recordFocusTime(uncommittedSecondsRef.current);
          uncommittedSecondsRef.current = 0;
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, recordFocusTime]);

  // When component unmounts or leaves, commit any uncommitted seconds
  useEffect(() => {
    return () => {
      if (uncommittedSecondsRef.current > 0) {
        recordFocusTime(uncommittedSecondsRef.current);
        uncommittedSecondsRef.current = 0;
      }
    };
  }, [recordFocusTime]);

  const handleStart = () => {
    sounds.playFocusStart();
    setIsRunning(true);
  };

  const handlePause = () => {
    sounds.playFocusPause();
    setIsRunning(false);

    // Commit uncommitted seconds to project storage immediately
    if (uncommittedSecondsRef.current > 0) {
      recordFocusTime(uncommittedSecondsRef.current);
      uncommittedSecondsRef.current = 0;
    }
  };

  const handleReset = () => {
    if (isRunning) {
      handlePause();
    }
    if (window.confirm('Deseja zerar o cronômetro da sessão atual? (O tempo já computado no projeto será preservado)')) {
      setElapsedSeconds(0);
      uncommittedSecondsRef.current = 0;
    }
  };

  const formatTimerDigits = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
    };
  };

  const digits = formatTimerDigits(elapsedSeconds);

  return (
    <>
      {/* Standard Inline Stopwatch Card */}
      <div className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-xl space-y-4">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-neutral-600'}`} />
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Cronômetro de Foco Deliberado
            </span>
          </div>

          <button
            onClick={() => setIsZenMode(true)}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-neutral-400 hover:text-white px-2.5 py-1 rounded-md bg-neutral-950 hover:bg-neutral-850 border border-neutral-850 transition-colors cursor-pointer"
            title="Expandir Modo Zen de Foco"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Modo Zen</span>
          </button>
        </div>

        {/* Stopwatch Display */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
          
          <div className="flex items-center gap-1.5 font-mono text-4xl sm:text-5xl font-light tracking-tight text-white select-none">
            <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-850">
              {digits.hours}
            </div>
            <span className="text-neutral-600 animate-pulse">:</span>
            <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-850">
              {digits.minutes}
            </div>
            <span className="text-neutral-600 animate-pulse">:</span>
            <div className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-850 text-emerald-400">
              {digits.seconds}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2.5">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-xs tracking-wide uppercase transition-all shadow-md shadow-emerald-950/40 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Iniciar Foco</span>
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-xs tracking-wide uppercase transition-all shadow-md shadow-amber-950/40 active:scale-95 cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Pausar / Parar</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="p-3 rounded-xl bg-neutral-950 hover:bg-neutral-850 text-neutral-400 hover:text-white border border-neutral-850 transition-colors cursor-pointer"
              title="Zerar sessão"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 pt-2 border-t border-neutral-850/80">
          <span>O tempo é computado em tempo real e salvo automaticamente no projeto ao pausar.</span>
          {isRunning && (
            <span className="text-emerald-400 flex items-center gap-1 animate-pulse">
              <Flame className="w-3.5 h-3.5" /> Estado de Foco Ativo
            </span>
          )}
        </div>

      </div>

      {/* ZEN FULLSCREEN FOCUS MODAL */}
      {isZenMode && (
        <div className="fixed inset-0 bg-neutral-950/95 z-50 flex flex-col items-center justify-center p-6 backdrop-blur-xl animate-in fade-in duration-300">
          <button
            onClick={() => setIsZenMode(false)}
            className="absolute top-6 right-6 text-neutral-500 hover:text-white p-2 rounded-lg bg-neutral-900 border border-neutral-800 transition-colors cursor-pointer"
            title="Sair do Modo Zen"
          >
            <Minimize2 className="w-5 h-5" />
          </button>

          <div className="max-w-xl w-full text-center space-y-12">
            <div className="space-y-3">
              <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase">
                Modo Zen • Imersão Total
              </span>
              <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
                {taskTitle}
              </h2>
            </div>

            {/* Giant Monospace Timer */}
            <div className="font-mono text-7xl sm:text-8xl font-light text-white tracking-tight flex items-center justify-center gap-2 select-none">
              <span>{digits.hours}</span>
              <span className="text-neutral-600">:</span>
              <span>{digits.minutes}</span>
              <span className="text-neutral-600">:</span>
              <span className="text-emerald-400">{digits.seconds}</span>
            </div>

            {/* Big Controls */}
            <div className="flex items-center justify-center gap-4">
              {!isRunning ? (
                <button
                  onClick={handleStart}
                  className="px-8 py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-sm tracking-wide uppercase transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-2.5"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Iniciar Foco
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-semibold text-sm tracking-wide uppercase transition-all shadow-xl active:scale-95 cursor-pointer flex items-center gap-2.5"
                >
                  <Pause className="w-5 h-5 fill-current" />
                  Pausar Foco
                </button>
              )}
            </div>

            <p className="text-xs text-neutral-500 font-light max-w-sm mx-auto">
              Silencie distrações. O aprendizado deliberado de primeiros princípios ocorre no silêncio e na prática contínua.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
