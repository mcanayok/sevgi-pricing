import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { RefreshCw, AlertCircle, CheckCircle } from "lucide-react"
import { TriggerScrapeButton } from "@/components/trigger-scrape-button"
import type { ScrapeJob } from "@/types/database"

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user?.id)
    .single()

  // Only admins can access settings
  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  // Fetch recent scrape jobs
  const { data: scrapeJobs } = await supabase
    .from("scrape_jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage scraping configuration
        </p>
      </div>

      {/* Scraping Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Price Scraping
              </CardTitle>
              <CardDescription>
                Trigger a manual price update or view scrape history
              </CardDescription>
            </div>
            <TriggerScrapeButton />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">Automatic Scraping</p>
                <p className="text-sm text-muted-foreground">
                  Prices are automatically updated every Sunday at 3:00 AM via GitHub Actions
                </p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>

            {/* Recent Scrape Jobs */}
            {scrapeJobs && scrapeJobs.length > 0 && (
              <div className="mt-6">
                <h4 className="font-medium mb-3">Recent Scrape Jobs</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Errors</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scrapeJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell>
                          <Badge
                            variant={
                              job.status === "completed"
                                ? "success"
                                : job.status === "failed"
                                ? "destructive"
                                : job.status === "running"
                                ? "warning"
                                : "secondary"
                            }
                          >
                            {job.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                            {job.status === "failed" && <AlertCircle className="h-3 w-3 mr-1" />}
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {job.scraped_count} / {job.total_products}
                        </TableCell>
                        <TableCell>
                          {job.error_count > 0 ? (
                            <span className="text-destructive">{job.error_count}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {job.started_at ? formatDate(job.started_at) : "—"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {job.completed_at ? formatDate(job.completed_at) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

