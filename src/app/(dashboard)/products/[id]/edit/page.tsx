"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Website, Product, ProductUrl } from "@/types/database"

interface ProductUrlInput {
  id?: string
  website_id: string
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
  const [websites, setWebsites] = useState<Website[]>([])
  const [brand, setBrand] = useState("")
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [notes, setNotes] = useState("")
  const [urls, setUrls] = useState<ProductUrlInput[]>([])
  const [deletedUrlIds, setDeletedUrlIds] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      // Fetch websites
      const { data: websitesData } = await supabase
        .from("websites")
        .select("*")
        .order("is_required", { ascending: false })

      if (websitesData) {
        setWebsites(websitesData)
      }

      // Fetch product
      const { data: product } = await supabase
        .from("products")
        .select(`
          *,
          product_urls(id, url, website_id)
        `)
        .eq("id", id)
        .single()

      if (product) {
        setBrand(product.brand)
        setName(product.name)
        setSku(product.sku || "")
        setNotes(product.notes || "")

        const existingUrls = (product.product_urls as ProductUrl[]).map((pu) => ({
          id: pu.id,
          website_id: pu.website_id,
          url: pu.url,
        }))
        setUrls(existingUrls)
      }

      setIsFetching(false)
    }

    fetchData()
  }, [supabase, id])

  function addUrl() {
    const availableWebsites = websites.filter(
      (w) => !urls.some((u) => u.website_id === w.id)
    )
    if (availableWebsites.length > 0) {
      setUrls([...urls, { website_id: availableWebsites[0].id, url: "", isNew: true }])
    }
  }

  function removeUrl(index: number) {
    const url = urls[index]
    const website = websites.find((w) => w.id === url.website_id)

    if (website?.is_required) {
      toast({
        variant: "destructive",
        title: "Cannot remove required website",
        description: `${website.name} is required for all products`,
      })
      return
    }

    if (url.id) {
      setDeletedUrlIds([...deletedUrlIds, url.id])
    }
    setUrls(urls.filter((_, i) => i !== index))
  }

  function updateUrl(index: number, field: keyof ProductUrlInput, value: string) {
    const newUrls = [...urls]
    newUrls[index] = { ...newUrls[index], [field]: value }
    setUrls(newUrls)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    // Validate required URLs
    const requiredWebsites = websites.filter((w) => w.is_required)
    for (const rw of requiredWebsites) {
      const url = urls.find((u) => u.website_id === rw.id)
      if (!url?.url) {
        toast({
          variant: "destructive",
          title: "Missing required URL",
          description: `Please provide a URL for ${rw.name}`,
        })
        setIsLoading(false)
        return
      }
    }

    // Update product
    const { error: productError } = await supabase
      .from("products")
      .update({
        brand,
        name,
        sku: sku || null,
        notes: notes || null,
      })
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

    // Delete removed URLs
    if (deletedUrlIds.length > 0) {
      await supabase.from("product_urls").delete().in("id", deletedUrlIds)
    }

    // Update or create URLs
    for (const url of urls) {
      if (url.id && !url.isNew) {
        // Update existing
        await supabase
          .from("product_urls")
          .update({ url: url.url })
          .eq("id", url.id)
      } else if (url.url) {
        // Create new
        await supabase.from("product_urls").insert({
          product_id: id,
          website_id: url.website_id,
          url: url.url,
        })
      }
    }

    toast({
      title: "Product updated",
      description: "Product has been updated successfully",
    })

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
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>Basic details about the product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand *</Label>
                <Input
                  id="brand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Optional)</Label>
                <Input
                  id="sku"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Product URLs */}
        <Card>
          <CardHeader>
            <CardTitle>Product URLs</CardTitle>
            <CardDescription>Links to track prices from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {urls.map((urlInput, index) => {
              const website = websites.find((w) => w.id === urlInput.website_id)
              return (
                <div key={index} className="flex gap-3 items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label>{website?.name}</Label>
                      {website?.is_required && (
                        <span className="text-xs text-primary">Required</span>
                      )}
                    </div>
                    <Input
                      value={urlInput.url}
                      onChange={(e) => updateUrl(index, "url", e.target.value)}
                      placeholder={`https://${website?.domain}/...`}
                      required={website?.is_required}
                    />
                  </div>
                  {!website?.is_required && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-7"
                      onClick={() => removeUrl(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              )
            })}

            {urls.length < websites.length && (
              <Button type="button" variant="outline" onClick={addUrl}>
                <Plus className="h-4 w-4 mr-2" />
                Add Another URL
              </Button>
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

