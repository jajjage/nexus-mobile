import { useMarkup } from "@/hooks/useUser";
import { useMemo } from "react";

/**
 * Hook to get markup percentage for a specific supplier
 *
 * @param supplierId - The supplier ID to look up
 * @returns The markup percentage for the supplier, or 0 if not found
 */
export function useSupplierMarkup(supplierId?: string) {
  const { data: markupData } = useMarkup();

  const markupPercent = useMemo(() => {
    if (!supplierId || !markupData?.markups) {
      return 0;
    }

    const markup = markupData.markups.find((m) => m.supplierId === supplierId);

    if (!markup) return 0;
    // Convert markup percent to number (backend returns as string)
    const percent =
      typeof markup.markupPercent === "string"
        ? parseFloat(markup.markupPercent)
        : markup.markupPercent;
    return percent || 0;
  }, [supplierId, markupData]);

  return markupPercent;
}

/**
 * Hook to get all supplier markups as a map for quick lookup
 *
 * @param enabled - Whether to fetch the data (useful for conditional fetching based on auth)
 * @returns Map of supplierId -> markupPercent
 */
export function useSupplierMarkupMap(enabled = true) {
  const { data: markupData } = useMarkup(undefined, enabled);

  const markupMap = useMemo(() => {
    const map = new Map<string, number>();

    if (markupData?.markups) {
      console.log("[useSupplierMarkupMap] Raw markupData:", markupData);
      markupData.markups.forEach((markup) => {
        // Convert markup percent to number (backend returns as string)
        const percent =
          typeof markup.markupPercent === "string"
            ? parseFloat(markup.markupPercent)
            : markup.markupPercent;
        console.log(
          `[useSupplierMarkupMap] Setting supplierId ${markup.supplierId} = ${percent}%`
        );
        map.set(markup.supplierId, percent);
      });
      console.log("[useSupplierMarkupMap] Final map:", map);
    }

    return map;
  }, [markupData]);

  return markupMap;
}
