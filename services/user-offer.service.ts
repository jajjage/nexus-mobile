/**
 * User Offer Service
 * Handles user-facing offer eligibility and validation
 */

import apiClient from "@/lib/api-client";
import {
  EligibleOffersResponse,
  ValidateOfferRequest,
  ValidateOfferResponse,
} from "@/types/user-offer.types";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

const BASE_PATH = "/user/offers";

export const userOfferService = {
  /**
   * Get offers the current user is eligible for
   * Used for the Two-Request Merge pattern
   */
  getEligibleOffers: async (): Promise<ApiResponse<EligibleOffersResponse>> => {
    const response = await apiClient.get<ApiResponse<EligibleOffersResponse>>(
      `${BASE_PATH}/my-eligible`
    );
    return response.data;
  },

  /**
   * Validate if user can apply an offer at checkout
   * Called before final purchase to prevent errors
   */
  validateOffer: async (
    data: ValidateOfferRequest
  ): Promise<ApiResponse<ValidateOfferResponse>> => {
    const response = await apiClient.post<ApiResponse<ValidateOfferResponse>>(
      `${BASE_PATH}/validate`,
      data
    );
    return response.data;
  },
};
