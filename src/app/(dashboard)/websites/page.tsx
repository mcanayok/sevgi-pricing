import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
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
import { Plus, Globe, Code } from "lucide-react"
import { WebsiteDialog } from "@/components/website-dialog"
import type { Website } from "@/types/database"

export default async function WebsitesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id)
    .single()

  const canEdit = profile?.role === "admin" || profile?.role === "editor"

  const { data: websites } = await supabase
    .from("websites")
    .select("*")
    .order("is_required", { ascending: false })
    .order("name", { ascending: true })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Websites</h1>
          <p className="text-muted-foreground mt-1">
            Manage tracked websites and their CSS selectors
          </p>
        </div>
        {canEdit && <WebsiteDialog />}
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Code className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">About CSS Selectors</p>
              <p className="text-sm text-muted-foreground mt-1">
                CSS selectors are used to find the price element on each website. 
                For example: <code className="bg-background px-1.5 py-0.5 rounded text-xs">span.prc-dsc</code> for Trendyol.
                Use your browser&apos;s developer tools to find the right selector for each site.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Websites Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Websites</CardTitle>
          <CardDescription>
            {websites?.length ?? 0} websites configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          {websites && websites.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>CSS Selector</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Added</TableHead>
                  {canEdit && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {websites.map((website) => (
                  <TableRow key={website.id}>
                    <TableCell className="font-medium">{website.name}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {website.domain}
                      </code>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {website.price_selector}
                      </code>
                    </TableCell>
                    <TableCell>
                      {website.is_required ? (
                        <Badge variant="default">Required</Badge>
                      ) : (
                        <Badge variant="secondary">Optional</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(website.created_at)}
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <WebsiteDialog website={website as Website} />
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No websites configured</p>
              {canEdit && <WebsiteDialog />}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

