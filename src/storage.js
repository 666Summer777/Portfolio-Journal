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

export function loadPortfolioData() {
  return getAppData();
}

export function getAppData() {
  if (typeof window === 'undefined') {
    return defaultPortfolioData;
  }

  const rawData = window.localStorage.getItem(STORAGE_KEY);

  if (!rawData) {
    return normalizePortfolioData(defaultPortfolioData);
  }

  try {
    return normalizePortfolioData(JSON.parse(rawData));
  } catch {
    return normalizePortfolioData(defaultPortfolioData);
  }
}

export function saveAppData(data) {
  const normalizedData = normalizePortfolioData(data);

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizedData));
  }

  return normalizedData;
}

export function addRmbToUsdRecord(record) {
  const data = getAppData();
  const nextRecord = {
    id: createId(),
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
    id: createId(),
    date: record.date,
    action: record.action,
    asset: record.asset,
    usdAmount: Number(record.usdAmount),
    fee: Number(record.fee || 0),
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
  return data.crypto.rmbToUsdRecords.reduce((sum, record) => {
    const amount = Number(record.rmbAmount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);
}

export function getTotalCapitalIn(data = getAppData()) {
  return getCryptoCapitalIn(data);
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

    if (!Number.isFinite(quantity) || !Number.isFinite(fee)) {
      return total;
    }

    if (trade.action === 'Buy') {
      return total + quantity - fee;
    }

    if (trade.action === 'Sell') {
      return total - quantity - fee;
    }

    return total;
  }, 0);
}

function normalizePortfolioData(data) {
  const crypto = data?.crypto || {};

  return {
    ...defaultPortfolioData,
    ...data,
    stocksAndFunds: Array.isArray(data?.stocksAndFunds) ? data.stocksAndFunds : [],
    crypto: {
      ...defaultPortfolioData.crypto,
      ...crypto,
      deposits: Array.isArray(crypto.deposits) ? crypto.deposits : [],
      rmbToUsdRecords: Array.isArray(crypto.rmbToUsdRecords) ? crypto.rmbToUsdRecords : [],
      trades: Array.isArray(crypto.trades) ? crypto.trades : [],
    },
    settings: {
      ...defaultPortfolioData.settings,
      ...(data?.settings || {}),
    },
  };
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function compareTradesByTime(a, b) {
  const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
}
