import apiClient from "@/lib/api-client";
import {
  ApiResponse,
  BillCategory,
  Biller,
  BillPayment,
  BillPaymentRequest,
  BillValidationRequest,
  BillValidationResult,
  BillVariation,
} from "@/types/bill-payment.types";

export const billPaymentService = {
  async getCategories(): Promise<ApiResponse<BillCategory[]>> {
    const response = await apiClient.get<ApiResponse<BillCategory[]>>(
      "/bills/categories"
    );
    return response.data;
  },

  async getBillers(category?: string): Promise<ApiResponse<Biller[]>> {
    const response = await apiClient.get<ApiResponse<Biller[]>>("/bills/billers", {
      params: category ? { category } : undefined,
    });
    return response.data;
  },

  async getVariations(
    billerCode: string
  ): Promise<ApiResponse<BillVariation[]>> {
    const response = await apiClient.get<ApiResponse<BillVariation[]>>(
      `/bills/billers/${billerCode}/variations`
    );
    return response.data;
  },

  async validateCustomer(
    data: BillValidationRequest
  ): Promise<ApiResponse<BillValidationResult>> {
    const response = await apiClient.post<ApiResponse<BillValidationResult>>(
      "/bills/validate",
      data
    );
    return response.data;
  },

  async pay(data: BillPaymentRequest): Promise<ApiResponse<BillPayment>> {
    const response = await apiClient.post<ApiResponse<BillPayment>>(
      "/bills/pay",
      data,
      {
        headers: data.idempotencyKey
          ? { "X-Idempotency-Key": data.idempotencyKey }
          : undefined,
      }
    );
    return response.data;
  },

  async getPayment(id: string): Promise<ApiResponse<BillPayment>> {
    const response = await apiClient.get<ApiResponse<BillPayment>>(
      `/bills/payments/${id}`
    );
    return response.data;
  },
};
