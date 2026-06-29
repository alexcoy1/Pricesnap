import { QuoteLineItem } from '../types';

export function applyBulkDiscount(
  lines: QuoteLineItem[],
  percentage: number,
  reason: string
): QuoteLineItem[] {
  return lines.map((line) => {
    const originalPrice = line.originalPrice ?? line.Price;
    const discountedPrice = originalPrice * (1 - percentage / 100);
    const totalPrice = discountedPrice * line.Quantity;
    const totalCost = line.Cost * line.Quantity;
    const profit = totalPrice - totalCost;

    return {
      ...line,
      originalPrice,
      Price: discountedPrice,
      discountPercentage: percentage,
      discountReason: reason,
      discountAmount: (originalPrice - discountedPrice) * line.Quantity,
      TotalPrice: totalPrice,
      TotalCost: totalCost,
      Profit: profit,
      ProfitMargin: totalPrice > 0 ? (profit / totalPrice) * 100 : 0,
    };
  });
}

export function calculateTotalSavings(lines: QuoteLineItem[]): number {
  return lines.reduce((sum, line) => {
    if (line.originalPrice && line.originalPrice > line.Price) {
      return sum + (line.originalPrice - line.Price) * line.Quantity;
    }
    return sum;
  }, 0);
}

export function hasAnyDiscounts(lines: QuoteLineItem[]): boolean {
  return lines.some((l) => (l.discountPercentage ?? 0) > 0);
}

export function recalcQuoteTotals(lines: QuoteLineItem[]) {
  const overallTotalPrice = lines.reduce((s, l) => s + l.TotalPrice, 0);
  const overallTotalCost = lines.reduce((s, l) => s + l.TotalCost, 0);
  const overallProfit = overallTotalPrice - overallTotalCost;
  const overallProfitMargin = overallTotalPrice > 0 ? (overallProfit / overallTotalPrice) * 100 : 0;
  return { overallTotalPrice, overallTotalCost, overallProfit, overallProfitMargin };
}
