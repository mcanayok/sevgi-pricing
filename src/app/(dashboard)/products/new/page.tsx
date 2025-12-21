"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import type { Website } from "@/types/database"

interface ProductUrlInput {
  website_id: string
  url: string
}

export default function NewProductPage() {
  const router = useRouter()
  const supabase = createClient()
  
  const [isLoading, setIsLoading] = useState(false)
  const [websites, setWebsites] = useState<Website[]>([])
  const [brand, setBrand] = useState("")
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [notes, setNotes] = useState("")
  const [urls, setUrls] = useState<ProductUrlInput[]>([])

  useEffect(() => {
    async function fetchWebsites() {
      const { data } = await supabase
        .from("websites")
        .select("*")
        .order("is_required", { ascending: false })
      
      if (data) {
        setWebsites(data)
        // Pre-populate required websites
        const requiredUrls = data
          .filter((w) => w.is_required)
          .map((w) => ({ website_id: w.id, url: "" }))
        setUrls(requiredUrls)
      }
    }
    fetchWebsites()
  }, [supabase])

  function addUrl() {
    const availableWebsites = websites.filter(
      (w) => !urls.some((u) => u.website_id === w.id)
    )
    if (availableWebsites.length > 0) {
      setUrls([...urls, { website_id: availableWebsites[0].id, url: "" }])
    }
  }

  function removeUrl(index: number) {
    const website = websites.find((w) => w.id === urls[index].website_id)
    if (website?.is_required) {
      toast({
        variant: "destructive",
        title: "Cannot remove required website",
        description: `${website.name} is required for all products`,
      })
      return
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

    const { data: { user } } = await supabase.auth.getUser()

    // Create product
    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        brand,
        name,
        sku: sku || null,
        notes: notes || null,
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

    // Create product URLs
    const urlsToInsert = urls
      .filter((u) => u.url)
      .map((u) => ({
        product_id: product.id,
        website_id: u.website_id,
        url: u.url,
      }))

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
                  placeholder="e.g., Fropie"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Meyve Topları Set"
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
                  placeholder="e.g., FRP-001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional notes..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Product URLs */}
        <Card>
          <CardHeader>
            <CardTitle>Product URLs</CardTitle>
            <CardDescription>
              Add links to track prices from different websites
            </CardDescription>
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

