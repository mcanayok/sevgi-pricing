import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST() {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  // Check GitHub configuration
  const githubToken = process.env.GITHUB_TOKEN
  const githubRepo = process.env.GITHUB_REPO

  if (!githubToken || !githubRepo) {
    return NextResponse.json(
      { error: "GitHub Actions not configured. Please set GITHUB_TOKEN and GITHUB_REPO environment variables." },
      { status: 500 }
    )
  }

  try {
    // Trigger GitHub Actions workflow
    const [owner, repo] = githubRepo.split("/")
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/scrape.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ref: "main",
          inputs: {
            triggered_by: user.id,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("GitHub API error:", errorText)
      return NextResponse.json(
        { error: "Failed to trigger GitHub Actions workflow" },
        { status: 500 }
      )
    }

    // Create a scrape job record
    await supabase.from("scrape_jobs").insert({
      status: "pending",
      triggered_by: user.id,
    })

    return NextResponse.json({ success: true, message: "Scrape job triggered" })
  } catch (error) {
    console.error("Error triggering scrape:", error)
    return NextResponse.json(
      { error: "Failed to trigger scrape" },
      { status: 500 }
    )
  }
}

