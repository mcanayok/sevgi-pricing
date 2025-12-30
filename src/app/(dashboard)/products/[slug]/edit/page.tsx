"use client"

import { use } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { ProductForm } from "@/components/product-form"
import { useProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/use-product"
import type { ProductFormData } from "@/lib/schemas/product"

interface EditProductPageProps {
  params: Promise<{ slug: string }>
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { slug } = use(params)
  const { data: product, isLoading: isFetching } = useProduct(slug)
  const updateMutation = useUpdateProduct()
  const deleteMutation = useDeleteProduct()

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

    updateMutation.mutate({
      id: product!.id,
      name: data.name,
      category_id: data.category_id,
      subcategory_id: data.subcategory_id,
      urls,
    })
  }

  function handleDelete() {
    deleteMutation.mutate(product!.id)
  }

  // Transform product data to form format
  const initialData: ProductFormData | undefined = product
    ? {
        name: product.name,
        category_id: product.category_id || undefined,
        subcategory_id: product.subcategory_id || undefined,
        requiredBrandUrls: product.product_urls
          .filter((url: any) => url.brands.is_required)
          .reduce((acc: Record<string, string>, url: any) => {
            acc[url.brands.id] = url.url
            return acc
          }, {} as Record<string, string>),
        nonRequiredBrand: (() => {
          const nonReq = product.product_urls.find((url: any) => !url.brands.is_required)
          return {
            brand_id: nonReq?.brands.id || "",
            url: nonReq?.url || "",
          }
        })(),
      }
    : undefined

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/products/${product.slug}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground mt-1">
              Update product information
            </p>
          </div>
        </div>
        <Link href={`/products/${product.slug}`}>
          <Button variant="outline">
            View Product
          </Button>
        </Link>
      </div>

      <ProductForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isLoading={updateMutation.isPending}
        onDelete={handleDelete}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
