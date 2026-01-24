import apiClient from "@/lib/api-client";
import { TopupRequest, TopupResponse } from "@/types/topup.types";

export const topupService = {
  async initiateTopup(data: TopupRequest): Promise<TopupResponse> {
    console.log("[TopupService] initiateTopup called", {
      ...data,
      pin: data.pin ? "****" : undefined,
    });
    
    // Debug: Log the full URL being called
    console.log("[TopupService] Base URL:", apiClient.defaults.baseURL);
    console.log("[TopupService] Full URL:", `${apiClient.defaults.baseURL}/user/topup`);
    
    try {
      const response = await apiClient.post<TopupResponse>("/user/topup", data);
      console.log("[TopupService] API Response received", response.status);
      return response.data;
    } catch (error: any) {
      console.error("[TopupService] Request failed");
      console.error("[TopupService] Status:", error.response?.status);
      console.error("[TopupService] Response data:", JSON.stringify(error.response?.data, null, 2));
      console.error("[TopupService] Response headers:", JSON.stringify(error.response?.headers, null, 2));
      throw error;
    }
  },
};
