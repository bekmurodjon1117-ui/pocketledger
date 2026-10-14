/**
 * api.ts — PocketLedger API client
 * Loads base URL and Bearer token from environment variables.
 * Never hardcoded — loaded from .env via import.meta.env.
 */

const BASE = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000'
const TOKEN = import.meta.env.VITE_API_TOKEN ?? ''

function headers(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...init, headers: headers() })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`${res.status} ${msg}`)
  }
  if (res.status === 204) return undefined as unknown as T
  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Transaction {
  id: string
  amount: string
  description: string
  category: string
  date: string
}

export interface TransactionIn {
  amount: string
  description: string
  category: string
  date: string
}

export interface Balance {
  income: string
  expense: string
  balance: string
}

export interface CategoryTotal {
  category: string
  total: string
}

// ---------------------------------------------------------------------------
// API calls
// ---------------------------------------------------------------------------

/**
 * F1 — Add a transaction
 */
export function addTransaction(data: TransactionIn): Promise<Transaction> {
  return request<Transaction>('/transactions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * F2 — List transactions (newest first). F7 — optional category filter.
 */
export function listTransactions(category?: string): Promise<Transaction[]> {
  const qs = category ? `?category=${encodeURIComponent(category)}` : ''
  return request<Transaction[]>(`/transactions${qs}`)
}

/**
 * F3 — Delete transaction by ID
 */
export function deleteTransaction(id: string): Promise<void> {
  return request<void>(`/transactions/${id}`, { method: 'DELETE' })
}

/**
 * F4 — Live balance
 */
export function getBalance(): Promise<Balance> {
  return request<Balance>('/balance')
}

/**
 * F5 — Category breakdown
 */
export function getCategoryBreakdown(): Promise<CategoryTotal[]> {
  return request<CategoryTotal[]>('/categories/breakdown')
}
