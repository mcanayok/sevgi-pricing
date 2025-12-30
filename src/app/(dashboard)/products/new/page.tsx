"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ProductForm } from "@/components/product-form"
import { useCreateProduct } from "@/hooks/use-product"
import type { ProductFormData } from "@/lib/schemas/product"

export default function NewProductPage() {
  const createMutation = useCreateProduct()

  function handleSubmit(data: ProductFormData) {
    // Transform form data to mutation format
    const urls = []

    // Add required brand URLs
    for (const [brandId, url] of Object.entries(data.requiredBrandUrls)) {
      if (url.trim()) {
        urls.push({ brand_id: brandId, url: url.trim() })
      }
    }

    // Add non-required brand URL (URL is optional but brand is required)
    if (data.nonRequiredBrand.brand_id) {
      urls.push({
        brand_id: data.nonRequiredBrand.brand_id,
        url: data.nonRequiredBrand.url?.trim() || '',
      })
    }

    createMutation.mutate({
      name: data.name,
      category_id: data.category_id,
      subcategory_id: data.subcategory_id,
      urls,
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/products">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add Product</h1>
          <p className="text-muted-foreground mt-1">
            Create a new product to track
          </p>
        </div>
      </div>

      <ProductForm
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending}
      />
    </div>
  )
}
