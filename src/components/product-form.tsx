"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { productFormSchema, type ProductFormData } from "@/lib/schemas/product"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { Brand, ProductCategory } from "@/types/database"

interface ProductFormProps {
  initialData?: ProductFormData
  onSubmit: (data: ProductFormData) => void
  isLoading?: boolean
  onDelete?: () => void
  isDeleting?: boolean
}

interface ProductSubcategory {
  id: string
  category_id: string
  name: string
}

export function ProductForm({ initialData, onSubmit, isLoading, onDelete, isDeleting }: ProductFormProps) {
  const supabase = createClient()
  const [brands, setBrands] = useState<Brand[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [subcategories, setSubcategories] = useState<ProductSubcategory[]>([])
  const [requiredBrands, setRequiredBrands] = useState<Brand[]>([])
  const [nonRequiredBrands, setNonRequiredBrands] = useState<Brand[]>([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData || {
      name: "",
      category_id: undefined,
      subcategory_id: undefined,
      requiredBrandUrls: {},
      nonRequiredBrand: {
        brand_id: "",
        url: "",
      },
    },
  })

  // Fetch brands and categories
  useEffect(() => {
    async function fetchData() {
      const { data: brandsData } = await supabase
        .from("brands")
        .select("*")
        .order("is_required", { ascending: false })

      if (brandsData) {
        setBrands(brandsData)
        const required = brandsData.filter((b) => b.is_required)
        const nonRequired = brandsData.filter((b) => !b.is_required)
        setRequiredBrands(required)
        setNonRequiredBrands(nonRequired)

        // Initialize required brand URLs if no initial data
        if (!initialData) {
          const urlsObj: Record<string, string> = {}
          required.forEach((b) => {
            urlsObj[b.id] = ""
          })
          setValue("requiredBrandUrls", urlsObj, { shouldDirty: false })
        }
      }

      const { data: categoriesData } = await supabase
        .from("product_categories")
        .select("*")
        .order("name")

      if (categoriesData) {
        setCategories(categoriesData)
      }

      const { data: subcategoriesData } = await supabase
        .from("product_subcategories")
        .select("*")
        .order("name")

      if (subcategoriesData) {
        setSubcategories(subcategoriesData)
      }
    }
    fetchData()
  }, [supabase, initialData, setValue])

  const category_id = watch("category_id")
  const subcategory_id = watch("subcategory_id")
  const nonRequiredBrandId = watch("nonRequiredBrand.brand_id")

  // Filter subcategories based on selected category
  const availableSubcategories = category_id
    ? subcategories.filter((s) => s.category_id === category_id)
    : []

  // Reset subcategory when category changes
  useEffect(() => {
    if (category_id && subcategory_id) {
      const isSubcategoryValid = availableSubcategories.some((s) => s.id === subcategory_id)
      if (!isSubcategoryValid) {
        setValue("subcategory_id", undefined)
      }
    }
  }, [category_id, subcategory_id, availableSubcategories, setValue])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Product Details */}
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>Basic information about the product</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              placeholder="Enter product name"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={category_id}
              onValueChange={(value) => setValue("category_id", value, { shouldDirty: true })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory">Subcategory</Label>
            <Select
              value={subcategory_id || ""}
              onValueChange={(value) => setValue("subcategory_id", value || undefined, { shouldDirty: true })}
              disabled={!category_id || availableSubcategories.length === 0}
            >
              <SelectTrigger id="subcategory">
                <SelectValue placeholder={
                  !category_id
                    ? "Select a category first"
                    : availableSubcategories.length === 0
                      ? "No subcategories available"
                      : "Select a subcategory (optional)"
                } />
              </SelectTrigger>
              <SelectContent>
                {availableSubcategories.map((subcat) => (
                  <SelectItem key={subcat.id} value={subcat.id}>
                    {subcat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {category_id && availableSubcategories.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No subcategories for this category yet. You can add them on the Categories page.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Product URLs */}
      <Card>
        <CardHeader>
          <CardTitle>Product URLs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Brand Selector */}
          <div className="space-y-2">
            <Label htmlFor="brand-select">Brand *</Label>
            <Select
              value={nonRequiredBrandId}
              onValueChange={(value) => setValue("nonRequiredBrand.brand_id", value, { shouldDirty: true })}
            >
              <SelectTrigger id="brand-select">
                <SelectValue placeholder="Select a brand" />
              </SelectTrigger>
              <SelectContent>
                {nonRequiredBrands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>
                    {brand.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.nonRequiredBrand?.brand_id && (
              <p className="text-sm text-destructive">
                {errors.nonRequiredBrand.brand_id.message}
              </p>
            )}
          </div>

          {/* Brand Product URL */}
          <div className="space-y-2">
            <Label htmlFor="brand-url">Product URL</Label>
            <Input
              id="brand-url"
              type="url"
              placeholder="https://example.com/product (optional)"
              {...register("nonRequiredBrand.url")}
            />
            {errors.nonRequiredBrand?.url && (
              <p className="text-sm text-destructive">
                {errors.nonRequiredBrand.url.message}
              </p>
            )}
          </div>

          {/* Trendyol URL */}
          {requiredBrands.map((brand) => (
            <div key={brand.id} className="space-y-2">
              <Label htmlFor={`url-${brand.id}`}>
                {brand.name} URL *
              </Label>
              <Input
                id={`url-${brand.id}`}
                type="url"
                placeholder={`https://${brand.domain}/product`}
                {...register(`requiredBrandUrls.${brand.id}` as const)}
              />
              {errors.requiredBrandUrls?.[brand.id] && (
                <p className="text-sm text-destructive">
                  {errors.requiredBrandUrls[brand.id]?.message}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bottom Fixed Save Bar - Always visible */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-slate-200 shadow-lg z-50">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          {/* Left: Delete button (only for edit mode) */}
          <div className="flex items-center gap-4">
            {onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                disabled={isDeleting || isLoading}
                className="text-sm text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Delete product
              </button>
            )}

            {/* Status indicator */}
            {isDirty ? (
              <p className="text-sm text-amber-600 font-medium flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Unsaved changes
              </p>
            ) : (
              <p className="text-sm text-slate-500">All changes saved</p>
            )}
          </div>

          {/* Right: Action buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isLoading || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isDeleting || !isDirty}
              className="min-w-[120px]"
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Product</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
              All price history and tracking data will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete?.()
                setShowDeleteDialog(false)
              }}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Spacer to prevent content from being hidden behind fixed bar */}
      <div className="h-20" />
    </form>
  )
}
