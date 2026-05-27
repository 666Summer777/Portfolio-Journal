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

export function loadPortfolioData() {
  if (typeof window === 'undefined') {
    return defaultPortfolioData;
  }

  const rawData = window.localStorage.getItem(STORAGE_KEY);

  if (!rawData) {
    return defaultPortfolioData;
  }

  try {
    return {
      ...defaultPortfolioData,
      ...JSON.parse(rawData),
    };
  } catch {
    return defaultPortfolioData;
  }
}
