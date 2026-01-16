import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import { ProductCategory } from "@/types/product.types";

/**
 * Category Service
 *
 * Public endpoint: GET /categories
 * Admin endpoints: POST/PUT/DELETE /admin/categories
 */

export interface CategoriesResponse {
  categories: ProductCategory[];
}

export interface CategoryResponse {
  category: ProductCategory;
}

export interface CreateCategoryRequest {
  name: string;
  slug?: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
}

export interface UpdateCategoryRequest {
  name?: string;
  slug?: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
}

export const categoryService = {
  // ============================================
  // PUBLIC ENDPOINT
  // ============================================

  /**
   * Get all categories (public)
   * GET /categories
   */
  getAll: async (): Promise<ProductCategory[]> => {
    const response =
      await apiClient.get<ApiResponse<ProductCategory[]>>("/categories");
    // Handle both array and { categories: [...] } response shapes
    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    }
    return (data as any)?.categories || [];
  },

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  /**
   * Get all categories (admin)
   * GET /admin/categories
   */
  adminGetAll: async (): Promise<ProductCategory[]> => {
    const response =
      await apiClient.get<ApiResponse<CategoriesResponse>>("/admin/categories");
    const data = response.data.data;
    if (Array.isArray(data)) {
      return data;
    }
    return data?.categories || [];
  },

  /**
   * Create a category
   * POST /admin/categories
   */
  create: async (data: CreateCategoryRequest): Promise<ProductCategory> => {
    const response = await apiClient.post<ApiResponse<CategoryResponse>>(
      "/admin/categories",
      data
    );
    return response.data.data?.category || (response.data.data as any);
  },

  /**
   * Update a category
   * PUT /admin/categories/:id
   */
  update: async (
    id: string,
    data: UpdateCategoryRequest
  ): Promise<ProductCategory> => {
    const response = await apiClient.put<ApiResponse<CategoryResponse>>(
      `/admin/categories/${id}`,
      data
    );
    return response.data.data?.category || (response.data.data as any);
  },

  /**
   * Delete a category
   * DELETE /admin/categories/:id
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`);
  },
};
