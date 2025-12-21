"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Plus, Edit, Loader2, Trash2 } from "lucide-react"
import type { Website } from "@/types/database"

interface WebsiteDialogProps {
  website?: Website
}

export function WebsiteDialog({ website }: WebsiteDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!website

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [name, setName] = useState(website?.name ?? "")
  const [domain, setDomain] = useState(website?.domain ?? "")
  const [priceSelector, setPriceSelector] = useState(website?.price_selector ?? "")
  const [notes, setNotes] = useState(website?.notes ?? "")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const data = {
      name,
      domain: domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      price_selector: priceSelector,
      notes: notes || null,
    }

    if (isEditing) {
      const { error } = await supabase
        .from("websites")
        .update(data)
        .eq("id", website.id)

      if (error) {
        toast({
          variant: "destructive",
          title: "Error updating website",
          description: error.message,
        })
        setIsLoading(false)
        return
      }

      toast({ title: "Website updated" })
    } else {
      const { error } = await supabase.from("websites").insert(data)

      if (error) {
        toast({
          variant: "destructive",
          title: "Error creating website",
          description: error.message,
        })
        setIsLoading(false)
        return
      }

      toast({ title: "Website created" })
    }

    setIsLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!website) return
    
    if (!confirm(`Are you sure you want to delete "${website.name}"? This will also delete all associated product URLs.`)) {
      return
    }

    setIsDeleting(true)

    const { error } = await supabase
      .from("websites")
      .delete()
      .eq("id", website.id)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting website",
        description: error.message,
      })
      setIsDeleting(false)
      return
    }

    toast({ title: "Website deleted" })
    setIsDeleting(false)
    setOpen(false)
    router.refresh()
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (newOpen && website) {
      setName(website.name)
      setDomain(website.domain)
      setPriceSelector(website.price_selector)
      setNotes(website.notes ?? "")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Website
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Website" : "Add Website"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the website configuration"
              : "Add a new website to track prices from"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Trendyol"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain</Label>
            <Input
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g., trendyol.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="selector">CSS Selector for Price</Label>
            <Input
              id="selector"
              value={priceSelector}
              onChange={(e) => setPriceSelector(e.target.value)}
              placeholder="e.g., span.prc-dsc"
              required
            />
            <p className="text-xs text-muted-foreground">
              Use browser DevTools to find the CSS selector for the price element
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this website..."
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {isEditing && !website?.is_required && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting || isLoading}
                className="mr-auto"
              >
                {isDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Add Website"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

