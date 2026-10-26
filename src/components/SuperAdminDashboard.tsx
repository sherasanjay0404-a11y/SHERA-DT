import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Building2,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  PlusCircle,
  MessageSquare,
  Lock,
  RefreshCw,
  LogOut,
  History,
  FileCheck2,
} from 'lucide-react';
import { Translations } from '../utils/translations';
import { WhatsAppModal } from './WhatsAppModal';
import { PrintableReceiptModal, ReceiptData } from './PrintableReceiptModal';

interface SuperAdminDashboardProps {
  user: { id: string; email: string; name?: string; role: string };
  csrfToken?: string;
  onLogout: () => void;
  t: Translations;
  isTamil: boolean;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({
  user,
  csrfToken,
  onLogout,
  t,
  isTamil,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'MEMBERS' | 'GROUPS' | 'FINANCES' | 'LEDGER' | 'WHATSAPP' | 'SECURITY'>('MEMBERS');

  // Modals & Forms State
  const [isWaOpen, setIsWaOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);

  // Group Create Form
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupVillage, setNewGroupVillage] = useState('');
  const [newGroupAdminEmail, setNewGroupAdminEmail] = useState('');
  const [newGroupTarget, setNewGroupTarget] = useState(500);
  const [newGroupSchedule, setNewGroupSchedule] = useState('Monthly 1st Sunday 10:00 AM');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Member Approval Modal
  const [approvingMember, setApprovingMember] = useState<any | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('grp_01');

  // Member Allocation Modal
  const [allocatingMember, setAllocatingMember] = useState<any | null>(null);
  const [targetAllocGroupId, setTargetAllocGroupId] = useState<string>('grp_01');

  const [notificationMsg, setNotificationMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, dataRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/super-admin/data'),
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
      console.error('Failed to load Super Admin data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveMember = async (memberId: string, groupId?: string) => {
    try {
      const res = await fetch('/api/super-admin/members/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({ member_id: memberId, group_id: groupId }),
      });

      if (res.ok) {
        setNotificationMsg({
          text: isTamil ? 'உறுப்பினர் பதிவு வெற்றிகரமாக அங்கீகரிக்கப்பட்டது.' : 'Member registration approved successfully.',
          type: 'success',
        });
        setApprovingMember(null);
        fetchDashboardData();
      }
    } catch {
      setNotificationMsg({ text: 'Error executing approval.', type: 'error' });
    }
  };

  const handleRejectMember = async (memberId: string) => {
    const reason = prompt(t.rejectionReasonPrompt) || 'Incomplete application criteria';
    try {
      const res = await fetch('/api/super-admin/members/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({ member_id: memberId, reason }),
      });

      if (res.ok) {
        setNotificationMsg({
          text: isTamil ? 'உறுப்பினர் விண்ணப்பம் நிராகரிக்கப்பட்டது.' : 'Member registration marked as rejected.',
          type: 'success',
        });
        fetchDashboardData();
      }
    } catch {
      setNotificationMsg({ text: 'Error rejecting registration.', type: 'error' });
    }
  };

  const handleAllocateMember = async () => {
    if (!allocatingMember || !targetAllocGroupId) return;
    try {
      const res = await fetch('/api/super-admin/members/allocate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({ member_id: allocatingMember._id, group_id: targetAllocGroupId }),
      });

      if (res.ok) {
        setNotificationMsg({
          text: isTamil ? 'உறுப்பினர் குழுவில் சேர்க்கப்பட்டார்.' : 'Member successfully re-allocated to group.',
          type: 'success',
        });
        setAllocatingMember(null);
        fetchDashboardData();
      }
    } catch {
      setNotificationMsg({ text: 'Error allocating member.', type: 'error' });
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName || !newGroupVillage) return;

    setIsCreatingGroup(true);
    try {
      const res = await fetch('/api/super-admin/groups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          name: newGroupName,
          village: newGroupVillage,
          admin_email: newGroupAdminEmail,
          monthly_savings_target: newGroupTarget,
          meeting_schedule: newGroupSchedule,
        }),
      });

      if (res.ok) {
        setNotificationMsg({
          text: isTamil ? 'புதிய மகளிர் குழு உருவாக்கப்பட்டது.' : 'New SHG Collective Group established.',
          type: 'success',
        });
        setNewGroupName('');
        setNewGroupVillage('');
        setNewGroupAdminEmail('');
        fetchDashboardData();
      }
    } catch {
      setNotificationMsg({ text: 'Failed to create group.', type: 'error' });
    } finally {
      setIsCreatingGroup(false);
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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-2xl shadow-xs">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {t.superAdminTitle}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                {t.roleSuperAdmin}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t.superAdminSubtitle} · <span className="font-mono text-slate-700">{user.email}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
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

      {/* Real Database Statistics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{t.totalGroupsStat}</span>
            <Building2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.total_groups ?? 0}
          </div>
          <span className="text-[10px] text-slate-500">{isTamil ? 'அனைத்து மாவட்டங்கள்' : 'Active SHGs'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{t.totalMembersStat}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.total_members ?? 0}
          </div>
          <span className="text-[10px] text-slate-500">{isTamil ? 'பதிவு செய்யப்பட்டோர்' : 'Registered members'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{t.totalSavingsStat}</span>
            <DollarSign className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            ₹{(stats?.total_savings ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">{isTamil ? 'சரிபார்க்கப்பட்ட சேமிப்பு' : 'Verified deposits'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{t.totalDisbursedStat}</span>
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-700">
            ₹{(stats?.total_disbursed ?? 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-indigo-600 font-medium">{isTamil ? 'அங்கீகரிக்கப்பட்ட கடன்' : 'Sanctioned loans'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="font-bold text-[10px] uppercase">{t.pendingRegsStat}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-900">
            {stats?.pending_registrations ?? 0}
          </div>
          <span className="text-[10px] text-amber-700 font-semibold">{isTamil ? 'ஒப்புதலுக்கு காத்திருக்கிறது' : 'Awaiting review'}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="font-bold text-[10px] uppercase">{t.pendingApprovalsStat}</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {stats?.pending_approvals ?? 0}
          </div>
          <span className="text-[10px] text-slate-500">{isTamil ? 'கட்டணம் & கடன்' : 'In review queue'}</span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto text-xs font-bold bg-slate-50">
          <button
            onClick={() => setActiveTab('MEMBERS')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'MEMBERS'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabMembersReg}{' '}
            {stats?.pending_registrations > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900">
                {stats.pending_registrations}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('GROUPS')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'GROUPS'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabShgGroups}
          </button>

          <button
            onClick={() => setActiveTab('FINANCES')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'FINANCES'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabFinancialQueues}
          </button>

          <button
            onClick={() => setActiveTab('LEDGER')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'LEDGER'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabLedgerAudit}
          </button>

          <button
            onClick={() => setActiveTab('WHATSAPP')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'WHATSAPP'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabWhatsAppComm}
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`py-3.5 px-5 border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
              activeTab === 'SECURITY'
                ? 'border-[#166534] text-[#166534] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tabSecuritySettings}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {/* TAB 1: MEMBERS REGISTRATION & ALLOCATION */}
          {activeTab === 'MEMBERS' && (
            <div className="space-y-6">
              {/* Pending Approvals Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>{isTamil ? 'புதிய உறுப்பினர் விண்ணப்பங்கள் (அனுமதிக்கு)' : 'Pending Member Registrations Awaiting Approval'}</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    {data?.pending_registrations?.length || 0} {isTamil ? 'விண்ணப்பங்கள்' : 'pending'}
                  </span>
                </div>

                {!data?.pending_registrations || data.pending_registrations.length === 0 ? (
                  <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 text-center text-xs text-slate-500">
                    {isTamil ? 'தற்போது நிலுவையில் உள்ள புதிய விண்ணப்பங்கள் இல்லை.' : 'No pending member applications in the queue.'}
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-amber-200 rounded-xl">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-amber-100/60 text-amber-950 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="py-3 px-4">{isTamil ? 'பெயர்' : 'Applicant'}</th>
                          <th className="py-3 px-4">{isTamil ? 'மின்னஞ்சல் & தொலைபேசி' : 'Email & Phone'}</th>
                          <th className="py-3 px-4">{isTamil ? 'விண்ணப்பித்த நாள்' : 'Application Date'}</th>
                          <th className="py-3 px-4">{isTamil ? 'நிலை' : 'Status'}</th>
                          <th className="py-3 px-4 text-right">{isTamil ? 'நடவடிக்கைகள்' : 'Actions'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-100 bg-white">
                        {data.pending_registrations.map((m: any) => (
                          <tr key={m._id} className="hover:bg-amber-50/40">
                            <td className="py-3 px-4 font-bold text-slate-900">{m.name}</td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-slate-700">{m.email}</span>
                              <span className="block text-slate-500 text-[11px]">{m.phone}</span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                              {new Date(m.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                                PENDING
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  onClick={() => setApprovingMember(m)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs cursor-pointer"
                                >
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>{t.approveMemberBtn}</span>
                                </button>
                                <button
                                  onClick={() => handleRejectMember(m._id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>{t.rejectMemberBtn}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* All Approved Members & Group Allocation Table */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>{isTamil ? 'அனைத்து பதிவுசெய்யப்பட்ட உறுப்பினர்கள் & குழு ஒதுக்கீடு' : 'All Registered Members & Group Allocation'}</span>
                  </h3>
                  <span className="text-xs text-slate-500">
                    {data?.members?.length || 0} {isTamil ? 'உறுப்பினர்கள்' : 'members'}
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">{isTamil ? 'உறுப்பினர் பெயர்' : 'Member Name'}</th>
                        <th className="py-3 px-4">{isTamil ? 'மின்னஞ்சல்' : 'Email'}</th>
                        <th className="py-3 px-4">{isTamil ? 'தொலைபேசி' : 'Phone'}</th>
                        <th className="py-3 px-4">{isTamil ? 'ஒதுக்கப்பட்ட மகளிர் குழு' : 'Allocated SHG Group'}</th>
                        <th className="py-3 px-4 text-right">{isTamil ? 'குழு மாற்றம்' : 'Allocation Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data?.members?.map((mem: any) => (
                        <tr key={mem._id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{mem.name}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{mem.email}</td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{mem.phone}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-100">
                              {mem.group_name || 'Not Allocated'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                setAllocatingMember(mem);
                                setTargetAllocGroupId(mem.group_id || 'grp_01');
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            >
                              {t.allocateGroupBtn}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHG GROUPS MANAGEMENT */}
          {activeTab === 'GROUPS' && (
            <div className="space-y-6">
              {/* Create Group Form */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="font-black text-sm text-slate-900 mb-3 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-[#166534]" />
                  <span>{t.createGroupBtn}</span>
                </h3>
                <form onSubmit={handleCreateGroup} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      {isTamil ? 'குழுவின் பெயர்' : 'SHG Group Name'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Roja Magilir Kulu"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      {isTamil ? 'கிராமம் / இருப்பிடம்' : 'Village / Location'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kumbakonam"
                      value={newGroupVillage}
                      onChange={(e) => setNewGroupVillage(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      {isTamil ? 'குழு தலைவி மின்னஞ்சல்' : 'Group Leader Email (Admin)'}
                    </label>
                    <input
                      type="email"
                      placeholder="leader@magilirkulu.org"
                      value={newGroupAdminEmail}
                      onChange={(e) => setNewGroupAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">
                      {isTamil ? 'மாதச் சேமிப்பு இலக்கு (₹)' : 'Monthly Savings Target (₹)'}
                    </label>
                    <input
                      type="number"
                      value={newGroupTarget}
                      onChange={(e) => setNewGroupTarget(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-600 font-bold mb-1">
                      {isTamil ? 'கூட்ட அட்டவணை' : 'Meeting Schedule'}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newGroupSchedule}
                        onChange={(e) => setNewGroupSchedule(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900"
                      />
                      <button
                        type="submit"
                        disabled={isCreatingGroup}
                        className="px-5 py-2 bg-[#166534] hover:bg-[#15803d] text-white font-bold rounded-lg shadow-xs cursor-pointer shrink-0 disabled:opacity-50"
                      >
                        {isCreatingGroup ? 'Creating...' : t.createGroupBtn}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Groups List Table */}
              <div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-3">
                  {isTamil ? 'செயலில் உள்ள மகளிர் குழுக்கள்' : 'Registered SHG Collective Groups'}
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">{isTamil ? 'குழுவின் பெயர்' : 'Group Name'}</th>
                        <th className="py-3 px-4">{isTamil ? 'கிராமம்' : 'Village'}</th>
                        <th className="py-3 px-4">{isTamil ? 'தலைவி / நிர்வாகி' : 'Group Leader / Admin'}</th>
                        <th className="py-3 px-4">{isTamil ? 'மாத இலக்கு' : 'Savings Target'}</th>
                        <th className="py-3 px-4">{isTamil ? 'கூட்ட நேரம்' : 'Meeting Schedule'}</th>
                        <th className="py-3 px-4">{isTamil ? 'நிலை' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data?.groups?.map((grp: any) => (
                        <tr key={grp._id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{grp.name}</td>
                          <td className="py-3 px-4 text-slate-600">{grp.village}</td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">{grp.admin_name}</span>
                            <span className="font-mono text-[10px] text-slate-500">{grp.admin_email}</span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-emerald-700">
                            ₹{grp.monthly_savings_target}/mo
                          </td>
                          <td className="py-3 px-4 text-slate-600">{grp.meeting_schedule}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                grp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {grp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FINANCIAL VERIFICATION QUEUES */}
          {activeTab === 'FINANCES' && (
            <div className="space-y-6">
              {/* Payment Submissions Queue */}
              <div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-3">
                  {isTamil ? 'அனைத்து குழுக்களின் செலுத்தல் சரிபார்ப்பு வரிசை' : 'Organization-Wide Payment Submissions Queue'}
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">{isTamil ? 'ரசீது எண்' : 'Receipt #'}</th>
                        <th className="py-3 px-4">{isTamil ? 'உறுப்பினர் & குழு' : 'Member & Group'}</th>
                        <th className="py-3 px-4">{isTamil ? 'வகை' : 'Type'}</th>
                        <th className="py-3 px-4">{isTamil ? 'தொகை' : 'Amount'}</th>
                        <th className="py-3 px-4">{isTamil ? 'பணம் செலுத்திய முறை' : 'Mode & Reference'}</th>
                        <th className="py-3 px-4">{isTamil ? 'நிலை' : 'Status'}</th>
                        <th className="py-3 px-4 text-right">{isTamil ? 'ரசீது' : 'Receipt'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data?.payment_submissions?.map((p: any) => (
                        <tr key={p._id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-[#166534]">
                            {p.receipt_number}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">{p.member_name}</span>
                            <span className="text-[11px] text-slate-500">{p.group_name}</span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {p.payment_type === 'SAVINGS_DEPOSIT' ? 'Savings Deposit' : 'Loan Repayment'}
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
                            <button
                              onClick={() => handleViewReceipt(p._id)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                            >
                              {isTamil ? 'ரசீது காண்க' : 'View Receipt'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Amount / Loan Requests Queue */}
              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-3">
                  {isTamil ? 'அனைத்து குழுக்களின் கடன் விண்ணப்பங்கள்' : 'Organization-Wide Loan Amount Requests'}
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">{isTamil ? 'உறுப்பினர்' : 'Applicant'}</th>
                        <th className="py-3 px-4">{isTamil ? 'குழு' : 'SHG Group'}</th>
                        <th className="py-3 px-4">{isTamil ? 'தொகை' : 'Amount'}</th>
                        <th className="py-3 px-4">{isTamil ? 'நோக்கம்' : 'Purpose'}</th>
                        <th className="py-3 px-4">{isTamil ? 'கால அளவு' : 'Tenure'}</th>
                        <th className="py-3 px-4">{isTamil ? 'நிலை' : 'Status'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data?.amount_requests?.map((req: any) => (
                        <tr key={req._id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-900">{req.member_name}</td>
                          <td className="py-3 px-4 text-slate-600">{req.group_name}</td>
                          <td className="py-3 px-4 font-black text-sm text-indigo-700">
                            ₹{req.amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-slate-700 max-w-xs">{req.purpose}</td>
                          <td className="py-3 px-4 font-mono text-[11px]">{req.repayment_months} months</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                req.status === 'APPROVED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : req.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {req.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRANSPARENT LEDGER & AUDIT TRAIL */}
          {activeTab === 'LEDGER' && (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                <strong>{isTamil ? 'கிரிப்டோகிராஃபிக் லெட்ஜர்:' : 'Cryptographically Sealed Collective Ledger:'}</strong>{' '}
                {isTamil
                  ? 'ஒவ்வொரு பரிவர்த்தனையும் SHA-256 ஹாஷ் செயின் மூலம் முந்தைய வரவுடன் இணைக்கப்பட்டு யாராலும் மாற்ற முடியாதபடி பாதுகாக்கப்படுகிறது.'
                  : 'Every financial entry is chained with SHA-256 block hashes to ensure complete transparency across rural collectives.'}
              </div>

              <div>
                <h3 className="font-black text-sm text-slate-900 uppercase tracking-wider mb-3">
                  {t.auditTrailTitle}
                </h3>
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="py-3 px-4">{t.colTimestamp}</th>
                        <th className="py-3 px-4">{t.colMethod}</th>
                        <th className="py-3 px-4">{t.colNetwork}</th>
                        <th className="py-3 px-4">{t.colResult}</th>
                        <th className="py-3 px-4">{t.colAccount}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {data?.audit_logs?.map((ev: any) => (
                        <tr key={ev._id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                            {new Date(ev.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-800">{ev.method}</td>
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600">
                            {ev.network_state}
                          </td>
                          <td className="py-2.5 px-4">
                            {ev.success ? (
                              <span className="text-emerald-700 font-bold">{isTamil ? 'வெற்றி' : 'Success'}</span>
                            ) : (
                              <span className="text-red-600 font-semibold">{ev.failure_reason || 'Failed'}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{ev.email || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WHATSAPP NOTIFICATIONS MODULE */}
          {activeTab === 'WHATSAPP' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {t.waModalTitle}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {isTamil
                      ? 'அங்கீகரிக்கப்பட்ட அனைத்து மகளிர் குழு உறுப்பினர்களுக்கும் வாட்ஸ்அப் கிளிக்-டு-சாட் நினைவூட்டல் செய்திகளைத் தயார் செய்து அனுப்பலாம்.'
                      : 'Prepare and manually dispatch WhatsApp reminders to all registered SHG members with zero external API fees.'}
                  </p>
                </div>
                <button
                  onClick={() => setIsWaOpen(true)}
                  className="px-5 py-2.5 bg-[#128C7E] hover:bg-[#075E54] text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{isTamil ? 'வாட்ஸ்அப் சாளரத்தைத் திற' : 'Launch WhatsApp Module'}</span>
                </button>
              </div>

              {/* Members Quick List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-3 font-bold text-xs text-slate-700 uppercase">
                  {isTamil ? 'வாட்ஸ்அப் அறிவிப்பு அனுப்பக்கூடிய உறுப்பினர்கள்' : 'Eligible Members for WhatsApp Reminders'}
                </div>
                <div className="divide-y divide-slate-100 bg-white text-xs">
                  {data?.members?.map((m: any) => (
                    <div key={m._id} className="p-3 px-4 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900">{m.name}</span>
                        <span className="ml-2 text-slate-500 font-mono text-[11px]">{m.phone}</span>
                        <span className="block text-[11px] text-emerald-800 font-semibold">{m.group_name}</span>
                      </div>
                      <button
                        onClick={() => setIsWaOpen(true)}
                        className="px-3 py-1.5 rounded-lg border border-[#128C7E] text-[#128C7E] hover:bg-emerald-50 font-bold text-xs cursor-pointer"
                      >
                        {isTamil ? 'செய்தி அனுப்பு' : 'Send Reminder'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY & AIR-GAPPED RECOVERY */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 text-xs leading-relaxed">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Lock className="w-4 h-4 text-[#166534]" />
                  <span>{t.recoveryTitle}</span>
                </div>
                <p className="text-slate-600">{t.recoveryAirGapNotice}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-4 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">
                      {isTamil ? 'படி 1: நேரடி சரிபார்ப்பு' : 'Step 1: In-Person Identity Verification'}
                    </span>
                    <p className="text-slate-600 text-[11px]">{t.recoveryStep1}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block mb-1">
                      {isTamil ? 'படி 2: புதிய சான்றுகள் மறுவழங்கல்' : 'Step 2: Credential Re-provisioning'}
                    </span>
                    <p className="text-slate-600 text-[11px]">{t.recoveryStep2}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Approve Member & Allocate Modal */}
      {approvingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">
              {isTamil ? 'உறுப்பினர் விண்ணப்பத்தை அனுமதித்து குழுவை ஒதுக்கு' : 'Approve Registration & Allocate to Group'}
            </h3>
            <p className="text-slate-600">
              {isTamil
                ? `விண்ணப்பதாரர் ${approvingMember.name} (${approvingMember.email})-ஐ அங்கீகரிக்க விரும்பும் மகளிர் குழுவைத் தேர்ந்தெடுக்கவும்:`
                : `Select the SHG collective group to allocate ${approvingMember.name} (${approvingMember.email}):`}
            </p>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {isTamil ? 'மகளிர் குழுவைத் தேர்ந்தெடு' : 'Select Target SHG Group'}
              </label>
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {data?.groups?.map((g: any) => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.village})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setApprovingMember(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold"
              >
                {isTamil ? 'ரத்து' : 'Cancel'}
              </button>
              <button
                onClick={() => handleApproveMember(approvingMember._id, selectedGroupId)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-xs hover:bg-emerald-700"
              >
                {t.approveMemberBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Re-Allocate Group Modal */}
      {allocatingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-xs">
            <h3 className="text-base font-bold text-slate-900">
              {isTamil ? 'குழு மாற்றம் / புதிய ஒதுக்கீடு' : 'Re-allocate Member to SHG Group'}
            </h3>
            <p className="text-slate-600">
              {isTamil ? 'உறுப்பினர்:' : 'Member:'} <strong>{allocatingMember.name}</strong>
            </p>
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                {isTamil ? 'புதிய மகளிர் குழு' : 'Target SHG Group'}
              </label>
              <select
                value={targetAllocGroupId}
                onChange={(e) => setTargetAllocGroupId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {data?.groups?.map((g: any) => (
                  <option key={g._id} value={g._id}>
                    {g.name} ({g.village})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAllocatingMember(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-bold"
              >
                {isTamil ? 'ரத்து' : 'Cancel'}
              </button>
              <button
                onClick={handleAllocateMember}
                className="px-4 py-2 bg-[#166534] text-white rounded-lg font-bold shadow-xs hover:bg-[#15803d]"
              >
                {t.allocateGroupBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      <WhatsAppModal
        isOpen={isWaOpen}
        onClose={() => setIsWaOpen(false)}
        members={data?.members || []}
        groupName="Magilir Kulu Tamil Nadu"
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
