import { FormEvent, useEffect, useState } from 'react';
import type { CatalogItem, PriceListRecord } from '../types';
import { parseCatalogFile } from '../utils/parseCatalog';
import {
  deletePriceList,
  listPriceLists,
  savePriceList,
  updatePriceList,
} from '../services/dataService';
import { formatMoney } from '../utils/commission';

function emptyItem(): CatalogItem {
  return { Item: '', Price: 0, Cost: 0 };
}

function normalizeItems(items: CatalogItem[]): CatalogItem[] {
  return items
    .map((item) => ({
      Item: item.Item.trim(),
      Price: Number.isFinite(item.Price) ? item.Price : 0,
      Cost: Number.isFinite(item.Cost) ? item.Cost : 0,
    }))
    .filter((item) => item.Item.length > 0);
}

export function InventoryPage() {
  const [lists, setLists] = useState<PriceListRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<CatalogItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [itemFilter, setItemFilter] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setLists(await listPriceLists());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const closeEditor = () => {
    setEditingId(null);
    setDraftItems([]);
    setItemFilter('');
    setError(null);
  };

  const startEdit = (list: PriceListRecord) => {
    setError(null);
    setEditingId(list.id);
    setDraftItems(list.items.map((item) => ({ ...item })));
    setItemFilter('');
  };

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('file') as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const items = await parseCatalogFile(file);
      if (!items.length) throw new Error('No valid rows. Need Item, Price, and Cost.');
      const name = uploadName.trim() || file.name.replace(/\.[^.]+$/, '');
      await savePriceList(name, items, file.name);
      setUploadName('');
      input.value = '';
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleRename = async (id: string, name: string) => {
    if (!name.trim()) return;
    try {
      await updatePriceList(id, { name: name.trim() });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rename failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this price list?')) return;
    try {
      if (editingId === id) closeEditor();
      await deletePriceList(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const updateDraftItem = (index: number, patch: Partial<CatalogItem>) => {
    setDraftItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const removeDraftItem = (index: number) => {
    setDraftItems((prev) => prev.filter((_, i) => i !== index));
  };

  const addDraftItem = () => {
    setItemFilter('');
    setDraftItems((prev) => [...prev, emptyItem()]);
  };

  const handleSaveItems = async (listId: string) => {
    const items = normalizeItems(draftItems);
    if (!items.length) {
      setError('Add at least one item with a name.');
      return;
    }

    setError(null);
    setSaving(true);
    try {
      await updatePriceList(listId, { items });
      await load();
      closeEditor();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredDraft = draftItems
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (!itemFilter.trim()) return true;
      const q = itemFilter.trim().toLowerCase();
      return item.Item.toLowerCase().includes(q);
    });

  return (
    <>
      <div className="page-head">
        <h1>Inventory</h1>
        <p className="page-sub">
          Store and manage your price lists — upload new lists or edit items when prices and costs change.
        </p>
      </div>

      <section className="panel">
        <h2>Upload price list</h2>
        <p className="panel-sub">Excel, CSV, or JSON with Item · Price · Cost columns.</p>
        <form onSubmit={(e) => void handleUpload(e)} className="upload-form">
          <input
            type="text"
            placeholder="List name (e.g. 2026 Dealer)"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            className="inline-input wide"
          />
          <input type="file" name="file" accept=".xlsx,.xls,.csv,.json" required />
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {uploading ? 'Uploading…' : 'Save to inventory'}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Saved price lists ({lists.length})</h2>
        {error && <p className="alert alert-error">{error}</p>}
        {loading ? (
          <p className="muted">Loading…</p>
        ) : lists.length === 0 ? (
          <p className="muted">No price lists yet. Upload one above.</p>
        ) : (
          <div className="inventory-list">
            {lists.map((list) => {
              const isEditing = editingId === list.id;
              return (
                <article
                  key={list.id}
                  className={`inventory-card${isEditing ? ' inventory-card-editing' : ''}`}
                >
                  <div className="inventory-card-head">
                    <div>
                      <input
                        className="inventory-name-input"
                        defaultValue={list.name}
                        disabled={isEditing}
                        onBlur={(e) => void handleRename(list.id, e.target.value)}
                      />
                      <p className="cell-sub">
                        {list.item_count} items · {list.file_name ?? 'uploaded'} ·{' '}
                        {new Date(list.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="row-actions">
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={saving}
                            onClick={() => void handleSaveItems(list.id)}
                          >
                            {saving ? 'Saving…' : 'Save changes'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={saving}
                            onClick={closeEditor}
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => startEdit(list)}
                          >
                            Edit items
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => void handleDelete(list.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="inventory-editor">
                      <div className="inventory-editor-toolbar">
                        <input
                          type="search"
                          className="inline-input"
                          placeholder="Filter items…"
                          value={itemFilter}
                          onChange={(e) => setItemFilter(e.target.value)}
                        />
                        <span className="cell-sub">
                          {draftItems.length} item{draftItems.length === 1 ? '' : 's'}
                          {itemFilter.trim() ? ` · ${filteredDraft.length} shown` : ''}
                        </span>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={addDraftItem}>
                          + Add item
                        </button>
                      </div>

                      <div className="table-wrap inventory-edit-table-wrap">
                        <table className="results-table inventory-edit-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th>Price</th>
                              <th>Cost</th>
                              <th>Margin</th>
                              <th></th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredDraft.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="muted">
                                  {draftItems.length === 0
                                    ? 'No items yet. Add one below.'
                                    : 'No items match your filter.'}
                                </td>
                              </tr>
                            ) : (
                              filteredDraft.map(({ item, index }) => (
                                <tr key={index}>
                                  <td>
                                    <input
                                      className="inventory-cell-input"
                                      value={item.Item}
                                      onChange={(e) =>
                                        updateDraftItem(index, { Item: e.target.value })
                                      }
                                      placeholder="Item name"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="inventory-cell-input inventory-cell-num"
                                      min={0}
                                      step={0.01}
                                      value={item.Price}
                                      onChange={(e) =>
                                        updateDraftItem(index, {
                                          Price: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="inventory-cell-input inventory-cell-num"
                                      min={0}
                                      step={0.01}
                                      value={item.Cost}
                                      onChange={(e) =>
                                        updateDraftItem(index, {
                                          Cost: parseFloat(e.target.value) || 0,
                                        })
                                      }
                                    />
                                  </td>
                                  <td className="inventory-margin-cell">
                                    {formatMoney(item.Price - item.Cost)}
                                  </td>
                                  <td className="row-actions">
                                    <button
                                      type="button"
                                      className="btn btn-ghost btn-sm"
                                      onClick={() => removeDraftItem(index)}
                                      title="Remove item"
                                    >
                                      Remove
                                    </button>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="inventory-editor-footer">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={addDraftItem}>
                          + Add item
                        </button>
                        <div className="inventory-editor-footer-actions">
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={saving}
                            onClick={() => void handleSaveItems(list.id)}
                          >
                            {saving ? 'Saving…' : 'Save changes'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            disabled={saving}
                            onClick={closeEditor}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
