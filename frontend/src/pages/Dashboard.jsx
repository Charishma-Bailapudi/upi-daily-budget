import { useState } from 'react'
import { LogOut, WalletCards } from 'lucide-react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import AnalyticsCard from '../components/AnalyticsCard'
import DailyAllowanceCard from '../components/DailyAllowanceCard'
import PaymentSimulatorCard from '../components/PaymentSimulatorCard'
import TelegramLinkCard from '../components/TelegramLinkCard'
import TransactionHistoryCard from '../components/TransactionHistoryCard'

function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0)
  const { user } = useOutletContext()
  const navigate = useNavigate()

  function refreshDashboard() {
    setRefreshKey((key) => key + 1)
  }

  function handleLogout() {
    window.localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <Link className="brand" to="/" aria-label="UPI Budget home">
          <span className="brand-icon"><WalletCards size={21} /></span>
          <span>paisa<span className="brand-accent">wise</span></span>
        </Link>
        <div className="topbar-meta">
          <span className="live-indicator"><span /> Your money, in focus</span>
          <div className="account-actions">
            <span className="user-badge">
              <span className="user-avatar" aria-hidden="true">
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
              <span className="user-badge-name">{user?.name || user?.email || 'Account'}</span>
            </span>
            <button className="logout-button" type="button" onClick={handleLogout}>
              <LogOut size={15} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      <section className="dashboard-intro">
        <div>
          <span className="eyebrow">UPI DAILY BUDGET</span>
          <h1>Your daily money dashboard</h1>
          <p>A clear view of today&apos;s allowance, spending habits, and connected alerts.</p>
        </div>
        <span className="intro-date">
          {new Intl.DateTimeFormat('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }).format(new Date())}
        </span>
      </section>

      <div className="dashboard-grid">
        <DailyAllowanceCard refreshKey={refreshKey} />
        <TelegramLinkCard isLinked={user?.telegramLinked} />
        <AnalyticsCard refreshKey={refreshKey} />
        <PaymentSimulatorCard onPaymentSuccess={refreshDashboard} />
        <TransactionHistoryCard refreshKey={refreshKey} />
      </div>

      <footer className="dashboard-footer">
        <span>Built for mindful spending</span>
        <span>Your daily budget resets at midnight IST</span>
      </footer>
    </main>
  )
}

export default Dashboard
