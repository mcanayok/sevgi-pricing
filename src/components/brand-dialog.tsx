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
import type { Brand } from "@/types/database"

interface BrandDialogProps {
  brand?: Brand
}

export function BrandDialog({ brand }: BrandDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!brand

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [name, setName] = useState(brand?.name ?? "")
  const [domain, setDomain] = useState(brand?.domain ?? "")
  const [priceSelector, setPriceSelector] = useState(brand?.price_selector ?? "")
  const [notes, setNotes] = useState(brand?.notes ?? "")

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
        .from("brands")
        .update(data)
        .eq("id", brand.id)

      if (error) {
        toast({
          variant: "destructive",
          title: "Error updating brand",
          description: error.message,
        })
        setIsLoading(false)
        return
      }

      toast({ title: "Brand updated" })
    } else {
      const { error } = await supabase.from("brands").insert(data)

      if (error) {
        toast({
          variant: "destructive",
          title: "Error creating brand",
          description: error.message,
        })
        setIsLoading(false)
        return
      }

      toast({ title: "Brand created" })
    }

    setIsLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!brand) return

    if (!confirm(`Are you sure you want to delete "${brand.name}"? This will also delete all associated product URLs.`)) {
      return
    }

    setIsDeleting(true)

    const { error } = await supabase
      .from("brands")
      .delete()
      .eq("id", brand.id)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting brand",
        description: error.message,
      })
      setIsDeleting(false)
      return
    }

    toast({ title: "Brand deleted" })
    setIsDeleting(false)
    setOpen(false)
    router.refresh()
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (newOpen && brand) {
      setName(brand.name)
      setDomain(brand.domain)
      setPriceSelector(brand.price_selector)
      setNotes(brand.notes ?? "")
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
            Add Brand
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Brand" : "Add Brand"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the brand configuration"
              : "Add a new brand to track prices from"}
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
              placeholder="Any notes about this brand..."
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {isEditing && !brand?.is_required && (
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
                "Add Brand"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

