import React, { useState } from 'react';
import { useLearning } from '../context/LearningContext';
import { 
  X, 
  Sparkles, 
  Key, 
  ExternalLink, 
  Cpu, 
  Thermometer, 
  Eye, 
  EyeOff 
} from 'lucide-react';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose }) => {
  const { aiSettings, updateAISettings } = useLearning();

  const [apiKey, setApiKey] = useState(aiSettings.apiKey || '');
  const [model, setModel] = useState(aiSettings.model || 'gemini-2.5-flash');
  const [temperature, setTemperature] = useState(aiSettings.temperature ?? 0.7);
  const [useMockFallback, setUseMockFallback] = useState(aiSettings.useMockFallback ?? true);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateAISettings({
      apiKey: apiKey.trim(),
      model,
      temperature,
      useMockFallback,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 sm:p-7 space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-500 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-medium text-white tracking-tight m-0">
              Configurações de Inteligência Artificial
            </h3>
          </div>
          <p className="text-xs text-neutral-400 font-light">
            Integração nativa com a API do Google Gemini. Armazenada com segurança exclusivamente no <code className="text-neutral-300 font-mono">localStorage</code> do seu navegador.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          
          {/* API KEY INPUT */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Chave de API do Google Gemini
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                Obter Chave Gratuita <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2.5 pr-10 rounded-xl bg-neutral-950 border border-neutral-800 text-white placeholder-neutral-600 focus:outline-none focus:border-emerald-500/70 text-xs font-mono transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-neutral-300 transition-colors"
                title={showKey ? 'Ocultar' : 'Mostrar'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* MODEL SELECTION */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-sky-400" />
              Modelo do Gemini
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-white text-xs font-mono focus:outline-none focus:border-emerald-500/70 transition-all cursor-pointer"
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash (Mais Recente e Rápido - Recomendado)</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash (Estável e Econômico)</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash (Alta Velocidade)</option>
            </select>
          </div>

          {/* TEMPERATURE SLIDER */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                Criatividade / Temperatura: {temperature}
              </label>
              <span className="text-[11px] text-neutral-500 font-mono">
                {temperature <= 0.4 ? 'Mais Determinístico' : temperature <= 0.7 ? 'Equilibrado' : 'Mais Criativo'}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* DEMO / FALLBACK TOGGLE */}
          <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-850 flex items-start gap-3">
            <input
              type="checkbox"
              id="mockFallback"
              checked={useMockFallback}
              onChange={(e) => setUseMockFallback(e.target.checked)}
              className="mt-1 accent-emerald-400 rounded cursor-pointer"
            />
            <label htmlFor="mockFallback" className="text-xs text-neutral-300 font-light cursor-pointer select-none space-y-0.5">
              <span className="font-medium text-white block">Modo Demonstração / Fallback Automático</span>
              <span className="text-[11px] text-neutral-400 leading-relaxed block">
                Se ativado, permite gerar roteiros e realizar avaliações pedagógicas completas mesmo sem fornecer uma chave de API, utilizando os templates heurísticos integrados.
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-neutral-950 font-semibold text-xs tracking-wide transition-all shadow-md active:scale-95 cursor-pointer"
            >
              Salvar Configurações
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
