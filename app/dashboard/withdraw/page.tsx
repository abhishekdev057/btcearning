'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Wallet, Bitcoin, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatSatoshi } from '@/lib/types'
import useSWR from 'swr'
import { toast } from 'sonner'
import { PageHeader } from '@/components/dashboard/page-header'
import { LedgerRow } from '@/components/dashboard/ledger-row'
import { EmptyState } from '@/components/dashboard/empty-state'

const MIN_WITHDRAWAL = 10000 // 10,000 satoshi

export default function WithdrawPage() {
  const [btcAddress, setBtcAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { data, mutate } = useSWR('withdraw-data', async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const [profileResult, withdrawalsResult] = await Promise.all([
      supabase.from('profiles').select('btc_balance').eq('id', user.id).single(),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10)
    ])

    return {
      user,
      balance: profileResult.data?.btc_balance || 0,
      withdrawals: withdrawalsResult.data || []
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const amountNum = parseInt(amount)
      
      if (!btcAddress.trim()) {
        throw new Error('Please enter a Bitcoin address')
      }

      if (!amount || amountNum <= 0) {
        throw new Error('Please enter a valid amount')
      }

      if (amountNum < MIN_WITHDRAWAL) {
        throw new Error(`Minimum withdrawal is ${formatSatoshi(MIN_WITHDRAWAL)}`)
      }

      if (amountNum > (data?.balance || 0)) {
        throw new Error('Insufficient balance')
      }

      // Basic BTC address validation
      if (!/^(1|3|bc1)[a-zA-Z0-9]{25,62}$/.test(btcAddress.trim())) {
        throw new Error('Invalid Bitcoin address format')
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error: withdrawError } = await supabase
        .rpc('request_withdrawal', {
          p_amount: amountNum,
          p_btc_address: btcAddress.trim(),
        })
        .single()

      if (withdrawError) throw withdrawError

      setSuccess(true)
      setBtcAddress('')
      setAmount('')
      mutate()
      toast.success('Withdrawal request submitted for manual review')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Withdrawal failed'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle
      case 'pending':
      case 'processing': return Clock
      case 'rejected': return XCircle
      default: return Clock
    }
  }

  const getStatusTone = (status: string): 'success' | 'warning' | 'destructive' | 'muted' => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending':
      case 'processing': return 'warning'
      case 'rejected': return 'destructive'
      default: return 'muted'
    }
  }

  const getStatusIconTone = (status: string): 'success' | 'warning' | 'destructive' | 'primary' => {
    switch (status) {
      case 'completed': return 'success'
      case 'pending':
      case 'processing': return 'warning'
      case 'rejected': return 'destructive'
      default: return 'primary'
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Payout desk"
        title="Withdraw"
        description="Submit Bitcoin payout requests with manual review and ledger tracking."
        icon={Wallet}
      />

      {/* Balance Card */}
      <Card className="glass-panel shine-edge">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-muted-foreground">Available Balance</p>
            <p className="text-3xl font-bold text-foreground">{formatSatoshi(data?.balance || 0)}</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Bitcoin className="h-8 w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal Form */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-foreground">Request Withdrawal</CardTitle>
          <CardDescription>
            Minimum withdrawal: {formatSatoshi(MIN_WITHDRAWAL)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="btc-address" className="text-foreground">Bitcoin Address</Label>
              <Input
                id="btc-address"
                placeholder="Enter your Bitcoin address"
                value={btcAddress}
                onChange={(e) => setBtcAddress(e.target.value)}
                className="bg-input text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-foreground">Amount (satoshi)</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min={MIN_WITHDRAWAL}
                  max={data?.balance || 0}
                  className="bg-input text-foreground"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setAmount(String(data?.balance || 0))}
                >
                  Max
                </Button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-lg bg-success/10 p-3 text-success">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Withdrawal request submitted successfully!</span>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full gap-2"
              disabled={isSubmitting || (data?.balance || 0) < MIN_WITHDRAWAL}
            >
              <Wallet className="h-4 w-4" />
              {isSubmitting ? 'Processing...' : 'Request Withdrawal'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Important:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Minimum withdrawal amount is {formatSatoshi(MIN_WITHDRAWAL)}</li>
                <li>Withdrawals are processed manually within 24-48 hours</li>
                <li>Double-check your Bitcoin address before submitting</li>
                <li>Network fees will be deducted from the withdrawal amount</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-foreground">Withdrawal History</CardTitle>
          <CardDescription>Your recent withdrawal requests</CardDescription>
        </CardHeader>
        <CardContent>
          {!data?.withdrawals || data.withdrawals.length === 0 ? (
            <EmptyState icon={Wallet} title="No withdrawals yet" description="Submitted payout requests will appear here." />
          ) : (
            <div className="space-y-2">
              {data.withdrawals.map((withdrawal) => (
                <LedgerRow
                  key={withdrawal.id}
                  icon={getStatusIcon(withdrawal.status)}
                  iconTone={getStatusIconTone(withdrawal.status)}
                  title={formatSatoshi(withdrawal.amount_satoshi)}
                  subtitle={withdrawal.btc_address}
                  value={withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                  valueTone={getStatusTone(withdrawal.status)}
                  badge={<span className="text-[10px] text-muted-foreground">{new Date(withdrawal.created_at).toLocaleDateString()}</span>}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
