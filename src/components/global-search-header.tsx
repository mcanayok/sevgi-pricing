"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { GlobalSearch } from "@/components/global-search"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CategoryDialog } from "@/components/category-dialog"
import { BrandDialog } from "@/components/brand-dialog"

export function GlobalSearchHeader() {
  const pathname = usePathname()

  // Determine which add button to show based on current page
  const getActionButton = () => {
    if (pathname.startsWith("/products")) {
      return (
        <Link href="/products/new">
          <Button size="default" className="shadow-sm whitespace-nowrap">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </Link>
      )
    }

    if (pathname.startsWith("/categories")) {
      return <CategoryDialog />
    }

    if (pathname.startsWith("/brands")) {
      return <BrandDialog />
    }

    return null
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 lg:left-64 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 border-b border-slate-200/60 shadow-sm transition-all duration-300">
      <div className="px-6 py-3.5 flex items-center gap-4">
        <div className="flex-1">
          <GlobalSearch />
        </div>
        {getActionButton()}
      </div>
    </header>
  )
}
