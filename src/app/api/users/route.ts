import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const serverSupabase = await createServerClient()

  // Check if user is admin
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await serverSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  // Parse request body
  const { email, password, fullName, role } = await request.json()

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    )
  }

  // Use service role client to create user
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // Create user
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: role || "viewer",
    },
  })

  if (createError) {
    return NextResponse.json({ error: createError.message }, { status: 400 })
  }

  // Update the profile with the correct role (trigger should have created it)
  if (newUser.user) {
    await supabaseAdmin
      .from("profiles")
      .update({ role: role || "viewer", full_name: fullName })
      .eq("id", newUser.user.id)
  }

  return NextResponse.json({ success: true, user: newUser.user })
}

