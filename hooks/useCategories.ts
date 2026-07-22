"use client";

import { categoryService } from "@/services/category.service";
import { ProductCategory } from "@/types/product.types";
import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch all categories (public endpoint)
 * Used in data-plans page for category tabs
 */
export function useCategories(productType?: string) {
  return useQuery<ProductCategory[]>({
    queryKey: ["categories", productType],
    queryFn: () => categoryService.getAll(productType),
    staleTime: 60 * 60 * 1000, // 1 hour (matches server cache)
  });
}
