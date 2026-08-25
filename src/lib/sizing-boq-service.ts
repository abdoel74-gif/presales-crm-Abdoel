import { supabase, isSupabaseConfigured } from './supabase.ts';
import {
  SizingItem,
  SizingItemFormData,
  BoqItem,
  BoqItemFormData,
  BoqSummary,
  BoqApprovalStatus,
  ProductCatalogItem,
  SizingCategory,
} from '../types.ts';
import {
  ENTERPRISE_PRODUCT_CATALOG,
  INITIAL_SIZING_ITEMS,
  INITIAL_BOQ_ITEMS,
} from '../data/initialCatalogData.ts';

const SIZING_STORAGE_KEY = 'presales_os_sizing_items_v1';
const BOQ_STORAGE_KEY = 'presales_os_boq_items_v1';
const BOQ_SUMMARY_STORAGE_KEY = 'presales_os_boq_summaries_v1';
const FX_USD_TO_IDR = 15500;

// LocalStorage helpers
function getLocalSizing(): SizingItem[] {
  try {
    const raw = localStorage.getItem(SIZING_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse local sizing items', e);
  }
  localStorage.setItem(SIZING_STORAGE_KEY, JSON.stringify(INITIAL_SIZING_ITEMS));
  return INITIAL_SIZING_ITEMS;
}

function saveLocalSizing(items: SizingItem[]) {
  try {
    localStorage.setItem(SIZING_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save local sizing items', e);
  }
}

function getLocalBoq(): BoqItem[] {
  try {
    const raw = localStorage.getItem(BOQ_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse local BOQ items', e);
  }
  localStorage.setItem(BOQ_STORAGE_KEY, JSON.stringify(INITIAL_BOQ_ITEMS));
  return INITIAL_BOQ_ITEMS;
}

function saveLocalBoq(items: BoqItem[]) {
  try {
    localStorage.setItem(BOQ_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to save local BOQ items', e);
  }
}

function getLocalSummaries(): Record<string, BoqSummary> {
  try {
    const raw = localStorage.getItem(BOQ_SUMMARY_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to parse local BOQ summaries', e);
  }
  return {};
}

function saveLocalSummaries(summaries: Record<string, BoqSummary>) {
  try {
    localStorage.setItem(BOQ_SUMMARY_STORAGE_KEY, JSON.stringify(summaries));
  } catch (e) {
    console.warn('Failed to save local BOQ summaries', e);
  }
}

export interface FetchSizingParams {
  requestId?: string;
  opportunityId?: string;
  category?: SizingCategory | 'ALL';
  vendor?: string | 'ALL';
  search?: string;
}

export interface FetchBoqParams {
  requestId?: string;
  opportunityId?: string;
  category?: SizingCategory | 'ALL';
  search?: string;
  includeOptional?: boolean;
}

export const SizingBoqService = {
  // -------------------------------------------------------------------------
  // PRODUCT CATALOG
  // -------------------------------------------------------------------------
  getProductCatalog(category?: string, vendor?: string, search?: string): ProductCatalogItem[] {
    return ENTERPRISE_PRODUCT_CATALOG.filter((item) => {
      if (category && category !== 'ALL' && item.category !== category) return false;
      if (vendor && vendor !== 'ALL' && item.vendor !== vendor) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.model.toLowerCase().includes(q) ||
          item.partNumber.toLowerCase().includes(q) ||
          item.vendor.toLowerCase().includes(q) ||
          item.specsSummary.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  },

  // -------------------------------------------------------------------------
  // SIZING ENGINE CRUD
  // -------------------------------------------------------------------------
  async getSizingItems(params: FetchSizingParams = {}): Promise<{ data: SizingItem[]; error: string | null }> {
    try {
      if (isSupabaseConfigured()) {
        let query = supabase.from('sizing_items').select('*');

        if (params.requestId) {
          query = query.eq('request_id', params.requestId);
        }
        if (params.opportunityId) {
          query = query.eq('opportunity_id', params.opportunityId);
        }
        if (params.category && params.category !== 'ALL') {
          query = query.eq('category', params.category);
        }
        if (params.vendor && params.vendor !== 'ALL') {
          query = query.eq('vendor', params.vendor);
        }

        const { data, error } = await query.order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          // map snake_case to camelCase
          const mapped: SizingItem[] = data.map((d: any) => ({
            id: d.id,
            requestId: d.request_id,
            requestCode: d.request_code,
            opportunityId: d.opportunity_id,
            opportunityTitle: d.opportunity_title,
            accountName: d.account_name,
            category: d.category,
            componentName: d.component_name,
            vendor: d.vendor,
            model: d.model,
            partNumber: d.part_number,
            quantity: d.quantity,
            redundancy: d.redundancy,
            sizingParameters: d.sizing_parameters || {},
            technicalJustification: d.technical_justification || '',
            complianceNotes: d.compliance_notes || '',
            estimatedUnitPriceIDR: Number(d.estimated_unit_price_idr || 0),
            estimatedUnitPriceUSD: Number(d.estimated_unit_price_usd || 0),
            boqConverted: Boolean(d.boq_converted),
            boqItemId: d.boq_item_id,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
          return { data: mapped, error: null };
        }
      }

      // LocalStorage fallback
      let items = getLocalSizing();

      if (params.requestId) {
        items = items.filter((i) => i.requestId === params.requestId);
      }
      if (params.opportunityId) {
        items = items.filter((i) => i.opportunityId === params.opportunityId);
      }
      if (params.category && params.category !== 'ALL') {
        items = items.filter((i) => i.category === params.category);
      }
      if (params.vendor && params.vendor !== 'ALL') {
        items = items.filter((i) => i.vendor === params.vendor);
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (i) =>
            i.componentName.toLowerCase().includes(q) ||
            i.model.toLowerCase().includes(q) ||
            i.vendor.toLowerCase().includes(q) ||
            (i.partNumber && i.partNumber.toLowerCase().includes(q)) ||
            i.technicalJustification.toLowerCase().includes(q)
        );
      }

      return { data: items, error: null };
    } catch (e: any) {
      return { data: [], error: e.message || 'Error fetching sizing items' };
    }
  },

  async createSizingItem(formData: SizingItemFormData): Promise<{ data: SizingItem | null; error: string | null }> {
    try {
      const now = new Date().toISOString();
      const newItem: SizingItem = {
        id: `size_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        requestId: formData.requestId,
        opportunityId: formData.opportunityId,
        category: formData.category,
        componentName: formData.componentName,
        vendor: formData.vendor,
        model: formData.model,
        partNumber: formData.partNumber,
        quantity: Math.max(1, formData.quantity),
        redundancy: formData.redundancy,
        sizingParameters: formData.sizingParameters || {},
        technicalJustification: formData.technicalJustification,
        complianceNotes: formData.complianceNotes,
        estimatedUnitPriceIDR: formData.estimatedUnitPriceIDR,
        estimatedUnitPriceUSD: formData.estimatedUnitPriceUSD || Math.round(formData.estimatedUnitPriceIDR / FX_USD_TO_IDR),
        boqConverted: false,
        createdAt: now,
        updatedAt: now,
      };

      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('sizing_items')
          .insert({
            id: newItem.id,
            request_id: newItem.requestId,
            opportunity_id: newItem.opportunityId,
            category: newItem.category,
            component_name: newItem.componentName,
            vendor: newItem.vendor,
            model: newItem.model,
            part_number: newItem.partNumber,
            quantity: newItem.quantity,
            redundancy: newItem.redundancy,
            sizing_parameters: newItem.sizingParameters,
            technical_justification: newItem.technicalJustification,
            compliance_notes: newItem.complianceNotes,
            estimated_unit_price_idr: newItem.estimatedUnitPriceIDR,
            estimated_unit_price_usd: newItem.estimatedUnitPriceUSD,
            boq_converted: false,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) {
          console.warn('Supabase sizing insert failed, using local storage', error);
        }
      }

      const all = getLocalSizing();
      saveLocalSizing([newItem, ...all]);

      return { data: newItem, error: null };
    } catch (e: any) {
      return { data: null, error: e.message || 'Error creating sizing item' };
    }
  },

  async updateSizingItem(id: string, updates: Partial<SizingItem>): Promise<{ data: SizingItem | null; error: string | null }> {
    try {
      const now = new Date().toISOString();
      const all = getLocalSizing();
      const idx = all.findIndex((i) => i.id === id);
      if (idx === -1) {
        return { data: null, error: 'Sizing item not found' };
      }

      const updated: SizingItem = {
        ...all[idx],
        ...updates,
        updatedAt: now,
      };

      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('sizing_items')
          .update({
            category: updated.category,
            component_name: updated.componentName,
            vendor: updated.vendor,
            model: updated.model,
            part_number: updated.partNumber,
            quantity: updated.quantity,
            redundancy: updated.redundancy,
            sizing_parameters: updated.sizingParameters,
            technical_justification: updated.technicalJustification,
            compliance_notes: updated.complianceNotes,
            estimated_unit_price_idr: updated.estimatedUnitPriceIDR,
            estimated_unit_price_usd: updated.estimatedUnitPriceUSD,
            boq_converted: updated.boqConverted,
            boq_item_id: updated.boqItemId,
            updated_at: now,
          })
          .eq('id', id);

        if (error) {
          console.warn('Supabase update sizing error', error);
        }
      }

      all[idx] = updated;
      saveLocalSizing(all);

      return { data: updated, error: null };
    } catch (e: any) {
      return { data: null, error: e.message || 'Error updating sizing item' };
    }
  },

  async deleteSizingItem(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      if (isSupabaseConfigured()) {
        await supabase.from('sizing_items').delete().eq('id', id);
      }
      const all = getLocalSizing();
      saveLocalSizing(all.filter((i) => i.id !== id));
      return { success: true, error: null };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error deleting sizing item' };
    }
  },

  // -------------------------------------------------------------------------
  // CONVERT SIZING TO DYNAMIC BOQ
  // -------------------------------------------------------------------------
  async convertSizingToBoq(
    requestId: string,
    selectedSizingIds?: string[]
  ): Promise<{ convertedCount: number; boqItems: BoqItem[]; error: string | null }> {
    try {
      const allSizing = getLocalSizing();
      let targetSizing = allSizing.filter((s) => s.requestId === requestId);
      if (selectedSizingIds && selectedSizingIds.length > 0) {
        targetSizing = targetSizing.filter((s) => selectedSizingIds.includes(s.id));
      }

      if (targetSizing.length === 0) {
        return { convertedCount: 0, boqItems: [], error: 'No sizing workloads available to convert.' };
      }

      const allBoq = getLocalBoq();
      const newBoqItems: BoqItem[] = [];
      const now = new Date().toISOString();

      for (const sizing of targetSizing) {
        // Look up vendor catalog for matched part number or create custom specs
        const matchedCatalog = ENTERPRISE_PRODUCT_CATALOG.find(
          (c) => c.partNumber === sizing.partNumber || (c.vendor === sizing.vendor && c.model === sizing.model)
        );

        const listPrice = matchedCatalog ? matchedCatalog.unitListPriceIDR : sizing.estimatedUnitPriceIDR;
        const discountPct = matchedCatalog ? matchedCatalog.standardDiscountPct : 35;
        const unitCost = Math.round(listPrice * (1 - discountPct / 100));
        const marginPct = matchedCatalog ? matchedCatalog.standardMarginPct : 22;
        const unitSelling = Math.round(unitCost / (1 - marginPct / 100));
        const qty = sizing.quantity;

        const extendedCost = unitCost * qty;
        const extendedSelling = unitSelling * qty;
        const grossMargin = extendedSelling - extendedCost;

        const boqItem: BoqItem = {
          id: `boq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          requestId: sizing.requestId,
          requestCode: sizing.requestCode,
          opportunityId: sizing.opportunityId,
          opportunityTitle: sizing.opportunityTitle,
          accountName: sizing.accountName,
          sizingItemId: sizing.id,
          category: sizing.category,
          vendor: sizing.vendor,
          partNumber: sizing.partNumber || matchedCatalog?.partNumber || `PN-${sizing.vendor.toUpperCase().slice(0, 3)}-${Date.now().toString().slice(-4)}`,
          itemDescription: `${sizing.vendor} ${sizing.model} - ${sizing.componentName}`,
          technicalSpecs: sizing.technicalJustification,
          quantity: qty,
          unit: matchedCatalog?.unit || 'Units',
          warrantyYears: matchedCatalog?.warrantyYears || 3,
          deliveryLeadTimeWeeks: matchedCatalog?.leadTimeWeeks || 4,
          isOptional: false,
          unitListPriceIDR: listPrice,
          vendorDiscountPct: discountPct,
          unitCostIDR: unitCost,
          marginPct: marginPct,
          unitSellingPriceIDR: unitSelling,
          extendedCostIDR: extendedCost,
          extendedSellingPriceIDR: extendedSelling,
          grossMarginIDR: grossMargin,
          unitCostUSD: Math.round(unitCost / FX_USD_TO_IDR),
          unitSellingPriceUSD: Math.round(unitSelling / FX_USD_TO_IDR),
          extendedCostUSD: Math.round(extendedCost / FX_USD_TO_IDR),
          extendedSellingPriceUSD: Math.round(extendedSelling / FX_USD_TO_IDR),
          grossMarginUSD: Math.round(grossMargin / FX_USD_TO_IDR),
          notes: `Auto-generated from Technical Sizing (${sizing.redundancy}).`,
          createdAt: now,
          updatedAt: now,
        };

        newBoqItems.push(boqItem);

        // Mark sizing item as converted
        sizing.boqConverted = true;
        sizing.boqItemId = boqItem.id;
        sizing.updatedAt = now;
      }

      // Save updated sizing items
      saveLocalSizing(allSizing);

      // Save new BOQ items
      const mergedBoq = [...newBoqItems, ...allBoq];
      saveLocalBoq(mergedBoq);

      return { convertedCount: newBoqItems.length, boqItems: newBoqItems, error: null };
    } catch (e: any) {
      return { convertedCount: 0, boqItems: [], error: e.message || 'Error converting sizing to BOQ' };
    }
  },

  // -------------------------------------------------------------------------
  // BOQ BUILDER CRUD & RECALCULATIONS
  // -------------------------------------------------------------------------
  async getBoqItems(params: FetchBoqParams = {}): Promise<{ data: BoqItem[]; error: string | null }> {
    try {
      if (isSupabaseConfigured()) {
        let query = supabase.from('boq_items').select('*');
        if (params.requestId) query = query.eq('request_id', params.requestId);
        if (params.category && params.category !== 'ALL') query = query.eq('category', params.category);

        const { data, error } = await query.order('created_at', { ascending: true });
        if (!error && data && data.length > 0) {
          const mapped: BoqItem[] = data.map((d: any) => ({
            id: d.id,
            boqId: d.boq_id,
            requestId: d.request_id,
            requestCode: d.request_code,
            opportunityId: d.opportunity_id,
            opportunityTitle: d.opportunity_title,
            accountName: d.account_name,
            sizingItemId: d.sizing_item_id,
            category: d.category,
            vendor: d.vendor,
            partNumber: d.part_number,
            itemDescription: d.item_description,
            technicalSpecs: d.technical_specs,
            quantity: d.quantity,
            unit: d.unit || 'Units',
            warrantyYears: d.warranty_years || 3,
            deliveryLeadTimeWeeks: d.delivery_lead_time_weeks || 4,
            isOptional: Boolean(d.is_optional),
            unitListPriceIDR: Number(d.unit_list_price_idr || 0),
            vendorDiscountPct: Number(d.vendor_discount_pct || 0),
            unitCostIDR: Number(d.unit_cost_idr || 0),
            marginPct: Number(d.margin_pct || 0),
            unitSellingPriceIDR: Number(d.unit_selling_price_idr || 0),
            extendedCostIDR: Number(d.extended_cost_idr || 0),
            extendedSellingPriceIDR: Number(d.extended_selling_price_idr || 0),
            grossMarginIDR: Number(d.gross_margin_idr || 0),
            unitCostUSD: Number(d.unit_cost_usd || 0),
            unitSellingPriceUSD: Number(d.unit_selling_price_usd || 0),
            extendedCostUSD: Number(d.extended_cost_usd || 0),
            extendedSellingPriceUSD: Number(d.extended_selling_price_usd || 0),
            grossMarginUSD: Number(d.gross_margin_usd || 0),
            notes: d.notes,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
          }));
          return { data: mapped, error: null };
        }
      }

      let items = getLocalBoq();
      if (params.requestId) {
        items = items.filter((b) => b.requestId === params.requestId);
      }
      if (params.opportunityId) {
        items = items.filter((b) => b.opportunityId === params.opportunityId);
      }
      if (params.category && params.category !== 'ALL') {
        items = items.filter((b) => b.category === params.category);
      }
      if (!params.includeOptional) {
        // default include all
      }
      if (params.search) {
        const q = params.search.toLowerCase();
        items = items.filter(
          (b) =>
            b.itemDescription.toLowerCase().includes(q) ||
            b.partNumber.toLowerCase().includes(q) ||
            b.vendor.toLowerCase().includes(q) ||
            (b.technicalSpecs && b.technicalSpecs.toLowerCase().includes(q))
        );
      }

      return { data: items, error: null };
    } catch (e: any) {
      return { data: [], error: e.message || 'Error fetching BOQ items' };
    }
  },

  async createBoqItem(formData: BoqItemFormData): Promise<{ data: BoqItem | null; error: string | null }> {
    try {
      const now = new Date().toISOString();
      const qty = Math.max(1, formData.quantity);
      
      // Calculate unit cost from list price & discount
      const listPrice = formData.unitListPriceIDR || 0;
      const discountPct = formData.vendorDiscountPct || 0;
      const unitCost = formData.unitCostIDR > 0 ? formData.unitCostIDR : Math.round(listPrice * (1 - discountPct / 100));
      
      // Calculate unit selling price from margin or direct input
      const marginPct = formData.marginPct || 20;
      const unitSelling =
        formData.unitSellingPriceIDR > 0
          ? formData.unitSellingPriceIDR
          : Math.round(unitCost / (1 - marginPct / 100));

      const extCost = unitCost * qty;
      const extSelling = unitSelling * qty;
      const grossMargin = extSelling - extCost;

      const newItem: BoqItem = {
        id: `boq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        requestId: formData.requestId,
        opportunityId: formData.opportunityId,
        sizingItemId: formData.sizingItemId,
        category: formData.category,
        vendor: formData.vendor,
        partNumber: formData.partNumber,
        itemDescription: formData.itemDescription,
        technicalSpecs: formData.technicalSpecs,
        quantity: qty,
        unit: formData.unit || 'Units',
        warrantyYears: formData.warrantyYears || 3,
        deliveryLeadTimeWeeks: formData.deliveryLeadTimeWeeks || 4,
        isOptional: Boolean(formData.isOptional),
        unitListPriceIDR: listPrice,
        vendorDiscountPct: discountPct,
        unitCostIDR: unitCost,
        marginPct: marginPct,
        unitSellingPriceIDR: unitSelling,
        extendedCostIDR: extCost,
        extendedSellingPriceIDR: extSelling,
        grossMarginIDR: grossMargin,
        unitCostUSD: Math.round(unitCost / FX_USD_TO_IDR),
        unitSellingPriceUSD: Math.round(unitSelling / FX_USD_TO_IDR),
        extendedCostUSD: Math.round(extCost / FX_USD_TO_IDR),
        extendedSellingPriceUSD: Math.round(extSelling / FX_USD_TO_IDR),
        grossMarginUSD: Math.round(grossMargin / FX_USD_TO_IDR),
        notes: formData.notes,
        createdAt: now,
        updatedAt: now,
      };

      if (isSupabaseConfigured()) {
        await supabase.from('boq_items').insert({
          id: newItem.id,
          request_id: newItem.requestId,
          opportunity_id: newItem.opportunityId,
          sizing_item_id: newItem.sizingItemId,
          category: newItem.category,
          vendor: newItem.vendor,
          part_number: newItem.partNumber,
          item_description: newItem.itemDescription,
          technical_specs: newItem.technicalSpecs,
          quantity: newItem.quantity,
          unit: newItem.unit,
          warranty_years: newItem.warrantyYears,
          delivery_lead_time_weeks: newItem.deliveryLeadTimeWeeks,
          is_optional: newItem.isOptional,
          unit_list_price_idr: newItem.unitListPriceIDR,
          vendor_discount_pct: newItem.vendorDiscountPct,
          unit_cost_idr: newItem.unitCostIDR,
          margin_pct: newItem.marginPct,
          unit_selling_price_idr: newItem.unitSellingPriceIDR,
          extended_cost_idr: newItem.extendedCostIDR,
          extended_selling_price_idr: newItem.extendedSellingPriceIDR,
          gross_margin_idr: newItem.grossMarginIDR,
          notes: newItem.notes,
          created_at: now,
          updated_at: now,
        });
      }

      const all = getLocalBoq();
      saveLocalBoq([newItem, ...all]);

      return { data: newItem, error: null };
    } catch (e: any) {
      return { data: null, error: e.message || 'Error creating BOQ item' };
    }
  },

  async updateBoqItem(id: string, updates: Partial<BoqItem>): Promise<{ data: BoqItem | null; error: string | null }> {
    try {
      const now = new Date().toISOString();
      const all = getLocalBoq();
      const idx = all.findIndex((b) => b.id === id);
      if (idx === -1) return { data: null, error: 'BOQ item not found' };

      const cur = all[idx];
      const merged = { ...cur, ...updates };

      // Recalculate cost, prices and extensions
      const qty = Math.max(1, merged.quantity);
      let unitCost = merged.unitCostIDR;
      if (updates.unitListPriceIDR !== undefined || updates.vendorDiscountPct !== undefined) {
        unitCost = Math.round((merged.unitListPriceIDR || 0) * (1 - (merged.vendorDiscountPct || 0) / 100));
      }

      let unitSelling = merged.unitSellingPriceIDR;
      let marginPct = merged.marginPct;

      if (updates.marginPct !== undefined && updates.marginPct !== cur.marginPct) {
        marginPct = updates.marginPct;
        unitSelling = Math.round(unitCost / (1 - marginPct / 100));
      } else if (updates.unitSellingPriceIDR !== undefined && updates.unitSellingPriceIDR !== cur.unitSellingPriceIDR) {
        unitSelling = updates.unitSellingPriceIDR;
        marginPct = unitSelling > 0 ? Number((((unitSelling - unitCost) / unitSelling) * 100).toFixed(1)) : 0;
      }

      const extCost = unitCost * qty;
      const extSelling = unitSelling * qty;
      const grossMargin = extSelling - extCost;

      const updated: BoqItem = {
        ...merged,
        quantity: qty,
        unitCostIDR: unitCost,
        marginPct: marginPct,
        unitSellingPriceIDR: unitSelling,
        extendedCostIDR: extCost,
        extendedSellingPriceIDR: extSelling,
        grossMarginIDR: grossMargin,
        unitCostUSD: Math.round(unitCost / FX_USD_TO_IDR),
        unitSellingPriceUSD: Math.round(unitSelling / FX_USD_TO_IDR),
        extendedCostUSD: Math.round(extCost / FX_USD_TO_IDR),
        extendedSellingPriceUSD: Math.round(extSelling / FX_USD_TO_IDR),
        grossMarginUSD: Math.round(grossMargin / FX_USD_TO_IDR),
        updatedAt: now,
      };

      if (isSupabaseConfigured()) {
        await supabase
          .from('boq_items')
          .update({
            category: updated.category,
            vendor: updated.vendor,
            part_number: updated.partNumber,
            item_description: updated.itemDescription,
            technical_specs: updated.technicalSpecs,
            quantity: updated.quantity,
            unit: updated.unit,
            warranty_years: updated.warrantyYears,
            delivery_lead_time_weeks: updated.deliveryLeadTimeWeeks,
            is_optional: updated.isOptional,
            unit_list_price_idr: updated.unitListPriceIDR,
            vendor_discount_pct: updated.vendorDiscountPct,
            unit_cost_idr: updated.unitCostIDR,
            margin_pct: updated.marginPct,
            unit_selling_price_idr: updated.unitSellingPriceIDR,
            extended_cost_idr: updated.extendedCostIDR,
            extended_selling_price_idr: updated.extendedSellingPriceIDR,
            gross_margin_idr: updated.grossMarginIDR,
            notes: updated.notes,
            updated_at: now,
          })
          .eq('id', id);
      }

      all[idx] = updated;
      saveLocalBoq(all);

      return { data: updated, error: null };
    } catch (e: any) {
      return { data: null, error: e.message || 'Error updating BOQ item' };
    }
  },

  async deleteBoqItem(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
      if (isSupabaseConfigured()) {
        await supabase.from('boq_items').delete().eq('id', id);
      }
      const all = getLocalBoq();
      saveLocalBoq(all.filter((b) => b.id !== id));
      return { success: true, error: null };
    } catch (e: any) {
      return { success: false, error: e.message || 'Error deleting BOQ item' };
    }
  },

  // -------------------------------------------------------------------------
  // BOQ SUMMARY & APPROVAL WORKFLOW
  // -------------------------------------------------------------------------
  getBoqSummary(requestId: string, vatTaxPct: number = 11): BoqSummary {
    const allBoq = getLocalBoq().filter((b) => b.requestId === requestId);
    const summaries = getLocalSummaries();
    const existingSummary = summaries[requestId];

    // Filter non-optional items for the primary base calculation
    const baseItems = allBoq.filter((b) => !b.isOptional);
    const optionalItems = allBoq.filter((b) => b.isOptional);

    const totalListPriceIDR = baseItems.reduce((sum, item) => sum + (item.unitListPriceIDR * item.quantity), 0);
    const totalCostIDR = baseItems.reduce((sum, item) => sum + item.extendedCostIDR, 0);
    const totalSellingPriceIDR = baseItems.reduce((sum, item) => sum + item.extendedSellingPriceIDR, 0);
    const totalGrossMarginIDR = totalSellingPriceIDR - totalCostIDR;
    const blendedMarginPct = totalSellingPriceIDR > 0 ? Number(((totalGrossMarginIDR / totalSellingPriceIDR) * 100).toFixed(2)) : 0;
    
    const vatTaxAmountIDR = Math.round(totalSellingPriceIDR * (vatTaxPct / 100));
    const grandTotalIDR = totalSellingPriceIDR + vatTaxAmountIDR;

    // Director approval rule: Blended margin < 18% or Deal value > 1,000,000,000 IDR
    const directorApprovalRequired = blendedMarginPct < 18 || totalSellingPriceIDR > 1000000000;

    const summary: BoqSummary = {
      requestId,
      requestCode: baseItems[0]?.requestCode || existingSummary?.requestCode || 'PSR-2026-001',
      opportunityTitle: baseItems[0]?.opportunityTitle || existingSummary?.opportunityTitle || 'Enterprise Solution',
      accountName: baseItems[0]?.accountName || existingSummary?.accountName || 'Enterprise Customer',
      itemCount: baseItems.length,
      optionalItemCount: optionalItems.length,
      totalListPriceIDR,
      totalCostIDR,
      totalSellingPriceIDR,
      totalGrossMarginIDR,
      blendedMarginPct,
      vatTaxPct,
      vatTaxAmountIDR,
      grandTotalIDR,
      totalCostUSD: Math.round(totalCostIDR / FX_USD_TO_IDR),
      totalSellingPriceUSD: Math.round(totalSellingPriceIDR / FX_USD_TO_IDR),
      totalGrossMarginUSD: Math.round(totalGrossMarginIDR / FX_USD_TO_IDR),
      grandTotalUSD: Math.round(grandTotalIDR / FX_USD_TO_IDR),
      approvalStatus: existingSummary?.approvalStatus || 'DRAFT',
      directorApprovalRequired,
      approvedBy: existingSummary?.approvedBy,
      approvedAt: existingSummary?.approvedAt,
      rejectionReason: existingSummary?.rejectionReason,
      commercialRevisionNotes: existingSummary?.commercialRevisionNotes,
      updatedAt: new Date().toISOString(),
    };

    summaries[requestId] = summary;
    saveLocalSummaries(summaries);

    return summary;
  },

  async updateBoqApproval(
    requestId: string,
    approvalStatus: BoqApprovalStatus,
    approverName?: string,
    notes?: string
  ): Promise<{ data: BoqSummary; error: string | null }> {
    try {
      const summary = this.getBoqSummary(requestId);
      summary.approvalStatus = approvalStatus;
      summary.updatedAt = new Date().toISOString();

      if (approvalStatus === 'APPROVED') {
        summary.approvedBy = approverName || 'Sales Director';
        summary.approvedAt = new Date().toISOString();
        summary.rejectionReason = undefined;
      } else if (approvalStatus === 'REJECTED') {
        summary.rejectionReason = notes || 'Margin threshold below minimum compliance.';
      } else {
        summary.commercialRevisionNotes = notes;
      }

      const summaries = getLocalSummaries();
      summaries[requestId] = summary;
      saveLocalSummaries(summaries);

      return { data: summary, error: null };
    } catch (e: any) {
      return { data: this.getBoqSummary(requestId), error: e.message || 'Error updating approval' };
    }
  },

  // -------------------------------------------------------------------------
  // EXPORT UTILITY
  // -------------------------------------------------------------------------
  exportBoqToCsv(items: BoqItem[], isCommercial: boolean): string {
    const headers = isCommercial
      ? [
          'No',
          'Category',
          'Vendor',
          'Part Number',
          'Description',
          'Qty',
          'Unit',
          'List Price (IDR)',
          'Disc %',
          'Unit Cost (IDR)',
          'Margin %',
          'Unit Sell Price (IDR)',
          'Extended Cost (IDR)',
          'Extended Sell Price (IDR)',
          'Gross Margin (IDR)',
          'Warranty',
          'Lead Time',
          'Optional',
        ]
      : [
          'No',
          'Category',
          'Vendor',
          'Part Number',
          'Description',
          'Specifications',
          'Qty',
          'Unit',
          'Warranty',
          'Lead Time',
          'Optional',
        ];

    const rows = items.map((item, idx) => {
      if (isCommercial) {
        return [
          idx + 1,
          `"${item.category}"`,
          `"${item.vendor}"`,
          `"${item.partNumber}"`,
          `"${item.itemDescription.replace(/"/g, '""')}"`,
          item.quantity,
          item.unit,
          item.unitListPriceIDR,
          `${item.vendorDiscountPct}%`,
          item.unitCostIDR,
          `${item.marginPct}%`,
          item.unitSellingPriceIDR,
          item.extendedCostIDR,
          item.extendedSellingPriceIDR,
          item.grossMarginIDR,
          `${item.warrantyYears} Years`,
          `${item.deliveryLeadTimeWeeks} Weeks`,
          item.isOptional ? 'YES' : 'NO',
        ];
      } else {
        return [
          idx + 1,
          `"${item.category}"`,
          `"${item.vendor}"`,
          `"${item.partNumber}"`,
          `"${item.itemDescription.replace(/"/g, '""')}"`,
          `"${(item.technicalSpecs || '').replace(/"/g, '""')}"`,
          item.quantity,
          item.unit,
          `${item.warrantyYears} Years`,
          `${item.deliveryLeadTimeWeeks} Weeks`,
          item.isOptional ? 'YES' : 'NO',
        ];
      }
    });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};
