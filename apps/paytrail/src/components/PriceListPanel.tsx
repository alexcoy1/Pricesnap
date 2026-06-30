import type { CatalogItem } from '../types';
import { catalogSummary } from '../utils/parseCatalog';

interface Props {
  catalog: CatalogItem[];
  fileName: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  error: string | null;
}

export function PriceListPanel({ catalog, fileName, onUpload, onClear, error }: Props) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Your price list</h2>
          <p className="panel-sub">Upload Item, Price, and Cost — Excel, CSV, or JSON.</p>
        </div>
        {catalog.length > 0 && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            Clear
          </button>
        )}
      </div>

      <label className="upload-zone">
        <input
          type="file"
          accept=".xlsx,.xls,.csv,.json"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            e.target.value = '';
          }}
        />
        <span className="upload-icon" aria-hidden>↑</span>
        <span className="upload-title">
          {fileName ? fileName : 'Drop file or click to upload'}
        </span>
        <span className="upload-hint">Columns: Item · Price · Cost</span>
      </label>

      {error && <p className="alert alert-error">{error}</p>}

      {catalog.length > 0 && (
        <div className="status-chip status-ok">
          <strong>{catalog.length}</strong> catalog items loaded
          <span className="muted"> — {catalogSummary(catalog)}</span>
        </div>
      )}
    </section>
  );
}
