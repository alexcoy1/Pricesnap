import React, { useRef, useState } from 'react';
import { StoredFile } from '../../types';

interface Props {
  files: StoredFile[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => void;
  onDownloadSampleCatalog: () => void;
}

const MAX_MB = 3;

export const FilesView: React.FC<Props> = ({ files, onUpload, onDelete, onDownloadSampleCatalog }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(list)) {
        if (file.size > MAX_MB * 1024 * 1024) {
          throw new Error(`"${file.name}" exceeds ${MAX_MB}MB limit`);
        }
        await onUpload(file);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const download = (f: StoredFile) => {
    const a = document.createElement('a');
    a.href = f.dataUrl;
    a.download = f.name;
    a.click();
  };

  return (
    <div>
      <h2 className="view-heading">Files</h2>
      <p className="view-subheading">Shared documents, price lists, and marketing assets</p>

      {error && <div className="alert alert-error mb-4" style={{ marginTop: 16 }}>{error}</div>}

      <div
        className="upload-zone"
        style={{ marginTop: 24, marginBottom: 24, padding: 32, opacity: uploading ? 0.6 : 1 }}
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={(e) => { e.preventDefault(); void handleFiles(e.dataTransfer.files); }}
      >
        <p style={{ fontWeight: 600 }}>{uploading ? 'Uploading...' : 'Drop files here or click to upload'}</p>
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>PDF, Excel, images — max {MAX_MB}MB each</p>
        <input ref={fileRef} type="file" multiple accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.webp" hidden onChange={(e) => void handleFiles(e.target.files)} />
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Type</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>sample-price-list.json</td>
              <td>Price List</td>
              <td>Demo</td>
              <td>Built-in</td>
              <td>
                <button type="button" className="btn btn-secondary btn-sm" onClick={onDownloadSampleCatalog}>Download</button>
              </td>
            </tr>
            {files.map((f) => (
              <tr key={f.id}>
                <td>{f.name}</td>
                <td>{f.type || 'File'}</td>
                <td>{(f.size / 1024).toFixed(0)} KB</td>
                <td>{new Date(f.uploadedAt).toLocaleDateString()}</td>
                <td className="flex gap-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => download(f)}>Download</button>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => onDelete(f.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {files.length === 0 && (
          <p style={{ padding: '12px 0 0', fontSize: 13, color: 'var(--color-text-secondary)' }}>No uploaded files yet.</p>
        )}
      </div>
    </div>
  );
};
