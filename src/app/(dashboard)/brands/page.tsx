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
import { formatDate } from "@/lib/utils"
import { Plus, Globe, Code } from "lucide-react"
import { BrandDialog } from "@/components/brand-dialog"
import type { Brand } from "@/types/database"

export default async function BrandsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single()

  const canEdit = profile?.role === "admin" || profile?.role === "editor"

  const { data: brands } = await supabase
    .from("brands")
    .select("*")
    .order("is_required", { ascending: false })
    .order("name", { ascending: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Brands</h1>
          <p className="text-muted-foreground mt-1">
            Manage tracked brands and their CSS selectors
          </p>
        </div>
        {canEdit && <BrandDialog />}
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Code className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">About CSS Selectors</p>
              <p className="text-sm text-muted-foreground mt-1">
                CSS selectors are used to find the price element on each website. 
                For example: <code className="bg-background px-1.5 py-0.5 rounded text-xs">span.prc-dsc</code> for Trendyol.
                Use your browser&apos;s developer tools to find the right selector for each site.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Brands</CardTitle>
          <CardDescription>
            {brands?.length ?? 0} brands configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {brands && brands.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>CSS Selector</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell className="font-medium">{brand.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {brand.domain}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {brand.price_selector}
                      </code>
                    </TableCell>
                    <TableCell>
                      {brand.is_required ? (
                        <Badge variant="default">Required</Badge>
                      ) : (
                        <Badge variant="secondary">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(brand.created_at)}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <BrandDialog brand={brand as Brand} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No brands configured</p>
              {canEdit && <BrandDialog />}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

