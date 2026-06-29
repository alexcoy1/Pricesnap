import { PriceListItem } from '../types';
import { enrichText, lexicalScore } from './matchScoring';

export interface CatalogSearchResult {
  item: PriceListItem;
  score: number;
}

function normalize(text: string): string {
  return enrichText(text).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function searchCatalog(
  query: string,
  priceList: PriceListItem[],
  limit = 12
): CatalogSearchResult[] {
  const q = query.trim();
  if (!q || !priceList.length) return [];

  const normQ = normalize(q);
  const qWords = normQ.split(' ').filter(Boolean);

  const scored = priceList.map((item) => {
    let score = lexicalScore(q, item.Item);
    const normItem = normalize(item.Item);
    const itemLower = item.Item.toLowerCase();

    if (itemLower === q.toLowerCase() || normItem === normQ) score = Math.max(score, 1);
    else if (itemLower.startsWith(q.toLowerCase()) || normItem.startsWith(normQ)) score += 0.3;
    else if (qWords.length > 1 && qWords.every((w) => normItem.includes(w))) score += 0.2;

    const acronym = qWords.map((w) => w[0]).join('');
    if (acronym.length >= 2 && normItem.replace(/\s/g, '').includes(acronym)) score += 0.15;

    return { item, score };
  });

  return scored
    .filter((row) => row.score >= 0.15 || itemLowerIncludes(row.item.Item, normQ))
    .sort((a, b) => b.score - a.score || a.item.Item.localeCompare(b.item.Item))
    .slice(0, limit);
}

function itemLowerIncludes(itemName: string, normQ: string): boolean {
  return normalize(itemName).includes(normQ);
}

export function resolveCatalogItem(query: string, priceList: PriceListItem[]): PriceListItem | null {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const exact = priceList.find((p) => p.Item === trimmed);
  if (exact) return exact;

  const ci = priceList.find((p) => p.Item.toLowerCase() === trimmed.toLowerCase());
  if (ci) return ci;

  const ranked = searchCatalog(trimmed, priceList, 1);
  if (ranked[0] && ranked[0].score >= 0.28) return ranked[0].item;

  const loose = priceList.find((p) => p.Item.toLowerCase().includes(trimmed.toLowerCase()));
  return loose || null;
}

export function lineFromCatalogItem(item: PriceListItem, quantity: number) {
  const qty = Math.max(1, quantity);
  const totalPrice = item.Price * qty;
  const totalCost = item.Cost * qty;
  return {
    ...item,
    Quantity: qty,
    TotalPrice: totalPrice,
    TotalCost: totalCost,
    Profit: totalPrice - totalCost,
    ProfitMargin: totalPrice > 0 ? ((totalPrice - totalCost) / totalPrice) * 100 : 0,
  };
}
