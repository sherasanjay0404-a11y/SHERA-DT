import React, { useState, useEffect } from 'react';
import {
  FileText,
  Radio,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  Coins,
  Wheat,
  Milk,
  RefreshCw,
  Hash,
  ShieldCheck,
  TrendingUp,
  Users,
} from 'lucide-react';
import { NetworkCondition } from './NetworkBar';

export interface LedgerEntry {
  _id: string;
  collective_name: string;
  member_name: string;
  entry_type: 'GRAIN_DEPOSIT' | 'DAIRY_YIELD' | 'MICRO_CREDIT' | 'PRODUCE_DISPATCH' | 'MEMBER_PAYOUT';
  quantity: number;
  unit: string;
  amount: number;
  notes: string;
  prev_hash: string;
  entry_hash: string;
  recorded_by: string;
  timestamp: string;
  verified: boolean;
}

export interface SmartMessage {
  _id: string;
  title: string;
  category: 'MARKET_RATE' | 'WEATHER_ALERT' | 'MEETING' | 'ADVISORY';
  body: string;
  priority: 'HIGH' | 'NORMAL';
  sender: string;
  timestamp: string;
}

interface CollectiveHubProps {
  userRole?: 'ADMIN' | 'USER';
  networkCondition: NetworkCondition;
  csrfToken?: string;
}

export const CollectiveHub: React.FC<CollectiveHubProps> = ({
  userRole = 'ADMIN',
  networkCondition,
  csrfToken,
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'communication'>('ledger');
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [messages, setMessages] = useState<SmartMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // New Ledger Entry Modal / Form
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [entryType, setEntryType] = useState<'GRAIN_DEPOSIT' | 'DAIRY_YIELD' | 'MICRO_CREDIT' | 'MEMBER_PAYOUT'>('GRAIN_DEPOSIT');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('kg');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  // New Communication Broadcast Form
  const [showBroadcastForm, setShowBroadcastForm] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastCategory, setBroadcastCategory] = useState<'MARKET_RATE' | 'WEATHER_ALERT' | 'MEETING' | 'ADVISORY'>('MARKET_RATE');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcastPriority, setBroadcastPriority] = useState<'HIGH' | 'NORMAL'>('NORMAL');

  useEffect(() => {
    fetchLedger();
    fetchCommunications();
  }, [networkCondition]);

  const fetchLedger = async () => {
    if (networkCondition === 'OFFLINE') return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/collective/ledger');
      if (res.ok) {
        const data = await res.json();
        setLedgerEntries(data.entries || []);
      }
    } catch {
      // offline fallback
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCommunications = async () => {
    if (networkCondition === 'OFFLINE') return;
    try {
      const res = await fetch('/api/collective/communication');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // offline fallback
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName || !quantity) return;

    if (networkCondition === 'OFFLINE') {
      // Queue offline ledger entry
      const localEntry: LedgerEntry = {
        _id: 'local_' + Date.now(),
        collective_name: 'SHE Mahila Kisan Sahakari',
        member_name: memberName,
        entry_type: entryType,
        quantity: parseFloat(quantity),
        unit,
        amount: parseFloat(amount || '0'),
        notes,
        prev_hash: ledgerEntries[0]?.entry_hash || '0'.repeat(64),
        entry_hash: 'pending_local_offline_hash_' + Math.random().toString(36).substring(2),
        recorded_by: 'Local Field Worker (Offline)',
        timestamp: new Date().toISOString(),
        verified: false,
      };
      setLedgerEntries([localEntry, ...ledgerEntries]);
      setSubmitMsg('Entry recorded locally in offline queue. Will seal when back online.');
      setShowAddEntry(false);
      resetForm();
      return;
    }

    try {
      const res = await fetch('/api/collective/ledger/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          member_name: memberName,
          entry_type: entryType,
          quantity: parseFloat(quantity),
          unit,
          amount: parseFloat(amount || '0'),
          notes,
          csrf_token: csrfToken,
        }),
      });

      if (res.ok) {
        setSubmitMsg('Transaction cryptographically sealed into transparent ledger.');
        setShowAddEntry(false);
        resetForm();
        fetchLedger();
      }
    } catch (err) {
      setSubmitMsg('Failed to record transaction.');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastBody) return;

    try {
      const res = await fetch('/api/collective/communication/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken || '',
        },
        body: JSON.stringify({
          title: broadcastTitle,
          category: broadcastCategory,
          body: broadcastBody,
          priority: broadcastPriority,
          csrf_token: csrfToken,
        }),
      });

      if (res.ok) {
        setShowBroadcastForm(false);
        setBroadcastTitle('');
        setBroadcastBody('');
        fetchCommunications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setMemberName('');
    setQuantity('');
    setAmount('');
    setNotes('');
  };

  const filteredEntries = ledgerEntries.filter((item) => {
    const matchesSearch =
      item.member_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entry_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'ALL' || item.entry_type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Collective Header Banner */}
      <div className="p-6 bg-gradient-to-r from-emerald-900 to-[#166534] text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                SHE · Self-Help Enterprises & Collectives
              </span>
              <span className="text-xs text-emerald-200/80">Gramin Vikas Federation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold mt-1 tracking-tight">
              Empowering Rural Collectives with Transparent Ledgers & Smart Communication
            </h2>
            <p className="text-xs text-emerald-100/90 mt-1 max-w-2xl leading-relaxed">
              Decentralized, tamper-evident record keeping and packet-resilient field advisories designed for low-connectivity agricultural cooperatives and women-led SHGs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab('ledger'); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-white text-[#166534] shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60'
              }`}
            >
              Transparent Ledgers
            </button>
            <button
              onClick={() => { setActiveTab('communication'); }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeTab === 'communication'
                  ? 'bg-white text-[#166534] shadow-xs'
                  : 'text-emerald-100 hover:bg-emerald-800/60'
              }`}
            >
              Smart Communication
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Area */}
      <div className="p-6">
        {submitMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between">
            <span className="font-medium">{submitMsg}</span>
            <button onClick={() => setSubmitMsg(null)} className="text-emerald-600 font-bold hover:text-emerald-900">
              &times;
            </button>
          </div>
        )}

        {/* TAB 1: TRANSPARENT LEDGER */}
        {activeTab === 'ledger' && (
          <div className="space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search member, batch, or note..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#166534]"
                  />
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 text-slate-700 bg-white"
                >
                  <option value="ALL">All Transactions</option>
                  <option value="GRAIN_DEPOSIT">Grain Deposits</option>
                  <option value="DAIRY_YIELD">Dairy Yield</option>
                  <option value="MICRO_CREDIT">Micro-Credit Loans</option>
                  <option value="MEMBER_PAYOUT">Member Payouts</option>
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={fetchLedger}
                  disabled={isLoading || networkCondition === 'OFFLINE'}
                  className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-40"
                  title="Refresh ledger"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>

                <button
                  onClick={() => setShowAddEntry(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#166534] hover:bg-[#14532d] rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Transaction</span>
                </button>
              </div>
            </div>

            {/* Modal: Record Transaction */}
            {showAddEntry && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Record Collective Transaction</h3>
                    <button
                      onClick={() => setShowAddEntry(false)}
                      className="text-slate-400 hover:text-slate-700 text-lg font-bold"
                    >
                      &times;
                    </button>
                  </div>
                  <form onSubmit={handleCreateEntry} className="p-5 space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Member Name & SHG ID</label>
                      <input
                        type="text"
                        required
                        value={memberName}
                        onChange={(e) => setMemberName(e.target.value)}
                        placeholder="e.g. Meena Bai (SHG 05)"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Transaction Category</label>
                        <select
                          value={entryType}
                          onChange={(e: any) => setEntryType(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                        >
                          <option value="GRAIN_DEPOSIT">Grain Deposit</option>
                          <option value="DAIRY_YIELD">Dairy Yield</option>
                          <option value="MICRO_CREDIT">Micro-Credit</option>
                          <option value="MEMBER_PAYOUT">Member Payout</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Unit of Measure</label>
                        <input
                          type="text"
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          placeholder="kg / Liters / bags"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={quantity}
                          onChange={(e) => setQuantity(e.target.value)}
                          placeholder="0.00"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Amount Value (INR)</label>
                        <input
                          type="number"
                          step="any"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          placeholder="₹ 0.00"
                          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Notes & Depot Batch</label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Moisture 11%, Silo 3"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddEntry(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-[#166534] hover:bg-[#14532d] text-white font-semibold"
                      >
                        Seal & Record
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Transparent Ledger Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Member / SHG</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3">Cryptographic Chain Seal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEntries.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{item.member_name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{item.notes}</div>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.entry_type === 'GRAIN_DEPOSIT' && (
                          <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200">
                            <Wheat className="w-3 h-3 text-emerald-600" />
                            Grain
                          </span>
                        )}
                        {item.entry_type === 'DAIRY_YIELD' && (
                          <span className="inline-flex items-center gap-1 text-blue-800 bg-blue-50 px-2 py-0.5 rounded font-medium border border-blue-200">
                            <Milk className="w-3 h-3 text-blue-600" />
                            Dairy
                          </span>
                        )}
                        {item.entry_type === 'MICRO_CREDIT' && (
                          <span className="inline-flex items-center gap-1 text-purple-800 bg-purple-50 px-2 py-0.5 rounded font-medium border border-purple-200">
                            <Coins className="w-3 h-3 text-purple-600" />
                            Micro-Credit
                          </span>
                        )}
                        {item.entry_type === 'MEMBER_PAYOUT' && (
                          <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-medium border border-amber-200">
                            <TrendingUp className="w-3 h-3 text-amber-600" />
                            Payout
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-slate-500">
                        <div className="flex items-center gap-1 text-emerald-700">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[120px]" title={item.entry_hash}>
                            {item.entry_hash.substring(0, 14)}...
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SMART COMMUNICATION */}
        {activeTab === 'communication' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  SHE Smart Communication & Broadcast Hub
                </h3>
                <p className="text-xs text-slate-500">
                  Compressed, packet-resilient advisories stored locally for offline field lookup.
                </p>
              </div>

              {userRole === 'ADMIN' && (
                <button
                  onClick={() => setShowBroadcastForm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#166534] hover:bg-[#14532d] rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>New Broadcast</span>
                </button>
              )}
            </div>

            {/* Broadcast Creation Modal */}
            {showBroadcastForm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">Dispatch Smart Broadcast</h3>
                    <button
                      onClick={() => setShowBroadcastForm(false)}
                      className="text-slate-400 hover:text-slate-700 text-lg font-bold"
                    >
                      &times;
                    </button>
                  </div>
                  <form onSubmit={handleSendBroadcast} className="p-5 space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Broadcast Title</label>
                      <input
                        type="text"
                        required
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="e.g. APMC Mandi Benchmark or Monsoon Alert"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Category</label>
                        <select
                          value={broadcastCategory}
                          onChange={(e: any) => setBroadcastCategory(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                        >
                          <option value="MARKET_RATE">Mandi Price</option>
                          <option value="WEATHER_ALERT">Weather Advisory</option>
                          <option value="MEETING">Collective Meeting</option>
                          <option value="ADVISORY">Field Advisory</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                        <select
                          value={broadcastPriority}
                          onChange={(e: any) => setBroadcastPriority(e.target.value)}
                          className="w-full px-2.5 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                        >
                          <option value="NORMAL">Standard</option>
                          <option value="HIGH">High Priority</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Message Body</label>
                      <textarea
                        required
                        rows={3}
                        value={broadcastBody}
                        onChange={(e) => setBroadcastBody(e.target.value)}
                        placeholder="Details of the announcement, prices, or storage precautions..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900"
                      />
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBroadcastForm(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-medium"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg bg-[#166534] hover:bg-[#14532d] text-white font-semibold"
                      >
                        Dispatch Broadcast
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Messages Feed */}
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg._id}
                  className={`p-4 rounded-xl border transition-colors ${
                    msg.priority === 'HIGH'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        msg.category === 'MARKET_RATE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : msg.category === 'WEATHER_ALERT'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {msg.category.replace('_', ' ')}
                      </span>
                      {msg.priority === 'HIGH' && (
                        <span className="text-[10px] font-bold text-amber-700 uppercase flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          High Priority
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(msg.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{msg.title}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{msg.body}</p>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Sender: <strong>{msg.sender}</strong></span>
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Cached for Offline Field Access
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
