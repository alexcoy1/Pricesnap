export enum AppView {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  SIGN_UP = 'SIGN_UP',
  HELP = 'HELP',
  DASHBOARD = 'DASHBOARD',
  INPUT_FORM = 'INPUT_FORM',
  QUOTE_HISTORY = 'QUOTE_HISTORY',
  PRICE_LISTS = 'PRICE_LISTS',
  CUSTOMERS = 'CUSTOMERS',
  COMPANY_BRANDING = 'COMPANY_BRANDING',
  SETTINGS = 'SETTINGS',
  PROFILE = 'PROFILE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  ANALYTICS = 'ANALYTICS',
  INVENTORY = 'INVENTORY',
  PROMOTIONS = 'PROMOTIONS',
  FINANCING = 'FINANCING',
  FILES = 'FILES',
  TEAM = 'TEAM',
  CUSTOMER_QUOTE = 'CUSTOMER_QUOTE',
  INTERNAL_QUOTE = 'INTERNAL_QUOTE',
}

export interface PriceListItem {
  Item: string;
  Price: number;
  Cost: number;
}

export interface QuoteLineItem extends PriceListItem {
  Quantity: number;
  TotalPrice: number;
  TotalCost: number;
  Profit: number;
  ProfitMargin: number;
  originalPrice?: number;
  discountPercentage?: number;
  discountReason?: string;
  discountAmount?: number;
  promotion?: string;
}

export interface QuoteData {
  id: string;
  createdAt: string;
  customerName?: string;
  customerId?: string;
  status: string;
  lines: QuoteLineItem[];
  overallTotalPrice: number;
  overallTotalCost: number;
  overallProfit: number;
  overallProfitMargin: number;
  version: number;
  notes?: string;
  terms?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress?: string;
  taxRate?: number;
  depositAmount?: number;
}

export interface ManagedPriceListInfo {
  id: string;
  name: string;
  uploadDate: string;
  itemCount: number;
  data: PriceListItem[];
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  createdAt?: string;
}

export interface CompanyInfo {
  companyName: string;
  companyAddress: string;
  companyContact: string;
  website: string;
  taxNumber: string;
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  company?: string;
  phone?: string;
}

export interface IdentifiedItem {
  Item: string;
  Quantity: number;
}

export interface QuoteTemplate {
  id: string;
  name: string;
  userInput: string;
  createdAt: string;
}

export interface Promotion {
  id: string;
  name: string;
  discountPct: number;
  validUntil: string;
  description: string;
  active: boolean;
  createdAt: string;
}

export interface FinancingOption {
  id: string;
  name: string;
  termMonths: number;
  apr: number;
  minAmount: number;
  active: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'Active' | 'Invited' | 'Inactive';
  createdAt: string;
}

export interface StoredFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  dataUrl: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  features: string[];
}
