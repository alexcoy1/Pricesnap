import type { CatalogItem, InvoiceUploadPayload } from '../types';
import { smartMatchInvoice } from '../utils/smartInvoiceMatch';
import { getDevApiKey } from './devApiKey';

export interface ExtractInvoiceResponse {
  lines: {
    Item: string;
    Quantity: number;
    statedPrice?: number;
    rawLine?: string;
  }[];
  matcher: string;
  model?: string;
  message?: string;
}

const API_PATH = '/api/ai/extract-invoice';

function invoiceHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const devKey = getDevApiKey();
  if (devKey) headers['X-Anthropic-Key'] = devKey;
  return headers;
}

function smartResult(
  lines: NonNullable<ReturnType<typeof smartMatchInvoice>>,
  note?: string
): ExtractInvoiceResponse {
  return {
    lines,
    matcher: 'smart',
    message: note ?? `Smart-matched ${lines.length} line(s) to your price list.`,
  };
}

async function callServerAi(
  invoice: InvoiceUploadPayload,
  priceList: CatalogItem[]
): Promise<ExtractInvoiceResponse> {
  const res = await fetch(API_PATH, {
    method: 'POST',
    headers: invoiceHeaders(),
    body: JSON.stringify({ invoice, priceList }),
  });

  const rawText = await res.text();
  let data: { error?: string; details?: string } & ExtractInvoiceResponse = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    throw new Error(
      res.ok
        ? 'Invalid response from invoice API.'
        : `Invoice AI failed (${res.status}). Smart matching found no lines — try an Excel quote or clearer PDF.`
    );
  }

  if (!res.ok) {
    throw new Error(data.details || data.error || `Invoice AI failed (${res.status}).`);
  }

  return data;
}

function shouldTryServerAi(): boolean {
  if (getDevApiKey()) return true;
  // Production: attempt Claude when Netlify env is configured.
  return import.meta.env.PROD;
}

function noMatchError(invoice: InvoiceUploadPayload): Error {
  if (invoice.mediaType === 'application/pdf') {
    if (!invoice.extractedText?.trim()) {
      return new Error(
        'This PDF has no selectable text (often a scan). Try Excel/CSV, or add Claude AI on Netlify for image-based PDFs.'
      );
    }
    return new Error(
      'No line items matched your price list. Check that product names on the PDF match your catalog, or try Excel/CSV.'
    );
  }
  if (invoice.mediaType.startsWith('image/')) {
    return new Error(
      'Smart matching cannot read photos yet. Upload a PDF or Excel quote, or add Claude AI on Netlify later.'
    );
  }
  return new Error(
    'No line items matched your price list. Try an Excel/CSV quote, a text-based PDF, or product names that match your catalog.'
  );
}

/** Smart match first; Claude only when configured and smart match finds nothing. */
export async function extractInvoice(
  invoice: InvoiceUploadPayload,
  priceList: CatalogItem[]
): Promise<ExtractInvoiceResponse> {
  const smart = smartMatchInvoice(invoice, priceList);
  if (smart?.length) {
    return smartResult(smart);
  }

  if (shouldTryServerAi()) {
    try {
      const ai = await callServerAi(invoice, priceList);
      if (ai.lines?.length) return ai;
    } catch (err) {
      if (!import.meta.env.PROD) {
        throw err instanceof Error
          ? err
          : new Error('Invoice AI failed. Smart matching found no lines in this file.');
      }
    }
  }

  throw noMatchError(invoice);
}

/** @deprecated Use extractInvoice */
export const extractInvoiceWithAi = extractInvoice;

export async function checkAiAvailable(): Promise<boolean> {
  try {
    const res = await fetch(API_PATH, { method: 'OPTIONS' });
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}
