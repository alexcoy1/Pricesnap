import type { CatalogItem, InvoiceUploadPayload } from '../types';
import { matchToCatalog } from './matcher';

export interface SmartMatchLine {
  Item: string;
  Quantity: number;
  statedPrice?: number;
  rawLine?: string;
}

const SKIP_LINE =
  /^(total|subtotal|tax|gst|hst|pst|balance|amount due|grand total|invoice|quote|#|date|bill to|ship to|customer|page \d)/i;

const WORD_QUANTITIES: Record<string, number> = {
  one: 1,
  a: 1,
  an: 1,
  two: 2,
  pair: 2,
  three: 3,
  four: 4,
  five: 5,
};

function parseQuantity(text: string): number {
  const qtyLabel = text.match(/\b(?:qty|quantity)\s*[:#]?\s*(\d+(?:\.\d+)?)\b/i);
  if (qtyLabel) return Math.max(1, Math.floor(Number(qtyLabel[1])) || 1);

  const times = text.match(/\bx\s*(\d+)\b/i);
  if (times) return Math.max(1, Number(times[1]) || 1);

  const lead = text.match(/^\s*(\d+(?:\.\d+)?)\s+/);
  if (lead) return Math.max(1, Math.floor(Number(lead[1])) || 1);

  for (const [word, n] of Object.entries(WORD_QUANTITIES)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) return n;
  }

  return 1;
}

function parsePrice(text: string): number | undefined {
  const prices = [...text.matchAll(/\$\s*([\d,]+(?:\.\d{2})?)/g)];
  if (!prices.length) {
    const plain = text.match(/\b([\d,]+\.\d{2})\b/);
    if (plain) {
          const n = Number(plain[1].replace(/,/g, ''));
          return Number.isFinite(n) ? n : undefined;
        }
    return undefined;
  }
  const last = prices[prices.length - 1][1];
  const n = Number(last.replace(/,/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function lineDescription(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^\d+[.)]\s*/, '');

  const pipeParts = text.split(/\||\t/).map((p) => p.trim());
  for (const part of pipeParts) {
    const itemMatch = part.match(
      /^(?:item|product|description|sku|model)\s*:\s*(.+)$/i
    );
    if (itemMatch) return itemMatch[1].trim();
  }

  if (pipeParts.length > 1) {
    const candidate = pipeParts.find(
      (p) =>
        p.length > 2 &&
        !/^(qty|quantity|price|cost|total|amount|unit)\s*:/i.test(p) &&
        !/^\$?[\d,]+(\.\d{2})?$/.test(p)
    );
    if (candidate) return candidate.replace(/^[^:]+:\s*/, '').trim() || candidate;
  }

  return text
    .replace(/\$\s*[\d,]+(?:\.\d{2})?/g, '')
    .replace(/\bqty\s*[:#]?\s*\d+/gi, '')
    .trim() || text;
}

function segmentsFromLine(line: string): string[] {
  const base = lineDescription(line);
  const parts = new Set<string>([base, line.trim()]);
  for (const piece of line.split(/\||\t/)) {
    const p = piece.trim();
    if (p.length > 2) parts.add(p);
  }
  return [...parts];
}

function tryMatchLine(
  description: string,
  catalog: CatalogItem[],
  used: Set<string>
): SmartMatchLine | null {
  if (!description || description.length < 2) return null;
  if (SKIP_LINE.test(description)) return null;

  const { item, score } = matchToCatalog(description, catalog, used);
  if (!item || score < 0.28) return null;

  used.add(item.Item);
  return {
    Item: item.Item,
    Quantity: parseQuantity(description),
    statedPrice: parsePrice(description),
    rawLine: description.slice(0, 200),
  };
}

function matchCatalogInDocument(text: string, catalog: CatalogItem[], used: Set<string>): SmartMatchLine[] {
  const found: SmartMatchLine[] = [];
  const lowerDoc = text.toLowerCase();

  const ranked = [...catalog].sort((a, b) => b.Item.length - a.Item.length);

  for (const row of ranked) {
    if (used.has(row.Item)) continue;
    const idx = lowerDoc.indexOf(row.Item.toLowerCase());
    if (idx < 0) continue;

    const context = text.slice(Math.max(0, idx - 30), idx + row.Item.length + 50);
    used.add(row.Item);
    found.push({
      Item: row.Item,
      Quantity: parseQuantity(context),
      statedPrice: parsePrice(context),
      rawLine: context.trim().slice(0, 200),
    });
  }

  return found;
}

export function smartMatchInvoice(
  invoice: InvoiceUploadPayload,
  catalog: CatalogItem[]
): SmartMatchLine[] | null {
  const text = invoice.extractedText?.trim();
  if (!text || !catalog.length) return null;

  const used = new Set<string>();
  const results: SmartMatchLine[] = [];

  for (const raw of text.split(/\r?\n/)) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length < 2 || SKIP_LINE.test(trimmed)) continue;

    for (const segment of segmentsFromLine(trimmed)) {
      const hit = tryMatchLine(segment, catalog, used);
      if (hit) results.push(hit);
    }
  }

  if (results.length < 2) {
    for (const hit of matchCatalogInDocument(text, catalog, used)) {
      results.push(hit);
    }
  }

  return results.length ? results : null;
}

// Back-compat alias
export const extractInvoiceLocally = smartMatchInvoice;
