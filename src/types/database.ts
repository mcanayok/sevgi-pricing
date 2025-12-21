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

export interface Website {
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
  brand: string
  name: string
  sku: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface ProductUrl {
  id: string
  product_id: string
  website_id: string
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
  product_urls: (ProductUrl & { website: Website })[]
}

export interface ProductUrlWithDetails extends ProductUrl {
  product: Product
  website: Website
}

// View type
export interface ProductWithPrices {
  id: string
  brand: string
  name: string
  sku: string | null
  notes: string | null
  created_at: string
  updated_at: string
  urls: {
    website_id: string
    website_name: string
    website_domain: string
    url: string
    is_active: boolean
    last_price: number | null
    last_scraped_at: string | null
  }[] | null
}

