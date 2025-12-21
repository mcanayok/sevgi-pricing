"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { RefreshCw, Loader2 } from "lucide-react"

export function TriggerScrapeButton() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleTrigger() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/scrape", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger scrape")
      }

      toast({
        title: "Scrape triggered",
        description: "Price update has been started. Check back in a few minutes.",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to trigger scrape",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleTrigger} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Triggering...
        </>
      ) : (
        <>
          <RefreshCw className="h-4 w-4 mr-2" />
          Trigger Scrape Now
        </>
      )}
    </Button>
  )
}

