import React, { useState, useCallback, useEffect, useContext } from 'react';
import { PriceListItem, QuoteData, QuoteLineItem, AppView, ManagedPriceListInfo, Customer, CompanyInfo, QuoteTemplate, Promotion, FinancingOption, TeamMember, StoredFile } from './types';
import { QuoteDisplay } from './components/QuoteDisplay';
import { Alert } from './components/common/Alert';
import { TopNav } from './components/navigation/TopNav';
import { NewQuoteView } from './components/views/NewQuoteView';
import { CustomersView } from './components/views/CustomersView';
import { ProfileView } from './components/views/ProfileView';
import { SignUpView } from './components/views/SignUpView';
import { HelpView } from './components/views/HelpView';
import { LoginView } from './components/auth/LoginView';
import { AuthProvider, AuthContext } from './components/auth/AuthContext';
import { CompanyBrandingView } from './components/views/CompanyBrandingView';
import { TeamView } from './components/views/TeamView';
import { PromotionsView } from './components/views/PromotionsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { InventoryView } from './components/views/InventoryView';
import { FinancingView } from './components/views/FinancingView';
import { FilesView } from './components/views/FilesView';
import { SubscriptionView } from './components/views/SubscriptionView';
import { LandingPage } from './components/views/LandingPage';
import { HomeView } from './components/views/HomeView';
import { SettingsView } from './components/views/SettingsView';
import { QuoteHistoryView } from './components/views/QuoteHistoryView';
import { PriceListsView } from './components/views/PriceListsView';
import { recalcQuoteTotals } from './utils/discountHelpers';
import { lineFromCatalogItem } from './utils/catalogSearch';
import { activePromotionNames, parsePromotionsFromStorage } from './utils/workspaceDefaults';
import { apiService } from './services/apiService';
import { applyTheme, getThemePreference } from './utils/themeUtils';
import * as XLSX from 'xlsx';
import './index.css';

const EMBEDDED_SAMPLE_CATALOG: PriceListItem[] = [
  { Item: "Cub Prestige 7'", Price: 15675, Cost: 11051.1 },
  { Item: "Cub Signature 7'", Price: 19525, Cost: 12569.1 },
  { Item: "Cub Legend Select 8'", Price: 24475, Cost: 15550.1 },
  { Item: 'Custom - Onzen', Price: 1800, Cost: 952.2 },
  { Item: 'Custom - Spa Boy', Price: 2825, Cost: 1487.9 },
  { Item: 'Covana Legend - Installation', Price: 2000, Cost: 1000 },
];

export type Theme = 'light' | 'dark';

const AppContent: React.FC = () => {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("AuthContext not found");
  const { currentUser, isAuthenticated, logout, updateProfileInAuthContext, login } = auth;

  const [priceListData, setPriceListData] = useState<PriceListItem[] | null>(null);
  const [userInputText, setUserInputText] = useState<string>('');
  const [customerNameInput, setCustomerNameInput] = useState<string>('');
  const [customerEmailInput, setCustomerEmailInput] = useState<string>('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>('');
  const [customerAddressInput, setCustomerAddressInput] = useState<string>('');
  const [adjustmentText, setAdjustmentText] = useState<string>('');
  const [draftQuoteLines, setDraftQuoteLines] = useState<QuoteLineItem[]>([]);
  const [matchMessage, setMatchMessage] = useState<string | null>(null);
  const [promotionRecords, setPromotionRecords] = useState<Promotion[]>(() =>
    parsePromotionsFromStorage(localStorage.getItem('promotionRecords') || localStorage.getItem('promotions'))
  );
  const [financingOptions, setFinancingOptions] = useState<FinancingOption[]>(() => {
    const saved = localStorage.getItem('financingOptions');
    return saved ? JSON.parse(saved) : [];
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const saved = localStorage.getItem('teamMembers');
    return saved ? JSON.parse(saved) : [];
  });
  const [storedFiles, setStoredFiles] = useState<StoredFile[]>(() => {
    const saved = localStorage.getItem('storedFiles');
    return saved ? JSON.parse(saved) : [];
  });
  const [subscriptionPlanId, setSubscriptionPlanId] = useState<string>(() =>
    localStorage.getItem('subscriptionPlanId') || 'pro'
  );
  const [billingEmail, setBillingEmail] = useState<string>(() =>
    localStorage.getItem('billingEmail') || 'billing@pricesnap.ca'
  );
  const [anthropicApiKey, setAnthropicApiKey] = useState<string>(() =>
    localStorage.getItem('anthropicApiKey') || ''
  );
  const promotionNames = activePromotionNames(promotionRecords);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>(isAuthenticated ? AppView.DASHBOARD : AppView.LANDING);
  const [theme, setTheme] = useState<Theme>(() => getThemePreference());
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [quoteTemplates, setQuoteTemplates] = useState<QuoteTemplate[]>(() => {
    const saved = localStorage.getItem('quoteTemplates');
    return saved ? JSON.parse(saved) : [];
  });

  const [historicalQuotes, setHistoricalQuotes] = useState<QuoteData[]>(() => {
    const savedQuotes = localStorage.getItem('historicalQuotes');
    return savedQuotes ? JSON.parse(savedQuotes) : [];
  });
  const [isViewingHistorical, setIsViewingHistorical] = useState<boolean>(false);

  const [managedPriceLists, setManagedPriceLists] = useState<ManagedPriceListInfo[]>(() => {
    const saved = localStorage.getItem('managedPriceLists');
    return saved ? JSON.parse(saved) : [];
  });
  const [preferredPriceListId, setPreferredPriceListId] = useState<string | null>(() => {
    return localStorage.getItem('preferredPriceListId');
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('companyInfo');
    return saved ? JSON.parse(saved) : { 
      companyName: '',
      companyAddress: '',
      companyContact: '',
      website: '',
      taxNumber: '',
      logoUrl: '',
      primaryColor: '#0066FF',
      secondaryColor: '#8B5CF6'
    };
  });

  const [defaultTerms, setDefaultTerms] = useState<string>(() => {
    const saved = localStorage.getItem('defaultTerms');
    return saved || `Payment due within 30 days of invoice date.
Quote valid for 30 days from issue date.
All prices are in CAD.`;
  });

  // Apply theme on mount and when changed
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated && currentView !== AppView.LOGIN && currentView !== AppView.SIGN_UP && currentView !== AppView.HELP && currentView !== AppView.LANDING) {
      setCurrentView(AppView.LANDING);
    } else if (isAuthenticated && (currentView === AppView.LOGIN || currentView === AppView.SIGN_UP)) {
      setCurrentView(AppView.DASHBOARD);
    }
  }, [isAuthenticated, currentView]);

  useEffect(() => {
    localStorage.setItem('historicalQuotes', JSON.stringify(historicalQuotes));
  }, [historicalQuotes]);

  useEffect(() => {
    localStorage.setItem('managedPriceLists', JSON.stringify(managedPriceLists));
  }, [managedPriceLists]);

  useEffect(() => {
    if (preferredPriceListId) {
      localStorage.setItem('preferredPriceListId', preferredPriceListId);
    } else {
      localStorage.removeItem('preferredPriceListId');
    }
  }, [preferredPriceListId]);

  // Load preferred price list data into active session
  useEffect(() => {
    if (priceListData || !preferredPriceListId) return;
    const pl = managedPriceLists.find((p) => p.id === preferredPriceListId);
    if (pl?.data) setPriceListData(pl.data);
  }, [managedPriceLists, preferredPriceListId, priceListData]);

  useEffect(() => {
    localStorage.setItem('quoteTemplates', JSON.stringify(quoteTemplates));
  }, [quoteTemplates]);

  const BUNDLED_LIST_NAME = 'Sample Catalog';

  const loadBundledSamplePriceList = useCallback(async () => {
    try {
      let parsed: PriceListItem[] | null = null;

      const jsonRes = await fetch('/sample-price-list.json');
      if (jsonRes.ok) {
        parsed = (await jsonRes.json()) as PriceListItem[];
      } else {
        const xlsxRes = await fetch('/sample-price-list.xlsx');
        if (xlsxRes.ok) {
          const buf = await xlsxRes.arrayBuffer();
          const workbook = XLSX.read(buf, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
          parsed = jsonData.map((row) => ({
            Item: String(row.Item || '').trim(),
            Price: parseFloat(String(row.Price)) || 0,
            Cost: parseFloat(String(row.Cost)) || 0,
          })).filter((r) => r.Item);
        }
      }

      if (!parsed?.length) parsed = EMBEDDED_SAMPLE_CATALOG;

      const existing = managedPriceLists.find((p) => p.name === BUNDLED_LIST_NAME);
      if (existing) {
        setManagedPriceLists((prev) => prev.map((p) => p.id === existing.id
          ? { ...p, data: parsed!, itemCount: parsed!.length, uploadDate: new Date().toISOString() }
          : p));
        setPreferredPriceListId(existing.id);
        setPriceListData(parsed);
      } else {
        const id = Date.now().toString();
        const entry: ManagedPriceListInfo = {
          id,
          name: BUNDLED_LIST_NAME,
          uploadDate: new Date().toISOString(),
          itemCount: parsed.length,
          data: parsed,
        };
        setManagedPriceLists((prev) => [...prev, entry]);
        setPreferredPriceListId(id);
        setPriceListData(parsed);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample price list');
    }
  }, [managedPriceLists]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser || teamMembers.length > 0) return;
    setTeamMembers([{
      id: currentUser.id,
      name: currentUser.displayName,
      role: 'Owner / Sales',
      email: currentUser.email,
      status: 'Active',
      createdAt: new Date().toISOString(),
    }]);
  }, [isAuthenticated, currentUser, teamMembers.length]);

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));
  }, [companyInfo]);

  useEffect(() => {
    localStorage.setItem('defaultTerms', defaultTerms);
  }, [defaultTerms]);

  useEffect(() => {
    localStorage.setItem('promotionRecords', JSON.stringify(promotionRecords));
  }, [promotionRecords]);

  useEffect(() => {
    localStorage.setItem('financingOptions', JSON.stringify(financingOptions));
  }, [financingOptions]);

  useEffect(() => {
    localStorage.setItem('teamMembers', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('storedFiles', JSON.stringify(storedFiles));
  }, [storedFiles]);

  useEffect(() => {
    localStorage.setItem('subscriptionPlanId', subscriptionPlanId);
  }, [subscriptionPlanId]);

  useEffect(() => {
    localStorage.setItem('billingEmail', billingEmail);
  }, [billingEmail]);

  useEffect(() => {
    localStorage.setItem('anthropicApiKey', anthropicApiKey);
  }, [anthropicApiKey]);

  const handleFileUpload = useCallback((file: File) => {
    setIsLoading(true);
    setError(null);
    setPriceListData(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Failed to read file data.");
        
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

        if (jsonData.length === 0) {
          throw new Error("Excel file is empty or has no data in the first sheet.");
        }
        
        const header = Object.keys(jsonData[0]);
        const requiredColumns = ["Item", "Price", "Cost"];
        for (const col of requiredColumns) {
          if (!header.includes(col)) {
            throw new Error(`Excel file must contain columns: ${requiredColumns.join(', ')}. Missing: ${col}`);
          }
        }
        
        const parsedData: PriceListItem[] = jsonData.map((row, index) => {
          const item = String(row.Item).trim();
          if (!item) {
            throw new Error(`Row ${index + 2}: 'Item' cannot be empty.`);
          }
          
          let price: number;
          const rawPriceValueFromCell = row.Price;
          const processedPriceString = (rawPriceValueFromCell === undefined || rawPriceValueFromCell === null) ? '' : String(rawPriceValueFromCell).trim().toLowerCase();
          const parsedPriceFloat = parseFloat(processedPriceString);

          if (!isNaN(parsedPriceFloat)) {
            price = parsedPriceFloat;
          } else if (processedPriceString === 'included' || processedPriceString === 'n/a' || processedPriceString === '') {
            price = 0;
          } else {
            throw new Error(`Row ${index + 2} for item '${item}': 'Price' must be a number, 'Included', 'N/A', or empty. Found: '${String(rawPriceValueFromCell)}'`);
          }
          if (price < 0) {
            throw new Error(`Row ${index + 2} for item '${item}': 'Price' must be a non-negative number. Found: ${price}`);
          }

          let cost: number;
          const rawCostValueFromCell = row.Cost;
          const processedCostString = (rawCostValueFromCell === undefined || rawCostValueFromCell === null) ? '' : String(rawCostValueFromCell).trim().toLowerCase();
          const parsedCostFloat = parseFloat(processedCostString);

          if (!isNaN(parsedCostFloat)) {
            cost = parsedCostFloat;
          } else if (processedCostString === 'included' || processedCostString === 'n/a' || processedCostString === '') {
            cost = 0;
          } else {
            throw new Error(`Row ${index + 2} for item '${item}': 'Cost' must be a number, 'Included', 'N/A', or empty. Found: '${String(rawCostValueFromCell)}'`);
          }
          if (cost < 0) {
            throw new Error(`Row ${index + 2} for item '${item}': 'Cost' must be a non-negative number. Found: ${cost}`);
          }
          
          return { Item: item, Price: price, Cost: cost };
        });
        
        setPriceListData(parsedData);
        setError(null);
        
        // Also add to managed price lists for future use
        const newManagedPriceList: ManagedPriceListInfo = {
          id: Date.now().toString(),
          name: file.name,
          uploadDate: new Date().toISOString(),
          itemCount: parsedData.length,
          data: parsedData
        };
        
        setManagedPriceLists(prev => {
          // Remove any existing list with same name to avoid duplicates
          const filtered = prev.filter(pl => pl.name !== file.name);
          return [...filtered, newManagedPriceList];
        });
        
        // Set as preferred if it's the first one
        if (managedPriceLists.length === 0) {
          setPreferredPriceListId(newManagedPriceList.id);
        }
        
      } catch (err) {
        console.error("Error parsing Excel:", err);
        setError(err instanceof Error ? err.message : "Error parsing Excel file.");
        setPriceListData(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError("Failed to read file.");
      setIsLoading(false);
    };
    
    reader.readAsBinaryString(file);
  }, [managedPriceLists.length]);

  const handleSelectManagedPriceList = useCallback((priceListId: string) => {
    const selectedPriceList = managedPriceLists.find(pl => pl.id === priceListId);
    if (selectedPriceList && selectedPriceList.data) {
      setPriceListData(selectedPriceList.data);
      setPreferredPriceListId(priceListId);
      setError(null);
    } else {
      setError("Selected price list data not found. Please re-upload the file.");
    }
  }, [managedPriceLists]);

  const buildQuoteLinesFromMatches = useCallback((identifiedItems: { Item: string; Quantity: number }[]) => {
    if (!priceListData) return [];
    const quoteLines: QuoteLineItem[] = [];
    for (const matched of identifiedItems) {
      let priceListItem = priceListData.find((p) => p.Item.toLowerCase() === matched.Item.toLowerCase());
      if (!priceListItem) {
        const words = matched.Item.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
        priceListItem = priceListData.find((p) => {
          const priceWords = p.Item.toLowerCase().split(/\s+/);
          return words.some((w) => priceWords.some((pw) => pw === w));
        });
      }
      if (priceListItem) {
        const quantity = Math.max(1, Math.floor(matched.Quantity));
        const totalPrice = priceListItem.Price * quantity;
        const totalCost = priceListItem.Cost * quantity;
        const profit = totalPrice - totalCost;
        quoteLines.push({
          ...priceListItem,
          Quantity: quantity,
          TotalPrice: totalPrice,
          TotalCost: totalCost,
          Profit: profit,
          ProfitMargin: priceListItem.Price > 0 ? (profit / totalPrice) * 100 : 0,
        });
      }
    }
    return quoteLines;
  }, [priceListData]);

  const handleIdentifyItems = useCallback(async () => {
    if (!priceListData?.length) {
      setError('Please upload or select a price list first.');
      return;
    }
    if (!userInputText.trim()) {
      setError('Please describe the items you want in the quote.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setMatchMessage(null);
    try {
      const response = await apiService.generateQuoteItems(userInputText, 'demo-list-id', priceListData);
      const identifiedItems = response.items;
      if (!identifiedItems?.length) {
        setError('Could not identify any relevant items. Try being more specific with item names.');
        setDraftQuoteLines([]);
        return;
      }
      const lines = buildQuoteLinesFromMatches(identifiedItems);
      if (!lines.length) {
        setError(`Matched ${identifiedItems.length} item(s) but none found in your price list.`);
        return;
      }
      setDraftQuoteLines(lines);
      setMatchMessage(`Matched ${lines.length} item(s) from your description.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred while matching items.');
    } finally {
      setIsLoading(false);
    }
  }, [priceListData, userInputText, buildQuoteLinesFromMatches]);

  const handleCreateQuoteFromDraft = useCallback(() => {
    if (!draftQuoteLines.length) {
      setError('Identify items first before creating a quote.');
      return;
    }
    const totals = recalcQuoteTotals(draftQuoteLines);
    let foundCustomerId: string | undefined;
    if (customerNameInput.trim()) {
      const existing = customers.find((c) => c.name.toLowerCase() === customerNameInput.trim().toLowerCase());
      if (existing) foundCustomerId = existing.id;
    }
    const newQuote: QuoteData = {
      id: `${Date.now().toString()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      customerName: customerNameInput.trim() || undefined,
      customerEmail: customerEmailInput.trim() || undefined,
      customerPhone: customerPhoneInput.trim() || undefined,
      customerAddress: customerAddressInput.trim() || undefined,
      customerId: foundCustomerId,
      status: 'Draft',
      lines: draftQuoteLines,
      ...totals,
      version: 1,
      taxRate: 0.13,
    };
    setQuoteData(newQuote);
    setHistoricalQuotes((prev) => [newQuote, ...prev]);
    setIsViewingHistorical(false);
    setCurrentView(AppView.CUSTOMER_QUOTE);
    setDraftQuoteLines([]);
    setUserInputText('');
    setCustomerNameInput('');
    setCustomerEmailInput('');
    setCustomerPhoneInput('');
    setCustomerAddressInput('');
    setAdjustmentText('');
    setMatchMessage(null);
    setError(null);
  }, [draftQuoteLines, customerNameInput, customerEmailInput, customerPhoneInput, customerAddressInput, customers]);

  const handleReset = () => {
    setUserInputText('');
    setCustomerNameInput('');
    setCustomerEmailInput('');
    setCustomerPhoneInput('');
    setCustomerAddressInput('');
    setAdjustmentText('');
    setDraftQuoteLines([]);
    setMatchMessage(null);
    setQuoteData(null);
    setError(null);
    setCurrentView(AppView.INPUT_FORM);
    setIsViewingHistorical(false);
  };
  
  const handleGetStarted = useCallback(() => {
    setError(null);
    setCurrentView(AppView.SIGN_UP);
  }, []);

  const handleSetView = (view: AppView) => {
    setError(null);
    if (view === AppView.INPUT_FORM && !isViewingHistorical) {
       setQuoteData(null);
       setIsViewingHistorical(false);
    } else if (view !== AppView.CUSTOMER_QUOTE && view !== AppView.INTERNAL_QUOTE && view !== AppView.LANDING) {
      setIsViewingHistorical(false);
    }
    setCurrentView(view);
  };

  const handleThemeToggle = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleDeletePriceList = useCallback((priceListId: string) => {
    setManagedPriceLists((prev) => prev.filter((pl) => pl.id !== priceListId));
    if (preferredPriceListId === priceListId) {
      setPreferredPriceListId(null);
      setPriceListData(null);
    }
  }, [preferredPriceListId]);

  const teamStats = {
    quotesCount: historicalQuotes.length,
    totalRevenue: historicalQuotes.reduce((s, q) => s + q.overallTotalPrice, 0),
    totalProfit: historicalQuotes.reduce((s, q) => s + q.overallProfit, 0),
  };

  const handleUploadFile = useCallback(async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Read failed'));
      reader.readAsDataURL(file);
    });
    const entry: StoredFile = {
      id: Date.now().toString(),
      name: file.name,
      type: file.type || file.name.split('.').pop() || 'file',
      size: file.size,
      uploadedAt: new Date().toISOString(),
      dataUrl,
    };
    setStoredFiles((prev) => [entry, ...prev]);
  }, []);

  const handleDownloadSampleCatalog = useCallback(() => {
    const data = priceListData || EMBEDDED_SAMPLE_CATALOG;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sample-price-list.json';
    a.click();
  }, [priceListData]);

  const handleDuplicateQuote = useCallback((quote: QuoteData) => {
    const copy: QuoteData = {
      ...JSON.parse(JSON.stringify(quote)),
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      status: 'Draft',
      version: 1,
    };
    setHistoricalQuotes((prev) => [copy, ...prev]);
    setQuoteData(copy);
    setIsViewingHistorical(true);
    setCurrentView(AppView.CUSTOMER_QUOTE);
  }, []);

  const handleDeleteQuote = useCallback((quoteId: string) => {
    if (!window.confirm('Delete this quote?')) return;
    setHistoricalQuotes((prev) => prev.filter((q) => q.id !== quoteId));
    if (quoteData?.id === quoteId) {
      setQuoteData(null);
      setCurrentView(AppView.DASHBOARD);
    }
  }, [quoteData?.id]);

  const updateDraftLine = (index: number, updater: (line: QuoteLineItem) => QuoteLineItem) => {
    setDraftQuoteLines((prev) => {
      const lines = [...prev];
      lines[index] = updater(lines[index]);
      const qty = lines[index].Quantity;
      const price = lines[index].Price;
      lines[index].TotalPrice = price * qty;
      lines[index].TotalCost = lines[index].Cost * qty;
      lines[index].Profit = lines[index].TotalPrice - lines[index].TotalCost;
      lines[index].ProfitMargin = lines[index].TotalPrice > 0 ? (lines[index].Profit / lines[index].TotalPrice) * 100 : 0;
      return lines;
    });
  };
  
  const renderContent = () => {
    if (!isAuthenticated) {
      if (currentView === AppView.SIGN_UP) {
        return <SignUpView onNavigateToLogin={() => handleSetView(AppView.LOGIN)} />;
      } else if (currentView === AppView.HELP) {
        return <HelpView onNavigateToLogin={() => handleSetView(AppView.LOGIN)} />;
      } else {
        return (
          <LoginView 
            onNavigateToSignUp={() => handleSetView(AppView.SIGN_UP)}
            onNavigateToHelp={() => handleSetView(AppView.HELP)}
          />
        );
      }
    }

    // Ensure currentUser is not null for authenticated views
    if (!currentUser) {
      return <div>Loading user data...</div>;
    }

    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <HomeView
            quotes={historicalQuotes}
            currentUser={currentUser}
            catalogLoaded={!!priceListData?.length}
            catalogCount={priceListData?.length ?? 0}
            onNavigate={handleSetView}
            onOpenQuote={(quote) => {
              setQuoteData(quote);
              setIsViewingHistorical(true);
              setCurrentView(AppView.CUSTOMER_QUOTE);
            }}
          />
        );

      case AppView.INPUT_FORM:
        return (
          <NewQuoteView
            priceListData={priceListData}
            managedPriceLists={managedPriceLists}
            preferredPriceListId={preferredPriceListId}
            onSelectManagedPriceList={handleSelectManagedPriceList}
            onFileUpload={handleFileUpload}
            customers={customers}
            customerName={customerNameInput}
            customerEmail={customerEmailInput}
            customerPhone={customerPhoneInput}
            customerAddress={customerAddressInput}
            onCustomerNameChange={setCustomerNameInput}
            onCustomerEmailChange={setCustomerEmailInput}
            onCustomerPhoneChange={setCustomerPhoneInput}
            onCustomerAddressChange={setCustomerAddressInput}
            userInputText={userInputText}
            onUserInputChange={setUserInputText}
            adjustmentText={adjustmentText}
            onAdjustmentTextChange={setAdjustmentText}
            quoteLines={draftQuoteLines}
            onIdentifyItems={handleIdentifyItems}
            onApplyAdjustments={() => {
              if (adjustmentText.toLowerCase().includes('10%')) {
                const lines = draftQuoteLines.map((line) => {
                  const orig = line.originalPrice ?? line.Price;
                  const newPrice = orig * 0.9;
                  return {
                    ...line,
                    originalPrice: orig,
                    Price: newPrice,
                    discountPercentage: 10,
                    discountReason: 'Volume Discount',
                    TotalPrice: newPrice * line.Quantity,
                    TotalCost: line.Cost * line.Quantity,
                    Profit: newPrice * line.Quantity - line.Cost * line.Quantity,
                    ProfitMargin: newPrice > 0 ? ((newPrice - line.Cost) / newPrice) * 100 : 0,
                  };
                });
                setDraftQuoteLines(lines);
              }
            }}
            onDescribeChanges={() => setMatchMessage(`Adjustment noted: ${adjustmentText}`)}
            onLinePromotionChange={(i, promo) => updateDraftLine(i, (l) => ({ ...l, promotion: promo || undefined }))}
            onLinePriceChange={(i, price) => updateDraftLine(i, (l) => ({ ...l, Price: price, originalPrice: l.originalPrice ?? l.Price }))}
            onLineQtyChange={(i, qty) => updateDraftLine(i, (l) => ({ ...l, Quantity: Math.max(1, qty) }))}
            onRemoveLine={(i) => setDraftQuoteLines((prev) => prev.filter((_, idx) => idx !== i))}
            onAddManualLine={(item, quantity = 1) => {
              setDraftQuoteLines((prev) => {
                const idx = prev.findIndex((l) => l.Item === item.Item);
                if (idx >= 0) {
                  const next = [...prev];
                  const existing = next[idx];
                  const merged = lineFromCatalogItem(item, existing.Quantity + quantity);
                  next[idx] = {
                    ...merged,
                    promotion: existing.promotion,
                    originalPrice: existing.originalPrice,
                    discountPercentage: existing.discountPercentage,
                    discountReason: existing.discountReason,
                  };
                  return next;
                }
                return [...prev, lineFromCatalogItem(item, quantity)];
              });
              setMatchMessage(`Added ${item.Item}${quantity > 1 ? ` × ${quantity}` : ''}`);
              setError(null);
            }}
            priceListItems={priceListData ?? []}
            onCreateQuote={handleCreateQuoteFromDraft}
            isLoading={isLoading}
            matchMessage={matchMessage}
            promotions={promotionNames}
          />
        );

      case AppView.CUSTOMER_QUOTE:
      case AppView.INTERNAL_QUOTE:
        return quoteData ? (
          <QuoteDisplay
            quoteData={quoteData}
            companyInfo={companyInfo}
            defaultTerms={defaultTerms}
            currentUser={currentUser}
            currentView={currentView}
            onSetView={handleSetView}
            onReset={handleReset}
            isHistoricalView={isViewingHistorical}
            promotions={promotionNames}
            financingOptions={financingOptions}
            onSaveAsTemplate={(templateName: string, quoteToTemplate: QuoteData) => {
              const linesSummary = quoteToTemplate.lines.map((l) => l.Item).join(', ');
              const userInput = linesSummary || templateName;
              const entry: QuoteTemplate = {
                id: Date.now().toString(),
                name: templateName,
                userInput,
                createdAt: new Date().toISOString(),
              };
              setQuoteTemplates((prev) => [entry, ...prev.filter((t) => t.name !== templateName)].slice(0, 20));
              alert(`Template "${templateName}" saved.`);
            }}
            onUpdateQuote={(updatedQuote: QuoteData) => {
              setQuoteData(updatedQuote);
              if (isViewingHistorical) {
                setHistoricalQuotes((prevQuotes) =>
                  prevQuotes.map((q) => (q.id === updatedQuote.id ? updatedQuote : q))
                );
              } else {
                setHistoricalQuotes((prevQuotes) =>
                  prevQuotes.map((q) => (q.id === updatedQuote.id ? updatedQuote : q))
                );
              }
            }}
          />
        ) : (
          <div className="text-center p-8">
            <h2 className="text-xl font-semibold mb-4">No Quote Selected</h2>
            <p>Please create a new quote or select one from your history.</p>
          </div>
        );

      case AppView.CUSTOMERS:
        return (
          <CustomersView
            quotes={historicalQuotes}
            customers={customers}
            onAddCustomer={(customer: Omit<Customer, 'id'>) => {
              setCustomers((prev) => [...prev, { ...customer, id: Date.now().toString() }]);
            }}
            onUpdateCustomer={(customerId: string, updatedCustomer: Omit<Customer, 'id'>) => {
              setCustomers((prev) => prev.map((c) => (c.id === customerId ? { ...updatedCustomer, id: customerId } : c)));
            }}
            onDeleteCustomer={(customerId: string) => {
              setCustomers((prev) => prev.filter((c) => c.id !== customerId));
            }}
            currentUser={currentUser}
          />
        );

      case AppView.ANALYTICS:
        return (
          <AnalyticsView
            quotes={historicalQuotes}
            onOpenQuote={(quote) => {
              setQuoteData(quote);
              setIsViewingHistorical(true);
              setCurrentView(AppView.CUSTOMER_QUOTE);
            }}
            onViewAllHistory={() => handleSetView(AppView.QUOTE_HISTORY)}
          />
        );

      case AppView.INVENTORY:
        return <InventoryView priceListData={priceListData} />;

      case AppView.PROMOTIONS:
        return (
          <PromotionsView
            promotions={promotionRecords}
            onAddPromotion={(p) =>
              setPromotionRecords((prev) => [
                ...prev,
                { ...p, id: Date.now().toString(), createdAt: new Date().toISOString() },
              ])
            }
            onUpdatePromotion={(id, updates) =>
              setPromotionRecords((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
            }
            onDeletePromotion={(id) => setPromotionRecords((prev) => prev.filter((p) => p.id !== id))}
          />
        );

      case AppView.FINANCING:
        return (
          <FinancingView
            options={financingOptions}
            onAddOption={(o) =>
              setFinancingOptions((prev) => [...prev, { ...o, id: Date.now().toString() }])
            }
            onUpdateOption={(id, updates) =>
              setFinancingOptions((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)))
            }
            onDeleteOption={(id) => setFinancingOptions((prev) => prev.filter((o) => o.id !== id))}
          />
        );

      case AppView.FILES:
        return (
          <FilesView
            files={storedFiles}
            onUpload={handleUploadFile}
            onDelete={(id) => setStoredFiles((prev) => prev.filter((f) => f.id !== id))}
            onDownloadSampleCatalog={handleDownloadSampleCatalog}
          />
        );

      case AppView.TEAM:
        return (
          <TeamView
            members={teamMembers}
            quotesCount={teamStats.quotesCount}
            totalRevenue={teamStats.totalRevenue}
            totalProfit={teamStats.totalProfit}
            onInvite={(m) =>
              setTeamMembers((prev) => [
                ...prev,
                { ...m, id: Date.now().toString(), status: 'Active', createdAt: new Date().toISOString() },
              ])
            }
            onUpdate={(id, updates) =>
              setTeamMembers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updates } : m)))
            }
            onRemove={(id) => setTeamMembers((prev) => prev.filter((m) => m.id !== id))}
          />
        );

      case AppView.COMPANY_BRANDING:
        return (
          <CompanyBrandingView
            companyInfo={companyInfo}
            onUpdateCompanyInfo={(info: CompanyInfo) => setCompanyInfo(info)}
          />
        );

      case AppView.SUBSCRIPTION:
        return (
          <SubscriptionView
            selectedPlanId={subscriptionPlanId}
            billingEmail={billingEmail}
            onSelectPlan={setSubscriptionPlanId}
            onUpdateBillingEmail={setBillingEmail}
          />
        );

      case AppView.SETTINGS:
        return (
          <SettingsView
            defaultTerms={defaultTerms}
            onUpdateDefaultTerms={setDefaultTerms}
            currentUser={currentUser!}
            onUpdateUser={(data) => updateProfileInAuthContext(data)}
            anthropicApiKey={anthropicApiKey}
            onUpdateAnthropicApiKey={setAnthropicApiKey}
          />
        );

      case AppView.QUOTE_HISTORY:
        return (
          <QuoteHistoryView
            quotes={historicalQuotes}
            currentUser={currentUser}
            onViewQuote={(quote) => {
              setQuoteData(quote);
              setIsViewingHistorical(true);
              setCurrentView(AppView.CUSTOMER_QUOTE);
            }}
            onDuplicateQuote={handleDuplicateQuote}
            onDeleteQuote={handleDeleteQuote}
          />
        );

      case AppView.PRICE_LISTS:
        return (
          <PriceListsView
            managedPriceLists={managedPriceLists}
            preferredPriceListId={preferredPriceListId}
            onAddPriceList={(pl) => {
              setManagedPriceLists((prev) => [...prev.filter((p) => p.name !== pl.name), pl]);
              if (!preferredPriceListId) {
                setPreferredPriceListId(pl.id);
                setPriceListData(pl.data);
              }
            }}
            onDeletePriceList={handleDeletePriceList}
            onSetPreferredPriceList={handleSelectManagedPriceList}
            onLoadBundled2026={loadBundledSamplePriceList}
            onNavigateTo={handleSetView}
          />
        );

      case AppView.PROFILE:
        return (
          <ProfileView
            currentUser={currentUser}
            onUpdateProfile={(userData: { displayName?: string; company?: string; phone?: string }) => {
              updateProfileInAuthContext(userData);
            }}
            onLogout={() => setShowLogoutConfirmation(true)}
          />
        );
        
      default:
        return <NewQuoteView
          priceListData={priceListData}
          managedPriceLists={managedPriceLists}
          preferredPriceListId={preferredPriceListId}
          onSelectManagedPriceList={handleSelectManagedPriceList}
          onFileUpload={handleFileUpload}
          customers={customers}
          customerName={customerNameInput}
          customerEmail={customerEmailInput}
          customerPhone={customerPhoneInput}
          customerAddress={customerAddressInput}
          onCustomerNameChange={setCustomerNameInput}
          onCustomerEmailChange={setCustomerEmailInput}
          onCustomerPhoneChange={setCustomerPhoneInput}
          onCustomerAddressChange={setCustomerAddressInput}
          userInputText={userInputText}
          onUserInputChange={setUserInputText}
          adjustmentText={adjustmentText}
          onAdjustmentTextChange={setAdjustmentText}
          quoteLines={draftQuoteLines}
          priceListItems={priceListData ?? []}
          onIdentifyItems={handleIdentifyItems}
          onApplyAdjustments={() => {}}
          onDescribeChanges={() => {}}
          onLinePromotionChange={() => {}}
          onLinePriceChange={() => {}}
          onLineQtyChange={() => {}}
          onRemoveLine={() => {}}
          onAddManualLine={() => {}}
          onCreateQuote={handleCreateQuoteFromDraft}
          isLoading={isLoading}
          matchMessage={matchMessage}
          promotions={promotionNames}
        />;
    }
  };

  if (!isAuthenticated) {
    const showAuthModal = currentView === AppView.LOGIN || currentView === AppView.SIGN_UP || currentView === AppView.HELP;
    return (
      <>
        <LandingPage
          onNavigate={handleSetView}
          onGetStarted={handleGetStarted}
        />
        {showAuthModal && (
          <div className="auth-modal-overlay" onClick={() => handleSetView(AppView.LANDING)}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
              <button type="button" className="auth-modal-close" onClick={() => handleSetView(AppView.LANDING)} aria-label="Close">×</button>
              <div className="auth-modal-header">
                <span className="brand-mark">PS</span>
                <h2>
                  {currentView === AppView.SIGN_UP ? 'Create account' : currentView === AppView.HELP ? 'How it works' : 'Sign in'}
                </h2>
              </div>
              <div className="auth-modal-body fade-in">
                {renderContent()}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Authenticated marketing page (full-screen, no app chrome)
  if (isAuthenticated && currentView === AppView.LANDING) {
    return (
      <LandingPage
        fromApp
        onBackToApp={() => handleSetView(AppView.DASHBOARD)}
        onNavigate={handleSetView}
        onGetStarted={() => handleSetView(AppView.SIGN_UP)}
      />
    );
  }

  // Authenticated views - top nav layout
  return (
    <div className="app-layout fade-in">
      <TopNav
        currentView={currentView}
        onNavigate={handleSetView}
        onLogout={() => setShowLogoutConfirmation(true)}
        userName={currentUser?.displayName ?? 'User'}
      />
      <div className="app-main">
        <div className="content-area">
          <div className="page-content">
            {isLoading && (
              <div className="flex items-center justify-center" style={{ padding: '40px' }}>
                <div className="loading-spinner" style={{ marginRight: '12px' }}></div>
                <span style={{ color: '#6b7280' }}>Preparing your quote...</span>
              </div>
            )}
            
            {error && !isLoading && (
              <div className="mb-6">
                <Alert type="error" message={error} onClose={() => setError(null)} />
              </div>
            )}

            <div className="slide-up">
              {!isLoading && renderContent()}
            </div>
          </div>
        </div>
        <footer className="app-footer">© 2025 PriceSnap. All rights reserved.</footer>
      </div>
      
      {showLogoutConfirmation && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="text-center" style={{ padding: '32px' }}>
              <h3 className="mb-4" style={{ fontSize: '20px', fontWeight: '600', color: '#1a1a1a' }}>Sign Out</h3>
              <p className="mb-6" style={{ color: '#6b7280' }}>Ready to call it a day?</p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowLogoutConfirmation(false)}
                  className="btn btn-secondary"
                >
                  Stay Logged In
                </button>
                <button 
                  onClick={() => {
                    logout();
                    setShowLogoutConfirmation(false);
                    setCurrentView(AppView.LANDING);
                  }}
                  className="btn btn-danger"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;