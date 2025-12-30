"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BrandDialog } from "@/components/brand-dialog"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowLeft, ExternalLink } from "lucide-react"
import type { Brand } from "@/types/database"

interface BrandDetailClientProps {
  brand: Brand
  productUrls: any[]
}

export function BrandDetailClient({ brand, productUrls }: BrandDetailClientProps) {
  return (
    <div className="max-w-5xl space-y-6">
      {/* Back Button */}
      <div className="flex items-center justify-between">
        <Link href="/brands">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Brands
          </Button>
        </Link>
        <BrandDialog brand={brand} />
      </div>

      {/* Brand Info Card */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            {/* Brand color bullet */}
            <span
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{
                backgroundColor: brand.color || '#64748b',
              }}
            />

            {/* Brand name */}
            <span className="font-bold text-xl text-slate-900">
              {brand.name}
            </span>

            <div className="flex-1 ml-4">
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <ExternalLink className="h-3 w-3" />
                <a
                  href={`https://${brand.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {brand.domain}
                </a>
              </div>
              {brand.is_required && (
                <Badge variant="secondary" className="mt-2">
                  Retailer
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Products Table */}
      <Card className="border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Products ({productUrls?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-slate-50 border-b border-slate-200">
                <TableHead className="font-semibold text-slate-700">Product</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">Original</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">Discount</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">Member</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">Status</TableHead>
                <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productUrls && productUrls.length > 0 ? (
                productUrls.map((productUrl, index) => (
                  <TableRow
                    key={productUrl.id}
                    className={`hover:bg-slate-100 transition-colors ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    }`}
                  >
                    <TableCell className="font-medium">
                      <Link
                        href={`/products/${productUrl.products?.slug}`}
                        className="hover:underline"
                      >
                        {productUrl.products?.name || 'Unknown Product'}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      {productUrl.original_price ? (
                        <span className="font-semibold">{productUrl.original_price} TL</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {productUrl.discount_price ? (
                        <span className="font-semibold text-green-600">{productUrl.discount_price} TL</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {productUrl.member_price ? (
                        <span className="font-semibold text-purple-600">{productUrl.member_price} TL</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={productUrl.is_active ? "default" : "secondary"}
                        className={productUrl.is_active ? "bg-green-100 text-green-700 border-green-200" : ""}
                      >
                        {productUrl.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <a
                        href={productUrl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm" className="gap-2">
                          <ExternalLink className="h-4 w-4" />
                          View
                        </Button>
                      </a>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                    No products for this brand yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
