import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPrice, formatDate } from "@/lib/utils"
import { ArrowLeft, ExternalLink, Edit } from "lucide-react"
import Link from "next/link"
import { PriceChart } from "@/components/price-chart"
import { RefreshProductButton } from "@/components/refresh-product-button"
import { PriceHistoryTable } from "@/components/price-history-table"

interface ProductPageProps {
  params: Promise<{ slug: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single()

  const canEdit = profile?.role === "admin" || profile?.role === "editor"

  // Fetch product with URLs
  const { data: product } = await supabase
    .from("products")
    .select(`
      *,
      product_urls(
        id,
        url,
        is_active,
        last_price,
        original_price,
        discount_price,
        member_price,
        last_scraped_at,
        brand_id,
        brands(id, name, domain, is_required, color)
      )
    `)
    .eq("slug", slug)
    .single()

  if (!product) {
    notFound()
  }

  // Fetch price history for this product
  const productUrlIds = (product.product_urls as Array<{ id: string }>)?.map((pu) => pu.id) || []
  
  let priceHistory: Array<{
    id: string
    price: number | null
    original_price: number | null
    discount_price: number | null
    member_price: number | null
    scraped_at: string
    product_url_id: string
  }> = []

  if (productUrlIds.length > 0) {
    const { data } = await supabase
      .from("price_history")
      .select("*")
      .in("product_url_id", productUrlIds)
      .order("scraped_at", { ascending: false })
      .limit(100)

    priceHistory = data || []
  }

  const urls = product.product_urls as Array<{
    id: string
    url: string
    is_active: boolean
    last_price: number | null
    original_price: number | null
    discount_price: number | null
    member_price: number | null
    last_scraped_at: string | null
    brand_id: string
    brands: { id: string; name: string; domain: string; is_required: boolean; color: string | null }
  }>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              {urls?.find((url) => url.brands && !url.brands.is_required)?.brands && (
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: urls.find((url) => url.brands && !url.brands.is_required)?.brands.color || '#64748b',
                    }}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {urls.find((url) => url.brands && !url.brands.is_required)?.brands.name}
                  </span>
                </div>
              )}
            </div>
            {product.subcategory && (
              <p className="text-sm text-muted-foreground mt-1">
                Subcategory: {product.subcategory}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <RefreshProductButton productId={product.id} />
          {canEdit && (
            <Link href={`/products/${product.slug}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Current Prices */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {urls?.sort((a, b) => {
          // Put Trendyol last (on the right)
          const aIsTrendyol = a.brands.name.toLowerCase().includes('trendyol')
          const bIsTrendyol = b.brands.name.toLowerCase().includes('trendyol')
          if (aIsTrendyol && !bIsTrendyol) return 1
          if (!aIsTrendyol && bIsTrendyol) return -1
          return 0
        }).map((url) => {
          const currentPrice = url.member_price || url.discount_price || url.original_price
          const hasDiscount = url.discount_price || url.member_price
          const savings = url.original_price && currentPrice && url.original_price > currentPrice
            ? Math.round(((url.original_price - currentPrice) / url.original_price) * 100)
            : null

          return (
            <Card key={url.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  {url.brands.name}
                  <a
                    href={url.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardTitle>
                <CardDescription>{url.brands.domain}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {hasDiscount && url.original_price && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(url.original_price)}
                      </span>
                      {savings && (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs border-emerald-200">
                          -{savings}%
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold text-primary">
                      {formatPrice(currentPrice)}
                    </p>
                    {url.member_price && (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                        Plus
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {url.last_scraped_at ? formatDate(url.last_scraped_at) : "Never"}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Price History Chart */}
      {priceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Index</CardTitle>
            <CardDescription>Price changes over time</CardDescription>
          </CardHeader>
          <CardContent>
            <PriceChart
              data={priceHistory}
              urls={urls}
            />
          </CardContent>
        </Card>
      )}

      {/* Price History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Price History Details</CardTitle>
          <CardDescription>All recorded prices with change tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <PriceHistoryTable priceHistory={priceHistory} urls={urls} />
        </CardContent>
      </Card>
    </div>
  )
}

