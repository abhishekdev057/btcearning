import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Droplets, Users, Wallet, Bitcoin, History, TrendingUp, TrendingDown } from 'lucide-react'
import { formatSatoshi } from '@/lib/types'
import { PageHeader } from '@/components/dashboard/page-header'
import { MetricCard } from '@/components/dashboard/metric-card'
import { LedgerRow } from '@/components/dashboard/ledger-row'
import { EmptyState } from '@/components/dashboard/empty-state'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ad_view': return Play
      case 'faucet': return Droplets
      case 'referral_bonus': return Users
      case 'withdrawal': return Wallet
      case 'ad_deposit': return Bitcoin
      default: return Bitcoin
    }
  }

  const getTransactionTone = (type: string) => {
    switch (type) {
      case 'ad_view': return 'info' as const
      case 'faucet': return 'info' as const
      case 'referral_bonus': return 'success' as const
      case 'withdrawal': return 'destructive' as const
      case 'ad_deposit': return 'primary' as const
      default: return 'primary' as const
    }
  }

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'ad_view': return 'Ad View'
      case 'faucet': return 'Faucet Claim'
      case 'referral_bonus': return 'Referral Bonus'
      case 'withdrawal': return 'Withdrawal'
      case 'ad_deposit': return 'Ad Deposit'
      default: return type
    }
  }

  type TransactionRow = NonNullable<typeof transactions>[number]

  const groupedTransactions = (transactions || []).reduce<Record<string, TransactionRow[]>>((groups, tx) => {
    const date = new Date(tx.created_at).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(tx)
    return groups
  }, {})

  const totalCredited = (transactions || []).filter(tx => tx.amount_satoshi > 0).reduce((sum, tx) => sum + tx.amount_satoshi, 0)
  const totalDebited = (transactions || []).filter(tx => tx.amount_satoshi < 0).reduce((sum, tx) => sum + Math.abs(tx.amount_satoshi), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Ledger"
        title="Transaction History"
        description="A complete, protected record of every credit and debit on your account."
        icon={History}
      />

      {transactions && transactions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Total Entries" value={transactions.length} detail="Ledger records shown" icon={History} />
          <MetricCard title="Total Credited" value={formatSatoshi(totalCredited)} detail="Rewards + bonuses" icon={TrendingUp} tone="success" />
          <MetricCard title="Total Debited" value={formatSatoshi(totalDebited)} detail="Withdrawals + spend" icon={TrendingDown} tone="warning" />
        </div>
      )}

      {!transactions || transactions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No transactions yet"
          description="Start earning by viewing ads or claiming the faucet!"
          actionHref="/dashboard/surf"
          actionLabel="Find Ads"
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <Card key={date} className="glass-panel">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{date}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {txs?.map((tx) => (
                  <LedgerRow
                    key={tx.id}
                    icon={getTransactionIcon(tx.type)}
                    iconTone={getTransactionTone(tx.type)}
                    title={getTransactionLabel(tx.type)}
                    subtitle={tx.description || new Date(tx.created_at).toLocaleTimeString()}
                    value={`${tx.amount_satoshi >= 0 ? '+' : ''}${formatSatoshi(tx.amount_satoshi)}`}
                    valueTone={tx.amount_satoshi >= 0 ? 'success' : 'destructive'}
                  />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
