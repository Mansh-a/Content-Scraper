import React from 'react';
import { X, Copy, Check, Sparkles } from 'lucide-react';

interface HookModalProps {
  isOpen: boolean;
  onClose: () => void;
  hooks: string[];
  isLoading: boolean;
}

const HookModal: React.FC<HookModalProps> = ({ isOpen, onClose, hooks, isLoading }) => {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl z-10 overflow-hidden transform transition-all scale-100 relative">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-full">
              <Sparkles size={16} className="text-emerald-600" />
            </div>
            <h3 className="font-bold text-slate-800">Generated Hooks</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <div className="relative w-16 h-16">
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-emerald-100 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-full h-full border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="text-slate-500 text-sm animate-pulse">Consulting the muse...</p>
             </div>
          ) : (
            <div className="space-y-4">
              {hooks.length === 0 ? (
                <p className="text-center text-slate-500 py-4">No hooks generated yet.</p>
              ) : (
                hooks.map((hook, index) => (
                  <div key={index} className="group relative bg-slate-50 hover:bg-emerald-50/50 p-4 rounded-xl border border-slate-200 hover:border-emerald-200 transition-all duration-200">
                    <p className="text-slate-700 text-sm leading-relaxed pr-8">{hook}</p>
                    <button
                      onClick={() => handleCopy(hook, index)}
                      className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${
                        copiedIndex === index 
                          ? 'bg-emerald-100 text-emerald-600' 
                          : 'bg-white text-slate-400 opacity-0 group-hover:opacity-100 shadow-sm hover:text-emerald-600'
                      }`}
                      title="Copy to clipboard"
                    >
                      {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 text-xs text-center text-slate-400">
            AI generated content may need refinement.
        </div>
      </div>
    </div>
  );
};

export default HookModal;