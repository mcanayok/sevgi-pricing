import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"

interface ImportRow {
  brand: string
  name: string
  sku?: string
  notes?: string
  trendyol_url: string
  website_name?: string
  website_url?: string
}

export async function POST(request: Request) {
  const serverSupabase = await createServerClient()

  // Check if user is admin or editor
  const { data: { user } } = await serverSupabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await serverSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    return NextResponse.json({ error: "Editor access required" }, { status: 403 })
  }

  // Parse request body
  const { rows } = await request.json() as { rows: ImportRow[] }

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "No data to import" }, { status: 400 })
  }

  // Use service role for bulk operations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get Trendyol website ID (required)
  const { data: trendyolWebsite } = await supabase
    .from("brands")
    .select("id")
    .eq("domain", "trendyol.com")
    .single()

  if (!trendyolWebsite) {
    return NextResponse.json(
      { error: "Trendyol website not found. Please add it first." },
      { status: 400 }
    )
  }

  const results = {
    success: 0,
    errors: [] as string[],
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 for 1-indexed + header row

    try {
      // Validate required fields
      if (!row.brand || !row.name || !row.trendyol_url) {
        results.errors.push(`Row ${rowNum}: Missing required fields (brand, name, trendyol_url)`)
        continue
      }

      // Create product
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          brand: row.brand.trim(),
          name: row.name.trim(),
          sku: row.sku?.trim() || null,
          notes: row.notes?.trim() || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (productError) {
        results.errors.push(`Row ${rowNum}: ${productError.message}`)
        continue
      }

      // Add Trendyol URL
      await supabase.from("product_urls").insert({
        product_id: product.id,
        brand_id: trendyolWebsite.id,
        url: row.trendyol_url.trim(),
      })

      // Add website URL if provided
      if (row.website_name && row.website_url) {
        // Find or create the website
        let websiteId: string

        // Extract domain from URL
        const urlObj = new URL(row.website_url.trim())
        const domain = urlObj.hostname.replace("www.", "")

        // Check if website exists
        const { data: existingWebsite } = await supabase
          .from("brands")
          .select("id")
          .eq("domain", domain)
          .single()

        if (existingWebsite) {
          websiteId = existingWebsite.id
        } else {
          // Create new website with a placeholder selector
          const { data: newWebsite, error: websiteError } = await supabase
            .from("brands")
            .insert({
              name: row.website_name.trim(),
              domain: domain,
              price_selector: ".price", // Placeholder - needs to be configured
              notes: "Auto-created from import. Please update the price selector.",
            })
            .select()
            .single()

          if (websiteError) {
            results.errors.push(`Row ${rowNum}: Could not create website: ${websiteError.message}`)
            results.success++ // Product was still created
            continue
          }

          websiteId = newWebsite.id
        }

        // Add the product URL
        await supabase.from("product_urls").insert({
          product_id: product.id,
          brand_id: websiteId,
          url: row.website_url.trim(),
        })
      }

      results.success++
    } catch (error) {
      results.errors.push(`Row ${rowNum}: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  return NextResponse.json(results)
}

