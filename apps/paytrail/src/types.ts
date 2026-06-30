export interface CatalogItem {
  Item: string;
  Price: number;
  Cost: number;
}

export interface OrderLineInput {
  id: string;
  rawText: string;
  quantity: number;
  description: string;
  /** Sell price from the external doc, if detected */
  statedPrice?: number;
}

export type CommissionBasis = 'margin' | 'sell';

export interface CommissionSettings {
  /** Percentage applied to margin or sell price */
  ratePercent: number;
  basis: CommissionBasis;
}

export type MatchConfidence = 'high' | 'medium' | 'low' | 'none';

export interface MatchedLine {
  input: OrderLineInput;
  catalogItem: CatalogItem | null;
  confidence: MatchConfidence;
  score: number;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  lineRevenue: number;
  lineCost: number;
  lineMargin: number;
  lineCommission: number;
}

export interface CommissionSummary {
  lines: MatchedLine[];
  matchedCount: number;
  unmatchedCount: number;
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  totalCommission: number;
}

export type MatchMode = 'local' | 'ai';

export interface InvoiceUploadPayload {
  fileName: string;
  mediaType: string;
  base64?: string;
  /** Plain text extracted client-side from spreadsheets */
  extractedText?: string;
}

export const INVOICE_ACCEPT =
  '.pdf,.png,.jpg,.jpeg,.webp,.gif,.heic,.xlsx,.xls,.csv,image/*,application/pdf';

export interface AppSettings {
  businessName: string;
  defaultRatePercent: number;
  defaultBasis: CommissionBasis;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  businessName: string;
}

export type ContactKind = 'customer' | 'rep';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  company: string | null;
  notes: string | null;
  kind: ContactKind;
  created_at: string;
}

export interface PriceListRecord {
  id: string;
  name: string;
  file_name: string | null;
  items: CatalogItem[];
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommissionRun {
  id: string;
  customer_id: string | null;
  rep_id: string | null;
  price_list_id: string | null;
  invoice_file_name: string | null;
  total_commission: number;
  total_revenue: number;
  total_margin: number;
  matched_count: number;
  line_count: number;
  summary: CommissionSummary | null;
  created_at: string;
  customers?: { name: string } | null;
  reps?: { name: string } | null;
  price_lists?: { name: string } | null;
}
