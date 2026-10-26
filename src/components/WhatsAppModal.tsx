import React, { useState, useEffect } from 'react';
import { Send, History, X, MessageSquare, ExternalLink, CheckCircle } from 'lucide-react';
import { Translations } from '../utils/translations';

interface MemberOption {
  _id: string;
  name: string;
  phone: string;
  group_name?: string;
}

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberOption[];
  groupName?: string;
  csrfToken?: string;
  t: Translations;
  isTamil: boolean;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  isOpen,
  onClose,
  members,
  groupName = 'Magilir Kulu',
  csrfToken,
  t,
  isTamil,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [templateType, setTemplateType] = useState<string>('SAVINGS_DUE');
  const [customText, setCustomText] = useState<string>('');
  const [history, setHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'PREPARE' | 'HISTORY'>('PREPARE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (members.length > 0 && !selectedMemberId) {
      setSelectedMemberId(members[0]._id);
    }
  }, [members, selectedMemberId]);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/whatsapp/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch {
      // offline
    }
  };

  if (!isOpen) return null;

  const currentMember = members.find((m) => m._id === selectedMemberId) || members[0];

  const generateTemplateText = (type: string, member?: MemberOption) => {
    const memberName = member?.name || 'உறுப்பினர் / Member';
    const grp = member?.group_name || groupName;

    switch (type) {
      case 'SAVINGS_DUE':
        return isTamil
          ? `வணக்கம் ${memberName}! ${grp} மாதச் சேமிப்புத் தவணை ₹500 செலுத்த வேண்டியுள்ளது. மகளிர் குழு கூட்டத்தில் அல்லது UPI வழியாகச் செலுத்தி ரசீது பெற்றுக்கொள்ளவும்.`
          : `Hello ${memberName}, this is a reminder from ${grp}. Your monthly SHG savings deposit of ₹500 is due. Please submit your payment to ensure active standing.`;

      case 'LOAN_EMI':
        return isTamil
          ? `அன்பார்ந்த ${memberName}! ${grp} கடனுக்கான மாதாந்திரத் தவணைத் தொகை செலுத்த வேண்டிய தேதி நெருங்குகிறது. தாமதக் கட்டணத்தைத் தவிர்க்க குறித்த நேரத்தில் செலுத்தவும்.`
          : `Dear ${memberName}, your monthly loan repayment installment for ${grp} is scheduled. Kindly complete your payment on or before the due date.`;

      case 'MEETING':
        return isTamil
          ? `அறிவிப்பு: ${grp} மாதக் கலந்தாய்வுக் கூட்டம் வரும் சனிக்கிழமை மாலை 4 மணிக்கு நடைபெறும். அனைத்து உறுப்பினர்களும் தவறாமல் கலந்துகொள்ளுமாறு கேட்டுக்கொள்ளப்படுகிறார்கள்.`
          : `Notice: The upcoming ${grp} assembly meeting is scheduled for Saturday at 4:00 PM. All members are requested to attend with their passbooks.`;

      case 'PAYMENT_VERIFIED':
        return isTamil
          ? `வணக்கம் ${memberName}! நீங்கள் செலுத்திய தொகை வெற்றிகரமாகச் சரிபார்க்கப்பட்டு மகளிர் குழு டிஜிட்டல் லெட்ஜரில் பதிவு செய்யப்பட்டுள்ளது. உங்கள் ரசீதைப் போர்ட்டலில் பார்க்கலாம்.`
          : `Greetings ${memberName}! Your recent payment has been verified and cryptographically sealed in the SHG ledger. You can download your official receipt anytime.`;

      case 'CUSTOM':
        return customText;

      default:
        return '';
    }
  };

  const currentPreview = generateTemplateText(templateType, currentMember);

  const handleLaunchWhatsApp = async () => {
    if (!currentMember || !currentPreview.trim()) return;

    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/whatsapp/prepare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          recipient_name: currentMember.name,
          phone: currentMember.phone,
          group_name: currentMember.group_name || groupName,
          message_text: currentPreview,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(
          isTamil
            ? 'நினைவூட்டல் பதிவு செய்யப்பட்டது! வாட்ஸ்அப் சாளரம் திறக்கப்படுகிறது...'
            : 'Reminder logged! Launching WhatsApp click-to-chat...'
        );
        fetchHistory();
        if (data.wa_link) {
          window.open(data.wa_link, '_blank', 'noopener,noreferrer');
        }
      }
    } catch (err) {
      console.error('Failed to prepare WhatsApp message', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-[#128C7E] px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-emerald-200" />
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {t.waModalTitle}
              </h3>
              <p className="text-[11px] text-emerald-100">
                {isTamil ? 'அங்கீகரிக்கப்பட்ட நேரடி வாட்ஸ்அப் அறிவிப்பு சேவை' : 'Official WhatsApp Click-to-Chat Integration'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
          <button
            onClick={() => setActiveTab('PREPARE')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors cursor-pointer ${
              activeTab === 'PREPARE'
                ? 'border-[#128C7E] text-[#128C7E] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {isTamil ? 'செய்தி அனுப்பு' : 'Prepare & Send'}
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'border-[#128C7E] text-[#128C7E] bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>{t.waHistoryTitle}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {history.length}
            </span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'PREPARE' ? (
            <div className="space-y-4 text-xs">
              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Select Member */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {t.waSelectMember}
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#128C7E]"
                >
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.phone}) {m.group_name ? `— ${m.group_name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Template */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {t.waSelectTemplate}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTemplateType('SAVINGS_DUE')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                      templateType === 'SAVINGS_DUE'
                        ? 'border-[#128C7E] bg-emerald-50 text-[#128C7E] font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-semibold">
                      {isTamil ? 'மாதச் சேமிப்பு நினைவூட்டல்' : 'Monthly Savings Due'}
                    </span>
                    <span className="text-[10px] text-slate-500">₹500 Deposit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType('LOAN_EMI')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                      templateType === 'LOAN_EMI'
                        ? 'border-[#128C7E] bg-emerald-50 text-[#128C7E] font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-semibold">
                      {isTamil ? 'கடன் தவணை நினைவூட்டல்' : 'Loan EMI Notice'}
                    </span>
                    <span className="text-[10px] text-slate-500">Scheduled EMI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType('MEETING')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                      templateType === 'MEETING'
                        ? 'border-[#128C7E] bg-emerald-50 text-[#128C7E] font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-semibold">
                      {isTamil ? 'குழு கூட்ட அறிவிப்பு' : 'Assembly Meeting'}
                    </span>
                    <span className="text-[10px] text-slate-500">Saturday 4 PM</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTemplateType('PAYMENT_VERIFIED')}
                    className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                      templateType === 'PAYMENT_VERIFIED'
                        ? 'border-[#128C7E] bg-emerald-50 text-[#128C7E] font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-semibold">
                      {isTamil ? 'செலுத்தல் சரிபார்ப்பு ரசீது' : 'Payment Verified'}
                    </span>
                    <span className="text-[10px] text-slate-500">Digital Seal</span>
                  </button>
                </div>
              </div>

              {/* Message Preview Box */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {t.waPreview}
                </label>
                <div className="p-3 bg-[#EFEAE2] border border-slate-300 rounded-xl font-sans text-xs text-slate-800 leading-relaxed shadow-inner">
                  <div className="bg-white p-3 rounded-lg shadow-xs border border-[#E1DDD6]">
                    <p className="whitespace-pre-line">{currentPreview}</p>
                    <span className="block text-right text-[10px] text-slate-400 mt-2 font-mono">
                      Official SHG Broadcast · Just now
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {t.waHistoryEmpty}
                </div>
              ) : (
                history.map((h) => (
                  <div
                    key={h._id}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {h.recipient_name}{' '}
                        <span className="font-normal font-mono text-slate-500">
                          ({h.phone})
                        </span>
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(h.prepared_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-2 italic">
                      "{h.message_text}"
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                      <span className="text-slate-500">
                        {isTamil ? 'அனுப்பியவர்:' : 'Prepared by:'}{' '}
                        <span className="font-mono">{h.prepared_by}</span>
                      </span>
                      {h.wa_link && (
                        <a
                          href={h.wa_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[#128C7E] font-bold hover:underline"
                        >
                          <span>{isTamil ? 'மீண்டும் திறக்க' : 'Re-open Chat'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            {isTamil ? 'மூடு' : 'Close'}
          </button>
          {activeTab === 'PREPARE' && (
            <button
              onClick={handleLaunchWhatsApp}
              disabled={isSubmitting || !currentMember}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.waSendBtn}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
