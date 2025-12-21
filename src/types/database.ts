export type UserRole = "admin" | "editor" | "viewer"
export type ScrapeStatus = "pending" | "running" | "completed" | "failed"

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Brand {
  id: string
  name: string
  domain: string
  price_selector: string
  is_required: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProductUrl {
  id: string
  product_id: string
  brand_id: string
  url: string
  is_active: boolean
  last_price: number | null
  last_scraped_at: string | null
  created_at: string
}

export interface PriceHistory {
  id: string
  product_url_id: string
  price: number | null
  error: string | null
  scraped_at: string
}

export interface ScrapeJob {
  id: string
  status: ScrapeStatus
  triggered_by: string | null
  total_products: number
  scraped_count: number
  error_count: number
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
}

// Extended types with relations
export interface ProductWithUrls extends Product {
  product_urls: (ProductUrl & { brand: Brand })[]
}

export interface ProductUrlWithDetails extends ProductUrl {
  product: Product
  brand: Brand
}

// View type
export interface ProductWithPrices {
  id: string
  name: string
  created_at: string
  updated_at: string
  urls: {
    brand_id: string
    brand_name: string
    brand_domain: string
    url: string
    is_active: boolean
    last_price: number | null
    last_scraped_at: string | null
  }[] | null
}

