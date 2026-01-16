import apiClient from "@/lib/api-client";
import { TopupRequest, TopupResponse } from "@/types/topup.types";

export const topupService = {
  async initiateTopup(data: TopupRequest): Promise<TopupResponse> {
    console.log("[TopupService] initiateTopup called", {
      ...data,
      pin: data.pin ? "****" : undefined,
    });
    const response = await apiClient.post<TopupResponse>("/user/topup", data);
    console.log("[TopupService] API Response received", response.status);
    return response.data;
  },
};
