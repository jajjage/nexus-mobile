import { publicApiClient } from "@/lib/api-client";
import { ApiResponse } from "@/types/api.types";
import { AppVersionInfo } from "@/types/app-version.types";
import { Platform } from "react-native";

export const appVersionService = {
  getAppVersion: async (): Promise<ApiResponse<AppVersionInfo>> => {
    try {
      const platform = Platform.OS === "ios" ? "ios" : "android";
      console.log(`[DEBUG-appVersion] Calling GET /app-version?platform=${platform}`);
      
      // Use publicApiClient (unauthenticated) to ensure version check works anywhere
      const response = await publicApiClient.get<ApiResponse<AppVersionInfo>>(
        `/app-version?platform=${platform}`
      );
      
      console.log(
        "[DEBUG-appVersion] GET /app-version raw response data:",
        JSON.stringify(response.data)
      );
      return response.data;
    } catch (error: any) {
      console.warn(
        "[DEBUG-appVersion] Error fetching app version from backend:",
        error?.message || error
      );
      return {
        success: false,
        message: "Failed to connect to version server",
        data: null as any,
      };
    }
  },
};
