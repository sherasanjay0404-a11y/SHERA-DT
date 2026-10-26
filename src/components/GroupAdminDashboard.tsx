import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Lock,
  RefreshCw,
  LogOut,
  FileCheck2,
  Calendar,
  AlertTriangle,
  Download,
  Receipt,
} from 'lucide-react';
import { Translations } from '../utils/translations';
import { WhatsAppModal } from './WhatsAppModal';
import { PrintableReceiptModal, ReceiptData } from './PrintableReceiptModal';

interface GroupAdminDashboardProps {
  user: { id: string; email: string; name?: string; role: string };
  csrfToken?: string;
  onLogout: () => void;
  t: Translations;
  isTamil: boolean;
}

export const GroupAdminDashboard: React.FC<GroupAdminDashboardProps> = ({
  user,
  csrfToken,
  onLogout,
  t,
  isTamil,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'PAYMENTS' | 'LOANS' | 'LEDGER' | 'WHATSAPP' | 'SECURITY'>('PAYMENTS');

  const [isWaOpen, setIsWaOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchGroupData();
  }, []);

  const fetchGroupData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, dataRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/group-admin/data'),
      ]);

      if (statsRes.ok) {
        const s = await statsRes.json();
        setStats(s);
      }

      if (dataRes.ok) {
        const d = await dataRes.json();
        setData(d);
      }
    } catch (err) {
      console.error('Failed to load group admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      const res = await fetch('/api/group-admin/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({ payment_id: paymentId, action: 'VERIFY' }),
      });

      if (res.ok) {
        const resData = await res.json();
        setNotificationMsg({
          text: isTamil
            ? `செலுத்தல் சரிபார்க்கப்பட்டது! ரசீது எண்: ${resData.receipt_number}`
            : `Payment verified successfully! Receipt #${resData.receipt_number} issued.`,
          type: 'success',
        });
        fetchGroupData();
      }
    } catch {
      setNotificationMsg({ text: 'Error verifying payment.', type: 'error' });
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt(t.rejectionReasonPrompt) || 'Invalid transaction UTR or uncredited voucher';
    try {
      const res = await fetch('/api/group-admin/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({ payment_id: paymentId, action: 'REJECT', reason }),
      });

      if (res.ok) {
        setNotificationMsg({
          text: isTamil ? 'செலுத்தல் நிராகரிக்கப்பட்டது.' : 'Payment rejected and member notified.',
          type: 'success',
        });
        fetchGroupData();
      }
    } catch {
      setNotificationMsg({ text: 'Error rejecting payment.', type: 'error' });
    }
  };

  const handleReviewLoan = async (requestId: string, action: 'APPROVE' | 'REJECT') => {
    let reason = '';
    if (action === 'REJECT') {
      reason = prompt(t.rejectionReasonPrompt) || 'Does not meet group eligibility criteria';
    }

    try {
      const res = await fetch('/api/group-admin/requests/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({ request_id: requestId, action, reason }),
      });

      if (res.ok) {
        setNotificationMsg({
          text: action === 'APPROVE'
            ? isTamil ? 'கடன் விண்ணப்பம் அனுமதிக்கப்பட்டு லெட்ஜரில் பதிவு செய்யப்பட்டது.' : 'Loan application sanctioned and recorded in ledger.'
            : isTamil ? 'கடன் விண்ணப்பம் நிராகரிக்கப்பட்டது.' : 'Loan application rejected.',
          type: 'success',
        });
        fetchGroupData();
      }
    } catch {
      setNotificationMsg({ text: 'Error updating loan request.', type: 'error' });
    }
  };

  const handleViewReceipt = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/receipt/${paymentId}`);
      if (res.ok) {
        const rData = await res.json();
        setSelectedReceipt(rData);
      }
    } catch (err) {
      console.error('Failed to load receipt', err);
    }
  };

  const handleExportCsv = () => {
    if (!data?.payment_submissions || data.payment_submissions.length === 0) {
      alert(isTamil ? 'ஏற்றுமதி செய்ய பதிவுகள் இல்லை' : 'No records available to export.');
      return;
    }

    const headers = ['Receipt #', 'Member Name', 'Type', 'Amount (INR)', 'Mode', 'Reference', 'Status', 'Date'];
    const rows = data.payment_submissions.map((p: any) => [
      p.receipt_number,
      `"${p.member_name}"`,
      p.payment_type,
      p.amount,
      p.payment_mode,
      `"${p.utr_reference}"`,
      p.status,
      new Date(p.created_at).toLocaleDateString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${data.group?.name || 'SHG'}_Financial_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: isTamil ? 'புதிய கடவுச்சொற்கள் பொருந்தவில்லை' : 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: isTamil ? 'குறைந்தது 8 எழுத்துக்கள் தேவை' : 'Minimum 8 characters required.', type: 'error' });
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
        setPasswordMsg({ text: isTamil ? 'கடவுச்சொல் வெற்றிகரமாக மாற்றப்பட்டது.' : 'Password updated securely.', type: 'success' });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const d = await res.json();
        setPasswordMsg({ text: d.message || 'Failed to update password.', type: 'error' });
      }
    } catch {
      setPasswordMsg({ text: 'Error communicating with server.', type: 'error' });
    }
  };

  const pendingPayments = data?.payment_submissions?.filter((p: any) => p.status === 'SUBMITTED') || [];
  const pendingLoans = data?.amount_requests?.filter((r: any) => r.status === 'PENDING') || [];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner with Assigned Group Badge */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#166534] flex items-center justify-center font-extrabold text-2xl shadow-xs">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {data?.group?.name || 'Sembaruthi Magilir Kulu'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                {t.roleGroupAdmin}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span>📍 {data?.group?.village || 'Thiruvarur'}</span>
              <span>🗓️ {data?.group?.meeting_schedule || '1st & 3rd Saturday 4:00 PM'}</span>
              <span className="font-semibold text-emerald-800">🎯 ₹{data?.group?.monthly_savings_target || 500}/month</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchGroupData}
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

      {/* Real Financial Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{isTamil ? 'குழு உறுப்பினர்கள்' : 'Group Members'}</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.member_count ?? data?.members?.length ?? 0}
          </div>
          <span className="text-[10px] text-slate-500">{isTamil ? 'ஒதுக்கப்பட்டவர்கள்' : 'In this collective'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{isTamil ? 'குழு சேமிப்பு நிதி' : 'Total Savings Pool'}</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{(stats?.total_savings ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">{isTamil ? 'சரிபார்க்கப்பட்டது' : 'Verified deposits'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{isTamil ? 'செயலில் உள்ள கடன்கள்' : 'Active Loans'}</span>
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">
            ₹{(stats?.active_loans_total ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">{isTamil ? 'வழங்கப்பட்ட தொகை' : 'Principal sanctioned'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="font-bold text-[10px] uppercase">{isTamil ? 'செலுத்தல் சரிபார்ப்பு' : 'Payment Queue'}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">
            {pendingPayments.length}
          </div>
          <span className="text-[10px] text-amber-700 font-semibold">{isTamil ? 'சரிபார்க்க காத்திருக்கிறது' : 'Pending verification'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{isTamil ? 'நிலுவை எச்சரிக்கைகள்' : 'Overdue Repayments'}</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.overdue_count ?? 1}
          </div>
          <span className="text-[10px] text-amber-600 font-medium">{isTamil ? 'நினைவூட்டல் தேவை' : 'Needs reminder'}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-bold bg-slate-50">
          <button
            onClick={() => setActiveTab('PAYMENTS')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'PAYMENTS'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabPaymentQueue}{' '}
            {pendingPayments.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900">
                {pendingPayments.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('LOANS')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'LOANS'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabLoanRequests}{' '}
            {pendingLoans.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-200 text-indigo-900">
                {pendingLoans.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'MEMBERS'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabGroupMembers} ({data?.members?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'LEDGER'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabGroupLedger}
          </button>

          <button
            onClick={() => setActiveTab('WHATSAPP')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'WHATSAPP'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabGroupWhatsApp}
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'SECURITY'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {isTamil ? 'கடவுச்சொல் & பாதுகாப்பு' : 'Security & Password'}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* TAB 1: PAYMENT VERIFICATION QUEUE */}
          {activeTab === 'PAYMENTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                    {t.tabPaymentQueue}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isTamil
                      ? 'உங்கள் குழு உறுப்பினர்கள் சமர்ப்பித்த UPI மற்றும் ரொக்கக் கட்டணங்களைச் சரிபார்த்து ரசீது வழங்கவும்.'
                      : 'Verify submitted UPI transactions and cash deposits from your group members to issue official receipts.'}
                  </p>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t.exportReportBtn}</span>
                </button>
              </div>

              {!data?.payment_submissions || data.payment_submissions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-slate-200 rounded-xl">
                  {isTamil ? 'செலுத்தல் பதிவுகள் எதுவும் இல்லை.' : 'No payment submissions found for this group.'}
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">{isTamil ? 'ரசீது எண்' : 'Receipt #'}</th>
                        <th className="py-3 px-4">{isTamil ? 'உறுப்பினர்' : 'Member'}</th>
                        <th className="py-3 px-4">{isTamil ? 'பரிவர்த்தனை வகை' : 'Category'}</th>
                        <th className="py-3 px-4">{isTamil ? 'தொகை' : 'Amount'}</th>
                        <th className="py-3 px-4">{isTamil ? 'முறை & UTR / ரசீது எண்' : 'Mode & Reference'}</th>
                        <th className="py-3 px-4">{isTamil ? 'நிலை' : 'Status'}</th>
                        <th className="py-3 px-4 text-right">{isTamil ? 'நடவடிக்கைகள்' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.payment_submissions.map((p: any) => (
                        <tr key={p._id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-[#166534]">
                            {p.receipt_number}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">{p.member_name}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-700">
                              {p.payment_type === 'SAVINGS_DEPOSIT'
                                ? isTamil ? 'மாதச் சேமிப்பு' : 'Savings Deposit'
                                : isTamil ? 'கடன் தவணை' : 'Loan Repayment'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-black text-sm text-slate-900">
                            ₹{p.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-800">{p.payment_mode}</span>
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
                          </td>
                          <td className="py-3 px-4 text-right">
                            {p.status === 'SUBMITTED' ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleVerifyPayment(p._id)}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>{t.verifyPaymentBtn}</span>
                                </button>
                                <button
                                  onClick={() => handleRejectPayment(p._id)}
                                  className="px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-bold text-xs cursor-pointer"
                                >
                                  {t.rejectPaymentBtn}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleViewReceipt(p._id)}
                                className="px-2.5 py-1.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{isTamil ? 'ரசீது' : 'Receipt'}</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOAN AMOUNT REQUESTS */}
          {activeTab === 'LOANS' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                  {t.tabLoanRequests}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTamil
                    ? 'உங்கள் மகளிர் குழு உறுப்பினர்களின் கடன் விண்ணப்பங்களை மதிப்பாய்வு செய்து அனுமதி வழங்கவும்.'
                    : 'Review and approve loan requests submitted by members of your SHG collective.'}
                </p>
              </div>

              {!data?.amount_requests || data.amount_requests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs border border-slate-200 rounded-xl">
                  {isTamil ? 'கடன் விண்ணப்பங்கள் எதுவும் இல்லை.' : 'No loan requests submitted yet.'}
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">{isTamil ? 'விண்ணப்பதாரர்' : 'Applicant'}</th>
                        <th className="py-3 px-4">{isTamil ? 'தொகை' : 'Requested Amount'}</th>
                        <th className="py-3 px-4">{isTamil ? 'நோக்கம்' : 'Purpose'}</th>
                        <th className="py-3 px-4">{isTamil ? 'திருப்பிச் செலுத்தும் காலம்' : 'Tenure'}</th>
                        <th className="py-3 px-4">{isTamil ? 'நிலை' : 'Status'}</th>
                        <th className="py-3 px-4 text-right">{isTamil ? 'நடவடிக்கைகள்' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data.amount_requests.map((r: any) => (
                        <tr key={r._id} className="hover:bg-slate-50">
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{r.member_name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{r.member_email}</span>
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
                          <td className="py-3 px-4 text-right">
                            {r.status === 'PENDING' ? (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => handleReviewLoan(r._id, 'APPROVE')}
                                  className="px-3 py-1.5 bg-[#166534] hover:bg-[#15803d] text-white rounded-lg font-bold text-xs shadow-2xs cursor-pointer"
                                >
                                  {t.approveLoanBtn}
                                </button>
                                <button
                                  onClick={() => handleReviewLoan(r._id, 'REJECT')}
                                  className="px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-bold text-xs cursor-pointer"
                                >
                                  {t.rejectLoanBtn}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] font-mono">
                                {isTamil ? 'மதிப்பாய்வு செய்யப்பட்டது' : 'Processed'}
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
          )}

          {/* TAB 3: ASSIGNED MEMBERS */}
          {activeTab === 'MEMBERS' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                  {t.tabGroupMembers}
                </h3>
                <p className="text-xs text-slate-500">
                  {isTamil
                    ? 'உங்கள் மகளிர் குழுவில் சேர்க்கப்பட்டுள்ள உறுப்பினர்களின் பட்டியல் மற்றும் சேமிப்பு விவரம்.'
                    : 'List of members enrolled in your specific SHG collective and their savings balance.'}
                </p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-4">{isTamil ? 'உறுப்பினர் பெயர்' : 'Member Name'}</th>
                      <th className="py-3 px-4">{isTamil ? 'மின்னஞ்சல்' : 'Email'}</th>
                      <th className="py-3 px-4">{isTamil ? 'தொலைபேசி' : 'Phone'}</th>
                      <th className="py-3 px-4">{isTamil ? 'சேமிப்பு இருப்பு' : 'Verified Savings'}</th>
                      <th className="py-3 px-4 text-right">{isTamil ? 'வாட்ஸ்அப்' : 'WhatsApp'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {data?.members?.map((m: any) => (
                      <tr key={m._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{m.email}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{m.phone}</td>
                        <td className="py-3 px-4 font-black text-emerald-700">
                          ₹{(m.savings_total || 0).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setIsWaOpen(true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#128C7E] text-[#128C7E] hover:bg-emerald-50 font-bold text-xs cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{isTamil ? 'நினைவூட்டல்' : 'Send Reminder'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: GROUP FINANCIAL LEDGER & OVERDUE TRACKING */}
          {activeTab === 'LEDGER' && (
            <div className="space-y-6">
              {/* Overdue Alert Callout */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-900 block text-sm">
                    {isTamil ? 'கடன் தவணை நிலுவை எச்சரிக்கை' : 'Scheduled Repayment & Overdue Tracking'}
                  </span>
                  <p className="text-amber-800 mt-0.5">
                    {isTamil
                      ? 'கவிதா சுந்தரம் (கடன் தவணை 1) ₹1,800 தவணை நவம்பர் 10-ஆம் தேதிக்குள் செலுத்தப்பட வேண்டும். நினைவூட்டல் அனுப்ப வாட்ஸ்அப் தாவலைப் பயன்படுத்தவும்.'
                      : 'Kavitha Sundaram has a scheduled EMI installment of ₹1,800 due on November 10, 2026. Use the WhatsApp tab to dispatch a friendly reminder.'}
                  </p>
                </div>
              </div>

              {/* Group Ledger Table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                    {t.tabGroupLedger}
                  </h3>
                  <button
                    onClick={handleExportCsv}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.exportReportBtn}</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">{isTamil ? 'தேதி' : 'Timestamp'}</th>
                        <th className="py-3 px-4">{isTamil ? 'உறுப்பினர்' : 'Member'}</th>
                        <th className="py-3 px-4">{isTamil ? 'பரிவர்த்தனை வகை' : 'Type'}</th>
                        <th className="py-3 px-4">{isTamil ? 'தொகை' : 'Amount'}</th>
                        <th className="py-3 px-4">{isTamil ? 'குறிப்பு' : 'Notes'}</th>
                        <th className="py-3 px-4">{isTamil ? 'ஹாஷ் முத்திரை' : 'Cryptographic Seal'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data?.ledger?.map((l: any) => (
                        <tr key={l._id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                            {new Date(l.timestamp).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{l.member_name}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                l.entry_type === 'SAVINGS_DEPOSIT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : l.entry_type === 'LOAN_DISBURSEMENT'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {l.entry_type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-black text-sm text-slate-900">
                            ₹{l.amount.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 max-w-xs">{l.notes}</td>
                          <td className="py-2.5 px-4 font-mono text-[9px] text-slate-400">
                            {l.entry_hash ? `${l.entry_hash.slice(0, 16)}...` : '0000000000000000...'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WHATSAPP REMINDERS */}
          {activeTab === 'WHATSAPP' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {t.waModalTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isTamil
                      ? 'உங்கள் மகளிர் குழு உறுப்பினர்களுக்கு அதிகாரப்பூர்வ வாட்ஸ்அப் நினைவூட்டல் செய்திகளைத் தயார் செய்து உடனே அனுப்பலாம்.'
                      : 'Prepare and launch WhatsApp reminders exclusively for members of your assigned SHG group.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsWaOpen(true)}
                  className="px-5 py-2.5 bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isTamil ? 'வாட்ஸ்அப் சாளரத்தைத் திற' : 'Open WhatsApp Reminders'}</span>
                </button>
              </div>

              {/* Members Quick List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 font-bold text-xs text-slate-700 uppercase">
                  {isTamil ? 'உங்கள் குழு உறுப்பினர்கள்' : 'Assigned Group Members'}
                </div>
                <div className="divide-y divide-slate-100 bg-white text-xs">
                  {data?.members?.map((m: any) => (
                    <div key={m._id} className="p-3 px-4 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{m.name}</span>
                        <span className="ml-2 text-slate-500 font-mono text-[11px]">{m.phone}</span>
                      </div>
                      <button
                        onClick={() => setIsWaOpen(true)}
                        className="px-3 py-1.5 rounded-lg border border-[#128C7E] text-[#128C7E] hover:bg-emerald-50 font-bold text-xs cursor-pointer"
                      >
                        {isTamil ? 'நினைவூட்டல் அனுப்பு' : 'Prepare Reminder'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY & PASSWORD CHANGE */}
          {activeTab === 'SECURITY' && (
            <div className="max-w-md mx-auto space-y-4">
              <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider text-center">
                {isTamil ? 'கடவுச்சொல் மாற்றுதல்' : 'Change Account Password'}
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
                    {isTamil ? 'புதிய கடவுச்சொல்' : 'New Password (min 8 characters)'}
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
                  {isTamil ? 'கடவுச்சொல்லைப் புதுப்பி' : 'Update Password Securely'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={isWaOpen}
        onClose={() => setIsWaOpen(false)}
        members={data?.members || []}
        groupName={data?.group?.name || 'Sembaruthi Magilir Kulu'}
        csrfToken={csrfToken}
        t={t}
        isTamil={isTamil}
      />

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
