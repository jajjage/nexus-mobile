/**
 * Error Message Utility
 * Converts technical error messages to user-friendly ones
 */

export function getUserFriendlyError(error: string): string {
  const errorLower = error.toLowerCase();
  
  // PIN related errors
  if (errorLower.includes("401") || errorLower.includes("wrong pin") || errorLower.includes("incorrect pin")) {
    return "Incorrect PIN. Please try again.";
  }
  
  if (errorLower.includes("pin") && errorLower.includes("locked")) {
    return "Your PIN has been locked due to multiple failed attempts. Please contact support.";
  }
  
  // Balance errors
  if (errorLower.includes("insufficient") || errorLower.includes("balance")) {
    return "Insufficient balance. Please add funds to your wallet.";
  }
  
  // Network errors
  if (errorLower.includes("network") || errorLower.includes("timeout") || errorLower.includes("connection")) {
    return "Network connection error. Please check your internet and try again.";
  }
  
  // Server errors
  if (errorLower.includes("500") || errorLower.includes("server error")) {
    return "Server error. Please try again in a few moments.";
  }
  
  if (errorLower.includes("503") || errorLower.includes("service unavailable")) {
    return "Service temporarily unavailable. Please try again later.";
  }
  
  // Transaction errors
  if (errorLower.includes("failed") || errorLower.includes("declined")) {
    return "Transaction declined. Please verify your details and try again.";
  }
  
  // Product/Provider errors
  if (errorLower.includes("product not available") || errorLower.includes("out of stock")) {
    return "This product is currently unavailable. Please try a different one.";
  }
  
  // Default message
  return error || "Something went wrong. Please try again.";
}
