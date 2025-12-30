"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function TriggerScrapeButton() {
  const router = useRouter()
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState("")
  const toastIdRef = useRef<string | number | null>(null)

  async function handleTrigger() {
    setIsLoading(true)
    setProgress("Starting...")

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger scrape")
      }

      // Show loading toast
      toastIdRef.current = toast.loading("Mass sync started", {
        description: "Fetching latest prices from all stores for all products...",
      })

      // Start polling for completion
      startPolling()
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to trigger scrape",
      })
      setIsLoading(false)
      setProgress("")
    }
  }

  function startPolling() {
    const startTime = new Date()
    let attempts = 0
    const maxAttempts = 120 // 2 minutes max

    const poll = async () => {
      attempts++
      setProgress(`Syncing... (${attempts}s)`)

      // Check for recent scrape job completion
      const { data: recentJob } = await supabase
        .from("scrape_jobs")
        .select("*")
        .gte("created_at", startTime.toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (recentJob && recentJob.status === "completed") {
        // Dismiss loading toast
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current)
        }

        setProgress("")
        setIsLoading(false)

        toast.success("Mass sync completed", {
          description: `Successfully scraped ${recentJob.scraped_count || 0} products`,
        })

        // Refresh to show updated data
        router.refresh()
        return
      }

      if (attempts < maxAttempts) {
        setTimeout(poll, 1000)
      } else {
        // Timeout - dismiss toast and show info
        if (toastIdRef.current) {
          toast.dismiss(toastIdRef.current)
        }

        setProgress("")
        setIsLoading(false)

        toast.info("Sync in progress", {
          description: "Prices are being updated in the background. This may take several minutes.",
        })

        router.refresh()
      }
    }

    setTimeout(poll, 3000) // Wait 3s before first poll
  }

  return (
    <Button onClick={handleTrigger} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {progress || "Syncing..."}
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync All Products
        </>
      )}
    </Button>
  )
}
