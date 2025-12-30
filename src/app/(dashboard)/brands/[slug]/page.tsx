import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { BrandDetailClient } from "./brand-detail-client"

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()

  // Fetch brand
  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .single()

  if (!brand) {
    notFound()
  }

  // Fetch products for this brand
  const { data: productUrls } = await supabase
    .from("product_urls")
    .select(`
      id,
      url,
      original_price,
      discount_price,
      member_price,
      last_scraped_at,
      is_active,
      products (
        id,
        name,
        slug
      )
    `)
    .eq("brand_id", brand.id)
    .order("products(name)")

  return <BrandDetailClient brand={brand} productUrls={productUrls || []} />
}
