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
    original_price: number | null
    discount_price: number | null
    member_price: number | null
    scraped_at: string
    product_url_id: string
  }>
  urls: Array<{
    id: string
    brands: { id: string; name: string; domain: string; is_required: boolean }
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
  // Group data by date and brand, tracking all price types
  const chartData: Record<string, Record<string, number | null>> = {}

  data.forEach((item) => {
    const date = new Date(item.scraped_at).toISOString().split("T")[0]
    const url = urls.find((u) => u.id === item.product_url_id)
    if (!url) return

    if (!chartData[date]) {
      chartData[date] = {}
    }

    // Use the effective price (member > discount > original)
    const effectivePrice = item.member_price || item.discount_price || item.original_price || item.price

    // Store original price if different from effective price
    if (item.original_price && item.original_price !== effectivePrice) {
      chartData[date][`${url.brands.name} (Original)`] = item.original_price
    }

    // Store discount price
    if (item.discount_price) {
      chartData[date][`${url.brands.name} (Discount)`] = item.discount_price
    }

    // Store member price or effective price
    if (item.member_price) {
      chartData[date][`${url.brands.name} (Plus)`] = item.member_price
    } else {
      chartData[date][url.brands.name] = effectivePrice
    }
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

  // Determine which price types exist
  const priceTypes = new Set<string>()
  formattedData.forEach((item) => {
    Object.keys(item).forEach((key) => {
      if (key !== 'date') priceTypes.add(key)
    })
  })

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
        {Array.from(priceTypes).map((priceType, index) => {
          const isOriginal = priceType.includes('(Original)')
          const isDiscount = priceType.includes('(Discount)')
          const isPlus = priceType.includes('(Plus)')

          return (
            <Line
              key={priceType}
              type="monotone"
              dataKey={priceType}
              stroke={isOriginal ? "hsl(0, 0%, 50%)" : isPlus ? "hsl(262, 83%, 58%)" : COLORS[index % COLORS.length]}
              strokeWidth={isOriginal ? 1 : 2}
              strokeDasharray={isOriginal ? "3 3" : undefined}
              dot={{ fill: isOriginal ? "hsl(0, 0%, 50%)" : isPlus ? "hsl(262, 83%, 58%)" : COLORS[index % COLORS.length], strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          )
        })}
      </LineChart>
    </ResponsiveContainer>
  )
}

