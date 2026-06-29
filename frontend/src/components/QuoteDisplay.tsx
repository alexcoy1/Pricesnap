import React, { useState, useEffect } from 'react';
import { QuoteData, CompanyInfo, User, AppView, QuoteLineItem, FinancingOption } from '../types';
import { applyBulkDiscount, calculateTotalSavings, hasAnyDiscounts, recalcQuoteTotals } from '../utils/discountHelpers';
import { exportQuoteToPdf } from '../utils/pdfExport';

interface Props {
  quoteData: QuoteData;
  companyInfo: CompanyInfo;
  defaultTerms: string;
  currentUser: User;
  currentView: AppView;
  onSetView: (view: AppView) => void;
  onReset: () => void;
  isHistoricalView: boolean;
  onSaveAsTemplate: (name: string, quote: QuoteData) => void;
  onUpdateQuote: (quote: QuoteData) => void;
  promotions: string[];
  financingOptions: FinancingOption[];
}

const DISCOUNT_PRESETS = [5, 10, 15, 20, 25];
const DISCOUNT_REASONS = ['Volume Discount', 'Seasonal Sale', 'Loyalty Discount', 'Custom Offer'];
const TAX_RATE = 0.13;

export const QuoteDisplay: React.FC<Props> = ({
  quoteData,
  companyInfo,
  defaultTerms,
  currentView,
  onSetView,
  onReset,
  onUpdateQuote,
  onSaveAsTemplate,
  promotions,
  financingOptions,
}) => {
  const activeFinancing = financingOptions.filter((o) => o.active);
  const financingLabels = activeFinancing.length
    ? activeFinancing.map((o) => o.name)
    : ['No financing options configured'];
  const [editMode, setEditMode] = useState(true);
  const [showDiscounts, setShowDiscounts] = useState(false);
  const [discountPct, setDiscountPct] = useState(10);
  const [discountReason, setDiscountReason] = useState('Volume Discount');
  const [adjustmentText, setAdjustmentText] = useState('');
  const [financing, setFinancing] = useState(financingLabels[0]);
  const [depositAmount, setDepositAmount] = useState('');
  const [financingDisplay, setFinancingDisplay] = useState<'total' | 'payments' | 'both'>('both');

  useEffect(() => {
    const labels = financingOptions.filter((o) => o.active).map((o) => o.name);
    const next = labels.length ? labels : ['No financing options configured'];
    if (!next.includes(financing)) setFinancing(next[0]);
  }, [financingOptions, financing]);

  const isInternal = currentView === AppView.INTERNAL_QUOTE;
  const savings = calculateTotalSavings(quoteData.lines);
  const taxAmount = quoteData.overallTotalPrice * TAX_RATE;
  const totalWithTax = quoteData.overallTotalPrice + taxAmount;

  const applyDiscount = () => {
    const lines = applyBulkDiscount(quoteData.lines, discountPct, discountReason);
    const totals = recalcQuoteTotals(lines);
    onUpdateQuote({ ...quoteData, lines, ...totals, version: quoteData.version + 1 });
    setShowDiscounts(false);
  };

  const removeDiscounts = () => {
    const lines = quoteData.lines.map((line) => {
      const price = line.originalPrice ?? line.Price;
      const totalPrice = price * line.Quantity;
      const totalCost = line.Cost * line.Quantity;
      const profit = totalPrice - totalCost;
      return {
        ...line,
        Price: price,
        originalPrice: undefined,
        discountPercentage: undefined,
        discountReason: undefined,
        discountAmount: undefined,
        TotalPrice: totalPrice,
        TotalCost: totalCost,
        Profit: profit,
        ProfitMargin: totalPrice > 0 ? (profit / totalPrice) * 100 : 0,
      };
    });
    const totals = recalcQuoteTotals(lines);
    onUpdateQuote({ ...quoteData, lines, ...totals, version: quoteData.version + 1 });
  };

  const updateLinePrice = (index: number, newPrice: number) => {
    const lines = [...quoteData.lines];
    const line = { ...lines[index] };
    if (!line.originalPrice) line.originalPrice = line.Price;
    line.Price = newPrice;
    line.discountPercentage = line.originalPrice > 0 ? Math.round((1 - newPrice / line.originalPrice) * 100) : 0;
    line.TotalPrice = newPrice * line.Quantity;
    line.TotalCost = line.Cost * line.Quantity;
    line.Profit = line.TotalPrice - line.TotalCost;
    line.ProfitMargin = line.TotalPrice > 0 ? (line.Profit / line.TotalPrice) * 100 : 0;
    lines[index] = line;
    const totals = recalcQuoteTotals(lines);
    onUpdateQuote({ ...quoteData, lines, ...totals });
  };

  const updateLinePromotion = (index: number, promotion: string) => {
    const lines = [...quoteData.lines];
    lines[index] = { ...lines[index], promotion: promotion || undefined };
    onUpdateQuote({ ...quoteData, lines });
  };

  const updateStatus = (status: string) => {
    onUpdateQuote({ ...quoteData, status, version: quoteData.version + 1 });
  };

  const copyQuoteSummary = () => {
    const lines = quoteData.lines.map((l) => `• ${l.Item} x${l.Quantity} — $${l.TotalPrice.toFixed(2)}`).join('\n');
    const text = `Quote for ${quoteData.customerName || 'Customer'}\n${lines}\n\nTotal: $${quoteData.overallTotalPrice.toFixed(2)}`;
    navigator.clipboard.writeText(text).then(() => alert('Quote copied to clipboard'));
  };

  const renderLineRow = (line: QuoteLineItem, index: number) => {
    const hasDiscount = (line.discountPercentage ?? 0) > 0;
    const listPrice = line.originalPrice ?? line.Price;
    const lineSaving = hasDiscount ? (listPrice - line.Price) * line.Quantity : 0;

    return (
      <tr key={index}>
        <td>{line.Item}</td>
        <td>{line.Quantity}</td>
        <td>
          {(hasDiscount || isInternal) && <div className="price-strikethrough">${listPrice.toFixed(2)}</div>}
          {!isInternal && !editMode && <span>${line.Price.toFixed(2)}</span>}
          {isInternal && <span>${line.Price.toFixed(2)}</span>}
          {hasDiscount && <span className="discount-badge" style={{ marginLeft: 8 }}>{line.discountPercentage}% OFF</span>}
        </td>
        {editMode && (
          <td>
            <input type="number" className="form-input" style={{ width: 88, padding: 4 }} value={line.Price} onChange={(e) => updateLinePrice(index, parseFloat(e.target.value) || 0)} />
          </td>
        )}
        <td>
          {editMode ? (
            <select className="form-select" style={{ minWidth: 120, padding: '4px 8px' }} value={line.promotion || ''} onChange={(e) => updateLinePromotion(index, e.target.value)}>
              <option value="">None</option>
              {promotions.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          ) : (
            line.promotion || '—'
          )}
        </td>
        <td>${line.TotalPrice.toFixed(2)}</td>
        {isInternal && (
          <>
            <td>${line.Cost.toFixed(2)}</td>
            <td>${line.Profit.toFixed(2)}</td>
            <td>{line.ProfitMargin.toFixed(1)}%</td>
          </>
        )}
        {!isInternal && hasAnyDiscounts(quoteData.lines) && <td className="discount-badge">${lineSaving.toFixed(2)}</td>}
      </tr>
    );
  };

  const renderMobileCard = (line: QuoteLineItem, index: number) => {
    const hasDiscount = (line.discountPercentage ?? 0) > 0;
    const listPrice = line.originalPrice ?? line.Price;
    return (
      <div key={index} className="quote-card">
        <div style={{ fontWeight: 600 }}>{line.Item}</div>
        <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>Qty: {line.Quantity}</div>
        <div style={{ marginTop: 8 }}>
          {(hasDiscount || isInternal) && <span className="price-strikethrough">${listPrice.toFixed(2)} </span>}
          <strong>${line.Price.toFixed(2)}</strong>
          {hasDiscount && <span className="discount-badge" style={{ marginLeft: 8 }}>{line.discountPercentage}% OFF</span>}
        </div>
        {line.promotion && <div style={{ fontSize: 12, marginTop: 4 }}>Promo: {line.promotion}</div>}
        <div style={{ marginTop: 4, fontWeight: 600 }}>Total: ${line.TotalPrice.toFixed(2)}</div>
        {isInternal && <div style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 4 }}>Profit: ${line.Profit.toFixed(2)} ({line.ProfitMargin.toFixed(1)}%)</div>}
      </div>
    );
  };

  return (
    <div>
      <div className="flex gap-3 mb-6 quote-toolbar" style={{ flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary" onClick={() => onSetView(isInternal ? AppView.CUSTOMER_QUOTE : AppView.INTERNAL_QUOTE)}>
          {isInternal ? 'Customer View' : 'Internal View'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setEditMode(!editMode)}>
          {editMode ? 'Done Editing' : 'Edit Mode'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => setShowDiscounts(!showDiscounts)}>Quick Discounts</button>
        <button type="button" className="btn btn-primary" onClick={() => { void exportQuoteToPdf(quoteData, companyInfo, defaultTerms); }}>Export PDF</button>
        <button type="button" className="btn btn-secondary" onClick={copyQuoteSummary}>Copy Summary</button>
        <button type="button" className="btn btn-secondary" onClick={() => {
          const name = window.prompt('Template name:', `${quoteData.customerName || 'Package'} template`);
          if (name?.trim()) onSaveAsTemplate(name.trim(), quoteData);
        }}>Save Template</button>
        <button type="button" className="btn btn-secondary" onClick={onReset}>New Quote</button>
        <select className="form-select" style={{ width: 'auto' }} value={quoteData.status} onChange={(e) => updateStatus(e.target.value)}>
          {['Draft', 'Sent', 'Approved', 'Rejected', 'Completed'].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {editMode && (
        <div className="card mb-6">
          <h3 style={{ marginBottom: 12, fontWeight: 600 }}>Financing Options</h3>
          <select className="form-select" style={{ maxWidth: 400, marginBottom: 12 }} value={financing} onChange={(e) => setFinancing(e.target.value)}>
            {financingLabels.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <div className="form-group" style={{ maxWidth: 240 }}>
            <label className="form-label">Deposit Amount</label>
            <input className="form-input" type="number" min={0} value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="0.00" />
          </div>
          <div className="flex gap-4" style={{ marginTop: 12, flexWrap: 'wrap' }}>
            {(['total', 'payments', 'both'] as const).map((mode) => (
              <label key={mode} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
                <input type="radio" name="financing-display" checked={financingDisplay === mode} onChange={() => setFinancingDisplay(mode)} />
                {mode === 'total' ? 'Total Only' : mode === 'payments' ? 'Payments Only' : 'Both'}
              </label>
            ))}
          </div>
        </div>
      )}

      {editMode && (
        <div className="card mb-6">
          <h3 style={{ marginBottom: 12, fontWeight: 600 }}>PriceSnap Adjustments</h3>
          <textarea className="form-textarea" rows={3} value={adjustmentText} onChange={(e) => setAdjustmentText(e.target.value)} placeholder="e.g. apply 10% volume discount to all items" />
          <div className="flex gap-2" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => { setDiscountPct(10); setDiscountReason('Volume Discount'); applyDiscount(); }}>Apply</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => alert('Adjustment noted: ' + adjustmentText)}>Describe Changes</button>
          </div>
        </div>
      )}

      {showDiscounts && (
        <div className="discount-toolbar card mb-6">
          <span style={{ fontWeight: 600 }}>Apply discount:</span>
          {DISCOUNT_PRESETS.map((pct) => (
            <button key={pct} type="button" className={`btn btn-sm ${discountPct === pct ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setDiscountPct(pct)}>{pct}%</button>
          ))}
          <select className="form-select" style={{ width: 'auto' }} value={discountReason} onChange={(e) => setDiscountReason(e.target.value)}>
            {DISCOUNT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <button type="button" className="btn btn-success btn-sm" onClick={applyDiscount}>Apply to All Items</button>
          {hasAnyDiscounts(quoteData.lines) && (
            <button type="button" className="btn btn-danger btn-sm" onClick={removeDiscounts}>Remove Discounts</button>
          )}
        </div>
      )}

      <div className="card mb-6" style={{ borderTop: `4px solid ${companyInfo.primaryColor}` }}>
        <div className="quote-doc-header flex justify-between" style={{ marginBottom: 24 }}>
          <div>
            {companyInfo.logoUrl && <img src={companyInfo.logoUrl} alt="" style={{ maxHeight: 48, marginBottom: 8 }} />}
            <h2 style={{ fontWeight: 800, color: companyInfo.primaryColor }}>{companyInfo.companyName}</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{companyInfo.companyAddress}</p>
            <p style={{ fontSize: 13 }}>{companyInfo.companyContact} | {companyInfo.website}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 700 }}>QUOTE</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{new Date(quoteData.createdAt).toLocaleDateString()}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>ID: {quoteData.id.slice(0, 8)} · v{quoteData.version}</div>
            {quoteData.customerName && <div style={{ marginTop: 4 }}>To: <strong>{quoteData.customerName}</strong></div>}
            {quoteData.customerEmail && <div style={{ fontSize: 13 }}>{quoteData.customerEmail}</div>}
            {quoteData.customerPhone && <div style={{ fontSize: 13 }}>{quoteData.customerPhone}</div>}
          </div>
        </div>

        <div className="quote-table-wrapper desktop-quote-table">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>{isInternal ? 'List Price' : 'Price'}</th>
                {editMode && <th>New Price</th>}
                <th>Promotion</th>
                <th>Total</th>
                {isInternal && <><th>Cost</th><th>Profit</th><th>Margin</th></>}
                {!isInternal && hasAnyDiscounts(quoteData.lines) && <th>Savings</th>}
              </tr>
            </thead>
            <tbody>
              {quoteData.lines.map(renderLineRow)}
            </tbody>
          </table>
        </div>

        <div className="mobile-quote-cards">
          {quoteData.lines.map(renderMobileCard)}
        </div>

        {savings > 0 && !isInternal && (
          <div className="savings-summary" style={{ marginTop: 24 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-success)' }}>Your Savings Summary</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-success-dark)', marginTop: 8 }}>${savings.toFixed(2)}</div>
            <div style={{ fontSize: 14, color: 'var(--color-success-dark)' }}>Total savings on this quote!</div>
          </div>
        )}

        <div className="revenue-summary" style={{ marginTop: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Subtotal</div>
            <div style={{ fontSize: 20, fontWeight: 600 }}>${quoteData.overallTotalPrice.toFixed(2)}</div>
            {isInternal && (
              <>
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>Tax (13%)</div>
                <div style={{ fontSize: 18, fontWeight: 600 }}>${taxAmount.toFixed(2)}</div>
                <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>Revenue (incl. tax)</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-primary)' }}>${totalWithTax.toFixed(2)}</div>
                <div style={{ marginTop: 12, padding: 16, background: 'var(--color-success-bg)', borderRadius: 8, display: 'inline-block', textAlign: 'left' }}>
                  <div style={{ fontSize: 13 }}>Total Cost: ${quoteData.overallTotalCost.toFixed(2)}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-success)', marginTop: 4 }}>
                    Profit: ${quoteData.overallProfit.toFixed(2)} ({quoteData.overallProfitMargin.toFixed(1)}%)
                  </div>
                </div>
              </>
            )}
            {!isInternal && (
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 8 }}>${quoteData.overallTotalPrice.toFixed(2)}</div>
            )}
          </div>
        </div>

        {defaultTerms && (
          <div style={{ marginTop: 24, padding: 16, background: 'var(--color-gray-50)', borderRadius: 8, fontSize: 12, whiteSpace: 'pre-wrap' }}>
            {defaultTerms}
          </div>
        )}
      </div>
    </div>
  );
};
