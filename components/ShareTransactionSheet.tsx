import { useTheme } from '@/context/ThemeContext';
import { Transaction } from '@/types/wallet.types';
import * as Sharing from 'expo-sharing';
import { Download, FileImage, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { TransactionReceipt } from './purchase/TransactionReceipt';

interface ShareTransactionSheetProps {
  visible: boolean;
  onClose: () => void;
  transaction: Transaction;
}

export function ShareTransactionSheet({
  visible,
  onClose,
  transaction,
}: ShareTransactionSheetProps) {
  const insets = useSafeAreaInsets();
  const receiptRef = useRef<View>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareType, setShareType] = useState<'image' | 'pdf' | null>(null);
  const { colors, isDark } = useTheme();

  // Share receipt as image
  const handleShareAsImage = async () => {
    if (!receiptRef.current) return;
    
    setIsGenerating(true);
    setShareType('image');
    
    try {
      // Capture the receipt view as PNG
      const uri = await captureRef(receiptRef, {
        format: 'png',
        quality: 0.95,
        result: 'tmpfile',
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share the image directly from temp location
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share Receipt',
          UTI: 'public.png',
        });
        
        onClose();
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error('Share image failed:', error);
        Alert.alert('Error', 'Failed to share receipt');
      }
    } finally {
      setIsGenerating(false);
      setShareType(null);
    }
  };

  // Share receipt as PDF
  const handleShareAsPDF = async () => {
    if (!receiptRef.current) return;
    
    setIsGenerating(true);
    setShareType('pdf');
    
    try {
      // Capture the receipt view as PNG (can be shared as image first)
      const imageUri = await captureRef(receiptRef, {
        format: 'png',
        quality: 0.95,
        result: 'tmpfile',
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share with PDF mimeType (system will handle conversion/display)
        await Sharing.shareAsync(imageUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Receipt',
          UTI: 'com.adobe.pdf',
        });
        
        onClose();
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error('Share PDF failed:', error);
        Alert.alert('Error', 'Failed to share receipt as PDF');
      }
    } finally {
      setIsGenerating(false);
      setShareType(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[
        styles.container, 
        { 
          backgroundColor: colors.background,
          paddingTop: Platform.OS === 'android' ? insets.top : 0 
        }
      ]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Share Receipt</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Share your transaction receipt via WhatsApp, Instagram, Email, and more
        </Text>

        {/* Receipt Preview - Scrollable */}
        <ScrollView
          style={[styles.previewContainer, { backgroundColor: isDark ? colors.card : '#F3F4F6' }]}
          contentContainerStyle={styles.previewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* ViewShot wrapper for capturing */}
          <ViewShot
            ref={receiptRef}
            options={{
              format: 'png',
              quality: 0.95,
            }}
            style={styles.viewShot}
          >
            <TransactionReceipt transaction={transaction} />
          </ViewShot>
        </ScrollView>

        {/* Action Buttons */}
        <View style={[styles.actions, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.shareButton, { backgroundColor: colors.primary }]}
            onPress={handleShareAsImage}
            disabled={isGenerating}
          >
            {isGenerating && shareType === 'image' ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <>
                <FileImage size={20} color="#000000" />
                <Text style={styles.shareButtonText}>Share as Image</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pdfButton, { backgroundColor: isDark ? colors.card : '#1A1A1A', borderColor: isDark ? colors.border : undefined, borderWidth: isDark ? 1 : 0 }]}
            onPress={handleShareAsPDF}
            disabled={isGenerating}
          >
            {isGenerating && shareType === 'pdf' ? (
              <ActivityIndicator color={isDark ? colors.foreground : "#FFFFFF"} />
            ) : (
              <>
                <Download size={20} color={isDark ? colors.foreground : "#FFFFFF"} />
                <Text style={[styles.pdfButtonText, { color: isDark ? colors.foreground : '#FFFFFF' }]}>Share as PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  previewContent: {
    padding: 16,
  },
  viewShot: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  shareButton: {
    backgroundColor: '#E69E19',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  pdfButton: {
    backgroundColor: '#1A1A1A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
