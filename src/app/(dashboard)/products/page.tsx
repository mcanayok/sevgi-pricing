import { createClient } from "@/lib/supabase/server"
import { ProductsClient } from "@/components/products-client"

export default async function ProductsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single()

  const canEdit = profile?.role === "admin" || profile?.role === "editor"

  // Load all products at once - optimized for small team with <200 products
  // 200 products × 2KB ≈ 400KB payload (negligible)
  // Benefit: Instant client-side filtering, no additional DB queries
  const { data: products } = await supabase
    .from("products")
    .select(`
      *,
      product_categories(id, name),
      product_urls(
        id,
        url,
        is_active,
        last_price,
        original_price,
        discount_price,
        member_price,
        last_scraped_at,
        brands(id, name, domain, is_required, color)
      )
    `)
    .order("created_at", { ascending: false })

  // Fetch categories
  const { data: categories } = await supabase
    .from("product_categories")
    .select("*")
    .order("name")

  // Fetch brands
  const { data: brands } = await supabase
    .from("brands")
    .select("*")
    .order("name")

  return (
    <ProductsClient
      initialProducts={products || []}
      categories={categories || []}
      brands={brands || []}
      canEdit={canEdit}
    />
  )
}
