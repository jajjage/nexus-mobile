import apiClient from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import {
  ProductQueryParams,
  ProductsResponseData,
} from "@/types/product.types";

export const productService = {
  /**
   * Fetch products with optional filtering
   */
  async getProducts(
    params?: ProductQueryParams
  ): Promise<ApiResponse<ProductsResponseData>> {
    const response = await apiClient.get<ApiResponse<ProductsResponseData>>(
      "/products",
      { params }
    );
    return response.data;
  },

  /**
   * Fetch a single product by ID
   */
  async getProductById(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.get<ApiResponse<any>>(`/products/${id}`);
    return response.data;
  },
};
