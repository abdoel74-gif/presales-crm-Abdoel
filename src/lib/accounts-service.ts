import { supabase, isSupabaseConfigured } from './supabase.ts';
import { Account, AccountFormData, Contact, ContactFormData } from '../types.ts';
import { INITIAL_ACCOUNTS, INITIAL_CONTACTS } from '../data/initialAccountsData.ts';

// Local storage backup keys for offline resilience
const ACCOUNTS_STORAGE_KEY = 'presales_os_accounts_cache_v1';
const CONTACTS_STORAGE_KEY = 'presales_os_contacts_cache_v1';

function getLocalAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse accounts from localStorage', e);
  }
  localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(INITIAL_ACCOUNTS));
  return INITIAL_ACCOUNTS;
}

function saveLocalAccounts(accounts: Account[]) {
  try {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Could not save accounts to localStorage', e);
  }
}

function getLocalContacts(): Contact[] {
  try {
    const raw = localStorage.getItem(CONTACTS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse contacts from localStorage', e);
  }
  localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(INITIAL_CONTACTS));
  return INITIAL_CONTACTS;
}

function saveLocalContacts(contacts: Contact[]) {
  try {
    localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts));
  } catch (e) {
    console.warn('Could not save contacts to localStorage', e);
  }
}

export interface FetchAccountsParams {
  search?: string;
  industry?: string;
  tier?: string;
  status?: string;
  assignedAeId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'createdAt' | 'tier' | 'totalDealValue';
  sortOrder?: 'asc' | 'desc';
}

export interface AccountsResponse {
  data: Account[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const accountsService = {
  /**
   * Fetch accounts with server-side / client-side query parameters
   */
  async getAccounts(params: FetchAccountsParams = {}): Promise<AccountsResponse> {
    const {
      search = '',
      industry = 'all',
      tier = 'all',
      status = 'all',
      assignedAeId = 'all',
      page = 1,
      limit = 8,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase
          .from('accounts')
          .select(`
            id,
            company_id,
            code,
            name,
            industry,
            tier,
            website,
            address,
            city,
            country,
            status,
            created_at,
            updated_at,
            assigned_ae_id,
            profiles:assigned_ae_id (
              id,
              full_name,
              avatar_url
            ),
            contacts (
              id
            ),
            opportunities (
              id,
              deal_value
            )
          `, { count: 'exact' });

        if (search) {
          query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,city.ilike.%${search}%`);
        }
        if (industry && industry !== 'all') {
          query = query.eq('industry', industry);
        }
        if (tier && tier !== 'all') {
          query = query.eq('tier', tier);
        }
        if (status && status !== 'all') {
          query = query.eq('status', status);
        }
        if (assignedAeId && assignedAeId !== 'all') {
          query = query.eq('assigned_ae_id', assignedAeId);
        }

        const from = (page - 1) * limit;
        const to = from + limit - 1;

        query = query.order(
          sortBy === 'name' ? 'name' : 'created_at',
          { ascending: sortOrder === 'asc' }
        ).range(from, to);

        const { data, error, count } = await query;

        if (!error && data && data.length > 0) {
          const transformed: Account[] = data.map((item: any) => {
            const opps = item.opportunities || [];
            const sumValue = opps.reduce((acc: number, curr: any) => acc + (Number(curr.deal_value) || 0), 0);

            return {
              id: item.id,
              companyId: item.company_id,
              code: item.code,
              name: item.name,
              industry: item.industry,
              tier: item.tier,
              website: item.website,
              address: item.address,
              city: item.city,
              country: item.country,
              status: item.status,
              assignedAeId: item.assigned_ae_id,
              assignedAeName: item.profiles?.full_name || 'Unassigned AE',
              contactsCount: item.contacts?.length || 0,
              opportunitiesCount: opps.length,
              totalDealValue: sumValue,
              createdAt: item.created_at,
              updatedAt: item.updated_at,
            };
          });

          return {
            data: transformed,
            total: count || transformed.length,
            page,
            limit,
            totalPages: Math.ceil((count || transformed.length) / limit),
          };
        }
      } catch (err) {
        console.warn('Supabase accounts fetch failed, falling back to local store:', err);
      }
    }

    // Local / Dev Fallback
    let list = getLocalAccounts();

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.code.toLowerCase().includes(q) ||
          (a.city && a.city.toLowerCase().includes(q)) ||
          a.industry.toLowerCase().includes(q)
      );
    }

    if (industry !== 'all') {
      list = list.filter((a) => a.industry === industry);
    }

    if (tier !== 'all') {
      list = list.filter((a) => a.tier === tier);
    }

    if (status !== 'all') {
      list = list.filter((a) => a.status === status);
    }

    if (assignedAeId !== 'all') {
      list = list.filter((a) => a.assignedAeId === assignedAeId);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortBy === 'totalDealValue') {
        const valA = a.totalDealValue || 0;
        const valB = b.totalDealValue || 0;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      // default createdAt
      return sortOrder === 'asc'
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const total = list.length;
    const from = (page - 1) * limit;
    const paged = list.slice(from, from + limit);

    return {
      data: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  /**
   * Get single account by ID with its contacts
   */
  async getAccountById(id: string): Promise<Account | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .select(`
            id,
            company_id,
            code,
            name,
            industry,
            tier,
            website,
            address,
            city,
            country,
            status,
            created_at,
            updated_at,
            assigned_ae_id,
            profiles:assigned_ae_id (
              id,
              full_name,
              avatar_url
            ),
            contacts (
              id,
              first_name,
              last_name,
              email,
              phone,
              job_title,
              department,
              decision_role,
              is_primary,
              created_at
            ),
            opportunities (
              id,
              code,
              title,
              deal_value,
              stage,
              probability
            )
          `)
          .eq('id', id)
          .single();

        if (!error && data) {
          const opps = data.opportunities || [];
          const sumValue = opps.reduce((acc: number, curr: any) => acc + (Number(curr.deal_value) || 0), 0);

          const contacts: Contact[] = (data.contacts || []).map((c: any) => ({
            id: c.id,
            accountId: data.id,
            firstName: c.first_name,
            lastName: c.last_name,
            email: c.email,
            phone: c.phone,
            jobTitle: c.job_title,
            department: c.department,
            decisionRole: c.decision_role,
            isPrimary: c.is_primary,
            createdAt: c.created_at,
          }));

          return {
            id: data.id,
            companyId: data.company_id,
            code: data.code,
            name: data.name,
            industry: data.industry,
            tier: data.tier,
            website: data.website,
            address: data.address,
            city: data.city,
            country: data.country,
            status: data.status,
            assignedAeId: data.assigned_ae_id,
            assignedAeName: (data as any).profiles?.full_name || 'Unassigned AE',
            contactsCount: contacts.length,
            opportunitiesCount: opps.length,
            totalDealValue: sumValue,
            contacts,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (e) {
        console.warn('Supabase getAccountById fallback', e);
      }
    }

    const accounts = getLocalAccounts();
    const found = accounts.find((a) => a.id === id) || null;
    if (found) {
      const allContacts = getLocalContacts();
      found.contacts = allContacts.filter((c) => c.accountId === id);
    }
    return found;
  },

  /**
   * Create account
   */
  async createAccount(payload: AccountFormData): Promise<Account> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('accounts')
          .insert({
            code: payload.code,
            name: payload.name,
            industry: payload.industry,
            tier: payload.tier,
            website: payload.website,
            address: payload.address,
            city: payload.city,
            country: payload.country || 'Indonesia',
            assigned_ae_id: payload.assignedAeId,
            status: payload.status,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            code: data.code,
            name: data.name,
            industry: data.industry,
            tier: data.tier,
            website: data.website,
            address: data.address,
            city: data.city,
            country: data.country,
            status: data.status,
            assignedAeId: data.assigned_ae_id,
            contactsCount: 0,
            opportunitiesCount: 0,
            totalDealValue: 0,
            createdAt: data.created_at,
          };
        }
      } catch (e) {
        console.warn('Supabase createAccount fallback', e);
      }
    }

    // Local creation
    const accounts = getLocalAccounts();
    const newAccount: Account = {
      id: `acc_${Date.now()}`,
      code: payload.code || `ACC-${Date.now().toString().slice(-4)}`,
      name: payload.name,
      industry: payload.industry,
      tier: payload.tier,
      website: payload.website,
      address: payload.address,
      city: payload.city,
      country: payload.country || 'Indonesia',
      assignedAeId: payload.assignedAeId,
      assignedAeName: payload.assignedAeId === 'usr_ae_01' ? 'Rian Hidayat' : payload.assignedAeId === 'usr_ae_02' ? 'Nadia Safitri' : 'Budi Santoso',
      status: payload.status,
      contactsCount: 0,
      opportunitiesCount: 0,
      totalDealValue: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    accounts.unshift(newAccount);
    saveLocalAccounts(accounts);
    return newAccount;
  },

  /**
   * Update account
   */
  async updateAccount(id: string, payload: Partial<AccountFormData>): Promise<Account | null> {
    if (isSupabaseConfigured()) {
      try {
        const updateBody: any = {};
        if (payload.code) updateBody.code = payload.code;
        if (payload.name) updateBody.name = payload.name;
        if (payload.industry) updateBody.industry = payload.industry;
        if (payload.tier) updateBody.tier = payload.tier;
        if (payload.website !== undefined) updateBody.website = payload.website;
        if (payload.address !== undefined) updateBody.address = payload.address;
        if (payload.city !== undefined) updateBody.city = payload.city;
        if (payload.country !== undefined) updateBody.country = payload.country;
        if (payload.assignedAeId !== undefined) updateBody.assigned_ae_id = payload.assignedAeId;
        if (payload.status) updateBody.status = payload.status;

        const { data, error } = await supabase
          .from('accounts')
          .update(updateBody)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            code: data.code,
            name: data.name,
            industry: data.industry,
            tier: data.tier,
            website: data.website,
            address: data.address,
            city: data.city,
            country: data.country,
            status: data.status,
            assignedAeId: data.assigned_ae_id,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
        }
      } catch (e) {
        console.warn('Supabase updateAccount fallback', e);
      }
    }

    const accounts = getLocalAccounts();
    const index = accounts.findIndex((a) => a.id === id);
    if (index === -1) return null;

    accounts[index] = {
      ...accounts[index],
      ...payload,
      updatedAt: new Date().toISOString(),
    };
    saveLocalAccounts(accounts);
    return accounts[index];
  },

  /**
   * Delete account
   */
  async deleteAccount(id: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('accounts').delete().eq('id', id);
        if (!error) return true;
      } catch (e) {
        console.warn('Supabase deleteAccount fallback', e);
      }
    }

    const accounts = getLocalAccounts();
    const filtered = accounts.filter((a) => a.id !== id);
    saveLocalAccounts(filtered);
    return true;
  },

  /**
   * Add Contact to Account (Stakeholder Buying Center)
   */
  async createContact(payload: ContactFormData): Promise<Contact> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .insert({
            account_id: payload.accountId,
            first_name: payload.firstName,
            last_name: payload.lastName,
            email: payload.email,
            phone: payload.phone,
            job_title: payload.jobTitle,
            department: payload.department,
            decision_role: payload.decisionRole,
            is_primary: payload.isPrimary,
          })
          .select()
          .single();

        if (!error && data) {
          return {
            id: data.id,
            accountId: data.account_id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            phone: data.phone,
            jobTitle: data.job_title,
            department: data.department,
            decisionRole: data.decision_role,
            isPrimary: data.is_primary,
            createdAt: data.created_at,
          };
        }
      } catch (e) {
        console.warn('Supabase createContact fallback', e);
      }
    }

    const contacts = getLocalContacts();
    const newContact: Contact = {
      id: `cnt_${Date.now()}`,
      accountId: payload.accountId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      phone: payload.phone,
      jobTitle: payload.jobTitle,
      department: payload.department,
      decisionRole: payload.decisionRole,
      isPrimary: payload.isPrimary,
      createdAt: new Date().toISOString(),
    };

    contacts.push(newContact);
    saveLocalContacts(contacts);

    // Increment count on account
    const accounts = getLocalAccounts();
    const accIdx = accounts.findIndex((a) => a.id === payload.accountId);
    if (accIdx !== -1) {
      accounts[accIdx].contactsCount = (accounts[accIdx].contactsCount || 0) + 1;
      saveLocalAccounts(accounts);
    }

    return newContact;
  },

  /**
   * Delete contact
   */
  async deleteContact(id: string, accountId: string): Promise<boolean> {
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('contacts').delete().eq('id', id);
        if (!error) return true;
      } catch (e) {
        console.warn('Supabase deleteContact fallback', e);
      }
    }

    const contacts = getLocalContacts();
    const filtered = contacts.filter((c) => c.id !== id);
    saveLocalContacts(filtered);

    // Decrement count on account
    const accounts = getLocalAccounts();
    const accIdx = accounts.findIndex((a) => a.id === accountId);
    if (accIdx !== -1 && accounts[accIdx].contactsCount) {
      accounts[accIdx].contactsCount = Math.max(0, accounts[accIdx].contactsCount - 1);
      saveLocalAccounts(accounts);
    }

    return true;
  },
};

export const AccountsService = accountsService;
