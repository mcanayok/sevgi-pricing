"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice, formatDate } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, ChevronDown } from "lucide-react"

interface PriceHistoryItem {
  id: string
  price: number | null
  scraped_at: string
  product_url_id: string
}

interface Url {
  id: string
  brands: { id: string; name: string; domain: string; is_required: boolean }
}

interface PriceHistoryTableProps {
  priceHistory: PriceHistoryItem[]
  urls: Url[]
}

export function PriceHistoryTable({ priceHistory, urls }: PriceHistoryTableProps) {
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null)
  const [showCount, setShowCount] = useState(20)

  // Filter by brand if selected
  const filteredHistory = selectedBrand
    ? priceHistory.filter((ph) => {
        const url = urls.find((u) => u.id === ph.product_url_id)
        return url?.brands.id === selectedBrand
      })
    : priceHistory

  // Sort by date - newest first for display
  const sortedHistory = [...filteredHistory].sort((a, b) =>
    new Date(b.scraped_at).getTime() - new Date(a.scraped_at).getTime()
  )
  const displayHistory = sortedHistory.slice(0, showCount)

  // Calculate price changes
  const getPriceChange = (currentPrice: number | null, index: number) => {
    if (!currentPrice || index >= sortedHistory.length - 1) return null

    const currentItem = sortedHistory[index]
    const url = urls.find((u) => u.id === currentItem.product_url_id)

    // Find previous price for same brand
    for (let i = index + 1; i < sortedHistory.length; i++) {
      const prevItem = sortedHistory[i]
      const prevUrl = urls.find((u) => u.id === prevItem.product_url_id)

      if (prevUrl?.brands.id === url?.brands.id && prevItem.price) {
        const change = currentPrice - prevItem.price
        const percentChange = (change / prevItem.price) * 100
        return { change, percentChange, prevPrice: prevItem.price }
      }
    }
    return null
  }

  // Get unique brands
  const uniqueBrands = Array.from(
    new Set(
      urls
        .filter((url) => priceHistory.some((ph) => ph.product_url_id === url.id))
        .map((url) => url.brands.id)
    )
  ).map((id) => urls.find((url) => url.brands.id === id)!)

  if (priceHistory.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No price history yet. Run a scrape to collect prices.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Brand Filter */}
      {uniqueBrands.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedBrand === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedBrand(null)}
          >
            All Brands ({priceHistory.length})
          </Button>
          {uniqueBrands.map((url) => {
            const count = priceHistory.filter(
              (ph) => urls.find((u) => u.id === ph.product_url_id)?.brands.id === url.brands.id
            ).length
            return (
              <Button
                key={url.brands.id}
                variant={selectedBrand === url.brands.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBrand(url.brands.id)}
              >
                {url.brands.name} ({count})
              </Button>
            )
          })}
        </div>
      )}

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayHistory.map((ph, index) => {
            const url = urls.find((u) => u.id === ph.product_url_id)
            const priceChange = getPriceChange(ph.price, index)

            return (
              <TableRow key={ph.id}>
                <TableCell className="text-muted-foreground">
                  {formatDate(ph.scraped_at)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{url?.brands.name}</Badge>
                </TableCell>
                <TableCell className="font-medium text-lg">
                  {formatPrice(ph.price)}
                </TableCell>
                <TableCell>
                  {priceChange ? (
                    <div className="flex items-center gap-2">
                      {priceChange.change > 0 ? (
                        <>
                          <TrendingUp className="h-4 w-4 text-red-500" />
                          <span className="text-red-500 text-sm font-medium">
                            +{formatPrice(priceChange.change)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            (+{priceChange.percentChange.toFixed(1)}%)
                          </span>
                        </>
                      ) : priceChange.change < 0 ? (
                        <>
                          <TrendingDown className="h-4 w-4 text-green-500" />
                          <span className="text-green-500 text-sm font-medium">
                            {formatPrice(priceChange.change)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            ({priceChange.percentChange.toFixed(1)}%)
                          </span>
                        </>
                      ) : (
                        <>
                          <Minus className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">No change</span>
                        </>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">First record</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Load More */}
      {sortedHistory.length > showCount && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={() => setShowCount((prev) => prev + 20)}
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            Show More ({sortedHistory.length - showCount} remaining)
          </Button>
        </div>
      )}
    </div>
  )
}
