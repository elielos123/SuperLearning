import React, { useRef, useState } from 'react';
import { useLearning } from '../context/LearningContext';
import { 
  X, 
  DownloadCloud, 
  UploadCloud, 
  ShieldCheck, 
  FileJson, 
  AlertCircle,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const { exportData, importData, projects } = useLearning();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    exportData();
    onClose();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportError(null);
    setImportStatus(null);

    try {
      await importData(file);
      setImportStatus('Backup importado com sucesso!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao processar arquivo.';
      setImportError(msg);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-6 sm:p-7 space-y-6 relative"
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
            <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-emerald-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-medium text-white tracking-tight m-0">
              Gerenciamento de Backup (JSON)
            </h3>
          </div>
          <p className="text-xs text-neutral-400 font-light">
            Seus dados residem 100% no seu navegador. Exporte para manter seus projetos salvos ou importe em qualquer outro dispositivo.
          </p>
        </div>

        {/* Status / Alerts */}
        {importStatus && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{importStatus}</span>
          </div>
        )}

        {importError && (
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-900/60 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{importError}</span>
          </div>
        )}

        {/* Options */}
        <div className="space-y-3 pt-1">
          
          {/* Export Card */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-850 hover:border-neutral-750 transition-all flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-white flex items-center gap-1.5">
                <FileJson className="w-4 h-4 text-emerald-400" />
                Exportar Backup (.json)
              </div>
              <div className="text-[11px] text-neutral-500 font-light">
                {projects.length} projeto(s) cadastrado(s)
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={projects.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 font-medium text-xs transition-all cursor-pointer shadow-sm disabled:opacity-40"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Baixar</span>
            </button>
          </div>

          {/* Import Card */}
          <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-850 hover:border-neutral-750 transition-all flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-white flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-sky-400" />
                Importar Backup (.json)
              </div>
              <div className="text-[11px] text-neutral-500 font-light">
                Restaura projetos e configurações locais
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-200 font-medium text-xs border border-neutral-750 transition-all cursor-pointer disabled:opacity-40"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Lendo...' : 'Carregar'}</span>
            </button>
          </div>

        </div>

        {/* Security Note */}
        <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-mono pt-2 border-t border-neutral-850">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Privacidade total: nenhuma informação é transmitida a servidores externos.</span>
        </div>

      </div>
    </div>
  );
};
