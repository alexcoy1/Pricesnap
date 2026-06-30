import type { CatalogItem, CommissionSettings, CommissionSummary, MatchedLine, OrderLineInput } from '../types';
import { matchToCatalog } from './matcher';

function computeLineCommission(
  revenue: number,
  margin: number,
  settings: CommissionSettings
): number {
  const base = settings.basis === 'margin' ? margin : revenue;
  return Math.max(0, base * (settings.ratePercent / 100));
}

export function calculateCommission(
  orderLines: OrderLineInput[],
  catalog: CatalogItem[],
  settings: CommissionSettings
): CommissionSummary {
  const used = new Set<string>();
  const lines: MatchedLine[] = [];

  for (const input of orderLines) {
    const { item, score, confidence } = matchToCatalog(input.description, catalog, used);

    const quantity = input.quantity;
    const unitPrice = input.statedPrice ?? item?.Price ?? 0;
    const unitCost = item?.Cost ?? 0;

    const lineRevenue = unitPrice * quantity;
    const lineCost = unitCost * quantity;
    const lineMargin = lineRevenue - lineCost;
    const commission = item ? computeLineCommission(lineRevenue, lineMargin, settings) : 0;

    if (item) used.add(item.Item);

    lines.push({
      input,
      catalogItem: item,
      confidence,
      score,
      quantity,
      unitPrice,
      unitCost,
      lineRevenue,
      lineCost,
      lineMargin,
      lineCommission: commission,
    });
  }

  const matchedCount = lines.filter((l) => l.catalogItem).length;

  return {
    lines,
    matchedCount,
    unmatchedCount: lines.length - matchedCount,
    totalRevenue: lines.reduce((s, l) => s + l.lineRevenue, 0),
    totalCost: lines.reduce((s, l) => s + l.lineCost, 0),
    totalMargin: lines.reduce((s, l) => s + l.lineMargin, 0),
    totalCommission: lines.reduce((s, l) => s + l.lineCommission, 0),
  };
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}
