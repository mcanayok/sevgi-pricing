import { z } from "zod"

export const productUrlSchema = z.object({
  brand_id: z.string().uuid("Invalid brand ID"),
  url: z.string().url("Please enter a valid URL"),
})

export const productFormSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  requiredBrandUrls: z.record(z.string(), z.string().url("Please enter a valid URL")),
  nonRequiredBrand: z.object({
    brand_id: z.string().min(1, "Please select a brand"),
    url: z.string().refine(
      (value) => {
        if (!value || !value.trim()) return true // Allow empty
        try {
          new URL(value)
          return true
        } catch {
          return false
        }
      },
      { message: "Please enter a valid URL" }
    ),
  }),
})

export type ProductFormData = z.infer<typeof productFormSchema>

// For simpler validation during form input
export const productUrlInputSchema = z.string().refine(
  (value) => {
    if (!value.trim()) return true // Allow empty
    try {
      new URL(value)
      return true
    } catch {
      return false
    }
  },
  { message: "Please enter a valid URL" }
)
