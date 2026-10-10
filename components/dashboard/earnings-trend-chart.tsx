'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatSatoshi } from '@/lib/types'

const chartConfig = {
  balance: {
    label: 'Balance',
    color: 'var(--color-chart-1)',
  },
} satisfies ChartConfig

export function EarningsTrendChart({ data }: { data: { date: string; balance: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[240px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fillBalance" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-balance)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--color-balance)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="4 8" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={24}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={56}
          tickFormatter={(value) => formatSatoshi(Number(value))}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => value}
              formatter={(value) => [formatSatoshi(Number(value)), ' Balance']}
            />
          }
        />
        <Area
          dataKey="balance"
          type="monotone"
          fill="url(#fillBalance)"
          stroke="var(--color-balance)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
