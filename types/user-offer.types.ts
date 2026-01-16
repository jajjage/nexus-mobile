/**
 * User Offer Types
 * Types for user-facing offer eligibility and validation
 */

export interface EligibleOffer {
  id: string;
  title: string;
  description?: string;
  discountType: "percentage" | "fixed_amount" | "fixed_price";
  discountValue: number;
}

export interface EligibleOffersResponse {
  offers: EligibleOffer[];
}

export interface ValidateOfferRequest {
  productId: string;
  amount: number;
  offerId?: string;
}

export interface ValidateOfferResponse {
  valid: boolean;
  message?: string;
  discountedAmount?: number;
}
