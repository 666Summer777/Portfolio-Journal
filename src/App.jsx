import { useState } from 'react';
import {
  addCryptoTrade,
  addRmbToUsdRecord,
  deleteCryptoTrade,
  deleteRmbToUsdRecord,
  getCryptoAssetNetQuantity,
  getCryptoCapitalIn,
  getCryptoTradesGroupedByAsset,
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
  const isCryptoPage = activePage === 'crypto';

  return (
    <div className="appShell">
      <main className={isCryptoPage ? 'appMain cryptoMain' : 'appMain'}>
        {!isCryptoPage && (
          <header className="appHeader">
            <p className="eyebrow">Portfolio Journal</p>
            <h1>{getPageTitle(activePage)}</h1>
          </header>
        )}

        {activePage === 'dashboard' && (
          <Dashboard totalCapitalIn={getTotalCapitalIn(portfolioData)} />
        )}
        {activePage === 'stocks' && <StocksAndFunds data={portfolioData} />}
        {activePage === 'crypto' && (
          <Crypto data={portfolioData.crypto} onDataChange={setPortfolioData} />
        )}
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

function Dashboard({ totalCapitalIn }) {
  return (
    <section className="capitalCard" aria-labelledby="total-capital-title">
      <span className="cardLabel" id="total-capital-title">
        Total Capital In
      </span>
      <strong className="capitalAmount">{formatRmb(totalCapitalIn)}</strong>
    </section>
  );
}

function StocksAndFunds({ data }) {
  const total = data.stocksAndFunds.reduce((sum, record) => {
    const amount = Number(record.amount);
    return Number.isFinite(amount) ? sum + amount : sum;
  }, 0);

  return (
    <section className="contentStack">
      <div className="softCard">
        <span className="cardLabel">Stocks & Funds Total</span>
        <strong className="sectionAmount">{formatCurrency(total)}</strong>
      </div>
      <p className="placeholderText">Stocks & Funds tracking will be added soon.</p>
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
          <strong className="sectionAmount">{formatRmb(capitalIn)}</strong>
        </div>
      </div>

      <RmbToUsdForm onDataChange={onDataChange} onViewRecords={() => setCryptoView('rmb-records')} />
      <CryptoTradeForm onDataChange={onDataChange} onViewTrades={() => setCryptoView('crypto-trades')} />
    </section>
  );
}

function RmbToUsdForm({ onDataChange, onViewRecords }) {
  const [date, setDate] = useState(getToday());
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
        <input type="date" value={date} required onChange={(event) => setDate(event.target.value)} />
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
  const [date, setDate] = useState(getToday());
  const [action, setAction] = useState('Buy');
  const [assetChoice, setAssetChoice] = useState('BTC');
  const [customAsset, setCustomAsset] = useState('');
  const [usdAmount, setUsdAmount] = useState('');
  const [fee, setFee] = useState('');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const numericUsdAmount = Number(usdAmount);
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

    if (!Number.isFinite(numericUsdAmount) || numericUsdAmount <= 0) {
      setError('USD Amount must be greater than 0.');
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
      usdAmount: numericUsdAmount,
      fee: numericFee,
      quantity: numericQuantity,
      note: note.trim(),
    });

    onDataChange(nextData);
    setUsdAmount('');
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
        <input type="date" value={date} required onChange={(event) => setDate(event.target.value)} />
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
        <span>USD Amount</span>
        <input
          type="number"
          min="0"
          step="0.01"
          value={usdAmount}
          required
          inputMode="decimal"
          onChange={(event) => setUsdAmount(event.target.value)}
        />
      </label>

      <label className="field">
        <span>Fee</span>
        <input
          type="number"
          min="0"
          step="0.00000001"
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
              <strong>{formatRmb(record.rmbAmount)}</strong>
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
          <span role="columnheader">USD Amount</span>
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
              <span>USD Amount</span>
              <strong>{formatUsd(record.usdAmount)}</strong>
            </div>
            <div>
              <span>Fee</span>
              <strong>
                {formatCryptoAmount(record.fee)} {asset}
              </strong>
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

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatRmb(value) {
  return `\u00a5${new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value || 0)}`;
}

function formatUsd(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatNumber(value, maximumFractionDigits) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits,
  }).format(value || 0);
}

function formatCryptoAmount(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8,
  }).format(value || 0);
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

export default App;
