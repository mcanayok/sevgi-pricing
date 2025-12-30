import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { CategoriesTable } from "@/components/categories-table"

export default async function CategoriesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single()

  const canEdit = profile?.role === "admin" || profile?.role === "editor"

  // Fetch categories
  const { data: categories } = await supabase
    .from("product_categories")
    .select("*")
    .order("name", { ascending: true })

  // Fetch subcategories
  const { data: subcategories } = await supabase
    .from("product_subcategories")
    .select("*")
    .order("name", { ascending: true })

  // Fetch all products to calculate counts
  const { data: products } = await supabase.from("products").select("id, category_id, subcategory_id")

  // Calculate category counts
  const categoryCounts: Record<string, number> = {}
  const subcategoryCounts: Record<string, number> = {}

  products?.forEach((product) => {
    if (product.category_id) {
      categoryCounts[product.category_id] = (categoryCounts[product.category_id] || 0) + 1
    }
    if (product.subcategory_id) {
      subcategoryCounts[product.subcategory_id] = (subcategoryCounts[product.subcategory_id] || 0) + 1
    }
  })

  const uncategorizedCount = products?.filter((p) => !p.category_id).length || 0

  // Group subcategories by category
  const subcategoriesByCategory: Record<string, any[]> = {}
  subcategories?.forEach((subcat) => {
    if (!subcategoriesByCategory[subcat.category_id]) {
      subcategoriesByCategory[subcat.category_id] = []
    }
    subcategoriesByCategory[subcat.category_id].push(subcat)
  })

  return (
    <div className="space-y-6">
      {/* Categories Table */}
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-0">
          <CategoriesTable
            categories={categories || []}
            categoryCounts={categoryCounts}
            subcategoriesByCategory={subcategoriesByCategory}
            subcategoryCounts={subcategoryCounts}
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  )
}
