import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Sidebar } from "@/components/sidebar"
import type { Profile } from "@/types/database"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar profile={profile as Profile} />
      <main className="lg:pl-64">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}

