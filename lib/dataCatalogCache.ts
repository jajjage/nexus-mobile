import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";

import { productKeys } from "@/hooks/useProducts";
import { categoryService } from "@/services/category.service";
import { productService } from "@/services/product.service";

const PRODUCTS_CACHE_KEY = "@nexus/catalog/data/products";
const CATEGORIES_CACHE_KEY = "@nexus/catalog/data/categories";
const DATA_PRODUCTS_PARAMS = {
  productType: "data",
  isActive: true,
  perPage: 100,
  limit: 100,
} as const;
const DATA_PRODUCTS_QUERY_KEY = productKeys.list(DATA_PRODUCTS_PARAMS);
const DATA_CATEGORIES_QUERY_KEY = ["categories", "data"] as const;

type StoredValue<T> = {
  value: T;
  savedAt: number;
};

async function hydrateCatalog(queryClient: QueryClient) {
  const [storedProducts, storedCategories] = await Promise.all([
    AsyncStorage.getItem(PRODUCTS_CACHE_KEY),
    AsyncStorage.getItem(CATEGORIES_CACHE_KEY),
  ]);

  if (storedProducts) {
    try {
      const cached = JSON.parse(storedProducts) as StoredValue<unknown>;
      if (cached?.value) {
        queryClient.setQueryData(DATA_PRODUCTS_QUERY_KEY, cached.value, {
          updatedAt: cached.savedAt || 0,
        });
      }
    } catch {
      await AsyncStorage.removeItem(PRODUCTS_CACHE_KEY);
    }
  }

  if (storedCategories) {
    try {
      const cached = JSON.parse(storedCategories) as StoredValue<unknown>;
      if (Array.isArray(cached?.value)) {
        queryClient.setQueryData(DATA_CATEGORIES_QUERY_KEY, cached.value, {
          updatedAt: cached.savedAt || 0,
        });
      }
    } catch {
      await AsyncStorage.removeItem(CATEGORIES_CACHE_KEY);
    }
  }
}

export async function warmDataCatalog(queryClient: QueryClient) {
  await hydrateCatalog(queryClient);

  const [productsResponse, categories] = await Promise.all([
    queryClient.fetchQuery({
      queryKey: DATA_PRODUCTS_QUERY_KEY,
      queryFn: () => productService.getProducts(DATA_PRODUCTS_PARAMS),
      staleTime: 1000 * 60 * 5,
    }),
    queryClient.fetchQuery({
      queryKey: DATA_CATEGORIES_QUERY_KEY,
      queryFn: () => categoryService.getAll("data"),
      staleTime: 1000 * 60 * 60,
    }),
  ]);

  await Promise.all([
    AsyncStorage.setItem(
      PRODUCTS_CACHE_KEY,
      JSON.stringify({ value: productsResponse, savedAt: Date.now() })
    ),
    AsyncStorage.setItem(
      CATEGORIES_CACHE_KEY,
      JSON.stringify({ value: categories, savedAt: Date.now() })
    ),
  ]);
}

