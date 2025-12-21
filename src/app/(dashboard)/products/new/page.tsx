"use client"

import { useState, useEffect } from "react"
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
import type { Brand } from "@/types/database"

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()

  const [isLoading, setIsLoading] = useState(false)
  const [brands, setBrands] = useState<Brand[]>([])
  const [name, setName] = useState("")
  const [requiredBrandUrls, setRequiredBrandUrls] = useState<Record<string, string>>({})
  const [selectedNonRequiredBrandId, setSelectedNonRequiredBrandId] = useState<string>("")
  const [nonRequiredBrandUrl, setNonRequiredBrandUrl] = useState("")

  useEffect(() => {
    async function fetchBrands() {
      const { data } = await supabase
        .from("brands")
        .select("*")
        .order("is_required", { ascending: false })

      if (data) {
        setBrands(data)
        // Initialize required brand URLs
        const required: Record<string, string> = {}
        data.filter(b => b.is_required).forEach(b => {
          required[b.id] = ""
        })
        setRequiredBrandUrls(required)
      }
    }
    fetchBrands()
  }, [supabase])

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

    const { data: { user } } = await supabase.auth.getUser()

    // Create product (only name and created_by)
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name,
        created_by: user?.id,
      })
      .select()
      .single()

    if (productError) {
      toast({
        variant: "destructive",
        title: "Error creating product",
        description: productError.message,
      })
      setIsLoading(false)
      return
    }

    // Insert required brand URLs
    const urlsToInsert = []
    for (const [brandId, url] of Object.entries(requiredBrandUrls)) {
      if (url.trim()) {
        urlsToInsert.push({
          product_id: product.id,
          brand_id: brandId,
          url: url.trim(),
        })
      }
    }

    // Insert non-required brand URL
    if (selectedNonRequiredBrandId && nonRequiredBrandUrl.trim()) {
      urlsToInsert.push({
        product_id: product.id,
        brand_id: selectedNonRequiredBrandId,
        url: nonRequiredBrandUrl.trim(),
      })
    }

    if (urlsToInsert.length > 0) {
      const { error: urlsError } = await supabase
        .from("product_urls")
        .insert(urlsToInsert)

      if (urlsError) {
        toast({
          variant: "destructive",
          title: "Error adding product URLs",
          description: urlsError.message,
        })
        setIsLoading(false)
        return
      }
    }

    toast({
      title: "Product created",
      description: "Product has been added successfully",
    })

    router.push("/products")
    router.refresh()
  }

  const requiredBrands = brands.filter(b => b.is_required)
  const nonRequiredBrands = brands.filter(b => !b.is_required)

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

        {/* Submit */}
        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Product"
            )}
          </Button>
          <Link href="/products">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
