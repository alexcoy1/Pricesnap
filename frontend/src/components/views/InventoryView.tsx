import React, { useMemo, useState } from 'react';
import { PriceListItem } from '../../types';

interface Props {
  priceListData: PriceListItem[] | null;
}

export const InventoryView: React.FC<Props> = ({ priceListData }) => {
  const items = priceListData || [];
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'margin'>('name');

  const filtered = useMemo(() => {
    let list = items.filter((i) =>
      !search || i.Item.toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      if (sortBy === 'price') return b.Price - a.Price;
      if (sortBy === 'margin') {
        const ma = a.Price > 0 ? (a.Price - a.Cost) / a.Price : 0;
        const mb = b.Price > 0 ? (b.Price - b.Cost) / b.Price : 0;
        return mb - ma;
      }
      return a.Item.localeCompare(b.Item);
    });
    return list;
  }, [items, search, sortBy]);

  const avgMargin = items.length
    ? items.reduce((s, i) => s + (i.Price > 0 ? ((i.Price - i.Cost) / i.Price) * 100 : 0), 0) / items.length
    : 0;

  return (
    <div>
      <h2 className="view-heading">Inventory</h2>
      <p className="view-subheading">Product catalog from your active price list</p>

      {!items.length ? (
        <div className="card" style={{ marginTop: 24 }}>
          <p style={{ color: 'var(--color-text-secondary)' }}>Load a price list from New Quote to view inventory.</p>
        </div>
      ) : (
        <>
          <div className="grid-3" style={{ marginTop: 24 }}>
            <div className="stat-card"><div className="stat-value">{items.length}</div><div className="stat-label">SKUs</div></div>
            <div className="stat-card"><div className="stat-value">${Math.round(items.reduce((s, i) => s + i.Price, 0) / items.length).toLocaleString()}</div><div className="stat-label">Avg List Price</div></div>
            <div className="stat-card"><div className="stat-value">{avgMargin.toFixed(1)}%</div><div className="stat-label">Avg Margin</div></div>
          </div>

          <div className="card" style={{ marginTop: 24 }}>
            <div className="flex gap-3 mb-4" style={{ flexWrap: 'wrap' }}>
              <input
                className="form-input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select className="form-select" style={{ width: 'auto' }} value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
                <option value="name">Sort: Name</option>
                <option value="price">Sort: Price</option>
                <option value="margin">Sort: Margin</option>
              </select>
            </div>
            <p style={{ marginBottom: 12, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Showing {filtered.length} of {items.length} items
            </p>
            <div className="quote-table-wrapper" style={{ maxHeight: 480, overflowY: 'auto' }}>
              <table className="table">
                <thead><tr><th>Item</th><th>Price</th><th>Cost</th><th>Margin</th></tr></thead>
                <tbody>
                  {filtered.map((item) => {
                    const margin = item.Price > 0 ? ((item.Price - item.Cost) / item.Price * 100) : 0;
                    return (
                      <tr key={item.Item}>
                        <td>{item.Item}</td>
                        <td>${item.Price.toFixed(2)}</td>
                        <td>${item.Cost.toFixed(2)}</td>
                        <td>{margin.toFixed(1)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
