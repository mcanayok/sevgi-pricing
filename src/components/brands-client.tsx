"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import type { Brand } from "@/types/database"

interface BrandsClientProps {
  brands: Brand[]
  brandCounts: Record<string, number>
}

type SortField = "name" | "products"
type SortDirection = "asc" | "desc"

export function BrandsClient({ brands, brandCounts }: BrandsClientProps) {
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => {
      let comparison = 0

      if (sortField === "name") {
        comparison = a.name.localeCompare(b.name)
      } else if (sortField === "products") {
        const aCount = brandCounts[a.id] || 0
        const bCount = brandCounts[b.id] || 0
        comparison = aCount - bCount
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [brands, brandCounts, sortField, sortDirection])

  const requiredBrands = sortedBrands.filter((b) => b.is_required)
  const manufacturerBrands = sortedBrands.filter((b) => !b.is_required)

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1.5 opacity-40" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 ml-1.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 ml-1.5" />
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent bg-slate-50 border-b border-slate-200">
          <TableHead
            className="font-semibold text-slate-700 cursor-pointer select-none hover:bg-slate-100 transition-colors"
            onClick={() => toggleSort("name")}
          >
            <div className="flex items-center">
              Brand
              <SortIcon field="name" />
            </div>
          </TableHead>
          <TableHead
            className="font-semibold text-slate-700 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors"
            onClick={() => toggleSort("products")}
          >
            <div className="flex items-center justify-center">
              Products
              <SortIcon field="products" />
            </div>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {/* Retailers */}
        {requiredBrands.length > 0 && requiredBrands.map((brand, index) => (
          <TableRow
            key={brand.id}
            className={`hover:bg-slate-100 transition-colors cursor-pointer ${
              index % 2 === 0 ? "bg-white" : "bg-slate-50/50"
            }`}
          >
            <TableCell>
              <Link
                href={`/brands/${brand.slug}`}
                className="flex items-center gap-2 hover:underline"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: brand.color || '#64748b',
                  }}
                />
                <span className="font-semibold text-slate-900">
                  {brand.name}
                </span>
              </Link>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="secondary" className="font-medium bg-blue-100 text-blue-700 border border-blue-200">
                {brandCounts[brand.id] || 0}
              </Badge>
            </TableCell>
          </TableRow>
        ))}

        {/* Manufacturers */}
        {manufacturerBrands.length > 0 && manufacturerBrands.map((brand, index) => (
          <TableRow
            key={brand.id}
            className={`hover:bg-slate-100 transition-colors cursor-pointer ${
              (requiredBrands.length + index) % 2 === 0 ? "bg-white" : "bg-slate-50/50"
            }`}
          >
            <TableCell>
              <Link
                href={`/brands/${brand.slug}`}
                className="flex items-center gap-2 hover:underline"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: brand.color || '#64748b',
                  }}
                />
                <span className="font-semibold text-slate-900">
                  {brand.name}
                </span>
              </Link>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="secondary" className="font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                {brandCounts[brand.id] || 0}
              </Badge>
            </TableCell>
          </TableRow>
        ))}

        {requiredBrands.length === 0 && manufacturerBrands.length === 0 && (
          <TableRow>
            <TableCell colSpan={2} className="text-center py-12 text-muted-foreground text-sm">
              No brands configured
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
