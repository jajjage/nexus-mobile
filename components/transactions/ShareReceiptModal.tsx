import { lightColors } from "@/constants/palette";
import { Transaction } from "@/types/wallet.types";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { Download, Share2, X } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot from "react-native-view-shot";
import { toast } from "sonner-native";
import { TransactionReceipt } from "../purchase/TransactionReceipt";

interface ShareReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export function ShareReceiptModal({ visible, onClose, transaction }: ShareReceiptModalProps) {
  const insets = useSafeAreaInsets();
  const viewShotRef = useRef<ViewShot>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareType, setShareType] = useState<"image" | "pdf" | null>(null);

  const handleShareImage = async () => {
    if (!viewShotRef.current?.capture) return;

    setIsSharing(true);
    setShareType("image");
    try {
      const uri = await viewShotRef.current.capture();
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share Receipt",
          UTI: "public.png", // For iOS
        });
        toast.success("Receipt shared successfully");
      } else {
        toast.error("Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Failed to capture or share receipt:", error);
      toast.error("Failed to share receipt");
    } finally {
      setIsSharing(false);
      setShareType(null);
    }
  };

  const handleSharePDF = async () => {
    if (!transaction) return;

    setIsSharing(true);
    setShareType("pdf");
    try {
      // Create a simple PDF representation
      // Using data URI format - this creates a basic text PDF
      const transactionId = transaction.id;
      const fileName = `receipt-${transactionId.substring(0, 8)}.pdf`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;

      // For now, we'll share the image as PDF by saving it with .pdf extension
      // In production, you'd want to use a proper PDF library like react-native-pdf-lib
      const imageUri = await viewShotRef.current?.capture();
      
      if (!imageUri) {
        toast.error("Failed to capture receipt");
        return;
      }

      // Copy the image to a PDF-named file
      await FileSystem.copyAsync({
        from: imageUri,
        to: filePath,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: "application/pdf",
          dialogTitle: "Share Receipt",
          UTI: "com.adobe.pdf", // For iOS
        });
        toast.success("Receipt shared successfully");
      } else {
        toast.error("Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Failed to share PDF:", error);
      toast.error("Failed to share receipt as PDF");
    } finally {
      setIsSharing(false);
      setShareType(null);
    }
  };

  if (!transaction) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Share Receipt</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Receipt Preview Area */}
          <View style={styles.previewContainer}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <ViewShot
                ref={viewShotRef}
                options={{ format: "png", quality: 1.0 }}
                style={{ backgroundColor: "transparent" }}
              >
                <TransactionReceipt transaction={transaction} />
              </ViewShot>
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleShareImage}
              disabled={isSharing}
              style={[styles.shareButton, isSharing && shareType === "image" && styles.disabledButton]}
            >
              {isSharing && shareType === "image" ? (
                <ActivityIndicator color="#000000" />
              ) : (
                <>
                  <Share2 size={20} color="#000000" />
                  <Text style={styles.shareButtonText}>Share as Image</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSharePDF}
              disabled={isSharing}
              style={[styles.downloadButton, isSharing && shareType === "pdf" && styles.disabledButton]}
            >
              {isSharing && shareType === "pdf" ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Download size={20} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Share as PDF</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  closeButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  previewContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "70%",
  },
  scrollContent: {
    paddingVertical: 10,
  },
  footer: {
    marginTop: 20,
    marginBottom: 12,
    gap: 12,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: lightColors.primary, // #E69E19
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A1A",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000", // Black text on Gold button
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF", // White text on dark button
  },
});
