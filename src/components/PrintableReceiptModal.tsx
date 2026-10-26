import React from 'react';
import { ShieldCheck, Printer, X, CheckCircle2, Lock } from 'lucide-react';
import { Translations } from '../utils/translations';

export interface ReceiptData {
  receipt_number: string;
  member_name: string;
  group_name: string;
  village: string;
  amount: number;
  payment_type: string;
  payment_mode: string;
  utr_reference: string;
  status: string;
  verified_by: string;
  verified_at: string;
  cryptographic_seal: string;
  created_at: string;
}

interface PrintableReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
  t: Translations;
  isTamil: boolean;
}

export const PrintableReceiptModal: React.FC<PrintableReceiptModalProps> = ({
  receipt,
  onClose,
  t,
  isTamil,
}) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-linear-to-r from-[#166534] to-[#15803d] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                {t.appName} — {t.receiptModalTitle}
              </h3>
              <p className="text-[11px] text-emerald-100">
                {isTamil ? 'அங்கீகரிக்கப்பட்ட மின்னணு கட்டண ரசீது' : 'Official Cryptographically Sealed Digital Receipt'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 space-y-5 bg-white text-slate-800 text-xs">
          {/* Top Receipt Bar */}
          <div className="flex items-center justify-between border-b border-dashed border-slate-300 pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {t.receiptSerial}
              </span>
              <span className="font-mono text-sm font-extrabold text-[#166534]">
                {receipt.receipt_number}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                {t.receiptDate}
              </span>
              <span className="font-mono text-[11px] text-slate-600">
                {new Date(receipt.verified_at || receipt.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Amount Callout */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block mb-1">
              {t.receiptAmount}
            </span>
            <div className="text-3xl font-black text-[#166534]">
              ₹{receipt.amount.toLocaleString()}
            </div>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {receipt.payment_type === 'SAVINGS_DEPOSIT'
                ? isTamil ? 'மாதச் சேமிப்பு வைப்பு' : 'Monthly Savings Deposit'
                : isTamil ? 'கடன் தவணைத் தொகை' : 'Loan EMI Repayment'}
            </span>
          </div>

          {/* Meta Details Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                {t.receiptPayer}
              </span>
              <span className="font-bold text-slate-900 text-sm">
                {receipt.member_name}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                {t.receiptShg}
              </span>
              <span className="font-semibold text-slate-800">
                {receipt.group_name}
              </span>
              <span className="block text-[11px] text-slate-500">{receipt.village}</span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                {t.paymentModeLabel}
              </span>
              <span className="font-medium text-slate-800">
                {receipt.payment_mode}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                {t.utrRefLabel}
              </span>
              <span className="font-mono text-[11px] text-slate-700 break-all">
                {receipt.utr_reference}
              </span>
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold text-slate-900 block text-[11px]">
                {receipt.status === 'VERIFIED' ? t.receiptStatusVerified : receipt.status}
              </span>
              <span className="text-[10px] text-slate-500">
                {isTamil ? 'சரிபார்த்தவர்:' : 'Verified By:'} <span className="font-mono">{receipt.verified_by}</span>
              </span>
            </div>
          </div>

          {/* Cryptographic Seal */}
          <div className="text-[10px] text-slate-500 space-y-1 pt-1 border-t border-slate-200">
            <div className="flex items-center gap-1 font-semibold text-slate-600">
              <Lock className="w-3 h-3 text-slate-400" />
              <span>{t.receiptSeal}</span>
            </div>
            <div className="font-mono text-[9px] bg-slate-100 p-2 rounded text-slate-600 break-all border border-slate-200">
              {receipt.cryptographic_seal || '0000000000000000000000000000000000000000000000000000000000000000'}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
          >
            {t.receiptCloseBtn}
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#166534] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t.receiptPrintBtn}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
