import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Play, Droplets, Users, Wallet, Bitcoin, History } from 'lucide-react'
import { formatSatoshi } from '@/lib/types'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch transactions
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'ad_view': return <Play className="h-4 w-4 text-chart-1" />
      case 'faucet': return <Droplets className="h-4 w-4 text-chart-2" />
      case 'referral_bonus': return <Users className="h-4 w-4 text-chart-3" />
      case 'withdrawal': return <Wallet className="h-4 w-4 text-destructive" />
      case 'ad_deposit': return <Bitcoin className="h-4 w-4 text-primary" />
      default: return <Bitcoin className="h-4 w-4 text-muted-foreground" />
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

  // Group transactions by date
  const groupedTransactions = (transactions || []).reduce<Record<string, TransactionRow[]>>((groups, tx) => {
    const date = new Date(tx.created_at).toLocaleDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(tx)
    return groups
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
        <p className="text-muted-foreground">View all your earnings and withdrawals</p>
      </div>

      {!transactions || transactions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground">No Transactions Yet</h3>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Start earning by viewing ads or claiming the faucet!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTransactions).map(([date, txs]) => (
            <Card key={date}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{date}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {txs?.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {getTransactionLabel(tx.type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {tx.description || new Date(tx.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <span className={`font-medium ${tx.amount_satoshi >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {tx.amount_satoshi >= 0 ? '+' : ''}{formatSatoshi(tx.amount_satoshi)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
