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

interface ProductSubcategory {
  id: string
  category_id: string
  name: string
  created_at: string
}

interface SubcategoryDialogProps {
  categoryId: string
  categoryName: string
  subcategory?: ProductSubcategory
}

export function SubcategoryDialog({ categoryId, categoryName, subcategory }: SubcategoryDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!subcategory

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [name, setName] = useState(subcategory?.name ?? "")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const data = {
      category_id: categoryId,
      name,
    }

    if (isEditing) {
      const { error } = await supabase
        .from("product_subcategories")
        .update({ name })
        .eq("id", subcategory.id)

      if (error) {
        toast({
          variant: "destructive",
          title: "Error updating subcategory",
          description: error.message,
        })
        setIsLoading(false)
        return
      }

      toast({ title: "Subcategory updated" })
    } else {
      const { error } = await supabase.from("product_subcategories").insert(data)

      if (error) {
        toast({
          variant: "destructive",
          title: "Error creating subcategory",
          description: error.message,
        })
        setIsLoading(false)
        return
      }

      toast({ title: "Subcategory created" })
    }

    setIsLoading(false)
    setOpen(false)
    setName("")
    router.refresh()
  }

  async function handleDelete() {
    if (!subcategory) return

    if (!confirm(`Are you sure you want to delete "${subcategory.name}"?`)) {
      return
    }

    setIsDeleting(true)

    const { error } = await supabase
      .from("product_subcategories")
      .delete()
      .eq("id", subcategory.id)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting subcategory",
        description: error.message,
      })
      setIsDeleting(false)
      return
    }

    toast({ title: "Subcategory deleted" })
    setIsDeleting(false)
    setOpen(false)
    router.refresh()
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (newOpen && subcategory) {
      setName(subcategory.name)
    } else if (!newOpen) {
      setName("")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm">
            <Edit className="h-3 w-3" />
          </Button>
        ) : (
          <Button size="sm" variant="outline">
            <Plus className="h-3 w-3 mr-1.5" />
            Add Subcategory
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the subcategory name"
              : <>Add a new subcategory to <strong>{categoryName}</strong></>}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Chocolate"
              required
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {isEditing && (
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
                "Add Subcategory"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
