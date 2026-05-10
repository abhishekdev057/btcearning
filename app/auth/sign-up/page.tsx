'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { Bitcoin, ShieldCheck } from 'lucide-react'

function SignUpForm() {
  const searchParams = useSearchParams()
  const referralCode = searchParams.get('ref') || ''
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [refCode, setRefCode] = useState(referralCode)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    if (password !== repeatPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${window.location.origin}/dashboard`,
          data: {
            referred_by: refCode || null,
          },
        },
      })
      if (error) throw error
      router.push('/auth/sign-up-success')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="pointer-events-none absolute inset-0 ledger-grid opacity-35" />
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2">
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/25">
              <Bitcoin className="size-6" />
            </div>
            <span className="text-2xl font-bold text-foreground">CryptoBTC</span>
          </div>
          <Card className="glass-panel">
            <CardHeader>
              <CardTitle className="text-2xl text-foreground">Sign Up</CardTitle>
              <CardDescription className="text-muted-foreground">
                Create your account and start earning Bitcoin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email" className="text-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password" className="text-foreground">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Min. 6 characters"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="repeat-password" className="text-foreground">Confirm Password</Label>
                    <Input
                      id="repeat-password"
                      type="password"
                      required
                      value={repeatPassword}
                      onChange={(e) => setRepeatPassword(e.target.value)}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="referral" className="text-foreground">
                      Referral Code <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="referral"
                      type="text"
                      placeholder="Enter referral code"
                      value={refCode}
                      onChange={(e) => setRefCode(e.target.value)}
                      className="bg-input border-border text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/25 p-3 text-xs text-muted-foreground">
                    <ShieldCheck className="size-4 shrink-0 text-primary" />
                    Referral codes are validated by the database when your profile is created.
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground">
            By signing up, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-svh w-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
