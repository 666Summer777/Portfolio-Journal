import { useState } from 'react';
import {
  addStocksAndFundsRecord,
  deleteStocksAndFundsRecord,
  getStocksAndFundsTotal,
  getTotalCapitalIn,
  loadPortfolioData,
} from './storage';

const pages = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'stocks', label: 'Stocks & Funds' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'settings', label: 'Settings' },
];

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [portfolioData, setPortfolioData] = useState(() => loadPortfolioData());

  function handleAddStocksAndFundsRecord(record) {
    setPortfolioData((currentData) => addStocksAndFundsRecord(currentData, record));
  }

  function handleDeleteStocksAndFundsRecord(recordId) {
    setPortfolioData((currentData) => deleteStocksAndFundsRecord(currentData, recordId));
  }

  return (
    <div className="appShell">
      <main className="appMain">
        <header className="appHeader">
          <p className="eyebrow">Portfolio Journal</p>
          <h1>{getPageTitle(activePage)}</h1>
        </header>

        {activePage === 'dashboard' && <Dashboard total={getTotalCapitalIn(portfolioData)} />}
        {activePage === 'stocks' && (
          <StocksAndFunds
            data={portfolioData}
            onAddRecord={handleAddStocksAndFundsRecord}
            onDeleteRecord={handleDeleteStocksAndFundsRecord}
          />
        )}
        {activePage === 'crypto' && <Crypto />}
        {activePage === 'settings' && <SettingsBackup />}
      </main>

      <nav className="bottomNav" aria-label="Primary navigation">
        {pages.map((page) => (
          <button
            key={page.id}
            className={page.id === activePage ? 'navButton active' : 'navButton'}
            type="button"
            aria-current={page.id === activePage ? 'page' : undefined}
            onClick={() => setActivePage(page.id)}
          >
            {page.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function getPageTitle(pageId) {
  if (pageId === 'stocks') {
    return 'Stocks & Funds';
  }

  if (pageId === 'crypto') {
    return 'Crypto';
  }

  if (pageId === 'settings') {
    return 'Settings / Backup';
  }

  return 'Dashboard';
}

function Dashboard({ total }) {
  return (
    <section className="capitalCard" aria-labelledby="total-capital-title">
      <span className="cardLabel" id="total-capital-title">
        Total Capital In
      </span>
      <strong className="capitalAmount">{formatCurrency(total)}</strong>
    </section>
  );
}

function StocksAndFunds({ data, onAddRecord, onDeleteRecord }) {
  const [formData, setFormData] = useState({
    date: getTodayDate(),
    category: 'S&P 500 Fund',
    customCategory: '',
    amount: '',
    note: '',
  });
  const [error, setError] = useState('');
  const total = getStocksAndFundsTotal(data);
  const categoryGroups = groupStocksAndFundsRecords(data.stocksAndFunds);

  function updateField(field, value) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }));
    setError('');
  }

  function handleSubmit(event) {
    event.preventDefault();

    const category =
      formData.category === 'Other' ? formData.customCategory.trim() : formData.category;
    const amount = Number(formData.amount);

    if (!formData.date) {
      setError('Please choose a date.');
      return;
    }

    if (!category) {
      setError('Please enter a custom category.');
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter an amount greater than 0.');
      return;
    }

    onAddRecord({
      date: formData.date,
      category,
      amount,
      note: formData.note,
    });

    setFormData({
      date: getTodayDate(),
      category: 'S&P 500 Fund',
      customCategory: '',
      amount: '',
      note: '',
    });
    setError('');
  }

  function handleDelete(recordId) {
    const shouldDelete = window.confirm('Are you sure you want to delete this record?');

    if (shouldDelete) {
      onDeleteRecord(recordId);
    }
  }

  return (
    <section className="contentStack">
      <div className="softCard">
        <span className="cardLabel">Stocks & Funds Total</span>
        <strong className="sectionAmount">{formatCurrency(total)}</strong>
      </div>

      <form className="softCard recordForm" onSubmit={handleSubmit}>
        <span className="cardLabel">Add Record</span>

        <label className="fieldGroup">
          <span>Date</span>
          <input
            type="date"
            value={formData.date}
            required
            onChange={(event) => updateField('date', event.target.value)}
          />
        </label>

        <label className="fieldGroup">
          <span>Category</span>
          <select
            value={formData.category}
            required
            onChange={(event) => updateField('category', event.target.value)}
          >
            <option value="S&P 500 Fund">S&P 500 Fund</option>
            <option value="Nasdaq Fund">Nasdaq Fund</option>
            <option value="Other">Other</option>
          </select>
        </label>

        {formData.category === 'Other' && (
          <label className="fieldGroup">
            <span>Custom Category</span>
            <input
              type="text"
              value={formData.customCategory}
              placeholder="Enter fund name"
              onChange={(event) => updateField('customCategory', event.target.value)}
            />
          </label>
        )}

        <label className="fieldGroup">
          <span>Amount</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            value={formData.amount}
            required
            placeholder="0.00"
            onChange={(event) => updateField('amount', event.target.value)}
          />
        </label>

        <label className="fieldGroup">
          <span>Note</span>
          <input
            type="text"
            value={formData.note}
            placeholder="Optional"
            onChange={(event) => updateField('note', event.target.value)}
          />
        </label>

        {error && <p className="formError">{error}</p>}

        <button type="submit" className="primaryButton">
          Save Record
        </button>
      </form>

      <section className="recordsSection" aria-labelledby="purchase-tables-title">
        <h2 id="purchase-tables-title">Purchase Tables</h2>

        {categoryGroups.length === 0 ? (
          <p className="placeholderText">No records yet.</p>
        ) : (
          <div className="categoryGroups">
            {categoryGroups.map((group) => (
              <article className="softCard categoryGroup" key={group.category}>
                <header className="categoryHeader">
                  <h3>{group.category}</h3>
                  <span className="categoryTotal">Total: {formatCurrency(group.total)}</span>
                </header>

                <div className="purchaseTable" role="table" aria-label={`${group.category} purchases`}>
                  <div className="purchaseHeader" role="row">
                    <span role="columnheader">Date</span>
                    <span role="columnheader">Amount</span>
                    <span role="columnheader">Note</span>
                    <span role="columnheader">Action</span>
                  </div>

                  {group.records.map((record) => (
                    <div className="purchaseRow" role="row" key={record.id}>
                      <time className="purchaseCell" dateTime={record.date} role="cell">
                        {record.date}
                      </time>
                      <strong className="purchaseCell" role="cell">
                        {formatCurrency(record.amount)}
                      </strong>
                      <span className="purchaseCell purchaseNote" role="cell">
                        {record.note || '-'}
                      </span>
                      <span className="purchaseCell purchaseAction" role="cell">
                        <button
                          type="button"
                          className="deleteButton"
                          onClick={() => handleDelete(record.id)}
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

function Crypto() {
  return (
    <section className="softCard">
      <p className="placeholderText">Crypto tracking is not configured yet.</p>
    </section>
  );
}

function SettingsBackup() {
  return (
    <section className="contentStack">
      <div className="softCard">
        <span className="cardLabel">Backup</span>
        <div className="buttonStack" aria-label="Backup actions">
          <button type="button" className="secondaryButton">
            Export JSON
          </button>
          <button type="button" className="secondaryButton">
            Import JSON
          </button>
          <button type="button" className="secondaryButton">
            Export CSV
          </button>
        </div>
      </div>
    </section>
  );
}

function groupStocksAndFundsRecords(records) {
  const groupsByCategory = new Map();

  records.forEach((record) => {
    const category = record.category || 'Uncategorized';
    const amount = Number(record.amount);
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    const currentGroup = groupsByCategory.get(category) ?? {
      category,
      total: 0,
      records: [],
    };

    currentGroup.total += safeAmount;
    currentGroup.records.push(record);
    groupsByCategory.set(category, currentGroup);
  });

  return [...groupsByCategory.values()]
    .map((group) => ({
      ...group,
      records: [...group.records].sort(comparePurchaseRecords),
    }))
    .sort((first, second) => first.category.localeCompare(second.category));
}

function comparePurchaseRecords(first, second) {
  const dateComparison = String(first.date ?? '').localeCompare(String(second.date ?? ''));

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return getRecordTimestamp(first) - getRecordTimestamp(second);
}

function getRecordTimestamp(record) {
  const timestamp = new Date(record.createdAt ?? record.date).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function formatCurrency(value) {
  const formattedNumber = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);

  return `￥${formattedNumber}`;
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default App;
