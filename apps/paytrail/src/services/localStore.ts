import type {
  AppSettings,
  CatalogItem,
  CommissionRun,
  CommissionSummary,
  Customer,
  PriceListRecord,
} from '../types';
import { requireUserId } from './authStore';

function storageKey(): string {
  return `paytrail_data_${requireUserId()}`;
}

interface StoreData {
  settings: AppSettings;
  customers: Customer[];
  priceLists: PriceListRecord[];
  commissionRuns: CommissionRun[];
}

const DEFAULT_SETTINGS: AppSettings = {
  businessName: '',
  defaultRatePercent: 25,
  defaultBasis: 'margin',
};

function emptyStore(): StoreData {
  return {
    settings: { ...DEFAULT_SETTINGS },
    customers: [],
    priceLists: [],
    commissionRuns: [],
  };
}

function load(): StoreData {
  try {
    const raw = localStorage.getItem(storageKey());
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as StoreData;
    return {
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      customers: (parsed.customers ?? []).map((c) => ({
        ...c,
        kind: c.kind ?? 'customer',
        address: c.address ?? null,
      })),
      priceLists: parsed.priceLists ?? [],
      commissionRuns: parsed.commissionRuns ?? [],
    };
  } catch {
    return emptyStore();
  }
}

function save(data: StoreData): void {
  localStorage.setItem(storageKey(), JSON.stringify(data));
}

function newId(): string {
  return crypto.randomUUID();
}

export function getAppSettings(): AppSettings {
  return { ...load().settings };
}

export function saveAppSettings(patch: Partial<AppSettings>): AppSettings {
  const data = load();
  data.settings = { ...data.settings, ...patch };
  save(data);
  return data.settings;
}

export function listCustomers(): Customer[] {
  return [...load().customers].sort((a, b) => a.name.localeCompare(b.name));
}

export function createCustomer(
  input: Pick<Customer, 'name' | 'email' | 'phone' | 'address' | 'company' | 'notes' | 'kind'>
): Customer {
  const data = load();
  const customer: Customer = {
    id: newId(),
    name: input.name,
    email: input.email,
    phone: input.phone,
    address: input.address,
    company: input.company,
    notes: input.notes,
    kind: input.kind,
    created_at: new Date().toISOString(),
  };
  data.customers.push(customer);
  save(data);
  return customer;
}

export function updateCustomer(
  id: string,
  input: Partial<Pick<Customer, 'name' | 'email' | 'phone' | 'address' | 'company' | 'notes' | 'kind'>>
): Customer {
  const data = load();
  const idx = data.customers.findIndex((c) => c.id === id);
  if (idx < 0) throw new Error('Customer not found');
  data.customers[idx] = { ...data.customers[idx], ...input };
  save(data);
  return data.customers[idx];
}

export function deleteCustomer(id: string): void {
  const data = load();
  data.customers = data.customers.filter((c) => c.id !== id);
  data.commissionRuns = data.commissionRuns.map((r) => {
    let next = r;
    if (r.customer_id === id) next = { ...next, customer_id: null, customers: null };
    if (r.rep_id === id) next = { ...next, rep_id: null, reps: null };
    return next;
  });
  save(data);
}

export function listPriceLists(): PriceListRecord[] {
  return [...load().priceLists].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );
}

export function savePriceList(
  name: string,
  items: CatalogItem[],
  fileName?: string
): PriceListRecord {
  const data = load();
  const now = new Date().toISOString();
  const record: PriceListRecord = {
    id: newId(),
    name,
    file_name: fileName ?? null,
    items,
    item_count: items.length,
    created_at: now,
    updated_at: now,
  };
  data.priceLists.unshift(record);
  save(data);
  return record;
}

export function updatePriceList(
  id: string,
  input: Partial<Pick<PriceListRecord, 'name' | 'items' | 'file_name'>>
): PriceListRecord {
  const data = load();
  const idx = data.priceLists.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error('Price list not found');
  const patch = { ...input, updated_at: new Date().toISOString() };
  if (input.items) {
    data.priceLists[idx] = {
      ...data.priceLists[idx],
      ...patch,
      item_count: input.items.length,
    };
  } else {
    data.priceLists[idx] = { ...data.priceLists[idx], ...patch };
  }
  save(data);
  return data.priceLists[idx];
}

export function deletePriceList(id: string): void {
  const data = load();
  data.priceLists = data.priceLists.filter((p) => p.id !== id);
  save(data);
}

function enrichRun(run: CommissionRun, data: StoreData): CommissionRun {
  const customer = run.customer_id
    ? data.customers.find((c) => c.id === run.customer_id)
    : null;
  const rep = run.rep_id ? data.customers.find((c) => c.id === run.rep_id) : null;
  const priceList = run.price_list_id
    ? data.priceLists.find((p) => p.id === run.price_list_id)
    : null;
  return {
    ...run,
    rep_id: run.rep_id ?? null,
    customers: customer ? { name: customer.name } : null,
    reps: rep ? { name: rep.name } : null,
    price_lists: priceList ? { name: priceList.name } : null,
  };
}

export function saveCommissionRun(input: {
  customerId?: string | null;
  repId?: string | null;
  priceListId?: string | null;
  invoiceFileName?: string;
  summary: CommissionSummary;
}): CommissionRun {
  const data = load();
  const run: CommissionRun = {
    id: newId(),
    customer_id: input.customerId ?? null,
    rep_id: input.repId ?? null,
    price_list_id: input.priceListId ?? null,
    invoice_file_name: input.invoiceFileName ?? null,
    total_commission: input.summary.totalCommission,
    total_revenue: input.summary.totalRevenue,
    total_margin: input.summary.totalMargin,
    matched_count: input.summary.matchedCount,
    line_count: input.summary.lines.length,
    summary: input.summary,
    created_at: new Date().toISOString(),
  };
  data.commissionRuns.unshift(run);
  save(data);
  return enrichRun(run, data);
}

export function listCommissionRuns(limit = 50): CommissionRun[] {
  const data = load();
  return data.commissionRuns.slice(0, limit).map((r) => enrichRun(r, data));
}

export function listCommissionRunsForRep(repId: string, limit = 100): CommissionRun[] {
  const data = load();
  return data.commissionRuns
    .filter((r) => r.rep_id === repId)
    .slice(0, limit)
    .map((r) => enrichRun(r, data));
}

export function getCommissionRun(id: string): CommissionRun | null {
  const data = load();
  const run = data.commissionRuns.find((r) => r.id === id);
  return run ? enrichRun(run, data) : null;
}

export function deleteCommissionRun(id: string): void {
  const data = load();
  data.commissionRuns = data.commissionRuns.filter((r) => r.id !== id);
  save(data);
}

export function exportAllData(): string {
  return JSON.stringify(load(), null, 2);
}

export function importAllData(json: string): void {
  const parsed = JSON.parse(json) as StoreData;
  save({
    settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
    customers: (parsed.customers ?? []).map((c) => ({
      ...c,
      kind: c.kind ?? 'customer',
      address: c.address ?? null,
    })),
    priceLists: parsed.priceLists ?? [],
    commissionRuns: parsed.commissionRuns ?? [],
  });
}

export function initUserStore(businessName: string): void {
  const data = emptyStore();
  data.settings.businessName = businessName;
  save(data);
}

export function clearAllData(): void {
  localStorage.removeItem(storageKey());
}

