import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PriceListItem } from '../../types';
import { searchCatalog } from '../../utils/catalogSearch';

interface Props {
  priceList: PriceListItem[];
  quoteItemNames: string[];
  onAddItem: (item: PriceListItem, quantity: number) => void;
  disabled?: boolean;
}

export const CatalogSearchPicker: React.FC<Props> = ({
  priceList,
  quoteItemNames,
  onAddItem,
  disabled,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [highlight, setHighlight] = useState(0);
  const [recentAdds, setRecentAdds] = useState<string[]>([]);

  const inQuote = useMemo(() => new Set(quoteItemNames), [quoteItemNames]);

  const results = useMemo(() => {
    if (!query.trim()) {
      const recent = recentAdds
        .map((name) => priceList.find((p) => p.Item === name))
        .filter((p): p is PriceListItem => !!p)
        .slice(0, 6);
      if (recent.length) {
        return recent.map((item) => ({ item, score: 1 }));
      }
      return priceList.slice(0, 8).map((item) => ({ item, score: 0 }));
    }
    return searchCatalog(query, priceList, 12);
  }, [query, priceList, recentAdds]);

  useEffect(() => {
    setHighlight(0);
  }, [query, results.length]);

  const addItem = useCallback((item: PriceListItem) => {
    onAddItem(item, quantity);
    setRecentAdds((prev) => [item.Item, ...prev.filter((n) => n !== item.Item)].slice(0, 8));
    setQuery('');
    setQuantity(1);
    inputRef.current?.focus();
  }, [onAddItem, quantity]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      addItem(results[highlight].item);
    } else if (e.key === 'Escape') {
      setQuery('');
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${highlight}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight]);

  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="catalog-search">
      <div className="catalog-search-header">
        <div>
          <h4 className="catalog-search-title">Quick catalog search</h4>
          <p className="catalog-search-sub">
            Type a few letters — smart matching ranks your inventory instantly. Faster than scrolling spreadsheets.
          </p>
        </div>
      </div>

      <div className="catalog-search-bar">
        <div className="catalog-search-input-wrap">
          <span className="catalog-search-icon" aria-hidden>⌕</span>
          <input
            ref={inputRef}
            className="form-input catalog-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={priceList.length ? 'Search by name, SKU, or shorthand (e.g. widget pro, inst)' : 'Upload a price list first'}
            disabled={disabled || !priceList.length}
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <label className="catalog-search-qty">
          <span>Qty</span>
          <input
            type="number"
            min={1}
            className="form-input"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            disabled={disabled || !priceList.length}
          />
        </label>
      </div>

      <p className="catalog-search-hint">↑ ↓ navigate · Enter to add · Esc to clear</p>

      <div className="catalog-search-results" ref={listRef}>
        {!priceList.length ? (
          <p className="catalog-search-empty">Load a price list to search your catalog.</p>
        ) : query.trim() && !results.length ? (
          <p className="catalog-search-empty">No matches for &ldquo;{query}&rdquo;. Try fewer words or check spelling.</p>
        ) : (
          results.map(({ item, score }, idx) => {
            const margin = item.Price > 0 ? ((item.Price - item.Cost) / item.Price) * 100 : 0;
            const selected = idx === highlight;
            const alreadyOnQuote = inQuote.has(item.Item);
            return (
              <div
                key={item.Item}
                data-idx={idx}
                className={`catalog-search-row${selected ? ' is-active' : ''}`}
                onMouseEnter={() => setHighlight(idx)}
              >
                <div className="catalog-search-row-main">
                  <span className="catalog-search-name">{item.Item}</span>
                  {alreadyOnQuote && <span className="catalog-search-badge">On quote</span>}
                  {!query.trim() && recentAdds.includes(item.Item) && (
                    <span className="catalog-search-badge is-recent">Recent</span>
                  )}
                  {query.trim() && score >= 0.7 && (
                    <span className="catalog-search-badge is-match">Best match</span>
                  )}
                </div>
                <div className="catalog-search-meta">
                  <span>${fmt(item.Price)}</span>
                  <span className="catalog-search-cost">Cost ${fmt(item.Cost)}</span>
                  <span className="catalog-search-margin">{margin.toFixed(0)}% margin</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm catalog-search-add"
                  onClick={() => addItem(item)}
                  disabled={disabled}
                >
                  + Add
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
