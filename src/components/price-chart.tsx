"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { formatPrice, formatDateShort } from "@/lib/utils"

interface PriceChartProps {
  data: Array<{
    id: string
    price: number | null
    scraped_at: string
    product_url_id: string
  }>
  urls: Array<{
    id: string
    websites: { id: string; name: string; domain: string }
  }>
}

const COLORS = [
  "hsl(262, 83%, 58%)", // primary purple
  "hsl(142, 76%, 36%)", // green
  "hsl(38, 92%, 50%)",  // orange
  "hsl(199, 89%, 48%)", // blue
  "hsl(0, 84%, 60%)",   // red
]

export function PriceChart({ data, urls }: PriceChartProps) {
  // Group data by date and website
  const chartData: Record<string, Record<string, number | null>> = {}

  data.forEach((item) => {
    const date = new Date(item.scraped_at).toISOString().split("T")[0]
    const url = urls.find((u) => u.id === item.product_url_id)
    if (!url) return

    if (!chartData[date]) {
      chartData[date] = {}
    }
    chartData[date][url.websites.name] = item.price
  })

  const formattedData = Object.entries(chartData)
    .map(([date, prices]) => ({
      date,
      ...prices,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (formattedData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No price data to display
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formattedData}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => formatDateShort(value)}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <YAxis
          tickFormatter={(value) => `₺${value}`}
          stroke="hsl(var(--muted-foreground))"
          fontSize={12}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
          labelFormatter={(value) => formatDateShort(value)}
          formatter={(value: number) => [formatPrice(value), ""]}
        />
        <Legend />
        {urls.map((url, index) => (
          <Line
            key={url.id}
            type="monotone"
            dataKey={url.websites.name}
            stroke={COLORS[index % COLORS.length]}
            strokeWidth={2}
            dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

