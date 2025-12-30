import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { BrandsClient } from "@/components/brands-client"

export default async function BrandsPage() {
  const supabase = await createClient()

  const { data: brands } = await supabase
    .from("brands")
    .select("*")
    .order("name", { ascending: true })

  // Fetch product URL counts per brand
  const { data: productUrls } = await supabase.from("product_urls").select("brand_id")

  const brandCounts: Record<string, number> = {}
  productUrls?.forEach((url) => {
    brandCounts[url.brand_id] = (brandCounts[url.brand_id] || 0) + 1
  })

  return (
    <div className="max-w-3xl">
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-0">
          <BrandsClient brands={brands || []} brandCounts={brandCounts} />
        </CardContent>
      </Card>
    </div>
  )
}
