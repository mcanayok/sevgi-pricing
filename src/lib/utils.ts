import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined) return "—"
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(price)
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—"
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date | null | undefined): string {
  if (!date) return "—"
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
  }).format(new Date(date))
}

/**
 * Calculates the best contrasting text color for a given background color
 * Based on WCAG relative luminance formula for accessibility
 * @param bgColor - Hex color string (e.g., "#FF6B00")
 * @returns Contrasting color for optimal readability
 */
export function getContrastingTextColor(bgColor: string | null | undefined): string {
  if (!bgColor) return "#1e293b" // slate-800

  // Remove # if present
  const hex = bgColor.replace("#", "")

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Calculate relative luminance using WCAG formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // For very light backgrounds, use dark slate for better readability
  // For dark backgrounds, use white
  if (luminance > 0.7) {
    return "#1e293b" // slate-800 - softer than pure black
  } else if (luminance > 0.5) {
    return "#0f172a" // slate-900 - darker for medium-light colors
  } else {
    return "#ffffff" // white for dark backgrounds
  }
}

