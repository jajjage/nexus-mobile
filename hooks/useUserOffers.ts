/**
 * User Offers Hooks
 * React Query hooks for user-facing offer eligibility
 */

"use client";

import { userOfferService } from "@/services/user-offer.service";
import { ValidateOfferRequest } from "@/types/user-offer.types";
import { useMutation, useQuery } from "@tanstack/react-query";

// Query keys
const userOfferKeys = {
  all: ["user", "offers"] as const,
  eligible: () => [...userOfferKeys.all, "eligible"] as const,
};

/**
 * Fetch user's eligible offers
 * Returns a Set of offer IDs for O(1) lookup in product listings
 */
export function useEligibleOffers(enabled: boolean = true) {
  const query = useQuery({
    queryKey: userOfferKeys.eligible(),
    queryFn: () => userOfferService.getEligibleOffers(),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Handle multiple possible response structures:
  // 1. { data: { offers: [...] } } - expected structure
  // 2. { json: { offers: [...] } } - actual backend structure
  // 3. { offers: [...] } - direct structure
  const getOffers = () => {
    if (!query.data) return [];

    const data = query.data as any;

    // Try different paths to find offers array
    if (data?.data?.offers) return data.data.offers;
    if (data?.json?.offers) return data.json.offers;
    if (data?.offers) return data.offers;

    return [];
  };

  const offers = getOffers();

  // Create a Set of eligible offer IDs for fast lookup
  const eligibleIds = new Set(offers.map((o: any) => o.id));

  return {
    ...query,
    eligibleIds,
    offers,
  };
}

/**
 * Validate offer at checkout
 * Used to pre-check eligibility before final purchase
 */
export function useValidateOffer() {
  return useMutation({
    mutationFn: (data: ValidateOfferRequest) =>
      userOfferService.validateOffer(data),
  });
}
