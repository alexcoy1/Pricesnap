import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { QuoteData, CompanyInfo } from '../types';
import { calculateTotalSavings } from './discountHelpers';

function loadImageDataUrl(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    if (!url?.trim()) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(null); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function exportQuoteToPdf(quote: QuoteData, company: CompanyInfo, terms: string) {
  const doc = new jsPDF();
  const savings = calculateTotalSavings(quote.lines);
  let startY = 20;

  const logoData = await loadImageDataUrl(company.logoUrl);
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 14, 10, 40, 16);
      startY = 32;
    } catch { /* skip logo */ }
  }

  doc.setFontSize(20);
  doc.setTextColor(0, 102, 255);
  doc.text(company.companyName, 14, startY);

  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(company.companyAddress, 14, startY + 8);
  doc.text(`${company.companyContact} | ${company.website}`, 14, startY + 14);

  const quoteY = startY + 28;
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('Quote', 14, quoteY);

  doc.setFontSize(10);
  doc.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, 14, quoteY + 8);
  if (quote.customerName) doc.text(`Customer: ${quote.customerName}`, 14, quoteY + 14);
  doc.text(`Status: ${quote.status}`, 14, quoteY + 20);
  doc.text(`Quote ID: ${quote.id.slice(0, 8)} (v${quote.version})`, 14, quoteY + 26);

  const rows = quote.lines.map((line) => {
    const orig = line.originalPrice ?? line.Price;
    const hasDiscount = line.discountPercentage && line.discountPercentage > 0;
    const unitDisplay = hasDiscount
      ? `$${orig.toFixed(2)} → $${line.Price.toFixed(2)} (${line.discountPercentage}% off)`
      : `$${line.Price.toFixed(2)}`;
    return [
      line.Item,
      String(line.Quantity),
      unitDisplay,
      `$${line.TotalPrice.toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: quoteY + 34,
    head: [['Item', 'Qty', 'Unit Price', 'Total']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [0, 102, 255] },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;

  if (savings > 0) {
    doc.setTextColor(5, 150, 105);
    doc.setFontSize(11);
    doc.text(`Total Savings: $${savings.toFixed(2)}`, 14, finalY + 10);
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text(`Subtotal: $${quote.overallTotalPrice.toFixed(2)}`, 140, finalY + 20, { align: 'right' });
  doc.text(`Total: $${quote.overallTotalPrice.toFixed(2)}`, 140, finalY + 28, { align: 'right' });

  if (terms) {
    doc.setFontSize(8);
    doc.text('Terms & Conditions', 14, finalY + 40);
    const split = doc.splitTextToSize(terms, 180);
    doc.text(split, 14, finalY + 46);
  }

  doc.save(`quote-${quote.id.slice(0, 8)}.pdf`);
}
