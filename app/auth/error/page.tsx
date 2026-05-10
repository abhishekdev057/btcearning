import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Bitcoin, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center gap-2">
            <Bitcoin className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-foreground">CryptoBTC</span>
          </div>
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-2xl text-foreground">
                Authentication Error
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {params?.error ? (
                <p className="text-sm text-muted-foreground mb-6">
                  Error: {params.error}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mb-6">
                  An unexpected error occurred during authentication. Please try again.
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Button asChild className="w-full">
                  <Link href="/auth/login">
                    Try Again
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">
                    Go Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
