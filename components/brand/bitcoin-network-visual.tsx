import { Bitcoin, Droplets, Megaphone, MousePointerClick, Wallet } from 'lucide-react'

export function BitcoinNetworkVisual() {
  return (
    <div className="relative mx-auto aspect-[4/3] w-full max-w-[620px] overflow-hidden rounded-xl border border-border/70 bg-card/70 p-4 shadow-2xl shadow-black/30 md:p-6">
      <div className="absolute inset-0 ledger-grid opacity-70" />
      <div className="absolute left-8 top-8 h-28 w-28 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-8 right-8 h-32 w-32 rounded-full bg-chart-2/15 blur-3xl" />

      <svg className="absolute inset-0 h-full w-full text-border/80" viewBox="0 0 620 465" aria-hidden="true">
        <path d="M117 312 C210 228 310 320 402 184" fill="none" stroke="currentColor" strokeDasharray="8 10" strokeWidth="2" />
        <path d="M174 128 C252 204 358 82 472 148" fill="none" stroke="currentColor" strokeDasharray="8 10" strokeWidth="2" />
        <path d="M134 336 C268 382 410 326 496 248" fill="none" stroke="currentColor" strokeDasharray="8 10" strokeWidth="2" />
      </svg>

      <div className="relative grid h-full grid-cols-12 grid-rows-10 gap-3">
        <div className="glass-panel shine-edge col-span-7 row-span-4 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">Live balance</p>
              <p className="mt-2 text-3xl font-bold text-foreground">42,850 sat</p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground pulse-ring">
              <Bitcoin className="size-6" />
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-2/3 rounded-full bg-primary" />
          </div>
          <div className="mt-3 flex justify-between text-xs text-muted-foreground">
            <span>Today +920 sat</span>
            <span>Next payout 10k</span>
          </div>
        </div>

        <div className="glass-panel col-span-5 row-span-3 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <MousePointerClick className="size-4 text-primary" />
            Verified surf
          </div>
          <div className="mt-4 space-y-2">
            {[78, 54, 92].map((width, index) => (
              <div key={index} className="h-2 rounded-full bg-muted">
                <div className="h-full rounded-full bg-chart-3" style={{ width: `${width}%` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel col-span-4 col-start-2 row-span-3 row-start-6 rounded-lg p-4 float-soft">
          <Droplets className="size-5 text-chart-2" />
          <p className="mt-3 text-xl font-bold text-foreground">1h faucet</p>
          <p className="text-xs text-muted-foreground">Cooldown protected rewards</p>
        </div>

        <div className="glass-panel col-span-4 col-start-6 row-span-3 row-start-5 rounded-lg p-4">
          <Megaphone className="size-5 text-primary" />
          <p className="mt-3 text-xl font-bold text-foreground">Campaigns</p>
          <p className="text-xs text-muted-foreground">Budget locked by ledger</p>
        </div>

        <div className="glass-panel col-span-4 col-start-9 row-span-3 row-start-7 rounded-lg p-4 float-soft">
          <Wallet className="size-5 text-chart-4" />
          <p className="mt-3 text-xl font-bold text-foreground">Withdraw</p>
          <p className="text-xs text-muted-foreground">Manual review queue</p>
        </div>
      </div>
    </div>
  )
}
