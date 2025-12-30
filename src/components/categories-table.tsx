"use client"

import { useState, Fragment } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Package, ChevronDown, ChevronRight } from "lucide-react"
import { CategoryDialog } from "@/components/category-dialog"
import { SubcategoryDialog } from "@/components/subcategory-dialog"
import Link from "next/link"
import type { ProductCategory } from "@/types/database"

interface ProductSubcategory {
  id: string
  category_id: string
  name: string
  created_at: string
}

interface CategoriesTableProps {
  categories: ProductCategory[]
  categoryCounts: Record<string, number>
  subcategoriesByCategory: Record<string, ProductSubcategory[]>
  subcategoryCounts: Record<string, number>
  canEdit: boolean
}

export function CategoriesTable({
  categories,
  categoryCounts,
  subcategoriesByCategory,
  subcategoryCounts,
  canEdit,
}: CategoriesTableProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent bg-slate-50 border-b border-slate-200">
          <TableHead className="font-semibold text-slate-700 w-[40px]"></TableHead>
          <TableHead className="font-semibold text-slate-700">Category</TableHead>
          <TableHead className="font-semibold text-slate-700 text-center">Products</TableHead>
          <TableHead className="font-semibold text-slate-700 text-center">Subcategories</TableHead>
          <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories && categories.length > 0 ? (
          categories.map((category, index) => {
            const productCount = categoryCounts[category.id] || 0
            const categorySubcats = subcategoriesByCategory[category.id] || []
            const subcategoryCount = categorySubcats.length
            const isExpanded = expandedCategories.has(category.id)

            return (
              <Fragment key={category.id}>
                {/* Category Row */}
                <TableRow
                  className={`hover:bg-slate-100 transition-colors ${
                    index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                  }`}
                >
                  <TableCell>
                    {subcategoryCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleCategory(category.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-medium bg-purple-100 text-purple-700 border border-purple-200">
                      {productCount}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {subcategoryCount > 0 ? (
                      <Badge variant="outline" className="font-medium bg-indigo-50 text-indigo-700 border-indigo-200">
                        {subcategoryCount}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canEdit && <SubcategoryDialog categoryId={category.id} categoryName={category.name} />}
                      {productCount > 0 && (
                        <Link href={`/products?category=${category.id}`}>
                          <Button variant="ghost" size="sm">
                            <Package className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      )}
                      {canEdit && <CategoryDialog category={category as ProductCategory} />}
                    </div>
                  </TableCell>
                </TableRow>

                {/* Subcategory Rows */}
                {isExpanded && categorySubcats.map((subcat) => {
                  const subcatProductCount = subcategoryCounts[subcat.id] || 0

                  return (
                    <TableRow
                      key={subcat.id}
                      className="bg-slate-50/80 hover:bg-slate-100/80 transition-colors border-l-4 border-l-indigo-300"
                    >
                      <TableCell></TableCell>
                      <TableCell className="pl-8 text-sm text-muted-foreground">
                        {subcat.name}
                      </TableCell>
                      <TableCell className="text-center">
                        {subcatProductCount > 0 ? (
                          <Badge variant="secondary" className="font-medium text-xs bg-indigo-100 text-indigo-700 border border-indigo-200">
                            {subcatProductCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">0</span>
                        )}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && <SubcategoryDialog categoryId={category.id} categoryName={category.name} subcategory={subcat} />}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </Fragment>
            )
          })
        ) : (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
              No categories yet
              {canEdit && (
                <div className="mt-4">
                  <CategoryDialog />
                </div>
              )}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
