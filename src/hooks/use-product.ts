import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function useProduct(productSlug: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["product", productSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_urls(
            id,
            url,
            is_active,
            last_price,
            last_scraped_at,
            brand_id,
            brands(id, name, domain, is_required)
          )
        `)
        .eq("slug", productSlug)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!productSlug,
  })
}

export function useProducts() {
  const supabase = createClient()

  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_categories(id, name),
          product_urls(
            id,
            url,
            is_active,
            last_price,
            last_scraped_at,
            brands(id, name, domain, is_required)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data
    },
  })
}

export function usePriceHistory(productId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ["priceHistory", productId],
    queryFn: async () => {
      // First get product URLs
      const { data: product } = await supabase
        .from("products")
        .select("product_urls(id)")
        .eq("id", productId)
        .single()

      const productUrlIds = (product?.product_urls as Array<{ id: string }>)?.map((pu) => pu.id) || []

      if (productUrlIds.length === 0) return []

      const { data, error } = await supabase
        .from("price_history")
        .select("*")
        .in("product_url_id", productUrlIds)
        .order("scraped_at", { ascending: false })
        .limit(100)

      if (error) throw error
      return data
    },
    enabled: !!productId,
  })
}

export function useRefreshProduct() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch("/api/scrape-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      })

      if (!response.ok) {
        throw new Error("Failed to refresh product")
      }

      return response.json()
    },
    onSuccess: (_, productId) => {
      // Invalidate product and price history queries after a delay
      // to allow the scraper to complete
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["product", productId] })
        queryClient.invalidateQueries({ queryKey: ["priceHistory", productId] })
      }, 20000) // 20 seconds
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (productId: string) => {
      // First delete product URLs (cascade should handle this, but being explicit)
      await supabase.from("product_urls").delete().eq("product_id", productId)

      // Delete the product
      const { error } = await supabase.from("products").delete().eq("id", productId)

      if (error) throw error
      return productId
    },
    onMutate: async (productId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["products"] })
      await queryClient.cancelQueries({ queryKey: ["product", productId] })

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData(["products"])

      // Optimistically update - remove from list
      queryClient.setQueryData(["products"], (old: any) => {
        if (!old) return old
        return old.filter((p: any) => p.id !== productId)
      })

      return { previousProducts }
    },
    onError: (err, productId, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts)
      }
      toast.error("Failed to delete product", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    },
    onSuccess: () => {
      toast.success("Product deleted successfully")
      router.push("/products")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: {
      name: string
      category_id?: string
      subcategory_id?: string
      urls: Array<{ brand_id: string; url: string }>
    }) => {
      // Create product
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: data.name,
          category_id: data.category_id || null,
          subcategory_id: data.subcategory_id || null,
        })
        .select()
        .single()

      if (productError) throw productError

      // Create product URLs
      const urlsToInsert = data.urls.map((url) => ({
        product_id: product.id,
        brand_id: url.brand_id,
        url: url.url,
      }))

      const { error: urlsError } = await supabase.from("product_urls").insert(urlsToInsert)

      if (urlsError) {
        // Cleanup: delete the product if URLs failed
        await supabase.from("products").delete().eq("id", product.id)
        throw urlsError
      }

      return product
    },
    onSuccess: (product) => {
      toast.success("Product created successfully")
      queryClient.invalidateQueries({ queryKey: ["products"] })
      router.push(`/products/${product.slug}`)
    },
    onError: (err) => {
      toast.error("Failed to create product", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  const supabase = createClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: {
      id: string
      name: string
      category_id?: string
      subcategory_id?: string
      urls: Array<{ brand_id: string; url: string }>
    }) => {
      // Update product
      const { data: product, error: productError } = await supabase
        .from("products")
        .update({
          name: data.name,
          category_id: data.category_id || null,
          subcategory_id: data.subcategory_id || null,
        })
        .eq("id", data.id)
        .select("id, slug")
        .single()

      if (productError) throw productError

      // Delete old URLs
      await supabase.from("product_urls").delete().eq("product_id", data.id)

      // Insert new URLs
      const urlsToInsert = data.urls.map((url) => ({
        product_id: data.id,
        brand_id: url.brand_id,
        url: url.url,
      }))

      const { error: urlsError } = await supabase.from("product_urls").insert(urlsToInsert)

      if (urlsError) throw urlsError

      return product
    },
    onSuccess: (product) => {
      toast.success("Product updated successfully")
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["product", product.slug] })
      router.push(`/products/${product.slug}`)
    },
    onError: (err) => {
      toast.error("Failed to update product", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    },
  })
}
