import { lightColors } from '@/constants/palette';
import { useAuth } from '@/hooks/useAuth';
import { useRequestResellerUpgrade } from '@/hooks/useReseller';
import { BadgePercent, CheckCircle2, Code2, Headphones, Send, Sparkles, Users, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ResellerApplicationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResellerApplicationModal({ visible, onClose, onSuccess }: ResellerApplicationModalProps) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { requestUpgrade, isSubmitting, error } = useRequestResellerUpgrade();
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    
    const success = await requestUpgrade(message);
    if (success) {
      setShowSuccess(true);
      // Wait a bit before calling onSuccess to let user see success message
      setTimeout(() => {
        onSuccess();
        onClose();
        setShowSuccess(false);
        setMessage('');
      }, 2000);
    }
  };

  const BenefitItem = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
    <View style={styles.benefitItem}>
      <View style={styles.benefitIcon}>
        <Icon size={20} color={lightColors.primary} />
      </View>
      <View style={styles.benefitContent}>
        <Text style={styles.benefitTitle}>{title}</Text>
        <Text style={styles.benefitDesc}>{description}</Text>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingTop: 20 }]}>
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={lightColors.textPrimary} />
          </TouchableOpacity>
        </View>

        {showSuccess ? (
          <View style={styles.successContainer}>
            <CheckCircle2 size={64} color="#2E7D32" />
            <Text style={styles.successTitle}>Application Submitted!</Text>
            <Text style={styles.successMessage}>
              Thank you for your interest. We will review your application within 24-48 hours.
            </Text>
          </View>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Header */}
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Sparkles size={32} color={lightColors.primary} />
              </View>
              <Text style={styles.title}>Unlock Exclusive Wholesale Rates</Text>
              <Text style={styles.description}>
                Turn your network into net worth. Join our reseller program and get access to premium tools and prices.
              </Text>
            </View>

            {/* Benefits Grid */}
            <View style={styles.benefitsGrid}>
              <View style={styles.row}>
                <BenefitItem 
                  icon={BadgePercent} 
                  title="Massive Discounts" 
                  description="Get up to 10% OFF on airtime and data bundles." 
                />
                <BenefitItem 
                  icon={Users} 
                  title="Bulk Tools" 
                  description="Send credit to 50+ numbers instantly." 
                />
              </View>
              <View style={styles.row}>
                <BenefitItem 
                  icon={Code2} 
                  title="API Access" 
                  description="Integrate our services into your platform." 
                />
                <BenefitItem 
                  icon={Headphones} 
                  title="Priority Support" 
                  description="Get a dedicated account manager." 
                />
              </View>
            </View>

            {/* Application Form */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Application</Text>
              
              {/* User Info Read-only */}
              <View style={styles.userInfoCard}>
                <Text style={styles.label}>Applicant</Text>
                <Text style={styles.value}>{user?.fullName}</Text>
                <Text style={styles.value}>{user?.email}</Text>
                <Text style={styles.value}>{user?.phoneNumber}</Text>
              </View>

              <Text style={styles.label}>Tell us about your business *</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="I run a recharge card business in Lagos..."
                placeholderTextColor={lightColors.textTertiary}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity 
                style={[styles.submitButton, (!message.trim() || isSubmitting) && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={!message.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Text style={styles.submitText}>Submit Application</Text>
                    <Send size={18} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FA',
  },
  headerActions: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 8,
    backgroundColor: '#EEE',
    borderRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: lightColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: lightColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  benefitsGrid: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  benefitItem: {
    flex: 1,
    gap: 8,
  },
  benefitIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitContent: {
    gap: 4,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: lightColors.textPrimary,
  },
  benefitDesc: {
    fontSize: 11,
    color: lightColors.textSecondary,
    lineHeight: 15,
  },
  formSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: lightColors.textPrimary,
    marginBottom: 4,
  },
  userInfoCard: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: lightColors.textSecondary,
    marginBottom: 6,
  },
  value: {
    fontSize: 13,
    color: lightColors.textPrimary,
    marginBottom: 2,
  },
  textArea: {
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 12,
    height: 100,
    fontSize: 14,
    color: lightColors.textPrimary,
  },
  submitButton: {
    backgroundColor: lightColors.primary,
    flexDirection: 'row',
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#E63946',
    fontSize: 12,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: -40, // offset header
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: lightColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: lightColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
