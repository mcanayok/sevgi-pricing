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

interface ProductPageProps {
  params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params
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
        last_scraped_at,
        brand_id,
        websites(id, name, domain)
      )
    `)
    .eq("id", id)
    .single()

  if (!product) {
    notFound()
  }

  // Fetch price history for this product
  const productUrlIds = (product.product_urls as Array<{ id: string }>)?.map((pu) => pu.id) || []
  
  let priceHistory: Array<{
    id: string
    price: number | null
    scraped_at: string
    product_url_id: string
  }> = []

  if (productUrlIds.length > 0) {
    const { data } = await supabase
      .from("price_history")
      .select("*")
      .in("product_url_id", productUrlIds)
      .order("scraped_at", { ascending: true })
    
    priceHistory = data || []
  }

  const urls = product.product_urls as Array<{
    id: string
    url: string
    is_active: boolean
    last_price: number | null
    last_scraped_at: string | null
    brand_id: string
    websites: { id: string; name: string; domain: string }
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
              <Badge variant="outline">{product.brand}</Badge>
            </div>
            {product.sku && (
              <p className="text-muted-foreground mt-1">SKU: {product.sku}</p>
            )}
          </div>
        </div>
        {canEdit && (
          <Link href={`/products/${product.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        )}
      </div>

      {/* Current Prices */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {urls?.map((url) => (
          <Card key={url.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                {url.websites.name}
                <a
                  href={url.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </CardTitle>
              <CardDescription>{url.websites.domain}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(url.last_price)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Last updated: {url.last_scraped_at ? formatDate(url.last_scraped_at) : "Never"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Price History Chart */}
      {priceHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Price History</CardTitle>
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
          <CardDescription>All recorded prices</CardDescription>
        </CardHeader>
        <CardContent>
          {priceHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...priceHistory].reverse().slice(0, 50).map((ph) => {
                  const url = urls.find((u) => u.id === ph.product_url_id)
                  return (
                    <TableRow key={ph.id}>
                      <TableCell>{url?.websites.name}</TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(ph.price)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(ph.scraped_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No price history yet. Run a scrape to collect prices.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

