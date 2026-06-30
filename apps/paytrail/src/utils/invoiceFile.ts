import * as XLSX from 'xlsx';
import type { InvoiceUploadPayload } from '../types';
import { isPdfTextEmpty, pdfFileToText } from './pdfText';

const MAX_BYTES = 12 * 1024 * 1024; // 12 MB

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

async function spreadsheetToText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (!rows.length) return '';
  return rows
    .map((row) =>
      Object.entries(row)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ')
    )
    .join('\n');
}

const IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

export function isInvoiceImageType(mediaType: string): boolean {
  return IMAGE_TYPES.has(mediaType) || mediaType.startsWith('image/');
}

export async function fileToInvoicePayload(file: File): Promise<InvoiceUploadPayload> {
  if (file.size > MAX_BYTES) {
    throw new Error('File is too large (max 12 MB). Try a smaller scan or photo.');
  }

  const lower = file.name.toLowerCase();
  const isSheet =
    lower.endsWith('.xlsx') ||
    lower.endsWith('.xls') ||
    lower.endsWith('.csv') ||
    file.type.includes('spreadsheet') ||
    file.type === 'text/csv';

  if (isSheet) {
    const extractedText = await spreadsheetToText(file);
    if (!extractedText.trim()) {
      throw new Error('Spreadsheet appears empty.');
    }
    return {
      fileName: file.name,
      mediaType: 'text/plain',
      extractedText,
    };
  }

  const mediaType =
    file.type ||
    (lower.endsWith('.pdf')
      ? 'application/pdf'
      : lower.endsWith('.png')
        ? 'image/png'
        : lower.endsWith('.webp')
          ? 'image/webp'
          : 'image/jpeg');

  if (mediaType === 'application/pdf' || isInvoiceImageType(mediaType)) {
    const base64 = await readAsBase64(file);
    let extractedText: string | undefined;

    if (mediaType === 'application/pdf') {
      try {
        const pdfText = await pdfFileToText(file);
        if (!isPdfTextEmpty(pdfText)) extractedText = pdfText;
      } catch {
        // Smart match may still use AI when configured; preview keeps the PDF.
      }
    }

    return { fileName: file.name, mediaType, base64, extractedText };
  }

  throw new Error('Unsupported file type. Upload a PDF, photo, or spreadsheet.');
}

export function invoicePreviewKind(mediaType: string): 'pdf' | 'image' | 'sheet' {
  if (mediaType === 'application/pdf') return 'pdf';
  if (mediaType === 'text/plain') return 'sheet';
  return 'image';
}
