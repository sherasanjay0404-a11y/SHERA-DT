import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  FileCheck2,
  Calendar,
  Send,
  History,
  Lock,
  RefreshCw,
  LogOut,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Phone,
  Receipt,
  Bell,
  CreditCard,
  Banknote,
  AlertCircle,
} from 'lucide-react';
import { Translations } from '../utils/translations';
import { PrintableReceiptModal, ReceiptData } from './PrintableReceiptModal';

interface MemberDashboardProps {
  user: {
    id: string;
    email: string;
    name?: string;
    role: string;
    status?: string;
    group_id?: string;
    group_name?: string;
  };
  csrfToken?: string;
  onLogout: () => void;
  t: Translations;
  isTamil: boolean;
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({
  user,
  csrfToken,
  onLogout,
  t,
  isTamil,
}) => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PAY' | 'LOAN' | 'HISTORY' | 'PASSBOOK' | 'NOTICES' | 'SECURITY'>('PAY');

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number>(500);
  const [payType, setPayType] = useState<'SAVINGS_DEPOSIT' | 'LOAN_REPAYMENT'>('SAVINGS_DEPOSIT');
  const [payMode, setPayMode] = useState<'UPI' | 'CASH'>('UPI');
  const [payUtr, setPayUtr] = useState<string>('');
  const [payNotes, setPayNotes] = useState<string>('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Loan Request Form State
  const [loanAmount, setLoanAmount] = useState<number>(10000);
  const [loanPurpose, setLoanPurpose] = useState<string>('');
  const [loanMonths, setLoanMonths] = useState<number>(12);
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);

  // Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  // Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchMemberData();
  }, []);

  const fetchMemberData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/member/data');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error('Failed to load member data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || payAmount <= 0 || !payUtr.trim()) {
      setNotificationMsg({
        text: isTamil ? 'சரியான தொகை மற்றும் UTR குறிப்பு எண்ணை உள்ளிடவும்.' : 'Please enter valid amount and UTR / Voucher reference.',
        type: 'error',
      });
      return;
    }

    setIsSubmittingPay(true);
    try {
      const res = await fetch('/api/member/payments/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          amount: payAmount,
          payment_type: payType,
          payment_mode: payMode,
          utr_reference: payUtr.trim(),
          notes: payNotes,
        }),
      });

      if (res.ok) {
        const resData = await res.json();
        setNotificationMsg({
          text: isTamil
            ? `செலுத்தல் சமர்ப்பிக்கப்பட்டது! உங்கள் குழு தலைவி சரிபார்த்ததும் அதிகாரப்பூர்வ ரசீது கிடைக்கும். (ரசீது எண்: ${resData.payment?.receipt_number})`
            : `Payment submitted! Queued for Group Leader verification. (Receipt #${resData.payment?.receipt_number})`,
          type: 'success',
        });
        setPayUtr('');
        setPayNotes('');
        fetchMemberData();
        setActiveTab('HISTORY');
      } else {
        const err = await res.json();
        setNotificationMsg({ text: err.message || 'Submission failed.', type: 'error' });
      }
    } catch {
      setNotificationMsg({ text: 'Error connecting to server.', type: 'error' });
    } finally {
      setIsSubmittingPay(false);
    }
  };

  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanAmount || loanAmount <= 0 || !loanPurpose.trim()) {
      setNotificationMsg({
        text: isTamil ? 'தொகை மற்றும் கடன் நோக்கத்தை உள்ளிடவும்.' : 'Please provide loan amount and purpose.',
        type: 'error',
      });
      return;
    }

    setIsSubmittingLoan(true);
    try {
      const res = await fetch('/api/member/requests/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          amount: loanAmount,
          purpose: loanPurpose.trim(),
          repayment_months: loanMonths,
        }),
      });

      if (res.ok) {
        setNotificationMsg({
          text: isTamil ? 'கடன் விண்ணப்பம் குழு நிர்வாகிக்கு சமர்ப்பிக்கப்பட்டது.' : 'Loan application submitted for Group Admin review.',
          type: 'success',
        });
        setLoanPurpose('');
        fetchMemberData();
        setActiveTab('HISTORY');
      } else {
        const err = await res.json();
        setNotificationMsg({ text: err.message || 'Application failed.', type: 'error' });
      }
    } catch {
      setNotificationMsg({ text: 'Error submitting application.', type: 'error' });
    } finally {
      setIsSubmittingLoan(false);
    }
  };

  const handleViewReceipt = async (receiptId: string) => {
    try {
      const res = await fetch(`/api/receipt/${receiptId}`);
      if (res.ok) {
        const rData = await res.json();
        setSelectedReceipt(rData);
      }
    } catch (err) {
      console.error('Failed to load receipt', err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: isTamil ? 'கடவுச்சொற்கள் பொருந்தவில்லை.' : 'Passwords do not match.', type: 'error' });
      return;
    }

    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });

      if (res.ok) {
        setPasswordMsg({ text: isTamil ? 'கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது.' : 'Password updated successfully.', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const d = await res.json();
        setPasswordMsg({ text: d.message || 'Failed to update password.', type: 'error' });
      }
    } catch {
      setPasswordMsg({ text: 'Error updating password.', type: 'error' });
    }
  };

  // CHECK: If member registration is PENDING approval
  const isPending = user.status === 'PENDING' || data?.member?.status === 'PENDING';

  if (isPending) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-950">
            {t.pendingApprovalTitle}
          </h2>
          <p className="text-xs sm:text-sm text-amber-900 max-w-xl mx-auto leading-relaxed">
            {t.pendingApprovalDesc}
          </p>
          <div className="p-4 bg-white/80 rounded-2xl border border-amber-200 text-xs text-left max-w-md mx-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">{isTamil ? 'விண்ணப்பதாரர்:' : 'Applicant:'}</span>
              <span className="font-bold text-slate-900">{user.name || user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isTamil ? 'மின்னஞ்சல்:' : 'Email:'}</span>
              <span className="font-mono text-slate-700">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{isTamil ? 'நிலை:' : 'Status:'}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900">
                PENDING REVIEW
              </span>
            </div>
          </div>
          <div className="pt-2">
            <button
              onClick={onLogout}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.signOut}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const fin = data?.financial_summary || {
    total_savings: 0,
    active_loan: 0,
    outstanding_balance: 0,
    next_due_date: null,
    monthly_emi: 0,
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner with Member & Group Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#166534] flex items-center justify-center font-extrabold text-2xl shadow-xs">
            {user.email.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {data?.member?.name || user.name || 'Member'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {t.roleMember}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span className="font-semibold text-slate-800">
                🏢 {data?.group?.name || 'Sembaruthi Magilir Kulu'} ({data?.group?.village || 'Thiruvarur'})
              </span>
              <span>
                👤 {isTamil ? 'தலைவி:' : 'Leader:'} {data?.group?.leader_name || 'Anitha Murugan'} (
                <span className="font-mono">{data?.group?.leader_phone || '+919443211234'}</span>)
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMemberData}
            disabled={isLoading}
            className="p-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isTamil ? 'புதுப்பி' : 'Refresh'}</span>
          </button>
          <button
            onClick={onLogout}
            className="p-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>{t.signOut}</span>
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{notificationMsg.text}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* Personal Financial Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{t.mySavingsStat}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{(fin.total_savings || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            {isTamil ? 'சரிபார்க்கப்பட்ட சேமிப்பு' : 'Verified savings balance'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{t.activeLoanStat}</span>
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">
            ₹{(fin.loan_principal || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">
            {isTamil ? 'அங்கீகரிக்கப்பட்ட தொகை' : 'Sanctioned loan principal'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{t.outstandingBalanceStat}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{(fin.active_loan || 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500">
            {isTamil ? 'திருப்பிச் செலுத்த வேண்டியது' : 'Remaining balance'}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{t.nextDueDateStat}</span>
            <Calendar className="w-4 h-4 text-[#166534]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
            {fin.next_due_date ? fin.next_due_date : 'None'}
          </div>
          <span className="text-[10px] text-slate-500">
            {fin.monthly_emi ? `EMI: ₹${fin.monthly_emi}` : (isTamil ? 'தவணை இல்லை' : 'No active EMI')}
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-bold bg-slate-50">
          <button
            onClick={() => setActiveTab('PAY')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'PAY'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabMakePayment}
          </button>

          <button
            onClick={() => setActiveTab('LOAN')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'LOAN'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabApplyLoan}
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'HISTORY'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabMyTransactions}
          </button>

          <button
            onClick={() => setActiveTab('PASSBOOK')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'PASSBOOK'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabMyReceipts}
          </button>

          <button
            onClick={() => setActiveTab('NOTICES')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'NOTICES'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabNotifications}
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'SECURITY'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabChangePassword}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* TAB 1: MAKE PAYMENT */}
          {activeTab === 'PAY' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                  {t.tabMakePayment}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTamil
                    ? 'உங்கள் மாதச் சேமிப்பு அல்லது கடன் தவணையை UPI அல்லது ரொக்கமாகச் செலுத்தி UTR எண்ணைப் பதிவு செய்யவும்.'
                    : 'Submit your monthly mandatory savings deposit or loan installment via UPI or Cash voucher reference.'}
                </p>
              </div>

              <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
                {/* Payment Category */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {t.paymentTypeLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPayType('SAVINGS_DEPOSIT');
                        setPayAmount(500);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                        payType === 'SAVINGS_DEPOSIT'
                          ? 'border-[#166534] bg-emerald-50 text-[#166534] font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block font-bold">
                        {isTamil ? 'மாதச் சேமிப்பு வைப்பு' : 'Monthly Savings Deposit'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">₹500 / month</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPayType('LOAN_REPAYMENT');
                        setPayAmount(1800);
                      }}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                        payType === 'LOAN_REPAYMENT'
                          ? 'border-[#166534] bg-emerald-50 text-[#166534] font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="block font-bold">
                        {isTamil ? 'கடன் தவணைத் தொகை' : 'Loan EMI Repayment'}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">Scheduled EMI</span>
                    </button>
                  </div>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {t.paymentModeLabel}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayMode('UPI')}
                      className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                        payMode === 'UPI'
                          ? 'border-[#166534] bg-emerald-50 text-[#166534] font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                      <span>{isTamil ? 'UPI பரிவர்த்தனை (GPay / PhonePe)' : 'UPI (GPay / PhonePe / Paytm)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayMode('CASH')}
                      className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                        payMode === 'CASH'
                          ? 'border-[#166534] bg-emerald-50 text-[#166534] font-bold'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      <span>{isTamil ? 'நேரடி ரொக்கம் (ரசீது சீட்டு)' : 'Cash (Leader Voucher)'}</span>
                    </button>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {t.amountLabel}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min={10}
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-black text-base"
                    />
                  </div>
                </div>

                {/* UTR / Voucher Reference */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {payMode === 'UPI'
                      ? isTamil ? '12-இலக்க UPI பரிவர்த்தனை UTR எண்' : '12-Digit UPI Transaction UTR Reference #'
                      : isTamil ? 'ரொக்க ரசீது சீட்டு எண்' : 'Cash Voucher Receipt Reference #'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={payMode === 'UPI' ? 'e.g. 489102837492' : 'e.g. CASH-VOUCHER-084'}
                    value={payUtr}
                    onChange={(e) => setPayUtr(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono"
                  />
                </div>

                {/* Optional Notes */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isTamil ? 'குறிப்புகள் (விருப்பத்தேர்வு)' : 'Notes (Optional)'}
                  </label>
                  <input
                    type="text"
                    placeholder={isTamil ? 'எ.கா. அக்டோபர் மாத தவணை' : 'e.g. October savings installment'}
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="w-full py-3 bg-[#166534] hover:bg-[#15803d] text-white font-extrabold text-sm rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPay ? 'Submitting...' : t.submitPaymentBtn}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: APPLY FOR LOAN */}
          {activeTab === 'LOAN' && (
            <div className="max-w-xl mx-auto space-y-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                  {t.tabApplyLoan}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTamil
                    ? 'சுயதொழில் அல்லது அவசரத் தேவைக்கான மகளிர் குழு கடன் விண்ணப்பத்தைச் சமர்ப்பிக்கவும்.'
                    : 'Apply for micro-credit for agriculture, livestock, tailoring, or small business expansion.'}
                </p>
              </div>

              <form onSubmit={handleSubmitLoan} className="space-y-4 text-xs">
                {/* Amount */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isTamil ? 'கோரப்படும் கடன் தொகை (₹)' : 'Requested Loan Amount (₹)'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={500}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-black text-base"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {isTamil ? 'வழக்கமான வரம்பு: ₹5,000 முதல் ₹50,000 வரை' : 'Typical collective range: ₹5,000 to ₹50,000'}
                  </span>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {t.purposeLabel}
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder={
                      isTamil
                        ? 'எ.கா. நாட்டுக்கோழி பண்ணை அமைத்தல் மற்றும் தீவனம் வாங்குதல்'
                        : 'e.g. Country chicken poultry setup and feeder equipment'
                    }
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>

                {/* Tenure */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {t.tenureLabel}
                  </label>
                  <select
                    value={loanMonths}
                    onChange={(e) => setLoanMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-semibold"
                  >
                    <option value={6}>6 {isTamil ? 'மாதங்கள் (மாத தவணை)' : 'Months (Bi-weekly/Monthly EMI)'}</option>
                    <option value={10}>10 {isTamil ? 'மாதங்கள்' : 'Months'}</option>
                    <option value={12}>12 {isTamil ? 'மாதங்கள் (1 வருடம்)' : 'Months (1 Year)'}</option>
                    <option value={24}>24 {isTamil ? 'மாதங்கள் (2 வருடங்கள்)' : 'Months (2 Years)'}</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingLoan}
                  className="w-full py-3 bg-[#166534] hover:bg-[#15803d] text-white font-extrabold text-sm rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingLoan ? 'Submitting...' : t.submitLoanBtn}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: MY TRANSACTIONS & SUBMISSION STATUS */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-6">
              {/* Payment Submissions Status */}
              <div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-3">
                  {isTamil ? 'சமர்ப்பிக்கப்பட்ட பணம் செலுத்துதல் நிலை' : 'Submitted Payments & Verification Status'}
                </h3>

                {!data?.payment_submissions || data.payment_submissions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs border border-slate-200 rounded-xl">
                    {isTamil ? 'செலுத்தல் பதிவுகள் எதுவும் இல்லை.' : 'No payment records found.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">{isTamil ? 'ரசீது எண்' : 'Receipt #'}</th>
                          <th className="py-3 px-4">{isTamil ? 'தேதி' : 'Date'}</th>
                          <th className="py-3 px-4">{isTamil ? 'வகை' : 'Type'}</th>
                          <th className="py-3 px-4">{isTamil ? 'தொகை' : 'Amount'}</th>
                          <th className="py-3 px-4">{isTamil ? 'முறை & UTR' : 'Mode & UTR'}</th>
                          <th className="py-3 px-4">{isTamil ? 'சரிபார்ப்பு நிலை' : 'Status'}</th>
                          <th className="py-3 px-4 text-right">{isTamil ? 'ரசீது' : 'Receipt'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {data.payment_submissions.map((p: any) => (
                          <tr key={p._id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono font-bold text-[#166534]">
                              {p.receipt_number}
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                              {new Date(p.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-700">
                              {p.payment_type === 'SAVINGS_DEPOSIT'
                                ? isTamil ? 'மாதச் சேமிப்பு' : 'Savings Deposit'
                                : isTamil ? 'கடன் தவணை' : 'Loan Repayment'}
                            </td>
                            <td className="py-3 px-4 font-black text-sm text-slate-900">
                              ₹{p.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-slate-800">{p.payment_mode}</span>
                              <span className="block font-mono text-[10px] text-slate-500">{p.utr_reference}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  p.status === 'VERIFIED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : p.status === 'SUBMITTED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {p.status}
                              </span>
                              {p.rejection_reason && (
                                <span className="block text-[10px] text-red-600 mt-0.5">
                                  {p.rejection_reason}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {p.status === 'VERIFIED' ? (
                                <button
                                  onClick={() => handleViewReceipt(p._id)}
                                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-[#166534] text-[#166534] hover:bg-emerald-50 cursor-pointer inline-flex items-center gap-1"
                                >
                                  <Receipt className="w-3.5 h-3.5" />
                                  <span>{isTamil ? 'ரசீது' : 'Receipt'}</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[10px]">
                                  {isTamil ? 'சரிபார்க்கப்படுகிறது' : 'In queue'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Loan Applications Status */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-3">
                  {isTamil ? 'என் கடன் விண்ணப்பங்கள்' : 'My Loan Applications'}
                </h3>

                {!data?.amount_requests || data.amount_requests.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs border border-slate-200 rounded-xl">
                    {isTamil ? 'கடன் விண்ணப்பங்கள் எதுவும் இல்லை.' : 'No loan applications found.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">{isTamil ? 'விண்ணப்பித்த தேதி' : 'Date'}</th>
                          <th className="py-3 px-4">{isTamil ? 'தொகை' : 'Amount'}</th>
                          <th className="py-3 px-4">{isTamil ? 'நோக்கம்' : 'Purpose'}</th>
                          <th className="py-3 px-4">{isTamil ? 'கால அளவு' : 'Tenure'}</th>
                          <th className="py-3 px-4">{isTamil ? 'நிலை' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {data.amount_requests.map((r: any) => (
                          <tr key={r._id} className="hover:bg-slate-50">
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                              {new Date(r.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 font-black text-sm text-indigo-700">
                              ₹{r.amount.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-slate-700 max-w-xs">{r.purpose}</td>
                            <td className="py-3 px-4 font-mono font-semibold">{r.repayment_months} months</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  r.status === 'APPROVED'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : r.status === 'PENDING'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: MY PASSBOOK & RECEIPTS */}
          {activeTab === 'PASSBOOK' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                  {t.tabMyReceipts}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTamil
                    ? 'சரிபார்க்கப்பட்ட அனைத்து வைப்பு மற்றும் கடன்களுக்கான உத்தியோகபூர்வ ரசீதுகளைப் பதிவிறக்கலாம் அல்லது அச்சிடலாம்.'
                    : 'Download or print official stamped receipts with cryptographic verification seals.'}
                </p>
              </div>

              {/* Verified Receipts List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data?.payment_submissions
                  ?.filter((p: any) => p.status === 'VERIFIED')
                  .map((p: any) => (
                    <div
                      key={p._id}
                      className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-[#166534]">
                            {p.receipt_number}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            {t.receiptStatusVerified}
                          </span>
                        </div>
                        <div className="text-xl font-black text-slate-900 mt-1">
                          ₹{p.amount.toLocaleString()}
                        </div>
                        <span className="text-[11px] text-slate-600 font-medium">
                          {p.payment_type === 'SAVINGS_DEPOSIT'
                            ? isTamil ? 'மாதச் சேமிப்பு' : 'Monthly Savings'
                            : isTamil ? 'கடன் தவணை' : 'Loan Installment'}
                        </span>
                        <span className="block font-mono text-[10px] text-slate-400 mt-1">
                          {p.payment_mode}: {p.utr_reference}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="font-mono text-[10px] text-slate-500">
                          {new Date(p.verified_at || p.created_at).toLocaleDateString()}
                        </span>
                        <button
                          onClick={() => handleViewReceipt(p._id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#166534] hover:bg-[#15803d] text-white font-bold text-xs shadow-2xs cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>{t.downloadReceiptBtn}</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB 5: IN-APP ANNOUNCEMENTS */}
          {activeTab === 'NOTICES' && (
            <div className="space-y-4">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                {t.tabNotifications}
              </h3>

              {!data?.notifications || data.notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-slate-200 rounded-xl">
                  {isTamil ? 'அறிவிப்புகள் எதுவும் இல்லை.' : 'No announcements at this time.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {data.notifications.map((n: any) => (
                    <div
                      key={n._id}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">
                          {isTamil && n.title_ta ? n.title_ta : n.title}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        {isTamil && n.message_ta ? n.message_ta : n.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: SECURITY & PASSWORD */}
          {activeTab === 'SECURITY' && (
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider text-center">
                {isTamil ? 'கடவுச்சொல் மாற்றுதல்' : 'Change Password Securely'}
              </h3>

              {passwordMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold ${
                    passwordMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isTamil ? 'தற்போதைய கடவுச்சொல்' : 'Current Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isTamil ? 'புதிய கடவுச்சொல் (8+ எழுத்துக்கள்)' : 'New Password (min 8 chars)'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    {isTamil ? 'புதிய கடவுச்சொல்லை உறுதிசெய்' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#166534] hover:bg-[#15803d] text-white font-bold rounded-lg shadow-xs cursor-pointer mt-2"
                >
                  {isTamil ? 'கடவுச்சொல்லைப் புதுப்பி' : 'Update Password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <PrintableReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        t={t}
        isTamil={isTamil}
      />
    </div>
  );
};
