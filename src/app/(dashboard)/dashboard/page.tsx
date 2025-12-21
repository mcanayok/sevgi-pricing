import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatPrice } from "@/lib/utils"
import { Package, Globe, TrendingUp, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch stats
  const [
    { count: productsCount },
    { count: websitesCount },
    { data: latestScrapeJob },
    { data: recentPrices },
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("websites").select("*", { count: "exact", head: true }),
    supabase.from("scrape_jobs").select("*").order("created_at", { ascending: false }).limit(1).single(),
    supabase
      .from("price_history")
      .select(`
        id,
        price,
        scraped_at,
        product_urls!inner(
          url,
          products!inner(brand, name),
          websites!inner(name, domain)
        )
      `)
      .order("scraped_at", { ascending: false })
      .limit(10),
  ])

  const stats = [
    {
      name: "Total Products",
      value: productsCount ?? 0,
      icon: Package,
      href: "/products",
    },
    {
      name: "Tracked Websites",
      value: websitesCount ?? 0,
      icon: Globe,
      href: "/websites",
    },
    {
      name: "Last Scrape",
      value: latestScrapeJob?.completed_at
        ? formatDate(latestScrapeJob.completed_at)
        : "Never",
      icon: Clock,
      href: "/settings",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your price tracking
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Latest Scrape Status */}
      {latestScrapeJob && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Latest Scrape Job
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 flex-wrap">
              <Badge
                variant={
                  latestScrapeJob.status === "completed"
                    ? "success"
                    : latestScrapeJob.status === "failed"
                    ? "destructive"
                    : latestScrapeJob.status === "running"
                    ? "warning"
                    : "secondary"
                }
              >
                {latestScrapeJob.status}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {latestScrapeJob.scraped_count} / {latestScrapeJob.total_products} products scraped
              </span>
              {latestScrapeJob.error_count > 0 && (
                <span className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {latestScrapeJob.error_count} errors
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Price Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Price Updates</CardTitle>
          <CardDescription>Latest scraped prices from all websites</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPrices && recentPrices.length > 0 ? (
            <div className="space-y-4">
              {recentPrices.map((item) => {
                const productUrl = item.product_urls as unknown as {
                  url: string
                  products: { brand: string; name: string }
                  websites: { name: string; domain: string }
                } | null
                if (!productUrl) return null
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {productUrl.products?.brand} - {productUrl.products?.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {productUrl.websites?.name}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-primary">
                        {formatPrice(item.price)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(item.scraped_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No price data yet</p>
              <p className="text-sm">Add products and run a scrape to see prices here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

