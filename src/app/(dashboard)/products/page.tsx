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
import { formatPrice, formatDateShort } from "@/lib/utils"
import { Plus, Package, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { Profile } from "@/types/database"

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single()

  const canEdit = profile?.role === "admin" || profile?.role === "editor"

  // Fetch products with their URLs and websites
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      product_urls(
        id,
        url,
        is_active,
        last_price,
        last_scraped_at,
        websites(id, name, domain)
      )
    `)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage products and track their prices
          </p>
        </div>
        {canEdit && (
          <Link href="/products/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </Link>
        )}
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            {products?.length ?? 0} products tracked
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products && products.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Prices</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const urls = product.product_urls as Array<{
                    id: string
                    url: string
                    is_active: boolean
                    last_price: number | null
                    last_scraped_at: string | null
                    websites: { id: string; name: string; domain: string }
                  }>

                  const latestUpdate = urls?.reduce((latest, url) => {
                    if (!url.last_scraped_at) return latest
                    if (!latest) return url.last_scraped_at
                    return new Date(url.last_scraped_at) > new Date(latest)
                      ? url.last_scraped_at
                      : latest
                  }, null as string | null)

                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          {product.sku && (
                            <p className="text-xs text-muted-foreground">
                              SKU: {product.sku}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.brand}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {urls?.map((url) => (
                            <div
                              key={url.id}
                              className="text-xs bg-muted px-2 py-1 rounded"
                            >
                              <span className="text-muted-foreground">
                                {url.websites.name}:
                              </span>{" "}
                              <span className="font-medium">
                                {formatPrice(url.last_price)}
                              </span>
                            </div>
                          ))}
                          {(!urls || urls.length === 0) && (
                            <span className="text-muted-foreground text-sm">
                              No URLs added
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {latestUpdate ? formatDateShort(latestUpdate) : "Never"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/products/${product.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No products yet</p>
              {canEdit && (
                <Link href="/products/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first product
                  </Button>
                </Link>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

