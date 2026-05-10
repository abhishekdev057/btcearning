'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'

interface ReferralLinkCopyProps {
  link: string
  code: string
}

export function ReferralLinkCopy({ link, code }: ReferralLinkCopyProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input 
          value={link} 
          readOnly 
          className="bg-muted/50 text-foreground"
        />
        <Button onClick={copyToClipboard} variant="outline" className="shrink-0 gap-2">
          {copied ? (
            <>
              <Check className="h-4 w-4 text-success" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Your referral code:</span>
        <code className="rounded bg-muted px-2 py-1 font-mono text-primary">{code}</code>
      </div>
    </div>
  )
}
