import React, { useRef, useState } from 'react';
import { PriceListItem, ManagedPriceListInfo, Customer, QuoteLineItem } from '../../types';

interface Props {
  priceListData: PriceListItem[] | null;
  managedPriceLists: ManagedPriceListInfo[];
  preferredPriceListId: string | null;
  onSelectManagedPriceList: (id: string) => void;
  onFileUpload: (file: File) => void;
  customers: Customer[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  onCustomerNameChange: (v: string) => void;
  onCustomerEmailChange: (v: string) => void;
  onCustomerPhoneChange: (v: string) => void;
  onCustomerAddressChange: (v: string) => void;
  userInputText: string;
  onUserInputChange: (v: string) => void;
  adjustmentText: string;
  onAdjustmentTextChange: (v: string) => void;
  quoteLines: QuoteLineItem[];
  priceListItems: PriceListItem[];
  onIdentifyItems: () => void;
  onApplyAdjustments: () => void;
  onDescribeChanges: () => void;
  onLinePromotionChange: (index: number, promotion: string) => void;
  onLinePriceChange: (index: number, price: number) => void;
  onLineQtyChange: (index: number, qty: number) => void;
  onRemoveLine: (index: number) => void;
  onAddManualLine: (itemName: string) => void;
  onCreateQuote: () => void;
  isLoading: boolean;
  matchMessage: string | null;
  promotions: string[];
}

export const NewQuoteView: React.FC<Props> = ({
  priceListData,
  managedPriceLists,
  preferredPriceListId,
  onSelectManagedPriceList,
  onFileUpload,
  customers,
  customerName,
  customerEmail,
  customerPhone,
  customerAddress,
  onCustomerNameChange,
  onCustomerEmailChange,
  onCustomerPhoneChange,
  onCustomerAddressChange,
  userInputText,
  onUserInputChange,
  adjustmentText,
  onAdjustmentTextChange,
  quoteLines,
  priceListItems,
  onIdentifyItems,
  onApplyAdjustments,
  onDescribeChanges,
  onLinePromotionChange,
  onLinePriceChange,
  onLineQtyChange,
  onRemoveLine,
  onAddManualLine,
  onCreateQuote,
  isLoading,
  matchMessage,
  promotions,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [manualItemSearch, setManualItemSearch] = useState('');

  const lineTotal = (line: QuoteLineItem) => line.TotalPrice;

  const itemSuggestions = manualItemSearch.trim().length >= 2
    ? priceListItems.filter((p) => p.Item.toLowerCase().includes(manualItemSearch.toLowerCase())).slice(0, 8)
    : [];

  return (
    <div className="new-quote-view" style={{ maxWidth: 960, margin: '0 auto' }}>
      <h2 className="view-heading">Create New Quote</h2>

      <div className="card mb-6">
        <div className="flex gap-3 items-end" style={{ flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: 220, marginBottom: 0 }}>
            <label className="form-label">Select Price List</label>
            <select
              className="form-select"
              value={preferredPriceListId || ''}
              onChange={(e) => e.target.value && onSelectManagedPriceList(e.target.value)}
            >
              <option value="">Select price list...</option>
              {managedPriceLists.map((pl) => (
                <option key={pl.id} value={pl.id}>{pl.name} ({pl.itemCount} items)</option>
              ))}
            </select>
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            Upload New
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])} />
        </div>
        {priceListData && (
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-success)' }}>
            ✓ {priceListData.length} items loaded
          </p>
        )}
      </div>

      <div className="card mb-6">
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Customer Information</h3>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className="form-input"
              list="customer-suggestions"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder="Customer name"
            />
            <datalist id="customer-suggestions">
              {customers.map((c) => <option key={c.id} value={c.name} />)}
            </datalist>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={customerEmail} onChange={(e) => onCustomerEmailChange(e.target.value)} placeholder="email@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={customerPhone} onChange={(e) => onCustomerPhoneChange(e.target.value)} placeholder="(555) 555-5555" />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" value={customerAddress} onChange={(e) => onCustomerAddressChange(e.target.value)} placeholder="Street, City, Province" />
          </div>
        </div>
      </div>

      <div className="card mb-6">
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Describe Items</h3>
        <textarea
          className="form-textarea"
          value={userInputText}
          onChange={(e) => onUserInputChange(e.target.value)}
          placeholder="e.g. premium widget, installation, and 3-year warranty"
          rows={4}
        />
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 12 }}
          onClick={onIdentifyItems}
          disabled={!priceListData || isLoading || !userInputText.trim()}
        >
          {isLoading ? 'Matching...' : 'Identify Items'}
        </button>
        {matchMessage && (
          <p style={{ marginTop: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>{matchMessage}</p>
        )}
      </div>

      <div className="card mb-6">
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>PriceSnap Adjustments</h3>
        <textarea
          className="form-textarea"
          value={adjustmentText}
          onChange={(e) => onAdjustmentTextChange(e.target.value)}
          placeholder="e.g. discount all by 10%"
          rows={3}
        />
        <div className="flex gap-2" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-secondary" onClick={onApplyAdjustments} disabled={!adjustmentText.trim() || quoteLines.length === 0}>
            Apply Changes
          </button>
          <button type="button" className="btn btn-secondary" onClick={onDescribeChanges} disabled={!adjustmentText.trim()}>
            Describe Changes
          </button>
        </div>
      </div>

      {priceListData && (
        <div className="card mb-6">
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Quote Items</h3>
          <div className="quote-table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>New Price</th>
                  <th>Promotion</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {quoteLines.map((line, i) => (
                  <tr key={`${line.Item}-${i}`}>
                    <td>{line.Item}</td>
                    <td>
                      <input
                        type="number"
                        min={1}
                        className="form-input"
                        style={{ width: 64, padding: '4px 8px' }}
                        value={line.Quantity}
                        onChange={(e) => onLineQtyChange(i, parseInt(e.target.value) || 1)}
                      />
                    </td>
                    <td>${line.Price.toFixed(2)}</td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        style={{ width: 88, padding: '4px 8px' }}
                        value={line.originalPrice ?? line.Price}
                        onChange={(e) => onLinePriceChange(i, parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ minWidth: 120, padding: '4px 8px' }}
                        value={line.promotion || ''}
                        onChange={(e) => onLinePromotionChange(i, e.target.value)}
                      >
                        <option value="">None</option>
                        {promotions.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td>${lineTotal(line).toFixed(2)}</td>
                    <td>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onRemoveLine(i)} title="Remove">✕</button>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={7}>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="form-input"
                        list="manual-item-suggestions"
                        value={manualItemSearch}
                        onChange={(e) => setManualItemSearch(e.target.value)}
                        placeholder="Search or type item name..."
                      />
                      <datalist id="manual-item-suggestions">
                        {itemSuggestions.map((p) => <option key={p.Item} value={p.Item} />)}
                      </datalist>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex gap-2" style={{ marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!manualItemSearch.trim()}
              onClick={() => {
                onAddManualLine(manualItemSearch.trim());
                setManualItemSearch('');
              }}
            >
              Add
            </button>
            {quoteLines.length > 0 && (
              <button
                type="button"
                className="btn btn-primary"
                style={{ marginLeft: 'auto' }}
                onClick={onCreateQuote}
                disabled={isLoading}
              >
                Create Quote
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
