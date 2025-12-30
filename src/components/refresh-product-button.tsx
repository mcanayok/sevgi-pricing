"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useRefreshProduct } from "@/hooks/use-product"
import { useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface RefreshProductButtonProps {
  productId: string
}

export function RefreshProductButton({ productId }: RefreshProductButtonProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const supabase = createClient()
  const refreshMutation = useRefreshProduct()
  const [progress, setProgress] = useState("")
  const toastIdRef = useRef<string | number | null>(null)

  // Poll for updates after refresh is triggered
  useEffect(() => {
    if (!refreshMutation.isSuccess) return

    const startTime = new Date()
    let attempts = 0
    const maxAttempts = 30

    // Show loading toast
    toastIdRef.current = toast.loading("Scraping started", {
      description: "Fetching latest prices for this product...",
    })

    const poll = async () => {
      attempts++

      const { data: product } = await supabase
        .from("products")
        .select("product_urls(last_scraped_at)")
        .eq("id", productId)
        .single()

      const urls = (product?.product_urls || []) as any[]
      const hasNewData = urls.some(
        (url) => url.last_scraped_at && new Date(url.last_scraped_at) > startTime
      )

      if (hasNewData) {
        // Dismiss loading toast
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current)
        }

        setProgress("✓ Prices updated")
        toast.success("Prices updated successfully", {
          description: "Latest prices have been fetched",
        })

        // Invalidate queries and refresh router to update server components
        queryClient.invalidateQueries({ queryKey: ["product", productId] })
        queryClient.invalidateQueries({ queryKey: ["priceHistory", productId] })
        router.refresh()

        setTimeout(() => setProgress(""), 1000)
        return
      }

      if (attempts < maxAttempts) {
        setProgress(`Fetching prices... (${attempts}s)`)
        setTimeout(poll, 1000)
      } else {
        // Dismiss loading toast
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current)
        }

        setProgress("✓ Completed")
        toast.info("Refresh in progress", {
          description: "Prices are being updated in the background",
        })

        // Refresh router anyway to show any partial updates
        router.refresh()

        setTimeout(() => setProgress(""), 2000)
      }
    }

    setTimeout(poll, 2000)
  }, [refreshMutation.isSuccess, productId, queryClient, supabase, router])

  const handleRefresh = () => {
    setProgress("Starting refresh...")
    refreshMutation.mutate(productId)
  }

  const isLoading = refreshMutation.isPending || progress !== ""

  return (
    <Button
      variant="outline"
      onClick={handleRefresh}
      disabled={isLoading}
      className="relative"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? progress || "Refreshing..." : "Refresh Prices"}
    </Button>
  )
}
