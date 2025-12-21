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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Plus, Edit, Loader2 } from "lucide-react"
import type { Profile, UserRole } from "@/types/database"

interface UserDialogProps {
  user?: Profile
  disabled?: boolean
}

export function UserDialog({ user, disabled }: UserDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const isEditing = !!user

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState(user?.full_name ?? "")
  const [role, setRole] = useState<UserRole>(user?.role ?? "viewer")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)

    if (isEditing) {
      // Update existing user
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName || null,
          role,
        })
        .eq("id", user.id)

      if (error) {
        toast({
          variant: "destructive",
          title: "Error updating user",
          description: error.message,
        })
        setIsLoading(false)
        return
      }

      toast({ title: "User updated" })
    } else {
      // Create new user via API
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast({
          variant: "destructive",
          title: "Error creating user",
          description: data.error || "Failed to create user",
        })
        setIsLoading(false)
        return
      }

      toast({ title: "User created" })
    }

    setIsLoading(false)
    setOpen(false)
    router.refresh()
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (newOpen) {
      if (user) {
        setFullName(user.full_name ?? "")
        setRole(user.role)
      } else {
        setEmail("")
        setPassword("")
        setFullName("")
        setRole("viewer")
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="sm" disabled={disabled}>
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Add User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update user details and permissions"
              : "Create a new user account"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </>
          )}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name (Optional)</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin - Full access</SelectItem>
                <SelectItem value="editor">Editor - Can edit products & websites</SelectItem>
                <SelectItem value="viewer">Viewer - Read only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create User"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

