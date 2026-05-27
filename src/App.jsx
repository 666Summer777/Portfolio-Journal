import { useMemo, useState } from 'react';
import { loadPortfolioData } from './storage';

const pages = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'stocks', label: 'Stocks & Funds' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'settings', label: 'Settings' },
];

function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const portfolioData = useMemo(() => loadPortfolioData(), []);

  return (
    <div className="appShell">
      <main className="appMain">
        <header className="appHeader">
          <p className="eyebrow">Portfolio Journal</p>
          <h1>{getPageTitle(activePage)}</h1>
        </header>

        {activePage === 'dashboard' && <Dashboard />}
        {activePage === 'stocks' && <StocksAndFunds data={portfolioData} />}
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

function Dashboard() {
  return (
    <section className="capitalCard" aria-labelledby="total-capital-title">
      <span className="cardLabel" id="total-capital-title">
        Total Capital In
      </span>
      <strong className="capitalAmount">$0</strong>
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

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default App;
