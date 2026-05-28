import { useRef, useState } from 'react';
import {
  addCryptoTrade,
  addRmbToUsdRecord,
  addStocksAndFundsRecord,
  deleteCryptoTrade,
  deleteRmbToUsdRecord,
  deleteStocksAndFundsRecord,
  getCryptoAssetNetQuantity,
  getCryptoCapitalIn,
  getCryptoTradesGroupedByAsset,
  getStocksAndFundsTotal,
  getTotalCapitalIn,
  loadPortfolioData,
  savePortfolioData,
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
  const isCryptoPage = activePage === 'crypto';

  function handleAddStocksAndFundsRecord(record) {
    setPortfolioData((currentData) => addStocksAndFundsRecord(currentData, record));
  }

  function handleDeleteStocksAndFundsRecord(recordId) {
    setPortfolioData((currentData) => deleteStocksAndFundsRecord(currentData, recordId));
  }

  return (
    <div className="appShell">
      <main className={isCryptoPage ? 'appMain cryptoMain' : 'appMain'}>
        {!isCryptoPage && (
          <header className="appHeader">
            <p className="eyebrow">Portfolio Journal</p>
            <h1>{getPageTitle(activePage)}</h1>
          </header>
        )}

        {activePage === 'dashboard' && <Dashboard data={portfolioData} />}
        {activePage === 'stocks' && (
          <StocksAndFunds
            data={portfolioData}
            onAddRecord={handleAddStocksAndFundsRecord}
            onDeleteRecord={handleDeleteStocksAndFundsRecord}
          />
        )}
        {activePage === 'crypto' && (
          <Crypto data={portfolioData.crypto} onDataChange={setPortfolioData} />
        )}
        {activePage === 'settings' && (
          <SettingsBackup data={portfolioData} onDataImport={setPortfolioData} />
        )}
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

function DateField({ value, onChange }) {
  const displayValue = value ? formatDisplayDate(value) : 'Select date';

  return (
    <span className="dateInputShell">
      <span className={value ? 'dateInputValue' : 'dateInputValue placeholderValue'}>
        {displayValue}
      </span>
      <input
        className="dateInputControl"
        type="date"
        value={value}
        required
        aria-label="Date"
        onChange={(event) => onChange(event.target.value)}
      />
    </span>
  );
}

function Dashboard({ data }) {
  const total = getTotalCapitalIn(data);
  const stocksAndFundsTotal = getStocksAndFundsTotal(data);
  const cryptoTotal = getCryptoCapitalIn(data);

  return (
    <section className="dashboardStack" aria-labelledby="total-capital-title">
      <article className="capitalCard dashboardHero">
        <span className="cardLabel" id="total-capital-title">
          Total Capital In
        </span>
        <strong className="capitalAmount">{formatCurrency(total)}</strong>
        <p className="summaryText">A clean snapshot of capital recorded across your portfolio.</p>
      </article>

      <div className="summaryGrid" aria-label="Portfolio summary">
        <article className="softCard summaryCard">
          <span className="cardLabel">Stocks & Funds</span>
          <strong className="summaryAmount">{formatCurrency(stocksAndFundsTotal)}</strong>
        </article>
        <article className="softCard summaryCard">
          <span className="cardLabel">Crypto</span>
          <strong className="summaryAmount">{formatCurrency(cryptoTotal)}</strong>
        </article>
      </div>
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
          <DateField value={formData.date} onChange={(date) => updateField('date', date)} />
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

function Crypto({ data, onDataChange }) {
  const [cryptoView, setCryptoView] = useState('main');
  const capitalIn = getCryptoCapitalIn({ crypto: data });

  if (cryptoView === 'rmb-records') {
    return (
      <NestedRecordsPage title="RMB to USD Records" onBack={() => setCryptoView('main')}>
        <RmbToUsdRecordList records={data.rmbToUsdRecords} onDataChange={onDataChange} />
      </NestedRecordsPage>
    );
  }

  if (cryptoView === 'crypto-trades') {
    return (
      <NestedRecordsPage title="Crypto Trades" onBack={() => setCryptoView('main')}>
        <CryptoTradesByAsset records={data.trades} onDataChange={onDataChange} />
      </NestedRecordsPage>
    );
  }

  return (
    <section className="contentStack cryptoHome" aria-label="Crypto tracking">
      <div className="capitalCard compactCapitalCard cryptoCapitalCard">
        <div className="cryptoTitleBlock">
          <p className="eyebrow">Portfolio Journal</p>
          <h1>Crypto</h1>
        </div>
        <div className="cryptoCapitalContent">
          <span className="cardLabel">Crypto Capital In</span>
          <strong className="sectionAmount">{formatCurrency(capitalIn)}</strong>
        </div>
      </div>

      <RmbToUsdForm onDataChange={onDataChange} onViewRecords={() => setCryptoView('rmb-records')} />
      <CryptoTradeForm onDataChange={onDataChange} onViewTrades={() => setCryptoView('crypto-trades')} />
    </section>
  );
}

function RmbToUsdForm({ onDataChange, onViewRecords }) {
  const [date, setDate] = useState(getTodayDate());
  const [rmbAmount, setRmbAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const numericRmbAmount = Number(rmbAmount);
  const numericExchangeRate = Number(exchangeRate);
  const usdReceived =
    numericRmbAmount > 0 && numericExchangeRate > 0 ? numericRmbAmount / numericExchangeRate : 0;

  function handleSubmit(event) {
    event.preventDefault();

    if (!date) {
      setError('Date is required.');
      return;
    }

    if (!Number.isFinite(numericRmbAmount) || numericRmbAmount <= 0) {
      setError('RMB Amount must be greater than 0.');
      return;
    }

    if (!Number.isFinite(numericExchangeRate) || numericExchangeRate <= 0) {
      setError('Exchange Rate must be greater than 0.');
      return;
    }

    const nextData = addRmbToUsdRecord({
      date,
      rmbAmount: numericRmbAmount,
      exchangeRate: numericExchangeRate,
      usdReceived,
      note: note.trim(),
    });

    onDataChange(nextData);
    setRmbAmount('');
    setExchangeRate('');
    setNote('');
    setError('');
  }

  return (
    <form className="softCard formCard cryptoFormCard" onSubmit={handleSubmit}>
      <div className="formHeader">
        <h2>RMB to USD</h2>
        <button type="button" className="secondaryButton compactButton" onClick={onViewRecords}>
          View Records
        </button>
      </div>

      <label className="field">
        <span>Date</span>
        <DateField value={date} onChange={setDate} />
      </label>

      <label className="field">
        <span>RMB Amount</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={rmbAmount}
          required
          inputMode="decimal"
          onChange={(event) => setRmbAmount(event.target.value)}
        />
      </label>

      <label className="field">
        <span>Exchange Rate</span>
        <input
          type="number"
          min="0"
          step="0.0001"
          value={exchangeRate}
          required
          inputMode="decimal"
          placeholder="7.25"
          onChange={(event) => setExchangeRate(event.target.value)}
        />
      </label>

      <div className="readonlyField" aria-live="polite">
        <span>USD Received</span>
        <strong>{formatUsd(usdReceived)}</strong>
      </div>

      <label className="field">
        <span>Note</span>
        <input
          type="text"
          value={note}
          placeholder="Optional"
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      {error && <p className="formError">{error}</p>}

      <button type="submit" className="primaryButton">
        Add RMB to USD Record
      </button>
    </form>
  );
}

function CryptoTradeForm({ onDataChange, onViewTrades }) {
  const [date, setDate] = useState(getTodayDate());
  const [action, setAction] = useState('Buy');
  const [assetChoice, setAssetChoice] = useState('BTC');
  const [customAsset, setCustomAsset] = useState('');
  const [price, setPrice] = useState('');
  const [fee, setFee] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const numericPrice = Number(price);
  const numericFee = fee === '' ? 0 : Number(fee);
  const numericQuantity = Number(quantity);

  function handleSubmit(event) {
    event.preventDefault();

    const asset = assetChoice === 'Other' ? customAsset.trim().toUpperCase() : assetChoice;

    if (!date) {
      setError('Date is required.');
      return;
    }

    if (!asset) {
      setError('Custom Asset is required when Asset is Other.');
      return;
    }

    if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
      setError('Price must be greater than 0.');
      return;
    }

    if (!Number.isFinite(numericFee) || numericFee < 0) {
      setError('Fee must be 0 or greater.');
      return;
    }

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      setError('Quantity must be greater than 0.');
      return;
    }

    const nextData = addCryptoTrade({
      date,
      action,
      asset,
      usdAmount: numericPrice,
      fee: numericFee,
      feeCurrency: getDefaultFeeCurrency(action, asset),
      quantity: numericQuantity,
      note: note.trim(),
    });

    onDataChange(nextData);
    setPrice('');
    setFee('');
    setQuantity('');
    setNote('');
    setError('');
  }

  return (
    <form className="softCard formCard cryptoFormCard" onSubmit={handleSubmit}>
      <div className="formHeader">
        <h2>Crypto Trade</h2>
        <button type="button" className="secondaryButton compactButton" onClick={onViewTrades}>
          View Trades
        </button>
      </div>

      <label className="field">
        <span>Date</span>
        <DateField value={date} onChange={setDate} />
      </label>

      <label className="field">
        <span>Action</span>
        <select value={action} required onChange={(event) => setAction(event.target.value)}>
          <option>Buy</option>
          <option>Sell</option>
        </select>
      </label>

      <label className="field">
        <span>Asset</span>
        <select
          value={assetChoice}
          required
          onChange={(event) => setAssetChoice(event.target.value)}
        >
          <option>BTC</option>
          <option>ETH</option>
          <option>SOL</option>
          <option>Other</option>
        </select>
      </label>

      {assetChoice === 'Other' && (
        <label className="field">
          <span>Custom Asset</span>
          <input
            type="text"
            value={customAsset}
            placeholder="Enter asset symbol"
            onChange={(event) => setCustomAsset(event.target.value)}
          />
        </label>
      )}

      <label className="field">
        <span>Price</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={price}
          required
          inputMode="decimal"
          onChange={(event) => setPrice(event.target.value)}
        />
      </label>

      <label className="field">
        <span>Fee</span>
        <input
          type="number"
          min="0"
          step="0.0000000001"
          value={fee}
          inputMode="decimal"
          placeholder="0"
          onChange={(event) => setFee(event.target.value)}
        />
      </label>

      <label className="field">
        <span>Quantity</span>
        <input
          type="number"
          min="0"
          step="0.00000001"
          value={quantity}
          required
          inputMode="decimal"
          onChange={(event) => setQuantity(event.target.value)}
        />
      </label>

      <label className="field">
        <span>Note</span>
        <input
          type="text"
          value={note}
          placeholder="Optional"
          onChange={(event) => setNote(event.target.value)}
        />
      </label>

      {error && <p className="formError">{error}</p>}

      <button type="submit" className="primaryButton">
        Add Crypto Trade
      </button>
    </form>
  );
}

function NestedRecordsPage({ title, onBack, children }) {
  return (
    <section className="contentStack recordsPage">
      <div className="recordsPageHeader">
        <button type="button" className="secondaryButton compactButton" onClick={onBack}>
          Back
        </button>
        <h1>{title}</h1>
      </div>
      {children}
    </section>
  );
}

function RmbToUsdRecordList({ records, onDataChange }) {
  if (!records.length) {
    return <p className="placeholderText">No RMB to USD records yet.</p>;
  }

  return (
    <article className="softCard tableCard">
      <div className="mobileTable rmbTable" role="table" aria-label="RMB to USD records">
        <div className="mobileTableHeader" role="row">
          <span role="columnheader">Date</span>
          <span role="columnheader">RMB Amount</span>
          <span role="columnheader">Exchange Rate</span>
          <span role="columnheader">USD Received</span>
          <span role="columnheader">Note</span>
          <span role="columnheader">Delete</span>
        </div>

        {records.map((record) => (
          <div className="mobileTableRow" role="row" key={record.id}>
            <div>
              <span>Date</span>
              <strong>{record.date}</strong>
            </div>
            <div>
              <span>RMB Amount</span>
              <strong>{formatCurrency(record.rmbAmount)}</strong>
            </div>
            <div>
              <span>Exchange Rate</span>
              <strong>{formatNumber(record.exchangeRate, 4)}</strong>
            </div>
            <div>
              <span>USD Received</span>
              <strong>{formatUsd(record.usdReceived)}</strong>
            </div>
            <div className="mobileTableNote">
              <span>Note</span>
              <strong>{record.note || '-'}</strong>
            </div>
            <div className="mobileTableAction">
              <button
                type="button"
                className="deleteButton"
                onClick={() => handleDeleteRmbRecord(record.id, onDataChange)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function CryptoTradesByAsset({ records, onDataChange }) {
  if (!records.length) {
    return <p className="placeholderText">No crypto trade records yet.</p>;
  }

  const groupedTrades = getCryptoTradesGroupedByAsset(records);
  const assetNames = Object.keys(groupedTrades).sort();

  return (
    <div className="assetGroupList">
      {assetNames.map((asset) => (
        <AssetTradeGroup
          asset={asset}
          key={asset}
          records={groupedTrades[asset]}
          onDataChange={onDataChange}
        />
      ))}
    </div>
  );
}

function AssetTradeGroup({ asset, records, onDataChange }) {
  const netQuantity = getCryptoAssetNetQuantity(records);

  return (
    <article className="softCard assetGroup">
      <div className="assetGroupHeader">
        <h3>{asset}</h3>
        <span>
          Net Quantity: {formatCryptoAmount(netQuantity)} {asset}
        </span>
      </div>

      <div className="mobileTable" role="table" aria-label={`${asset} trades`}>
        <div className="mobileTableHeader" role="row">
          <span role="columnheader">Date</span>
          <span role="columnheader">Action</span>
          <span role="columnheader">Price</span>
          <span role="columnheader">Fee</span>
          <span role="columnheader">Quantity</span>
          <span role="columnheader">Note</span>
          <span role="columnheader">Delete</span>
        </div>

        {records.map((record) => (
          <div className="mobileTableRow" role="row" key={record.id}>
            <div>
              <span>Date</span>
              <strong>{record.date}</strong>
            </div>
            <div>
              <span>Action</span>
              <strong>{record.action}</strong>
            </div>
            <div>
              <span>Price</span>
              <strong>{formatUsd(record.usdAmount)}</strong>
            </div>
            <div>
              <span>Fee</span>
              <strong>{formatTradeFee(record, asset)}</strong>
            </div>
            <div>
              <span>Quantity</span>
              <strong>
                {formatCryptoAmount(record.quantity)} {asset}
              </strong>
            </div>
            <div className="mobileTableNote">
              <span>Note</span>
              <strong>{record.note || '-'}</strong>
            </div>
            <div className="mobileTableAction">
              <button
                type="button"
                className="deleteButton"
                onClick={() => handleDeleteTrade(record.id, onDataChange)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function handleDeleteRmbRecord(recordId, onDataChange) {
  if (!window.confirm('Are you sure you want to delete this record?')) {
    return;
  }

  onDataChange(deleteRmbToUsdRecord(recordId));
}

function handleDeleteTrade(recordId, onDataChange) {
  if (!window.confirm('Are you sure you want to delete this record?')) {
    return;
  }

  onDataChange(deleteCryptoTrade(recordId));
}

function getDefaultFeeCurrency(action, asset) {
  return action === 'Sell' ? 'USD' : asset;
}

function getTradeFeeCurrency(record, asset) {
  return record.feeCurrency || getDefaultFeeCurrency(record.action, asset);
}

function formatTradeFee(record, asset) {
  const feeCurrency = getTradeFeeCurrency(record, asset);

  if (feeCurrency === 'USD') {
    return formatUsdFee(record.fee);
  }

  return `${formatCryptoAmount(record.fee)} ${feeCurrency}`;
}

function SettingsBackup({ data, onDataImport }) {
  const fileInputRef = useRef(null);
  const [backupMessage, setBackupMessage] = useState('');

  function handleExportJson() {
    downloadTextFile(
      `portfolio-journal-backup-${getTodayStamp()}.json`,
      JSON.stringify(data, null, 2),
      'application/json',
    );
    setBackupMessage('JSON backup exported.');
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportJson(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!window.confirm('Importing this JSON backup will replace your current portfolio data. Continue?')) {
      event.target.value = '';
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsedData = JSON.parse(String(reader.result || '{}'));
        const savedData = savePortfolioData(parsedData);
        onDataImport(savedData);
        setBackupMessage('JSON backup imported.');
      } catch {
        setBackupMessage('Import failed. Please choose a valid JSON backup file.');
      } finally {
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      setBackupMessage('Import failed. Please try another JSON file.');
      event.target.value = '';
    };

    reader.readAsText(file);
  }

  function handleExportCsv() {
    downloadTextFile(
      `portfolio-journal-backup-${getTodayStamp()}.csv`,
      convertPortfolioDataToCsv(data),
      'text/csv',
    );
    setBackupMessage('CSV backup exported.');
  }

  return (
    <section className="contentStack">
      <div className="softCard">
        <span className="cardLabel">Backup</span>
        <div className="buttonStack" aria-label="Backup actions">
          <button type="button" className="secondaryButton" onClick={handleExportJson}>
            Export JSON
          </button>
          <button type="button" className="secondaryButton" onClick={handleImportClick}>
            Import JSON
          </button>
          <button type="button" className="secondaryButton" onClick={handleExportCsv}>
            Export CSV
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="visuallyHidden"
          onChange={handleImportJson}
        />
        {backupMessage && <p className="formHint">{backupMessage}</p>}
      </div>
    </section>
  );
}

function downloadTextFile(fileName, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function convertPortfolioDataToCsv(data) {
  const rows = [
    [
      'section',
      'id',
      'date',
      'category',
      'action',
      'asset',
      'amount',
      'rmbAmount',
      'exchangeRate',
      'usdReceived',
      'price',
      'fee',
      'feeCurrency',
      'quantity',
      'note',
      'createdAt',
    ],
  ];

  data.stocksAndFunds.forEach((record) => {
    rows.push([
      'stocksAndFunds',
      record.id,
      record.date,
      record.category,
      '',
      '',
      record.amount,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      record.note,
      record.createdAt,
    ]);
  });

  data.crypto.rmbToUsdRecords.forEach((record) => {
    rows.push([
      'rmbToUsdRecords',
      record.id,
      record.date,
      '',
      '',
      '',
      '',
      record.rmbAmount,
      record.exchangeRate,
      record.usdReceived,
      '',
      '',
      '',
      '',
      record.note,
      record.createdAt,
    ]);
  });

  data.crypto.trades.forEach((record) => {
    rows.push([
      'cryptoTrades',
      record.id,
      record.date,
      '',
      record.action,
      record.asset,
      '',
      '',
      '',
      '',
      record.usdAmount,
      record.fee,
      getTradeFeeCurrency(record, record.asset),
      record.quantity,
      record.note,
      record.createdAt,
    ]);
  });

  return rows.map((row) => row.map(formatCsvCell).join(',')).join('\n');
}

function formatCsvCell(value) {
  const stringValue = value == null ? '' : String(value);

  return `"${stringValue.replaceAll('"', '""')}"`;
}

function getTodayStamp() {
  return new Date().toISOString().slice(0, 10);
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
    .sort(compareCategoryGroups);
}

function compareCategoryGroups(first, second) {
  const totalComparison = second.total - first.total;

  if (totalComparison !== 0) {
    return totalComparison;
  }

  return first.category.localeCompare(second.category);
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
  }).format(value || 0);

  return `\u00a5${formattedNumber}`;
}

function formatUsd(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatUsdFee(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 10,
  }).format(value || 0);
}

function formatNumber(value, maximumFractionDigits) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value || 0);
}

function formatDisplayDate(value) {
  const [year, month, day] = String(value).split('-').map(Number);

  if (!year || !month || !day) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function formatCryptoAmount(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 10,
  }).format(value || 0);
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default App;
