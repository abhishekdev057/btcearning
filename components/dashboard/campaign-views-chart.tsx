'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'

const chartConfig = {
  views: {
    label: 'Views',
    color: 'var(--color-chart-1)',
  },
} satisfies ChartConfig

export function CampaignViewsChart({ data }: { data: { date: string; views: number }[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[220px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="4 8" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={10} />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={32} allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="views" fill="var(--color-views)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
