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
  const [originalPriceSelector, setOriginalPriceSelector] = useState(brand?.original_price_selector ?? brand?.price_selector ?? "")
  const [discountPriceSelector, setDiscountPriceSelector] = useState(brand?.discount_price_selector ?? "")
  const [memberPriceSelector, setMemberPriceSelector] = useState(brand?.member_price_selector ?? "")
  const [color, setColor] = useState(brand?.color ?? "#64748b")
  const [notes, setNotes] = useState(brand?.notes ?? "")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const data = {
      name,
      domain: domain.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      original_price_selector: originalPriceSelector || null,
      discount_price_selector: discountPriceSelector || null,
      member_price_selector: memberPriceSelector || null,
      price_selector: originalPriceSelector || null, // Keep for backwards compatibility
      color: color || null,
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
      setOriginalPriceSelector(brand.original_price_selector ?? brand.price_selector ?? "")
      setDiscountPriceSelector(brand.discount_price_selector ?? "")
      setMemberPriceSelector(brand.member_price_selector ?? "")
      setColor(brand.color ?? "#64748b")
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
            <Label htmlFor="original-selector">Original Price Selector</Label>
            <Input
              id="original-selector"
              value={originalPriceSelector}
              onChange={(e) => setOriginalPriceSelector(e.target.value)}
              placeholder="e.g., span.prc-org, .price--original"
              required
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated selectors for original/crossed-out price
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="discount-selector">Discount Price Selector (Optional)</Label>
            <Input
              id="discount-selector"
              value={discountPriceSelector}
              onChange={(e) => setDiscountPriceSelector(e.target.value)}
              placeholder="e.g., span.discounted, .price--sale"
            />
            <p className="text-xs text-muted-foreground">
              Comma-separated selectors for discounted price
            </p>
          </div>
          {brand?.is_required && (
            <div className="space-y-2">
              <Label htmlFor="member-selector">Member/Plus Price Selector (Optional)</Label>
              <Input
                id="member-selector"
                value={memberPriceSelector}
                onChange={(e) => setMemberPriceSelector(e.target.value)}
                placeholder="e.g., .ty-plus-price-discounted-price"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated selectors for member/Plus pricing (Trendyol only)
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="color">Brand Color</Label>
            <div className="flex gap-2 items-center">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#64748b"
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Choose a color that matches the brand's identity
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

