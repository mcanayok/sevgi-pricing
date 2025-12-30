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
import type { ProductCategory } from "@/types/database"

interface CategoryDialogProps {
  category?: ProductCategory
}

export function CategoryDialog({ category }: CategoryDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!category

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [name, setName] = useState(category?.name ?? "")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    const data = {
      name,
    }

    if (isEditing) {
      const { error } = await supabase
        .from("product_categories")
        .update(data)
        .eq("id", category.id)

      if (error) {
        toast({
          variant: "destructive",
          title: "Error updating category",
          description: error.message,
        })
        setIsLoading(false)
        return
      }

      toast({ title: "Category updated" })
    } else {
      const { error } = await supabase.from("product_categories").insert(data)

      if (error) {
        toast({
          variant: "destructive",
          title: "Error creating category",
          description: error.message,
        })
        setIsLoading(false)
        return
      }

      toast({ title: "Category created" })
    }

    setIsLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!category) return

    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) {
      return
    }

    setIsDeleting(true)

    const { error } = await supabase
      .from("product_categories")
      .delete()
      .eq("id", category.id)

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting category",
        description: error.message,
      })
      setIsDeleting(false)
      return
    }

    toast({ title: "Category deleted" })
    setIsDeleting(false)
    setOpen(false)
    router.refresh()
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (newOpen && category) {
      setName(category.name)
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
            Add Category
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the category details"
              : "Add a new product category"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Snacks"
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
                "Add Category"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
