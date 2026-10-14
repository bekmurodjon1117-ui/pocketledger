/**
 * App.tsx — PocketLedger main application
 * Features: F1 F2 F3 F4 F5 F6 F7
 */

import { useCallback, useEffect, useState } from 'react'
import CategoryChart from './components/CategoryChart'
import {
  addTransaction,
  deleteTransaction,
  getBalance,
  getCategoryBreakdown,
  listTransactions,
  type Balance,
  type CategoryTotal,
  type Transaction,
} from './api'
import './App.css'

const CATEGORIES = [
  'Food', 'Transport', 'Housing', 'Health',
  'Entertainment', 'Shopping', 'Income', 'Other',
]

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [balance, setBalance] = useState<Balance | null>(null)
  const [breakdown, setBreakdown] = useState<CategoryTotal[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Form state
  const [form, setForm] = useState({
    amount: '',
    description: '',
    category: 'Food',
    date: new Date().toISOString().slice(0, 10),
  })

  const refresh = useCallback(async () => {
    try {
      const [txs, bal, bd] = await Promise.all([
        listTransactions(filterCategory || undefined),
        getBalance(),
        getCategoryBreakdown(),
      ])
      setTransactions(txs)
      setBalance(bal)
      setBreakdown(bd)
      setError('')
    } catch (e) {
      setError(String(e))
    }
  }, [filterCategory])

  useEffect(() => { void refresh() }, [refresh])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount.trim() || !form.description.trim()) return
    setLoading(true)
    try {
      await addTransaction(form)
      setForm({ ...form, amount: '', description: '' })
      await refresh()
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteTransaction(id)
      await refresh()
    } catch (e) {
      setError(String(e))
    }
  }

  const fmt = (v: string) =>
    Number(v) >= 0
      ? `+€${Number(v).toFixed(2)}`
      : `-€${Math.abs(Number(v)).toFixed(2)}`

  return (
    <div className="app">
      <header className="app-header">
        <h1>💰 PocketLedger</h1>
        {balance && (
          <div className="balance-bar">
            <span className="income">Income: €{Number(balance.income).toFixed(2)}</span>
            <span className="sep">|</span>
            <span className="expense">Expense: €{Math.abs(Number(balance.expense)).toFixed(2)}</span>
            <span className="sep">|</span>
            <span className={Number(balance.balance) >= 0 ? 'income' : 'expense'}>
              Balance: €{Number(balance.balance).toFixed(2)}
            </span>
          </div>
        )}
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main className="app-main">
        {/* ── Add transaction ── */}
        <section className="card">
          <h2>Add Transaction</h2>
          <form onSubmit={(e) => { void handleAdd(e) }} className="tx-form">
            <input
              type="number"
              step="0.01"
              placeholder="Amount (negative = expense)"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? 'Adding…' : 'Add'}
            </button>
          </form>
        </section>

        {/* ── Chart ── */}
        <section className="card">
          <h2>Category Breakdown</h2>
          <CategoryChart data={breakdown} />
        </section>

        {/* ── Transaction list ── */}
        <section className="card">
          <div className="list-header">
            <h2>Transactions</h2>
            {/* F7 — filter by category */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="filter-select"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          {transactions.length === 0 ? (
            <p className="empty">No transactions yet.</p>
          ) : (
            <ul className="tx-list">
              {transactions.map((tx) => (
                <li key={tx.id} className="tx-item">
                  <span className="tx-date">{tx.date}</span>
                  <span className="tx-desc">{tx.description}</span>
                  <span className="tx-cat">{tx.category}</span>
                  <span className={`tx-amount ${Number(tx.amount) >= 0 ? 'income' : 'expense'}`}>
                    {fmt(tx.amount)}
                  </span>
                  <button
                    className="delete-btn"
                    onClick={() => { void handleDelete(tx.id) }}
                    aria-label="Delete"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
