import React from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { Translations } from '../utils/translations';

interface RecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Translations;
  isTamil: boolean;
}

export const RecoveryModal: React.FC<RecoveryModalProps> = ({ isOpen, onClose, t, isTamil }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">{t.recoveryTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            aria-label="Close recovery modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs text-slate-600">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 leading-relaxed">
            <span className="font-bold block mb-1">
              {isTamil ? 'கிராமப்புற இணையப் பாதுகாப்பு விதிமுறை' : 'Rural Cybersecurity & Anti-Takeover Policy'}
            </span>
            <p>{t.recoveryAirGapNotice}</p>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
              {isTamil ? 'அங்கீகரிக்கப்பட்ட மீட்பு வழிமுறைகள்:' : 'Authorized Recovery Steps:'}
            </h4>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-700 font-bold shrink-0">
                1
              </div>
              <p className="leading-relaxed">{t.recoveryStep1}</p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center text-slate-700 font-bold shrink-0">
                2
              </div>
              <p className="leading-relaxed">{t.recoveryStep2}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            {t.recoveryUnderstood}
          </button>
        </div>
      </div>
    </div>
  );
};
