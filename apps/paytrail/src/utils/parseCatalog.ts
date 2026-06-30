import * as XLSX from 'xlsx';
import type { CatalogItem } from '../types';

function normalizeRow(row: Record<string, unknown>): CatalogItem | null {
  const item =
    row.Item ?? row.item ?? row.ITEM ?? row.Product ?? row.product ?? row.Description ?? row.description;
  const price = row.Price ?? row.price ?? row.Retail ?? row.retail ?? row.MSRP;
  const cost = row.Cost ?? row.cost ?? row.Dealer ?? row.dealer;

  const name = String(item ?? '').trim();
  if (!name) return null;

  const priceNum = parseFloat(String(price ?? '').replace(/[$,]/g, ''));
  const costNum = parseFloat(String(cost ?? '').replace(/[$,]/g, ''));

  return {
    Item: name,
    Price: Number.isFinite(priceNum) ? priceNum : 0,
    Cost: Number.isFinite(costNum) ? costNum : 0,
  };
}

export function parseCatalogJson(data: unknown): CatalogItem[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((row) => normalizeRow(row as Record<string, unknown>))
    .filter((r): r is CatalogItem => r !== null);
}

export async function parseCatalogFile(file: File): Promise<CatalogItem[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const text = await file.text();
    return parseCatalogJson(JSON.parse(text));
  }

  if (ext === 'csv') {
    const text = await file.text();
    const wb = XLSX.read(text, { type: 'string' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    return rows.map((r) => normalizeRow(r)).filter((r): r is CatalogItem => r !== null);
  }

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
  return rows.map((r) => normalizeRow(r)).filter((r): r is CatalogItem => r !== null);
}

export function catalogSummary(items: CatalogItem[]): string {
  if (!items.length) return 'No items loaded';
  return `${items.length} items · ${items[0].Item}${items.length > 1 ? ` … ${items[items.length - 1].Item}` : ''}`;
}
