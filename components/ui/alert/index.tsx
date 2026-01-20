import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  /** The variant/type of alert */
  variant?: AlertVariant;
  /** Title of the alert */
  title?: string;
  /** Message/description of the alert */
  message: string;
  /** Whether to show close button */
  closable?: boolean;
  /** Callback when close is pressed */
  onClose?: () => void;
  /** Additional className for styling */
  className?: string;
}

const VARIANTS = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'checkmark-circle' as const,
    iconColor: '#16A34A',
    titleColor: 'text-green-800',
    textColor: 'text-green-700',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'alert-circle' as const,
    iconColor: '#DC2626',
    titleColor: 'text-red-800',
    textColor: 'text-red-700',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: 'warning' as const,
    iconColor: '#D97706',
    titleColor: 'text-amber-800',
    textColor: 'text-amber-700',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'information-circle' as const,
    iconColor: '#2563EB',
    titleColor: 'text-blue-800',
    textColor: 'text-blue-700',
  },
};

export function Alert({
  variant = 'info',
  title,
  message,
  closable = false,
  onClose,
  className = '',
}: AlertProps) {
  const config = VARIANTS[variant];

  return (
    <View
      className={`${config.bg} ${config.border} border rounded-xl p-3 ${className}`}
      style={styles.container}
    >
      <HStack space="sm" className="items-start">
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name={config.icon} size={20} color={config.iconColor} />
        </View>

        {/* Content */}
        <VStack space="xs" className="flex-1">
          {title && (
            <Text className={`${config.titleColor} font-semibold text-sm`}>
              {title}
            </Text>
          )}
          <Text className={`${config.textColor} text-sm`}>{message}</Text>
        </VStack>

        {/* Close button */}
        {closable && onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={18} color={config.iconColor} />
          </TouchableOpacity>
        )}
      </HStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    marginTop: 1,
  },
  closeButton: {
    padding: 2,
    marginLeft: 8,
  },
});

export default Alert;
