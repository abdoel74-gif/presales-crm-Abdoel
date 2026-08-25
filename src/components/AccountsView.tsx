import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Users,
  TrendingUp,
  MoreVertical,
  Edit2,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  Briefcase,
  Layers,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { Account, AccountFormData, AccountTier, AccountStatus, UserRole } from '../types.ts';
import { accountsService } from '../lib/accounts-service.ts';
import { AccountModal } from './AccountModal.tsx';
import { AccountDetailModal } from './AccountDetailModal.tsx';
import { INDUSTRY_OPTIONS, AE_OPTIONS } from '../data/initialAccountsData.ts';
import { useAuth } from '../lib/AuthContext.tsx';

interface AccountsViewProps {
  currentRole?: UserRole;
}

export const AccountsView: React.FC<AccountsViewProps> = ({ currentRole }) => {
  const { canAccess } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAE, setSelectedAE] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(8);

  // Sorting
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'tier' | 'totalDealValue'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccountForDetail, setSelectedAccountForDetail] = useState<Account | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Permissions
  const canCreate = canAccess('accounts', 'create');
  const canEdit = canAccess('accounts', 'edit');
  const canDelete = canAccess('accounts', 'delete');

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await accountsService.getAccounts({
        search: searchTerm,
        industry: selectedIndustry,
        tier: selectedTier,
        status: selectedStatus,
        assignedAeId: selectedAE,
        page,
        limit,
        sortBy,
        sortOrder,
      });
      setAccounts(res.data);
      setTotalCount(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedIndustry, selectedTier, selectedStatus, selectedAE, page, limit, sortBy, sortOrder]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleRefreshAccount = async (accountId: string) => {
    const fresh = await accountsService.getAccountById(accountId);
    if (fresh) {
      setSelectedAccountForDetail(fresh);
      loadAccounts();
    }
  };

  const handleSaveAccount = async (formData: AccountFormData, id?: string) => {
    if (id) {
      await accountsService.updateAccount(id, formData);
      setActionSuccessMessage('Account updated successfully.');
    } else {
      await accountsService.createAccount(formData);
      setActionSuccessMessage('Account created successfully.');
    }
    await loadAccounts();
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAccount) return;
    try {
      await accountsService.deleteAccount(deletingAccount.id);
      setActionSuccessMessage(`Account "${deletingAccount.name}" removed.`);
      setDeletingAccount(null);
      await loadAccounts();
      setTimeout(() => setActionSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  // KPIs
  const totalPipeline = useMemo(() => {
    return accounts.reduce((sum, a) => sum + (a.totalDealValue || 0), 0);
  }, [accounts]);

  const strategicCount = useMemo(() => {
    return accounts.filter((a) => a.tier === 'Strategic').length;
  }, [accounts]);

  const activeCount = useMemo(() => {
    return accounts.filter((a) => a.status === 'Active').length;
  }, [accounts]);

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'Strategic':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Tier-1':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Tier-2':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Prospect':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Accounts & Stakeholders</h1>
              <p className="text-xs text-slate-500">
                Enterprise client dossiers, buying center maps, and multi-tenant CRM repositories.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadAccounts()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            title="Refresh Account Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Supabase</span>
          </button>

          {canCreate && (
            <button
              onClick={() => {
                setEditingAccount(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionSuccessMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-700 hover:text-emerald-900">
            &times;
          </button>
        </div>
      )}

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Accounts</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">{activeCount} actively engaged in pipeline</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Strategic Tier</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-purple-700 mt-2">{strategicCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">High-priority enterprise logos</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pipeline Attached</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono mt-2">
            Rp {(totalPipeline / 1000000000).toFixed(1)}M
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">Across active client deals</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Security & Isolation</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-sm font-bold text-slate-800 mt-2">Multi-Tenant RLS</div>
          <div className="text-[11px] text-slate-400 mt-1">Supabase company-scoped access</div>
        </div>
      </div>

      {/* Control & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-3 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search by account name, code, or city..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700"
              >
                &times;
              </button>
            )}
          </div>

          {/* View Toggles & Sorting */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Field */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="createdAt">Date Created</option>
                <option value="name">Company Name</option>
                <option value="totalDealValue">Deal Value</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-[10px] font-bold text-indigo-600 ml-1 px-1 hover:bg-slate-200 rounded"
              >
                {sortOrder === 'asc' ? 'ASC' : 'DESC'}
              </button>
            </div>

            {/* Table / Grid Mode */}
            <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden p-0.5 bg-slate-50">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          {/* Industry Filter */}
          <select
            value={selectedIndustry}
            onChange={(e) => {
              setSelectedIndustry(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Industries</option>
            {INDUSTRY_OPTIONS.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>

          {/* Tier Filter */}
          <select
            value={selectedTier}
            onChange={(e) => {
              setSelectedTier(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Strategic Tiers</option>
            <option value="Strategic">Strategic Tier</option>
            <option value="Tier-1">Tier-1 Enterprise</option>
            <option value="Tier-2">Tier-2 Commercial</option>
            <option value="SMB">SMB / Mid-Market</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Prospect">Prospect</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Assigned AE Filter */}
          <select
            value={selectedAE}
            onChange={(e) => {
              setSelectedAE(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Account Executives</option>
            {AE_OPTIONS.map((ae) => (
              <option key={ae.id} value={ae.id}>
                {ae.name}
              </option>
            ))}
          </select>

          {(selectedIndustry !== 'all' || selectedTier !== 'all' || selectedStatus !== 'all' || selectedAE !== 'all') && (
            <button
              onClick={() => {
                setSelectedIndustry('all');
                setSelectedTier('all');
                setSelectedStatus('all');
                setSelectedAE('all');
                setPage(1);
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* MAIN DATA CONTENT (Table or Grid) */}
      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-700">Querying Supabase Accounts database...</p>
          <p className="text-[11px] text-slate-400 mt-1">Applying multi-tenant Row Level Security policies</p>
        </div>
      ) : accounts.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Enterprise Accounts Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new enterprise client into the CRM.
          </p>
          {canCreate && (
            <button
              onClick={() => {
                setEditingAccount(null);
                setIsCreateModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Account / Code</th>
                  <th className="px-4 py-3.5">Industry Vertical</th>
                  <th className="px-4 py-3.5">Tier</th>
                  <th className="px-4 py-3.5">Assigned AE</th>
                  <th className="px-4 py-3.5 text-center">Buying Center</th>
                  <th className="px-4 py-3.5 text-right">Pipeline Value</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {accounts.map((acc) => (
                  <tr
                    key={acc.id}
                    className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                    onClick={() => {
                      accountsService.getAccountById(acc.id).then((fresh) => {
                        setSelectedAccountForDetail(fresh || acc);
                      });
                    }}
                  >
                    {/* Account & Code */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
                          {acc.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {acc.name}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono">
                            <span>{acc.code}</span>
                            {acc.city && (
                              <>
                                <span>•</span>
                                <span>{acc.city}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Industry */}
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-800">{acc.industry}</span>
                    </td>

                    {/* Tier */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getTierBadge(acc.tier)}`}>
                        {acc.tier}
                      </span>
                    </td>

                    {/* Assigned AE */}
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-slate-900">{acc.assignedAeName || 'Rian Hidayat'}</div>
                      <div className="text-[10px] text-slate-400">Account Executive</div>
                    </td>

                    {/* Buying Center Stakeholders */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span>{acc.contactsCount || 0}</span>
                      </span>
                    </td>

                    {/* Pipeline Value */}
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                      {acc.totalDealValue && acc.totalDealValue > 0 ? (
                        <span>Rp {(acc.totalDealValue / 1000000000).toFixed(1)}M</span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(acc.status)}`}>
                        {acc.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            accountsService.getAccountById(acc.id).then((fresh) => {
                              setSelectedAccountForDetail(fresh || acc);
                            });
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="View Buying Center & Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => {
                              setEditingAccount(acc);
                              setIsCreateModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Edit Account"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => setDeletingAccount(acc)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              onClick={() => {
                accountsService.getAccountById(acc.id).then((fresh) => {
                  setSelectedAccountForDetail(fresh || acc);
                });
              }}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                    {acc.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getTierBadge(acc.tier)}`}>
                    {acc.tier}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {acc.name}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{acc.code}</p>

                <div className="space-y-1.5 mt-4 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Industry:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[150px]">{acc.industry}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Assigned AE:</span>
                    <span className="font-medium text-slate-700">{acc.assignedAeName || 'Rian Hidayat'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Buying Center:</span>
                    <span className="font-bold text-indigo-600">{acc.contactsCount || 0} Stakeholders</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getStatusBadge(acc.status)}`}>
                  {acc.status}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      accountsService.getAccountById(acc.id).then((fresh) => {
                        setSelectedAccountForDetail(fresh || acc);
                      });
                    }}
                    className="p-1 text-slate-400 hover:text-indigo-600 rounded"
                    title="View"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => {
                        setEditingAccount(acc);
                        setIsCreateModalOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 rounded"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setDeletingAccount(acc)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-xs">
        <div className="text-slate-500">
          Showing <span className="font-bold text-slate-800">{accounts.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
          <span className="font-bold text-slate-800">{Math.min(page * limit, totalCount)}</span> of{' '}
          <span className="font-bold text-slate-800">{totalCount}</span> enterprise accounts
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold">
            Page {page} of {totalPages || 1}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Create / Edit Account Modal */}
      <AccountModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSaveAccount}
        account={editingAccount}
      />

      {/* Account Detail & Buying Center Modal */}
      <AccountDetailModal
        isOpen={Boolean(selectedAccountForDetail)}
        onClose={() => setSelectedAccountForDetail(null)}
        account={selectedAccountForDetail}
        onRefreshAccount={handleRefreshAccount}
        onEditAccount={(acc) => {
          setSelectedAccountForDetail(null);
          setEditingAccount(acc);
          setIsCreateModalOpen(true);
        }}
      />

      {/* Delete Confirmation Dialog */}
      {deletingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900">Delete Account</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800">{deletingAccount.name}</strong> ({deletingAccount.code})? 
              This will remove all associated contacts, buying center mappings, and historical presales attachments under RLS cascade rules.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingAccount(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/30"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
