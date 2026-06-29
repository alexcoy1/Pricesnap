import React, { useRef } from 'react';
import * as XLSX from 'xlsx';
import { ManagedPriceListInfo, AppView, PriceListItem } from '../../types';

interface Props {
  managedPriceLists: ManagedPriceListInfo[];
  preferredPriceListId: string | null;
  onAddPriceList: (priceList: ManagedPriceListInfo) => void;
  onDeletePriceList: (priceListId: string) => void;
  onSetPreferredPriceList: (priceListId: string) => void;
  onLoadBundled2026: () => void;
  onNavigateTo: (view: AppView) => void;
}

export const PriceListsView: React.FC<Props> = ({
  managedPriceLists,
  preferredPriceListId,
  onAddPriceList,
  onDeletePriceList,
  onSetPreferredPriceList,
  onLoadBundled2026,
  onNavigateTo,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) return;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
        const parsed: PriceListItem[] = jsonData.map((row) => ({
          Item: String(row.Item).trim(),
          Price: parseFloat(String(row.Price)) || 0,
          Cost: parseFloat(String(row.Cost)) || 0,
        }));
        onAddPriceList({
          id: Date.now().toString(),
          name: file.name,
          uploadDate: new Date().toISOString(),
          itemCount: parsed.length,
          data: parsed,
        });
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to parse file');
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div>
      <button type="button" className="btn btn-primary mb-6" onClick={onLoadBundled2026}>
        Load Sample Catalog
      </button>
      <div className="upload-zone mb-6" onClick={() => fileRef.current?.click()}>
        <p style={{ fontSize: 32, marginBottom: 8 }}>📁</p>
        <p style={{ fontWeight: 600 }}>Upload Price List</p>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Excel file with Item, Price, Cost columns
        </p>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Your Price Lists</h3>
        {managedPriceLists.length === 0 ? (
          <p style={{ color: 'var(--color-text-secondary)' }}>No price lists uploaded yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Items</th><th>Uploaded</th><th>Preferred</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {managedPriceLists.map((pl) => (
                <tr key={pl.id}>
                  <td>{pl.name}</td>
                  <td>{pl.itemCount}</td>
                  <td>{new Date(pl.uploadDate).toLocaleDateString()}</td>
                  <td>{preferredPriceListId === pl.id ? '⭐ Yes' : '—'}</td>
                  <td className="flex gap-2">
                    <button className="btn btn-secondary btn-sm" onClick={() => onSetPreferredPriceList(pl.id)}>Set Preferred</button>
                    <button className="btn btn-danger btn-sm" onClick={() => onDeletePriceList(pl.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => onNavigateTo(AppView.INPUT_FORM)}>
        Create Quote with Price List
      </button>
    </div>
  );
};
