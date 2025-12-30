import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)

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

  const isDev = process.env.NODE_ENV === "development"

  // Development mode: run scraper locally
  if (isDev) {
    try {
      console.log("🔧 Development mode: Running scraper locally...")

      const scraperPath = path.join(process.cwd(), "scraper")
      const command = `node index.js`

      // Run in background with secure env vars
      exec(command, {
        cwd: scraperPath,
        env: {
          ...process.env,
          SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
          TRIGGERED_BY: user.id
        }
      }, (error, stdout, stderr) => {
        if (error) {
          console.error("Scraper error:", error)
          console.error("stderr:", stderr)
        } else {
          console.log("Scraper output:", stdout)
        }
      })

      return NextResponse.json({
        success: true,
        message: "Scraper started locally. Check terminal for output."
      })
    } catch (error) {
      console.error("Error running scraper:", error)
      return NextResponse.json(
        { error: "Failed to start scraper" },
        { status: 500 }
      )
    }
  }

  // Production mode: trigger GitHub Actions
  const githubToken = process.env.GITHUB_TOKEN
  const githubRepo = process.env.GITHUB_REPO

  if (!githubToken || !githubRepo) {
    return NextResponse.json(
      { error: "GitHub Actions not configured. Please set GITHUB_TOKEN and GITHUB_REPO environment variables." },
      { status: 500 }
    )
  }

  try {
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

