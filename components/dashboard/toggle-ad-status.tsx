'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Pause, Play } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ToggleAdStatusProps {
  adId: string
  isActive: boolean
}

export function ToggleAdStatus({ adId, isActive }: ToggleAdStatusProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const toggle = async () => {
    setLoading(true)
    const supabase = createClient()
    
    await supabase.rpc('set_ad_status', {
      p_ad_id: adId,
      p_is_active: !isActive,
    })

    router.refresh()
    setLoading(false)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="gap-2"
    >
      {isActive ? (
        <>
          <Pause className="h-3 w-3" />
          Pause
        </>
      ) : (
        <>
          <Play className="h-3 w-3" />
          Resume
        </>
      )}
    </Button>
  )
}
