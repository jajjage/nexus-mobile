import { BadgeCheck } from "lucide-react-native";

import { ProductPurchaseScreen } from "./data";

export default function SubscriptionScreen() {
  return (
    <ProductPurchaseScreen
      productType="subscription"
      title="Subscriptions"
      returnRoute="/subscription"
      processingMessage="Processing your subscription purchase..."
      EmptyIcon={BadgeCheck}
    />
  );
}
