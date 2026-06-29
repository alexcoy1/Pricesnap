import React, { useRef, useState } from 'react';
import { PriceListItem, ManagedPriceListInfo, Customer } from '../types';

const QUICK_EXAMPLES = [
  { label: 'Product + install', text: 'widget pro premium with standard installation' },
  { label: 'Service bundle', text: 'annual service plan, starter kit, and 3-year warranty' },
  { label: 'Team package', text: 'team software license with remote training' },
];

interface Props {
  priceListData: PriceListItem[] | null;
  userInputText: string;
  onUserInputChange: (text: string) => void;
  customerNameInput: string;
  onCustomerNameChange: (name: string) => void;
  onGenerateQuote: () => void;
  onManualQuoteGeneration: (items: { itemName: string; quantity: number }[]) => void;
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  managedPriceLists: ManagedPriceListInfo[];
  onSelectManagedPriceList: (id: string) => void;
  preferredPriceListId: string | null;
  customers: Customer[];
  recentCustomers: string[];
  quoteTemplates: { id: string; name: string; userInput: string }[];
  onApplyTemplate: (userInput: string) => void;
  serviceStatus: { available: boolean; message: string } | null;
}

export const QuoteInputForm: React.FC<Props> = ({
  priceListData,
  userInputText,
  onUserInputChange,
  customerNameInput,
  onCustomerNameChange,
  onGenerateQuote,
  onManualQuoteGeneration,
  onFileUpload,
  isLoading,
  managedPriceLists,
  onSelectManagedPriceList,
  preferredPriceListId,
  customers,
  recentCustomers,
  quoteTemplates,
  onApplyTemplate,
  serviceStatus,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualItems, setManualItems] = useState<Record<string, number>>({});
  const [manualSearch, setManualSearch] = useState('');

  const filteredItems = priceListData
    ? (manualSearch.trim()
      ? priceListData.filter((i) => i.Item.toLowerCase().includes(manualSearch.toLowerCase()))
      : priceListData)
    : [];

  const toggleManualItem = (itemName: string) => {
    setManualItems((prev) => {
      const next = { ...prev };
      if (next[itemName]) delete next[itemName];
      else next[itemName] = 1;
      return next;
    });
  };

  const setManualQty = (itemName: string, qty: number) => {
    setManualItems((prev) => ({ ...prev, [itemName]: Math.max(1, qty) }));
  };

  const handleManualSubmit = () => {
    const items = Object.entries(manualItems).map(([itemName, quantity]) => ({ itemName, quantity }));
    onManualQuoteGeneration(items);
  };

  return (
    <div className="grid-2" style={{ alignItems: 'start' }}>
      <div>
        <div className="card mb-6">
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Upload Price List</h3>
          <div className="upload-zone" onClick={() => fileRef.current?.click()}>
            <p>📁 Click to upload Excel (.xlsx)</p>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>Columns: Item, Price, Cost</p>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" hidden onChange={(e) => e.target.files?.[0] && onFileUpload(e.target.files[0])} />
          </div>

          {managedPriceLists.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <label className="form-label">Or select saved price list</label>
              <select
                className="form-select"
                value={preferredPriceListId || ''}
                onChange={(e) => e.target.value && onSelectManagedPriceList(e.target.value)}
              >
                <option value="">Select...</option>
                {managedPriceLists.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.name} ({pl.itemCount} items)</option>
                ))}
              </select>
            </div>
          )}

          {priceListData && (
            <div className="alert alert-success" style={{ marginTop: 16 }}>
              ✓ {priceListData.length} items loaded
            </div>
          )}
        </div>

        {priceListData && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 style={{ fontWeight: 600 }}>Manual Quote Builder</h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowManual(!showManual)}>
                {showManual ? 'Hide' : 'Show'}
              </button>
            </div>
            {showManual && (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                <input
                  className="form-input mb-3"
                  placeholder="Search by series or item name..."
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                />
                {filteredItems.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>No items match your search.</p>
                ) : filteredItems.map((item) => (
                  <div key={item.Item} className="flex items-center gap-2" style={{ padding: '8px 0', borderBottom: '1px solid var(--color-border-light)' }}>
                    <input type="checkbox" checked={!!manualItems[item.Item]} onChange={() => toggleManualItem(item.Item)} />
                    <span style={{ flex: 1, fontSize: 13 }}>{item.Item}</span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>${item.Price}</span>
                    {manualItems[item.Item] !== undefined && (
                      <input
                        type="number" min={1} className="form-input"
                        style={{ width: 60, padding: '4px 8px' }}
                        value={manualItems[item.Item]}
                        onChange={(e) => setManualQty(item.Item, parseInt(e.target.value) || 1)}
                      />
                    )}
                  </div>
                ))}
                <button
                  className="btn btn-primary"
                  style={{ marginTop: 12, width: '100%' }}
                  onClick={handleManualSubmit}
                  disabled={Object.keys(manualItems).length === 0 || isLoading}
                >
                  Create Manual Quote
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 style={{ fontWeight: 600 }}>Quote Generation</h3>
          {serviceStatus && (
            <span className="discount-badge" style={{ background: serviceStatus.available ? 'var(--color-primary)' : 'var(--color-gray-600)' }}>
              {serviceStatus.available ? 'Auto Match' : 'Manual Mode'}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Customer Name</label>
          <input
            className="form-input"
            list="customer-suggestions"
            value={customerNameInput}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            placeholder="Optional — start typing to match saved customers"
          />
          <datalist id="customer-suggestions">
            {customers.map((c) => <option key={c.id} value={c.name} />)}
          </datalist>
          {recentCustomers.length > 0 && (
            <div className="chip-row" style={{ marginTop: 8 }}>
              {recentCustomers.map((n) => (
                <button key={n} type="button" className="chip" onClick={() => onCustomerNameChange(n)}>{n}</button>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Describe what the customer needs</label>
          {quoteTemplates.length > 0 && (
            <>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Saved templates:</p>
              <div className="chip-row">
                {quoteTemplates.map((t) => (
                  <button key={t.id} type="button" className="chip" onClick={() => onApplyTemplate(t.userInput)}>{t.name}</button>
                ))}
              </div>
            </>
          )}
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 8 }}>Quick examples — tap to fill:</p>
          <div className="flex gap-2 mb-3" style={{ flexWrap: 'wrap' }}>
            {QUICK_EXAMPLES.map((b) => (
              <button
                key={b.label}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onUserInputChange(b.text)}
              >
                {b.label}
              </button>
            ))}
          </div>
          <textarea
            className="form-textarea"
            value={userInputText}
            onChange={(e) => onUserInputChange(e.target.value)}
              placeholder="e.g. premium widget with installation and extended warranty"
            rows={5}
          />
        </div>

        <button
          className="btn btn-primary"
          style={{ width: '100%' }}
          onClick={onGenerateQuote}
          disabled={!priceListData || isLoading || !userInputText.trim()}
        >
          {isLoading ? 'Generating...' : '✨ Generate Quote'}
        </button>

        <p style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-secondary)' }}>
          Describe what the customer needs — items are matched automatically from your price list.
        </p>
      </div>
    </div>
  );
};
