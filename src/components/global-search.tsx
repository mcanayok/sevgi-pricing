"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Search, Package, FolderOpen, Globe, Tag } from "lucide-react"

interface SearchResult {
  type: "product" | "category" | "subcategory" | "brand"
  id: string
  name: string
  subtitle?: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const searchAll = async () => {
      // Require at least 2 characters to search
      if (!query.trim() || query.trim().length < 2) {
        setResults([])
        setLoading(false)
        return
      }

      setLoading(true)
      const allResults: SearchResult[] = []

      try {
        // Run all searches in parallel with strict limits
        const [products, categories, brands] = await Promise.all([
          // Search products
          supabase
            .from("products")
            .select("id, name, subcategory")
            .ilike("name", `%${query}%`)
            .limit(3),

          // Search categories
          supabase
            .from("product_categories")
            .select("id, name")
            .ilike("name", `%${query}%`)
            .limit(3),

          // Search brands
          supabase
            .from("brands")
            .select("id, name, domain")
            .ilike("name", `%${query}%`)
            .limit(3),
        ])

        if (products.data) {
          allResults.push(
            ...products.data.map((p) => ({
              type: "product" as const,
              id: p.id,
              name: p.name,
              subtitle: p.subcategory || undefined,
            }))
          )
        }

        if (categories.data) {
          allResults.push(
            ...categories.data.map((c) => ({
              type: "category" as const,
              id: c.id,
              name: c.name,
            }))
          )
        }

        if (brands.data) {
          allResults.push(
            ...brands.data.map((b) => ({
              type: "brand" as const,
              id: b.id,
              name: b.name,
              subtitle: b.domain,
            }))
          )
        }

        setResults(allResults.slice(0, 10))
      } catch (error) {
        console.error("Search error:", error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(searchAll, 500)
    return () => clearTimeout(debounce)
  }, [query, supabase])

  const handleSelect = (result: SearchResult) => {
    setOpen(false)
    setQuery("")

    switch (result.type) {
      case "product":
        router.push(`/products/${result.id}`)
        break
      case "category":
        router.push(`/categories`)
        break
      case "brand":
        router.push(`/brands`)
        break
      case "subcategory":
        router.push(`/products`)
        break
    }
  }

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "product":
        return <Package className="h-4 w-4" />
      case "category":
        return <FolderOpen className="h-4 w-4" />
      case "brand":
        return <Globe className="h-4 w-4" />
      case "subcategory":
        return <Tag className="h-4 w-4" />
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products, categories, brands..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          className="pl-9 w-full"
        />
      </div>

      {open && results.length > 0 && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-lg z-50 max-h-80 overflow-auto">
            <div className="p-2 space-y-1">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}-${index}`}
                  onClick={() => handleSelect(result)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-accent text-left transition-colors"
                >
                  <div className="text-muted-foreground">
                    {getIcon(result.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{result.name}</p>
                    {result.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">
                        {result.subtitle}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {result.type}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
