import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { InvoiceUploadPanel } from '../components/InvoiceUploadPanel';
import { SettingsBar } from '../components/SettingsBar';
import { CommissionResults } from '../components/CommissionResults';
import type {
  CatalogItem,
  CommissionSettings,
  CommissionSummary,
  ContactKind,
  Customer,
  InvoiceUploadPayload,
  OrderLineInput,
  PriceListRecord,
} from '../types';
import { parseCatalogFile } from '../utils/parseCatalog';
import { fileToInvoicePayload, isInvoiceImageType } from '../utils/invoiceFile';
import { calculateCommission } from '../utils/commission';
import { extractInvoice } from '../services/invoiceApi';
import {
  listCustomers,
  listPriceLists,
  saveCommissionRun,
  savePriceList,
  createCustomer,
  getAppSettings,
  saveAppSettings,
} from '../services/dataService';

const NEW_PRICE_LIST = '__new__';
const ADD_CUSTOMER = '__add_customer__';
const ADD_REP = '__add_rep__';

const EMPTY_QUICK = { name: '', email: '', phone: '', address: '', company: '' };

function aiLinesToOrderInput(
  lines: { Item: string; Quantity: number; statedPrice?: number; rawLine?: string }[]
): OrderLineInput[] {
  return lines.map((line, index) => ({
    id: `ai-${index}`,
    rawText: line.rawLine || line.Item,
    description: line.Item,
    quantity: line.Quantity,
    statedPrice: line.statedPrice,
  }));
}

export function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [priceLists, setPriceLists] = useState<PriceListRecord[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedRepId, setSelectedRepId] = useState('');
  const [selectedPriceListId, setSelectedPriceListId] = useState('');

  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [catalogFileName, setCatalogFileName] = useState<string | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [activePriceListId, setActivePriceListId] = useState<string | null>(null);
  const [newListName, setNewListName] = useState('');
  const [uploadingList, setUploadingList] = useState(false);
  const listFileRef = useRef<HTMLInputElement>(null);

  const [quickForm, setQuickForm] = useState(EMPTY_QUICK);
  const [showQuickCompany, setShowQuickCompany] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const [invoice, setInvoice] = useState<InvoiceUploadPayload | null>(null);
  const [invoicePreview, setInvoicePreview] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  const [settings, setSettings] = useState<CommissionSettings>({
    ratePercent: 25,
    basis: 'margin',
  });

  const [calculating, setCalculating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<CommissionSummary | null>(null);

  const buyers = customers.filter((c) => c.kind === 'customer');
  const reps = customers.filter((c) => c.kind === 'rep');
  const isNewPriceList = selectedPriceListId === NEW_PRICE_LIST;
  const isAddingCustomer = selectedCustomerId === ADD_CUSTOMER;
  const isAddingRep = selectedRepId === ADD_REP;

  const resetQuickForm = useCallback(() => {
    setQuickForm(EMPTY_QUICK);
    setShowQuickCompany(false);
    setQuickError(null);
  }, []);

  const refreshContacts = useCallback(async () => {
    setCustomers(await listCustomers());
  }, []);

  useEffect(() => {
    const app = getAppSettings();
    setSettings({ ratePercent: app.defaultRatePercent, basis: app.defaultBasis });
  }, []);

  useEffect(() => {
    saveAppSettings({
      defaultRatePercent: settings.ratePercent,
      defaultBasis: settings.basis,
    });
  }, [settings.ratePercent, settings.basis]);

  const loadPriceList = useCallback((record: PriceListRecord) => {
    setCatalog(record.items);
    setCatalogFileName(record.file_name ?? record.name);
    setActivePriceListId(record.id);
    setSummary(null);
    setCatalogError(null);
  }, []);

  useEffect(() => {
    void Promise.all([listCustomers(), listPriceLists()]).then(([c, p]) => {
      setCustomers(c);
      setPriceLists(p);
      if (p.length > 0) {
        setSelectedPriceListId(p[0].id);
        loadPriceList(p[0]);
      } else {
        setSelectedPriceListId(NEW_PRICE_LIST);
      }
    }).catch(() => {});
  }, [loadPriceList]);

  useEffect(() => {
    if (selectedPriceListId && selectedPriceListId !== NEW_PRICE_LIST) {
      const pl = priceLists.find((p) => p.id === selectedPriceListId);
      if (pl) loadPriceList(pl);
    }
  }, [selectedPriceListId, priceLists, loadPriceList]);

  const handlePriceListSelect = (value: string) => {
    setSelectedPriceListId(value);
    setCatalogError(null);
    if (value === NEW_PRICE_LIST) {
      setCatalog([]);
      setCatalogFileName(null);
      setActivePriceListId(null);
      setNewListName('');
      setSummary(null);
    }
  };

  const handleNewListFile = async (file: File) => {
    setCatalogError(null);
    setUploadingList(true);
    try {
      const items = await parseCatalogFile(file);
      if (!items.length) {
        setCatalogError('No valid rows found. Need Item, Price, and Cost columns.');
        return;
      }
      const name = newListName.trim() || file.name.replace(/\.[^.]+$/, '');
      const saved = await savePriceList(name, items, file.name);
      setPriceLists((prev) => [saved, ...prev]);
      setSelectedPriceListId(saved.id);
      loadPriceList(saved);
      setNewListName('');
    } catch {
      setCatalogError('Could not read that file. Try Excel, CSV, or JSON.');
    } finally {
      setUploadingList(false);
    }
  };

  const handleQuickAdd = async (e: FormEvent, kind: ContactKind) => {
    e.preventDefault();
    setQuickError(null);
    if (!quickForm.name.trim()) {
      setQuickError('Name is required');
      return;
    }
    try {
      const created = await createCustomer({
        name: quickForm.name.trim(),
        email: quickForm.email.trim() || null,
        phone: quickForm.phone.trim() || null,
        address: kind === 'customer' ? quickForm.address.trim() || null : null,
        company: showQuickCompany ? quickForm.company.trim() || null : null,
        notes: null,
        kind,
      });
      await refreshContacts();
      if (kind === 'customer') setSelectedCustomerId(created.id);
      else setSelectedRepId(created.id);
      resetQuickForm();
    } catch (err) {
      setQuickError(err instanceof Error ? err.message : 'Could not save');
    }
  };

  const handleInvoiceUpload = useCallback(async (file: File) => {
    setInvoiceError(null);
    setSummary(null);
    try {
      setInvoicePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });

      const payload = await fileToInvoicePayload(file);
      setInvoice(payload);

      if (file.type.startsWith('image/') || isInvoiceImageType(file.type)) {
        setInvoicePreview(URL.createObjectURL(file));
      } else if (payload.mediaType === 'application/pdf' && payload.base64) {
        const binary = atob(payload.base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        setInvoicePreview(URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })));
      } else {
        setInvoicePreview(null);
      }
    } catch (err) {
      setInvoice(null);
      setInvoicePreview(null);
      setInvoiceError(err instanceof Error ? err.message : 'Could not read invoice file.');
    }
  }, []);

  const clearInvoice = useCallback(() => {
    setInvoicePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setInvoice(null);
    setInvoiceError(null);
    setSummary(null);
  }, []);

  const hasPriceList = catalog.length > 0;
  const canCalculate = hasPriceList && !!invoice && !calculating;

  const handleCalculate = useCallback(async () => {
    setInvoiceError(null);
    setCatalogError(null);
    setStatusMessage(null);

    if (!catalog.length) {
      setCatalogError('Select or upload a price list first.');
      return;
    }
    if (!invoice) {
      setInvoiceError('Upload an invoice, quote PDF, or photo.');
      return;
    }

    setCalculating(true);
    setStatusMessage('Matching to your price list…');
    try {
      const extracted = await extractInvoice(invoice, catalog);
      if (!extracted.lines?.length) {
        setInvoiceError(extracted.message || 'No line items found on this invoice.');
        return;
      }

      const lines = aiLinesToOrderInput(extracted.lines);
      const result = calculateCommission(lines, catalog, settings);
      setSummary(result);

      await saveCommissionRun({
        customerId:
          selectedCustomerId && selectedCustomerId !== ADD_CUSTOMER ? selectedCustomerId : null,
        repId: selectedRepId && selectedRepId !== ADD_REP ? selectedRepId : null,
        priceListId: activePriceListId,
        invoiceFileName: invoice.fileName,
        summary: result,
      });

      const mode =
        extracted.matcher === 'smart'
          ? 'Smart match'
          : extracted.matcher === 'claude-vision'
            ? 'AI read'
            : 'Matched';
      setStatusMessage(
        extracted.message ?? `${mode} — commission saved to your history.`
      );
    } catch (err) {
      setInvoiceError(err instanceof Error ? err.message : 'Could not process invoice.');
    } finally {
      setCalculating(false);
    }
  }, [catalog, invoice, settings, activePriceListId, selectedCustomerId, selectedRepId]);

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <p className="page-sub">
          Upload an invoice — get a commission payout in seconds. Reps check their earnings;
          owners run payouts for the team.
        </p>
      </div>

      <section className="panel dash-setup">
        <div className="dash-setup-grid">
          <div className="dash-field">
            <span className="dash-field-label">Customer</span>
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                resetQuickForm();
                setSelectedCustomerId(e.target.value);
              }}
              className="dash-select dash-select-full"
            >
              <option value="">— Optional —</option>
              {buyers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` (${c.company})` : ''}
                </option>
              ))}
              <option value={ADD_CUSTOMER}>+ Add customer</option>
            </select>
            {isAddingCustomer && (
              <form className="dash-quick-form dash-quick-form-stack" onSubmit={(e) => void handleQuickAdd(e, 'customer')}>
                <label className="dash-quick-label">
                  Name *
                  <input
                    className="inline-input wide"
                    value={quickForm.name}
                    onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                    required
                  />
                </label>
                <label className="dash-quick-label">
                  Email
                  <input
                    type="email"
                    className="inline-input wide"
                    value={quickForm.email}
                    onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })}
                  />
                </label>
                <label className="dash-quick-label">
                  Phone
                  <input
                    type="tel"
                    className="inline-input wide"
                    value={quickForm.phone}
                    onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                  />
                </label>
                <label className="dash-quick-label">
                  Address
                  <input
                    className="inline-input wide"
                    value={quickForm.address}
                    onChange={(e) => setQuickForm({ ...quickForm, address: e.target.value })}
                  />
                </label>
                {!showQuickCompany ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm dash-quick-opt"
                    onClick={() => setShowQuickCompany(true)}
                  >
                    + Add company
                  </button>
                ) : (
                  <label className="dash-quick-label">
                    Company
                    <input
                      className="inline-input wide"
                      value={quickForm.company}
                      onChange={(e) => setQuickForm({ ...quickForm, company: e.target.value })}
                    />
                  </label>
                )}
                <div className="dash-quick-actions">
                  <button type="submit" className="btn btn-primary btn-sm">Save customer</button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setSelectedCustomerId('');
                      resetQuickForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="dash-field">
            <span className="dash-field-label">Sales rep</span>
            <select
              value={selectedRepId}
              onChange={(e) => {
                resetQuickForm();
                setSelectedRepId(e.target.value);
              }}
              className="dash-select dash-select-full"
            >
              <option value="">— Optional —</option>
              {reps.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company ? ` (${c.company})` : ''}
                </option>
              ))}
              <option value={ADD_REP}>+ Add sales rep</option>
            </select>
            {isAddingRep && (
              <form className="dash-quick-form dash-quick-form-stack" onSubmit={(e) => void handleQuickAdd(e, 'rep')}>
                <label className="dash-quick-label">
                  Name *
                  <input
                    className="inline-input wide"
                    value={quickForm.name}
                    onChange={(e) => setQuickForm({ ...quickForm, name: e.target.value })}
                    required
                  />
                </label>
                <label className="dash-quick-label">
                  Email
                  <input
                    type="email"
                    className="inline-input wide"
                    value={quickForm.email}
                    onChange={(e) => setQuickForm({ ...quickForm, email: e.target.value })}
                  />
                </label>
                <label className="dash-quick-label">
                  Phone
                  <input
                    type="tel"
                    className="inline-input wide"
                    value={quickForm.phone}
                    onChange={(e) => setQuickForm({ ...quickForm, phone: e.target.value })}
                  />
                </label>
                {!showQuickCompany ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm dash-quick-opt"
                    onClick={() => setShowQuickCompany(true)}
                  >
                    + Add company
                  </button>
                ) : (
                  <label className="dash-quick-label">
                    Company
                    <input
                      className="inline-input wide"
                      value={quickForm.company}
                      onChange={(e) => setQuickForm({ ...quickForm, company: e.target.value })}
                    />
                  </label>
                )}
                <div className="dash-quick-actions">
                  <button type="submit" className="btn btn-primary btn-sm">Save rep</button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setSelectedRepId('');
                      resetQuickForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="dash-field dash-field-wide">
            <span className="dash-field-label">Price list</span>
            <select
              value={selectedPriceListId}
              onChange={(e) => handlePriceListSelect(e.target.value)}
              className="dash-select dash-select-full"
            >
              {priceLists.length === 0 && (
                <option value="">— Select or upload —</option>
              )}
              {priceLists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.item_count} items)
                </option>
              ))}
              <option value={NEW_PRICE_LIST}>+ Upload new price list</option>
            </select>

            {isNewPriceList && (
              <div className="dash-upload-list">
                <input
                  type="text"
                  className="inline-input wide"
                  placeholder="List name (e.g. 2026 Dealer)"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                />
                <input
                  ref={listFileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.json"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleNewListFile(f);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={uploadingList}
                  onClick={() => listFileRef.current?.click()}
                >
                  {uploadingList ? 'Uploading…' : 'Choose file'}
                </button>
                <span className="cell-sub">Excel, CSV, or JSON</span>
              </div>
            )}

            {!isNewPriceList && catalog.length > 0 && (
              <p className="dash-loaded-list">
                Loaded: <strong>{catalogFileName}</strong> · {catalog.length} items
              </p>
            )}
          </div>
        </div>
        {quickError && <p className="alert alert-error">{quickError}</p>}
        {catalogError && <p className="alert alert-error">{catalogError}</p>}
      </section>

      <SettingsBar settings={settings} onChange={setSettings} />

      <div className="workspace">
        <div className="workspace-col">
          <InvoiceUploadPanel
            invoice={invoice}
            previewUrl={invoicePreview}
            onUpload={handleInvoiceUpload}
            onClear={clearInvoice}
            error={invoiceError}
          />

          {statusMessage && !invoiceError && (
            <p className="status-chip status-ok">{statusMessage}</p>
          )}

          <button
            type="button"
            className="btn btn-primary btn-calc"
            onClick={() => void handleCalculate()}
            disabled={!canCalculate}
          >
            {calculating ? 'Matching…' : 'Calculate commission'}
          </button>

          {!canCalculate && !calculating && (
            <ul className="calc-checklist">
              <li className={hasPriceList ? 'calc-check-ok' : 'calc-check-missing'}>
                {hasPriceList
                  ? `Price list loaded (${catalog.length} items)`
                  : 'Select or upload a price list above'}
              </li>
              <li className={invoice ? 'calc-check-ok' : 'calc-check-missing'}>
                {invoice ? `Invoice ready: ${invoice.fileName}` : 'Upload an invoice or quote'}
              </li>
            </ul>
          )}
        </div>

        <div className="workspace-col workspace-col-wide">
          <CommissionResults summary={summary} />
        </div>
      </div>
    </>
  );
}
