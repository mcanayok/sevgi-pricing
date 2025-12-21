"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Brand, ProductUrl } from "@/types/database"

interface ProductUrlInput {
  id?: string
  brand_id: string
  url: string
  isNew?: boolean
}

interface EditProductPageProps {
  params: Promise<{ id: string }>
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [brands, setBrands] = useState<Brand[]>([])
  const [name, setName] = useState("")
  const [requiredBrandUrls, setRequiredBrandUrls] = useState<Record<string, string>>({})
  const [selectedNonRequiredBrandId, setSelectedNonRequiredBrandId] = useState<string>("")
  const [nonRequiredBrandUrl, setNonRequiredBrandUrl] = useState("")
  const [deletedUrlIds, setDeletedUrlIds] = useState<string[]>([])
  const [existingUrls, setExistingUrls] = useState<ProductUrlInput[]>([])

  useEffect(() => {
    async function fetchData() {
      // Fetch brands
      const { data: brandsData } = await supabase
        .from("brands")
        .select("*")
        .order("is_required", { ascending: false })

      if (brandsData) {
        setBrands(brandsData)

        // Initialize required brand URLs
        const required: Record<string, string> = {}
        brandsData.filter(b => b.is_required).forEach(b => {
          required[b.id] = ""
        })
        setRequiredBrandUrls(required)
      }

      // Fetch product
      const { data: product } = await supabase
        .from("products")
        .select(`
          *,
          product_urls(id, url, brand_id)
        `)
        .eq("id", id)
        .single()

      if (product) {
        setName(product.name)

        const urls = (product.product_urls as ProductUrl[]) || []
        setExistingUrls(urls.map(pu => ({
          id: pu.id,
          brand_id: pu.brand_id,
          url: pu.url,
        })))

        // Populate existing URLs
        const reqUrls: Record<string, string> = {}
        urls.forEach(pu => {
          const brand = brandsData?.find(b => b.id === pu.brand_id)
          if (brand?.is_required) {
            reqUrls[pu.brand_id] = pu.url
          } else {
            setSelectedNonRequiredBrandId(pu.brand_id)
            setNonRequiredBrandUrl(pu.url)
          }
        })
        setRequiredBrandUrls(prev => ({ ...prev, ...reqUrls }))
      }

      setIsFetching(false)
    }

    fetchData()
  }, [supabase, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    // Validate required brand URLs
    const requiredBrands = brands.filter(b => b.is_required)
    for (const brand of requiredBrands) {
      if (!requiredBrandUrls[brand.id]?.trim()) {
        toast({
          variant: "destructive",
          title: "Missing required URL",
          description: `Please provide a URL for ${brand.name}`,
        })
        setIsLoading(false)
        return
      }
    }

    // Validate non-required brand selection
    if (!selectedNonRequiredBrandId || !nonRequiredBrandUrl.trim()) {
      toast({
        variant: "destructive",
        title: "Missing brand",
        description: "Please select a brand and provide its URL",
      })
      setIsLoading(false)
      return
    }

    // Update product (only name)
    const { error: productError } = await supabase
      .from("products")
      .update({ name })
      .eq("id", id)

    if (productError) {
      toast({
        variant: "destructive",
        title: "Error updating product",
        description: productError.message,
      })
      setIsLoading(false)
      return
    }

    // Delete all existing URLs
    if (existingUrls.length > 0) {
      await supabase
        .from("product_urls")
        .delete()
        .eq("product_id", id)
    }

    // Insert required brand URLs
    for (const [brandId, url] of Object.entries(requiredBrandUrls)) {
      if (url.trim()) {
        await supabase.from("product_urls").insert({
          product_id: id,
          brand_id: brandId,
          url: url.trim(),
        })
      }
    }

    // Insert non-required brand URL
    if (selectedNonRequiredBrandId && nonRequiredBrandUrl.trim()) {
      await supabase.from("product_urls").insert({
        product_id: id,
        brand_id: selectedNonRequiredBrandId,
        url: nonRequiredBrandUrl.trim(),
      })
    }

    toast({
      title: "Product updated",
      description: "Product has been updated successfully",
    })

    setIsLoading(false)
    router.push(`/products/${id}`)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) {
      return
    }

    setIsLoading(true)

    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting product",
        description: error.message,
      })
      setIsLoading(false)
      return
    }

    toast({ title: "Product deleted" })
    router.push("/products")
    router.refresh()
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const requiredBrands = brands.filter(b => b.is_required)
  const nonRequiredBrands = brands.filter(b => !b.is_required)

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/products/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground mt-1">Update product details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Name */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Basic product details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Meyve Topları Tanışma Seti"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Required Brand URLs (Marketplaces) */}
        <Card>
          <CardHeader>
            <CardTitle>Marketplace URLs</CardTitle>
            <CardDescription>URLs for required marketplaces (all products must have these)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiredBrands.map(brand => (
              <div key={brand.id} className="space-y-2">
                <Label htmlFor={`brand-${brand.id}`}>
                  {brand.name} <span className="text-primary text-xs">*</span>
                </Label>
                <Input
                  id={`brand-${brand.id}`}
                  value={requiredBrandUrls[brand.id] || ""}
                  onChange={(e) => setRequiredBrandUrls(prev => ({
                    ...prev,
                    [brand.id]: e.target.value
                  }))}
                  placeholder={`https://${brand.domain}/...`}
                  required
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Non-Required Brand Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Product Brand</CardTitle>
            <CardDescription>Select the brand that manufactures this product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-select">Brand *</Label>
              <Select
                value={selectedNonRequiredBrandId}
                onValueChange={setSelectedNonRequiredBrandId}
                required
              >
                <SelectTrigger id="brand-select">
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {nonRequiredBrands.map(brand => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedNonRequiredBrandId && (
              <div className="space-y-2">
                <Label htmlFor="brand-url">
                  {nonRequiredBrands.find(b => b.id === selectedNonRequiredBrandId)?.name} URL *
                </Label>
                <Input
                  id="brand-url"
                  value={nonRequiredBrandUrl}
                  onChange={(e) => setNonRequiredBrandUrl(e.target.value)}
                  placeholder={`https://${nonRequiredBrands.find(b => b.id === selectedNonRequiredBrandId)?.domain}/...`}
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            Delete Product
          </Button>
          <div className="flex gap-3">
            <Link href={`/products/${id}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
