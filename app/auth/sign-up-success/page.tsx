import { BitcoinNetworkVisual } from '@/components/brand/bitcoin-network-visual'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowRight, Bitcoin, Mail, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function SignUpSuccessPage() {
  return (
    <div className="grid min-h-svh w-full items-center gap-8 px-6 py-10 md:grid-cols-[0.95fr_1.05fr] md:px-10">
      <div className="mx-auto w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Bitcoin className="size-6" />
          </div>
          <span className="text-2xl font-bold text-foreground">CryptoBTC</span>
        </Link>

        <Card className="glass-panel">
          <CardHeader>
            <div className="mb-5 flex size-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary pulse-ring">
              <Mail className="size-8" />
            </div>
            <CardTitle className="text-3xl text-foreground">Check your email</CardTitle>
            <CardDescription className="text-muted-foreground">
              We sent you a confirmation link to activate your rewards workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border/70 bg-muted/25 p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <ShieldCheck className="size-4 text-primary" />
                Account activation required
              </div>
              Open the email, confirm your account, then log in to access Surf Ads, Faucet, Referrals, Campaigns, and Withdrawals.
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button asChild className="gap-2">
                <Link href="/auth/login">
                  Back to Login
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:block">
        <BitcoinNetworkVisual />
      </div>
    </div>
  )
}
