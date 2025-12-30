"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatPrice, getContrastingTextColor } from "@/lib/utils"
import { Plus, X, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from "next/link"

interface ProductUrl {
  id: string
  url: string
  is_active: boolean
  last_price: number | null
  original_price: number | null
  discount_price: number | null
  member_price: number | null
  last_scraped_at: string | null
  brands: { id: string; name: string; domain: string; is_required: boolean; color: string | null }
}

interface Product {
  id: string
  name: string
  slug: string
  category_id: string | null
  subcategory: string | null
  created_at: string
  updated_at: string
  product_categories?: { id: string; name: string } | null
  product_urls: ProductUrl[]
}

interface Category {
  id: string
  name: string
}

interface Brand {
  id: string
  name: string
  domain: string
  is_required: boolean
  color: string | null
}

interface ProductsClientProps {
  initialProducts: Product[]
  categories: Category[]
  brands: Brand[]
  canEdit: boolean
}

export function ProductsClient({
  initialProducts,
  categories,
  brands,
  canEdit,
}: ProductsClientProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])
  const [selectedBrands, setSelectedBrands] = useState<string[]>([])
  const [sortField, setSortField] = useState<string>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Get all unique subcategories
  const allSubcategories = useMemo(() => {
    const subcats = new Set<string>()
    initialProducts.forEach((p) => {
      if (p.subcategory) subcats.add(p.subcategory)
    })
    return Array.from(subcats).sort()
  }, [initialProducts])

  // Filter products based on selected filters
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // Category filter
      if (selectedCategories.length > 0 && !selectedCategories.includes(product.category_id || "")) return false

      // Subcategory filter
      if (selectedSubcategories.length > 0 && !selectedSubcategories.includes(product.subcategory || "")) return false

      // Brand filter
      if (selectedBrands.length > 0) {
        const hasBrand = product.product_urls.some((url) => selectedBrands.includes(url.brands.id))
        if (!hasBrand) return false
      }

      return true
    })
  }, [initialProducts, selectedCategories, selectedSubcategories, selectedBrands])

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      let comparison = 0

      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === "brand") {
        const aBrand = a.product_urls.find((url) => !url.brands.is_required)?.brands.name || ""
        const bBrand = b.product_urls.find((url) => !url.brands.is_required)?.brands.name || ""
        comparison = aBrand.localeCompare(bBrand)
      } else if (sortField === "category") {
        const aCat = a.product_categories?.name || ""
        const bCat = b.product_categories?.name || ""
        comparison = aCat.localeCompare(bCat)
      } else if (sortField === "price") {
        const aPrice = Math.min(...a.product_urls.map(u => u.member_price || u.discount_price || u.original_price || Infinity).filter(p => p !== null))
        const bPrice = Math.min(...b.product_urls.map(u => u.member_price || u.discount_price || u.original_price || Infinity).filter(p => p !== null))
        comparison = aPrice - bPrice
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [filteredProducts, sortField, sortDirection])

  const manufacturerBrands = brands.filter((b) => !b.is_required)

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedSubcategories.length > 0 ||
    selectedBrands.length > 0

  const clearFilters = () => {
    setSelectedCategories([])
    setSelectedSubcategories([])
    setSelectedBrands([])
  }

  const removeCategory = (id: string) => {
    setSelectedCategories(selectedCategories.filter(c => c !== id))
  }

  const removeSubcategory = (name: string) => {
    setSelectedSubcategories(selectedSubcategories.filter(s => s !== name))
  }

  const removeBrand = (id: string) => {
    setSelectedBrands(selectedBrands.filter(b => b !== id))
  }

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const toggleSubcategory = (name: string) => {
    setSelectedSubcategories(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    )
  }

  const toggleBrand = (id: string) => {
    setSelectedBrands(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    )
  }

  // Calculate price insights for each product
  const getPriceInsights = (product: Product) => {
    // Use member_price > discount_price > original_price for comparison
    const prices = product.product_urls
      .map((url) => url.member_price || url.discount_price || url.original_price)
      .filter((price): price is number => price !== null)

    if (prices.length === 0) return { lowest: null, highest: null, average: null }

    const lowest = Math.min(...prices)
    const highest = Math.max(...prices)
    const average = prices.reduce((sum, price) => sum + price, 0) / prices.length

    return { lowest, highest, average }
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1.5 opacity-40" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1.5" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-4 space-y-3">
          {/* Filter Dropdowns */}
          <div className="flex flex-wrap gap-3 items-center min-h-[36px]">
            {/* Brand Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  Brand
                  {selectedBrands.length > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-4 text-[10px]">
                      {selectedBrands.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start" sideOffset={4}>
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {manufacturerBrands.map((brand) => (
                    <div
                      key={brand.id}
                      className="flex items-center space-x-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer"
                      onClick={() => toggleBrand(brand.id)}
                    >
                      <Checkbox
                        checked={selectedBrands.includes(brand.id)}
                        onCheckedChange={() => toggleBrand(brand.id)}
                      />
                      <label className="text-sm cursor-pointer flex-1">{brand.name}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Category Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9">
                  Category
                  {selectedCategories.length > 0 && (
                    <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-4 text-[10px]">
                      {selectedCategories.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start" sideOffset={4}>
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center space-x-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer"
                      onClick={() => toggleCategory(cat.id)}
                    >
                      <Checkbox
                        checked={selectedCategories.includes(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
                      />
                      <label className="text-sm cursor-pointer flex-1">{cat.name}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Subcategory Filter */}
            {allSubcategories.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    Subcategory
                    {selectedSubcategories.length > 0 && (
                      <Badge variant="secondary" className="ml-2 px-1.5 py-0 h-4 text-[10px]">
                        {selectedSubcategories.length}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start" sideOffset={4}>
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {allSubcategories.map((subcat) => (
                      <div
                        key={subcat}
                        className="flex items-center space-x-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer"
                        onClick={() => toggleSubcategory(subcat)}
                      >
                        <Checkbox
                          checked={selectedSubcategories.includes(subcat)}
                          onCheckedChange={() => toggleSubcategory(subcat)}
                        />
                        <label className="text-sm cursor-pointer flex-1">{subcat}</label>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                <X className="h-3.5 w-3.5 mr-1.5" />
                Clear all
              </Button>
            )}

            {/* Sort Dropdown */}
            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <Select value={`${sortField}-${sortDirection}`} onValueChange={(value) => {
                const [field, direction] = value.split('-') as [string, "asc" | "desc"]
                setSortField(field)
                setSortDirection(direction)
              }}>
                <SelectTrigger className="h-9 w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                  <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                  <SelectItem value="brand-asc">Brand (A-Z)</SelectItem>
                  <SelectItem value="brand-desc">Brand (Z-A)</SelectItem>
                  <SelectItem value="category-asc">Category (A-Z)</SelectItem>
                  <SelectItem value="category-desc">Category (Z-A)</SelectItem>
                  <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                  <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Selected Filters Pills */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2">
            {selectedBrands.map((brandId) => {
              const brand = brands.find(b => b.id === brandId)
              if (!brand) return null
              return (
                <Badge
                  key={brandId}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 gap-1.5 flex items-center"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: brand.color || '#64748b',
                    }}
                  />
                  <span className="text-xs font-medium">{brand.name}</span>
                  <button
                    onClick={() => removeBrand(brandId)}
                    className="rounded-full hover:bg-slate-300 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )
            })}
            {selectedCategories.map((catId) => {
              const category = categories.find(c => c.id === catId)
              return category ? (
                <Badge key={catId} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                  <span className="text-xs">{category.name}</span>
                  <button
                    onClick={() => removeCategory(catId)}
                    className="rounded-full hover:bg-slate-300 p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null
            })}
            {selectedSubcategories.map((subcat) => (
              <Badge key={subcat} variant="secondary" className="pl-2 pr-1 py-1 gap-1">
                <span className="text-xs">{subcat}</span>
                <button
                  onClick={() => removeSubcategory(subcat)}
                  className="rounded-full hover:bg-slate-300 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between pt-3 border-t">
            <p className="text-sm text-muted-foreground">
              {filteredProducts.length === initialProducts.length ? (
                <>{filteredProducts.length} products</>
              ) : (
                <>
                  Showing {filteredProducts.length} of {initialProducts.length} products
                </>
              )}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="border-border/40 shadow-sm">
        <CardContent className="p-0">
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-slate-50 border-b border-slate-200">
                    <TableHead
                      className="font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("brand")}
                    >
                      <div className="flex items-center">
                        Brand
                        <SortIcon field="brand" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("category")}
                    >
                      <div className="flex items-center">
                        Category
                        <SortIcon field="category" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center">
                        Product
                        <SortIcon field="name" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
                      onClick={() => toggleSort("price")}
                    >
                      <div className="flex items-center">
                        Prices
                        <SortIcon field="price" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProducts.map((product, index) => {
                    const urls = product.product_urls
                    const latestUpdate = urls?.reduce((latest, url) => {
                      if (!url.last_scraped_at) return latest
                      if (!latest) return url.last_scraped_at
                      return new Date(url.last_scraped_at) > new Date(latest)
                        ? url.last_scraped_at
                        : latest
                    }, null as string | null)

                    const manufacturerUrl = urls?.find((url) => !url.brands.is_required)
                    const priceInsights = getPriceInsights(product)

                    return (
                      <TableRow
                        key={product.id}
                        className={`group hover:bg-slate-100 transition-colors ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        }`}
                      >
                        {/* Brand */}
                        <TableCell className="cursor-pointer" onClick={() => manufacturerUrl?.brands && toggleBrand(manufacturerUrl.brands.id)}>
                          {manufacturerUrl?.brands && (
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full flex-shrink-0"
                                style={{
                                  backgroundColor: manufacturerUrl.brands.color || '#64748b',
                                }}
                              />
                              <span className="text-sm font-medium text-slate-900">
                                {manufacturerUrl.brands.name}
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {/* Category */}
                        <TableCell
                          className="text-sm text-muted-foreground cursor-pointer hover:text-slate-900 transition-colors"
                          onClick={() => product.category_id && toggleCategory(product.category_id)}
                        >
                          {product.product_categories?.name || "—"}
                        </TableCell>

                        {/* Product Name */}
                        <TableCell className="font-medium">
                          <Link
                            href={`/products/${product.slug}`}
                            prefetch={true}
                            className="hover:text-primary transition-colors"
                          >
                            {product.name}
                          </Link>
                          {product.subcategory && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {product.subcategory}
                            </p>
                          )}
                        </TableCell>

                        {/* Prices */}
                        <TableCell>
                          <div className="space-y-1.5">
                            {urls?.sort((a, b) => {
                              // Always put Trendyol first
                              const aIsTrendyol = a.brands.name.toLowerCase().includes('trendyol')
                              const bIsTrendyol = b.brands.name.toLowerCase().includes('trendyol')
                              if (aIsTrendyol && !bIsTrendyol) return -1
                              if (!aIsTrendyol && bIsTrendyol) return 1
                              return 0
                            }).map((url) => {
                              const isTrendyol = url.brands.name.toLowerCase().includes('trendyol')

                              // For display, show discount_price if available, otherwise original_price
                              const displayPrice = url.discount_price || url.original_price

                              // Calculate savings from original to lowest available price
                              const lowestPrice = url.member_price || url.discount_price || url.original_price
                              const hasDiscount = url.discount_price || url.member_price
                              const savings = url.original_price && lowestPrice && url.original_price > lowestPrice
                                ? Math.round(((url.original_price - lowestPrice) / url.original_price) * 100)
                                : null

                              return (
                                <div key={url.id} className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground min-w-[80px]">
                                    {url.brands.name}:
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {/* Show strikethrough only for non-Trendyol retailers */}
                                    {hasDiscount && url.original_price && !isTrendyol && (
                                      <span className="text-xs text-muted-foreground line-through">
                                        {formatPrice(url.original_price)}
                                      </span>
                                    )}
                                    <span className="text-sm font-medium tabular-nums">
                                      {formatPrice(displayPrice)}
                                    </span>
                                    {url.member_price && (
                                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0 h-4 border-purple-200 whitespace-nowrap">
                                        +
                                      </Badge>
                                    )}
                                    {savings && (
                                      <span className="text-[10px] text-emerald-600 font-medium whitespace-nowrap">
                                        (-{savings}%)
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                {initialProducts.length === 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm">No products yet</p>
                    {canEdit && (
                      <Link href="/products/new" prefetch={true}>
                        <Button size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add your first product
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : (
                  <p className="text-sm">No products match the selected filters</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
