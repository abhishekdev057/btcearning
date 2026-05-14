'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export type AdSlotVariant = 'leaderboard' | 'skyscraper' | 'native'

type IframeAdConfig = {
  kind: 'iframe'
  name: string
  key: string
  width: number
  height: number
  src: string
}

type NativeAdConfig = {
  kind: 'native'
  name: string
  containerId: string
  height: number
  src: string
}

type AdConfig = IframeAdConfig | NativeAdConfig

const AD_SLOTS: Record<AdSlotVariant, AdConfig> = {
  skyscraper: {
    kind: 'iframe',
    name: '160x300_1',
    key: '14e22f52ee909423a840ef596aee5a6b',
    width: 160,
    height: 300,
    src: 'https://evacuateenclose.com/14e22f52ee909423a840ef596aee5a6b/invoke.js',
  },
  leaderboard: {
    kind: 'iframe',
    name: '468x60_1',
    key: '6b61f47f370a846bf85c3fdd46bac765',
    width: 468,
    height: 60,
    src: 'https://evacuateenclose.com/6b61f47f370a846bf85c3fdd46bac765/invoke.js',
  },
  native: {
    kind: 'native',
    name: 'NativeBanner_1',
    containerId: 'container-d5e783df795ad9b1998e9d977945a400',
    height: 300,
    src: 'https://evacuateenclose.com/d5e783df795ad9b1998e9d977945a400/invoke.js',
  },
}

const ACTION_SCRIPTS = {
  popunder: 'https://evacuateenclose.com/99/42/08/99420871fd97d44766baf9cd12551b4d.js',
  socialBar: 'https://evacuateenclose.com/f2/d5/e5/f2d5e5029c2aaa41310c361d36801dd2.js',
}

export const SMART_LINK_URL = 'https://evacuateenclose.com/ez9xf1x8ge?key=c6468c254110c8873c997b65b17a4787'

const ACTION_THROTTLE_MS = 20_000

declare global {
  interface Window {
    __cryptoBtcAdActions?: Record<string, number>
  }
}

function buildSrcDoc(config: AdConfig) {
  if (config.kind === 'native') {
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; width: 100%; min-height: ${config.height}px; overflow: hidden; background: transparent; }
      #${config.containerId} { width: 100%; min-height: ${config.height}px; }
    </style>
  </head>
  <body>
    <script async="async" data-cfasync="false" src="${config.src}"><\/script>
    <div id="${config.containerId}"></div>
  </body>
</html>`
  }

  const options = JSON.stringify({
    key: config.key,
    format: 'iframe',
    height: config.height,
    width: config.width,
    params: {},
  })

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; width: ${config.width}px; height: ${config.height}px; overflow: hidden; background: transparent; }
    </style>
  </head>
  <body>
    <script>atOptions = ${options};<\/script>
    <script src="${config.src}"><\/script>
  </body>
</html>`
}

function appendActionScript(src: string, token: string, once = false) {
  if (once && document.querySelector(`script[data-crypto-ad="${token}"]`)) {
    return
  }

  const script = document.createElement('script')
  script.src = src
  script.async = false
  script.dataset.cfasync = 'false'
  script.dataset.cryptoAd = token
  document.body.appendChild(script)
}

function openSmartLinkWindow() {
  window.open(SMART_LINK_URL, '_blank', 'noopener,noreferrer')
}

export function triggerRewardAdEvent(
  placement: string,
  options: {
    includePopunder?: boolean
    includeSocialBar?: boolean
    openSmartLink?: boolean
  } = {},
) {
  if (typeof window === 'undefined') return

  const {
    includePopunder = true,
    includeSocialBar = true,
    openSmartLink = false,
  } = options

  const now = Date.now()
  const actions = window.__cryptoBtcAdActions ?? {}
  const lastRun = actions[placement] ?? 0

  if (now - lastRun < ACTION_THROTTLE_MS) {
    if (openSmartLink) openSmartLinkWindow()
    return
  }

  actions[placement] = now
  window.__cryptoBtcAdActions = actions

  if (includeSocialBar) {
    appendActionScript(ACTION_SCRIPTS.socialBar, 'social-bar', true)
  }

  if (includePopunder) {
    appendActionScript(ACTION_SCRIPTS.popunder, `popunder-${placement}-${now}`)
  }

  if (openSmartLink) {
    openSmartLinkWindow()
  }
}

export function openSponsorLink(placement = 'sponsor-link') {
  triggerRewardAdEvent(placement, {
    includePopunder: false,
    includeSocialBar: true,
    openSmartLink: true,
  })
}

export function AdSlot({
  variant,
  className,
  frameClassName,
}: {
  variant: AdSlotVariant
  className?: string
  frameClassName?: string
}) {
  const config = AD_SLOTS[variant]
  const isNative = config.kind === 'native'
  const iframeWidth = isNative ? '100%' : config.width
  const iframeHeight = config.height
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(false)
  }, [variant])

  return (
    <aside
      className={cn(
        'overflow-hidden rounded-lg border border-border/50 bg-background/35 p-2 shadow-sm shadow-black/20',
        variant === 'skyscraper' && 'w-[176px]',
        variant === 'leaderboard' && 'w-full max-w-[486px]',
        variant === 'native' && 'w-full',
        className,
      )}
      aria-label="Sponsored advertisement"
    >
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-md bg-card/45',
          variant === 'leaderboard' && 'min-h-[60px]',
          variant === 'skyscraper' && 'min-h-[300px]',
          variant === 'native' && 'min-h-[300px]',
          frameClassName,
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.08),transparent)] opacity-100 transition-opacity duration-500 motion-safe:animate-pulse',
            isLoaded && 'opacity-0',
          )}
        />
        <iframe
          title="Sponsored placement"
          srcDoc={buildSrcDoc(config)}
          width={iframeWidth}
          height={iframeHeight}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-same-origin"
          onLoad={() => setIsLoaded(true)}
          className={cn(
            'relative z-10 block max-w-full border-0 bg-transparent transition-opacity duration-700',
            isLoaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      </div>
    </aside>
  )
}
