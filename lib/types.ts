export interface Profile {
  id: string
  email: string
  username: string | null
  btc_balance: number
  total_earned: number
  total_withdrawn: number
  referral_code: string
  referred_by: string | null
  created_at: string
  updated_at: string
}

export interface Ad {
  id: string
  user_id: string
  title: string
  description: string | null
  url: string
  reward_satoshi: number
  view_duration: number
  total_budget: number
  remaining_budget: number
  total_views: number
  max_views_per_user: number
  is_active: boolean
  created_at: string
}

export interface AdView {
  id: string
  ad_id: string
  user_id: string
  earned_satoshi: number
  viewed_at: string
}

export interface FaucetClaim {
  id: string
  user_id: string
  amount_satoshi: number
  claimed_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  bonus_earned: number
  created_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount_satoshi: number
  btc_address: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  created_at: string
  processed_at: string | null
}

export interface Transaction {
  id: string
  user_id: string
  type: 'ad_view' | 'faucet' | 'referral_bonus' | 'withdrawal' | 'ad_deposit'
  amount_satoshi: number
  description: string | null
  created_at: string
}

// Helper types
export type TransactionType = Transaction['type']
export type WithdrawalStatus = Withdrawal['status']

// Satoshi/BTC conversion helpers
export const SATOSHI_PER_BTC = 100_000_000

export function satoshiToBtc(satoshi: number): number {
  return satoshi / SATOSHI_PER_BTC
}

export function btcToSatoshi(btc: number): number {
  return Math.floor(btc * SATOSHI_PER_BTC)
}

export function formatSatoshi(satoshi: number): string {
  if (satoshi >= 100_000_000) {
    return `${(satoshi / 100_000_000).toFixed(8)} BTC`
  } else if (satoshi >= 1_000_000) {
    return `${(satoshi / 1_000_000).toFixed(2)}M sat`
  } else if (satoshi >= 1_000) {
    return `${(satoshi / 1_000).toFixed(2)}K sat`
  }
  return `${satoshi} sat`
}

export function formatBtc(satoshi: number): string {
  return `${(satoshi / 100_000_000).toFixed(8)} BTC`
}
