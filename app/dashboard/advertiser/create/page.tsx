'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatSatoshi } from '@/lib/types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CreateAdPage() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [url, setUrl] = useState('')
  const [rewardSatoshi, setRewardSatoshi] = useState(50)
  const [viewDuration, setViewDuration] = useState(15)
  const [budget, setBudget] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const budgetNum = parseInt(budget) || 0
  const estimatedViews = budgetNum > 0 ? Math.floor(budgetNum / rewardSatoshi) : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (!title.trim()) throw new Error('Title is required')
      if (!url.trim()) throw new Error('URL is required')
      if (!budget || budgetNum <= 0) throw new Error('Budget is required')
      if (budgetNum < rewardSatoshi) throw new Error('Budget must be at least equal to reward per view')

      // Validate URL
      try {
        new URL(url)
      } catch {
        throw new Error('Invalid URL format')
      }

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check user balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('btc_balance')
        .eq('id', user.id)
        .single()

      if (!profile || profile.btc_balance < budgetNum) {
        throw new Error('Insufficient balance. Please earn more or deposit funds.')
      }

      const { error: adError } = await supabase
        .rpc('create_ad_campaign', {
          p_title: title.trim(),
          p_description: description.trim() || null,
          p_url: url.trim(),
          p_reward_satoshi: rewardSatoshi,
          p_view_duration: viewDuration,
          p_total_budget: budgetNum,
        })

      if (adError) throw adError

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/advertiser')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create ad')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/advertiser">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create New Ad</h1>
          <p className="text-muted-foreground">Set up your advertising campaign</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Campaign Details</CardTitle>
              <CardDescription>Fill in the details for your ad</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-foreground">Ad Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter a catchy title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-input text-foreground"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-foreground">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what users will see (optional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="bg-input text-foreground"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url" className="text-foreground">Website URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">Reward Per View</Label>
                    <span className="text-sm font-medium text-primary">{formatSatoshi(rewardSatoshi)}</span>
                  </div>
                  <Slider
                    value={[rewardSatoshi]}
                    onValueChange={([value]) => setRewardSatoshi(value)}
                    min={10}
                    max={500}
                    step={10}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher rewards attract more viewers
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-foreground">View Duration</Label>
                    <span className="text-sm font-medium text-foreground">{viewDuration} seconds</span>
                  </div>
                  <Slider
                    value={[viewDuration]}
                    onValueChange={([value]) => setViewDuration(value)}
                    min={5}
                    max={60}
                    step={5}
                  />
                  <p className="text-xs text-muted-foreground">
                    How long users must view your site
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-foreground">Campaign Budget (satoshi) *</Label>
                  <Input
                    id="budget"
                    type="number"
                    placeholder="Enter total budget"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="bg-input text-foreground"
                    min={rewardSatoshi}
                  />
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
                    <span className="text-sm">Ad created successfully! Redirecting...</span>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting || success}>
                  {isSubmitting ? 'Creating...' : 'Create Campaign'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">Campaign Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reward per view</span>
                <span className="font-medium text-foreground">{formatSatoshi(rewardSatoshi)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">View duration</span>
                <span className="font-medium text-foreground">{viewDuration}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total budget</span>
                <span className="font-medium text-foreground">{formatSatoshi(budgetNum)}</span>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estimated views</span>
                  <span className="text-lg font-bold text-primary">{estimatedViews.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-foreground">Tips for Better Ads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Use a clear, descriptive title</p>
              <p>• Higher rewards attract more viewers</p>
              <p>• Shorter durations get more completions</p>
              <p>• Make sure your website loads fast</p>
              <p>• Mobile-friendly sites perform better</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
