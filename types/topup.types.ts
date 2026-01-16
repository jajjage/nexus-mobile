export interface TopupRequest {
  amount: number;
  productCode: string;
  recipientPhone: string;
  pin?: string; // Optional - use PIN OR verificationToken
  verificationToken?: string; // Optional - use biometric token OR PIN
  supplierSlug?: string;
  supplierMappingId?: string;
  useCashback?: boolean;
  offerId?: string; // Optional - offer ID if applying a discount
}

export interface TopupResponse {
  success: boolean;
  message: string;
  data: {
    transactionId: string;
    status: string;
    amount: number;
    balance: number;
    [key: string]: any;
  };
}
