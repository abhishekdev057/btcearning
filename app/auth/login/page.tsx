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
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Bitcoin, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/dashboard')
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
              <CardTitle className="text-2xl text-foreground">Login</CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
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
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-input border-border text-foreground"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/25 p-3 text-xs text-muted-foreground">
                    <ShieldCheck className="size-4 shrink-0 text-primary" />
                    Sessions are refreshed through Supabase secure server cookies.
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {"Don't have an account?"}{' '}
                  <Link
                    href="/auth/sign-up"
                    className="text-primary underline underline-offset-4 hover:text-primary/80"
                  >
                    Sign up
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
          <p className="text-center text-xs text-muted-foreground">
            By logging in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  )
}
