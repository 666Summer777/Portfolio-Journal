const STORAGE_KEY = 'portfolioJournalData';

export const defaultPortfolioData = {
  version: 1,
  stocksAndFunds: [],
  crypto: {
    deposits: [],
    trades: [],
  },
  settings: {},
};

function getDefaultPortfolioData() {
  return {
    ...defaultPortfolioData,
    stocksAndFunds: [],
    crypto: {
      deposits: [],
      trades: [],
    },
    settings: {},
  };
}

function normalizePortfolioData(data) {
  const baseData = getDefaultPortfolioData();
  const parsedData = data && typeof data === 'object' ? data : {};
  const parsedCrypto = parsedData.crypto && typeof parsedData.crypto === 'object' ? parsedData.crypto : {};

  return {
    ...baseData,
    ...parsedData,
    stocksAndFunds: Array.isArray(parsedData.stocksAndFunds)
      ? parsedData.stocksAndFunds
      : baseData.stocksAndFunds,
    crypto: {
      ...baseData.crypto,
      ...parsedCrypto,
      deposits: Array.isArray(parsedCrypto.deposits) ? parsedCrypto.deposits : baseData.crypto.deposits,
      trades: Array.isArray(parsedCrypto.trades) ? parsedCrypto.trades : baseData.crypto.trades,
    },
    settings:
      parsedData.settings && typeof parsedData.settings === 'object'
        ? parsedData.settings
        : baseData.settings,
  };
}

export function loadPortfolioData() {
  if (typeof window === 'undefined') {
    return getDefaultPortfolioData();
  }

  const rawData = window.localStorage.getItem(STORAGE_KEY);

  if (!rawData) {
    return getDefaultPortfolioData();
  }

  try {
    return normalizePortfolioData(JSON.parse(rawData));
  } catch {
    return getDefaultPortfolioData();
  }
}

export function getAppData() {
  return loadPortfolioData();
}

export function savePortfolioData(data) {
  const normalizedData = normalizePortfolioData(data);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData));
  }

  return normalizedData;
}

export function saveAppData(data) {
  return savePortfolioData(data);
}

export function addStocksAndFundsRecord(data, recordInput) {
  const currentData = normalizePortfolioData(data);
  const record = createStocksAndFundsRecord(recordInput);
  const nextData = {
    ...currentData,
    stocksAndFunds: [record, ...currentData.stocksAndFunds],
  };

  return savePortfolioData(nextData);
}

export function deleteStocksAndFundsRecord(data, recordId) {
  const currentData = normalizePortfolioData(data);
  const nextData = {
    ...currentData,
    stocksAndFunds: currentData.stocksAndFunds.filter((record) => record.id !== recordId),
  };

  return savePortfolioData(nextData);
}

export function getStocksAndFundsTotal(data) {
  const currentData = normalizePortfolioData(data);

  return currentData.stocksAndFunds.reduce((sum, record) => {
    const amount = Number(record.amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
}

export function getTotalCapitalIn(data) {
  return getStocksAndFundsTotal(data);
}

function createStocksAndFundsRecord(recordInput) {
  return {
    id: createRecordId(),
    date: recordInput.date,
    category: recordInput.category,
    amount: Number(recordInput.amount),
    note: recordInput.note?.trim() ?? '',
    createdAt: new Date().toISOString(),
  };
}

function createRecordId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
