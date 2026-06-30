import { useState } from 'react';
import type { InvoiceUploadPayload } from '../types';
import { INVOICE_ACCEPT } from '../types';
import { invoicePreviewKind } from '../utils/invoiceFile';

interface Props {
  invoice: InvoiceUploadPayload | null;
  previewUrl: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  error: string | null;
}

export function InvoiceUploadPanel({ invoice, previewUrl, onUpload, onClear, error }: Props) {
  const [viewOpen, setViewOpen] = useState(false);
  const kind = invoice ? invoicePreviewKind(invoice.mediaType) : null;
  const pdfHasText = kind === 'pdf' && !!invoice?.extractedText?.trim();
  const canView = invoice && (previewUrl || kind === 'sheet' || pdfHasText);

  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <h2>Invoice or quote</h2>
          <p className="panel-sub">
            Upload a PDF, photo, scan, or spreadsheet — smart matching reads text PDFs and Excel in your browser.
          </p>
        </div>
        {invoice && (
          <div className="row-actions">
            {canView && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setViewOpen(true)}>
                View
              </button>
            )}
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
              Remove
            </button>
          </div>
        )}
      </div>

      {!invoice ? (
        <label className="upload-zone upload-zone-tall">
          <input
            type="file"
            accept={INVOICE_ACCEPT}
            capture="environment"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = '';
            }}
          />
          <span className="upload-icon" aria-hidden>📄</span>
          <span className="upload-title">Drop invoice or tap to upload</span>
          <span className="upload-hint">Excel, CSV, or text PDF · scanned PDFs need AI on Netlify</span>
        </label>
      ) : (
        <div className="invoice-preview">
          {previewUrl && kind === 'image' && (
            <button type="button" className="invoice-thumb-btn" onClick={() => setViewOpen(true)}>
              <img src={previewUrl} alt="Invoice preview" className="invoice-thumb" />
            </button>
          )}
          {kind === 'pdf' && (
            <button type="button" className="invoice-file-badge invoice-file-badge-btn" onClick={() => setViewOpen(true)}>
              {pdfHasText ? 'PDF — text extracted for matching' : 'PDF document — click to view'}
            </button>
          )}
          {kind === 'sheet' && (
            <button type="button" className="invoice-file-badge invoice-file-badge-btn" onClick={() => setViewOpen(true)}>
              Spreadsheet — click to preview text
            </button>
          )}
          <div className="invoice-file-name">{invoice.fileName}</div>
          {canView && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setViewOpen(true)}>
              Open full preview
            </button>
          )}
        </div>
      )}

      {error && <p className="alert alert-error">{error}</p>}

      {viewOpen && invoice && (
        <div
          className="invoice-modal-backdrop"
          role="presentation"
          onClick={() => setViewOpen(false)}
        >
          <div
            className="invoice-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`Preview ${invoice.fileName}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="invoice-modal-head">
              <h3>{invoice.fileName}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setViewOpen(false)}>
                Close
              </button>
            </div>
            <div className="invoice-modal-body">
              {kind === 'image' && previewUrl && (
                <img src={previewUrl} alt={invoice.fileName} className="invoice-modal-image" />
              )}
              {kind === 'pdf' && previewUrl && (
                <>
                  <iframe
                    src={previewUrl}
                    title={invoice.fileName}
                    className="invoice-modal-pdf"
                  />
                  {pdfHasText && (
                    <>
                      <h4 className="invoice-modal-subhead">Extracted text (used for smart match)</h4>
                      <pre className="invoice-modal-text">{invoice.extractedText}</pre>
                    </>
                  )}
                </>
              )}
              {kind === 'sheet' && (
                <pre className="invoice-modal-text">{invoice.extractedText ?? 'No text extracted.'}</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
