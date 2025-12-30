import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"

const execAsync = promisify(exec)

export async function POST(request: Request) {
  const supabase = await createClient()

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { productId } = await request.json()

  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 })
  }

  const isDev = process.env.NODE_ENV === "development"

  // Development mode: run scraper locally for this product
  if (isDev) {
    try {
      console.log(`🔧 Scraping product: ${productId}`)

      const scraperPath = path.join(process.cwd(), "scraper")
      const command = `node index.js`

      // Run in background with secure env vars
      exec(command, {
        cwd: scraperPath,
        env: {
          ...process.env,
          SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
          PRODUCT_ID: productId
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
        message: "Started scraping product. Check back in a moment."
      })
    } catch (error) {
      console.error("Error running scraper:", error)
      return NextResponse.json(
        { error: "Failed to start scraper" },
        { status: 500 }
      )
    }
  }

  // Production mode: trigger GitHub Actions with product ID
  const githubToken = process.env.GITHUB_TOKEN
  const githubRepo = process.env.GITHUB_REPO

  if (!githubToken || !githubRepo) {
    return NextResponse.json(
      { error: "GitHub Actions not configured" },
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
            product_id: productId,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to trigger workflow")
    }

    return NextResponse.json({
      success: true,
      message: "Started scraping product"
    })
  } catch (error) {
    console.error("Error triggering scrape:", error)
    return NextResponse.json(
      { error: "Failed to trigger scrape" },
      { status: 500 }
    )
  }
}
