const STORAGE_KEY = 'portfolioJournalData';

export const defaultPortfolioData = {
  version: 1,
  stocksAndFunds: [],
  crypto: {
    deposits: [],
    rmbToUsdRecords: [],
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
      rmbToUsdRecords: [],
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
      rmbToUsdRecords: Array.isArray(parsedCrypto.rmbToUsdRecords)
        ? parsedCrypto.rmbToUsdRecords
        : baseData.crypto.rmbToUsdRecords,
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

export function addRmbToUsdRecord(record) {
  const data = getAppData();
  const nextRecord = {
    id: createRecordId(),
    date: record.date,
    rmbAmount: Number(record.rmbAmount),
    exchangeRate: Number(record.exchangeRate),
    usdReceived: Number(record.usdReceived),
    note: record.note || '',
    createdAt: new Date().toISOString(),
  };

  return saveAppData({
    ...data,
    crypto: {
      ...data.crypto,
      rmbToUsdRecords: [nextRecord, ...data.crypto.rmbToUsdRecords],
    },
  });
}

export function deleteRmbToUsdRecord(recordId) {
  const data = getAppData();

  return saveAppData({
    ...data,
    crypto: {
      ...data.crypto,
      rmbToUsdRecords: data.crypto.rmbToUsdRecords.filter((record) => record.id !== recordId),
    },
  });
}

export function addCryptoTrade(record) {
  const data = getAppData();
  const nextRecord = {
    id: createRecordId(),
    date: record.date,
    action: record.action,
    asset: record.asset,
    usdAmount: Number(record.usdAmount),
    fee: Number(record.fee || 0),
    feeCurrency: record.feeCurrency || getDefaultTradeFeeCurrency(record.action, record.asset),
    quantity: Number(record.quantity),
    note: record.note || '',
    createdAt: new Date().toISOString(),
  };

  return saveAppData({
    ...data,
    crypto: {
      ...data.crypto,
      trades: [nextRecord, ...data.crypto.trades],
    },
  });
}

export function deleteCryptoTrade(recordId) {
  const data = getAppData();

  return saveAppData({
    ...data,
    crypto: {
      ...data.crypto,
      trades: data.crypto.trades.filter((record) => record.id !== recordId),
    },
  });
}

export function getCryptoCapitalIn(data = getAppData()) {
  const currentData = normalizePortfolioData(data);

  return currentData.crypto.rmbToUsdRecords.reduce((sum, record) => {
    const amount = Number(record.rmbAmount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
}

export function getTotalCapitalIn(data) {
  return getStocksAndFundsTotal(data) + getCryptoCapitalIn(data);
}

export function getCryptoTradesGroupedByAsset(trades = []) {
  return trades.reduce((groups, trade) => {
    const asset = String(trade.asset || '').trim().toUpperCase();

    if (!asset) {
      return groups;
    }

    if (!groups[asset]) {
      groups[asset] = [];
    }

    groups[asset].push(trade);
    groups[asset].sort(compareTradesByTime);

    return groups;
  }, {});
}

export function getCryptoAssetNetQuantity(trades = []) {
  return trades.reduce((total, trade) => {
    const quantity = Number(trade.quantity);
    const fee = Number(trade.fee || 0);
    const feeCurrency = getTradeFeeCurrency(trade);
    const asset = String(trade.asset || '').trim().toUpperCase();
    const assetFee = feeCurrency === asset ? fee : 0;

    if (!Number.isFinite(quantity) || !Number.isFinite(fee)) {
      return total;
    }

    if (trade.action === 'Buy') {
      return total + quantity - assetFee;
    }

    if (trade.action === 'Sell') {
      return total - quantity - assetFee;
    }

    return total;
  }, 0);
}

function getDefaultTradeFeeCurrency(action, asset) {
  return action === 'Sell' ? 'USD' : String(asset || '').trim().toUpperCase();
}

function getTradeFeeCurrency(trade) {
  return String(
    trade.feeCurrency || getDefaultTradeFeeCurrency(trade.action, trade.asset),
  )
    .trim()
    .toUpperCase();
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

function compareTradesByTime(a, b) {
  const dateCompare = String(b.date || '').localeCompare(String(a.date || ''));

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
}
