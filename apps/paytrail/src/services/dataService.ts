import type {
  CatalogItem,
  CommissionSummary,
  Customer,
  PriceListRecord,
  CommissionRun,
  AppSettings,
} from '../types';
import * as store from './localStore';

export type { AnalyticsSummary } from './analytics';
export { getAnalytics } from './analytics';

export function getAppSettings(): AppSettings {
  return store.getAppSettings();
}

export function saveAppSettings(patch: Partial<AppSettings>): AppSettings {
  return store.saveAppSettings(patch);
}

export async function listCustomers(): Promise<Customer[]> {
  return store.listCustomers();
}

export async function createCustomer(
  input: Pick<Customer, 'name' | 'email' | 'phone' | 'address' | 'company' | 'notes' | 'kind'>
): Promise<Customer> {
  return store.createCustomer(input);
}

export async function updateCustomer(
  id: string,
  input: Partial<Pick<Customer, 'name' | 'email' | 'phone' | 'address' | 'company' | 'notes' | 'kind'>>
): Promise<Customer> {
  return store.updateCustomer(id, input);
}

export async function deleteCustomer(id: string): Promise<void> {
  store.deleteCustomer(id);
}

export async function listPriceLists(): Promise<PriceListRecord[]> {
  return store.listPriceLists();
}

export async function savePriceList(
  name: string,
  items: CatalogItem[],
  fileName?: string
): Promise<PriceListRecord> {
  return store.savePriceList(name, items, fileName);
}

export async function updatePriceList(
  id: string,
  input: Partial<Pick<PriceListRecord, 'name' | 'items' | 'file_name'>>
): Promise<PriceListRecord> {
  return store.updatePriceList(id, input);
}

export async function deletePriceList(id: string): Promise<void> {
  store.deletePriceList(id);
}

export async function saveCommissionRun(input: {
  customerId?: string | null;
  repId?: string | null;
  priceListId?: string | null;
  invoiceFileName?: string;
  summary: CommissionSummary;
}): Promise<CommissionRun> {
  return store.saveCommissionRun(input);
}

export async function listCommissionRuns(limit = 50): Promise<CommissionRun[]> {
  return store.listCommissionRuns(limit);
}

export async function listCommissionRunsForRep(
  repId: string,
  limit = 100
): Promise<CommissionRun[]> {
  return store.listCommissionRunsForRep(repId, limit);
}

export async function getCommissionRun(id: string): Promise<CommissionRun | null> {
  return store.getCommissionRun(id);
}

export async function deleteCommissionRun(id: string): Promise<void> {
  store.deleteCommissionRun(id);
}

export { exportAllData, importAllData, clearAllData } from './localStore';
