import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';
import { useMutation } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { Check, Copy, RefreshCw, Share as ShareIcon, X } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { ActivityIndicator, Modal, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { toast } from 'sonner-native';

interface AddMoneyModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function AddMoneyModal({ isVisible, onClose }: AddMoneyModalProps) {
  const { user, refetch } = useAuth();
  const [copied, setCopied] = React.useState(false);
  const virtualAccounts =
    user?.virtualAccounts && user.virtualAccounts.length > 0
      ? user.virtualAccounts
      : user?.virtualAccountNumber
        ? [
            {
              id: user.virtualAccountNumber,
              accountNumber: user.virtualAccountNumber,
              bankName: user.virtualAccountBankName,
              accountName: user.virtualAccountAccountName,
            },
          ]
        : [];
  const hasVirtualAccount = virtualAccounts.length > 0;

  // Mutation to create virtual account
  const { mutate: createVirtualAccount, isPending, isError } = useMutation({
    mutationFn: async () => {
      // Endpoint requires empty object payload
      return await userService.createVirtualAccount({});
    },
    onSuccess: async () => {
      // Refetch user to get the new account details
      await refetch();
      toast.success('Unique account created successfully');
    },
    onError: (error) => {
        // @ts-ignore
      const message = error?.response?.data?.message || 'Failed to create account';
      toast.error(message);
    }
  });

  // Effect to trigger creation if user doesn't have an account
  useEffect(() => {
    if (isVisible && user && !hasVirtualAccount && !isPending && !isError) {
      createVirtualAccount();
    }
  }, [isVisible, user, hasVirtualAccount, isPending, isError, createVirtualAccount]);

  const handleCopy = async (accountNumber: string) => {
    if (accountNumber) {
      await Clipboard.setStringAsync(accountNumber);
      setCopied(true);
      toast.success('Account number copied');
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!hasVirtualAccount) return;
    const details = virtualAccounts
      .map(
        account =>
          `Bank: ${account.bankName || 'Bank'}\nAccount Number: ${account.accountNumber}\nAccount Name: ${account.accountName || user.fullName}`
      )
      .join('\n\n');
    
    try {
      await Share.share({
        message: `Here are my Nexus account details:\n${details}`,
      });
    } catch (error) {
     toast.error('Could not share details');
    }
  };

  if (!user) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalParams}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Money</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#555" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            {hasVirtualAccount ? (
              // Account Exists View
              <View style={styles.accountDetails}>
                <Text style={styles.instruction}>
                  Transfer money to any account below to fund your wallet instantly.
                </Text>

                {virtualAccounts.map(account => (
                  <View key={account.id || account.accountNumber} style={styles.detailCard}>
                    <View>
                        <Text style={styles.bankName}>{account.bankName || 'Bank'}</Text>
                        <Text style={styles.accountName}>{account.accountName || user.fullName}</Text>
                    </View>
                  
                  <View style={styles.accountNumberContainer}>
                    <Text style={styles.accountNumber}>{account.accountNumber}</Text>
                    <TouchableOpacity onPress={() => handleCopy(account.accountNumber)} style={styles.copyButton}>
                      {copied ? (
                        <Check size={20} color="#2E7D32" />
                      ) : (
                        <Copy size={20} color="#E69E19" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
                ))}

                <View style={styles.actions}>
                  <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                    <ShareIcon size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Share Details</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.warningContainer}>
                    <Text style={styles.warningText}>
                        Deposits are automated and usually reflect within minutes.
                    </Text>
                </View>
              </View>
            ) : (
               // Account Missing / Creating View
              <View style={styles.loadingState}>
                {isError ? (
                     <View style={{alignItems: 'center'}}>
                         <Text style={styles.errorText}>Failed to create account.</Text>
                         <TouchableOpacity onPress={() => createVirtualAccount()} style={styles.retryButton}>
                             <Text style={styles.retryText}>Retry</Text>
                             <RefreshCw size={16} color="#FFF" />
                         </TouchableOpacity>
                     </View>
                ) : (
                    <>
                        <ActivityIndicator size="large" color="#E69E19" />
                        <Text style={styles.loadingText}>
                        Creating your unique virtual account...
                        </Text>
                        <Text style={styles.subLoadingText}>
                        This allows you to receive automated bank transfers directly to your wallet.
                        </Text>
                    </>
                )}
                
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalParams: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  accountDetails: {
    alignItems: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    minHeight: 200,
    justifyContent: 'center',
  },
  instruction: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  detailCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  bankName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  accountName: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    fontWeight: '500',
  },
  accountNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  accountNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    letterSpacing: 2,
  },
  copyButton: {
    padding: 8,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E69E19',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingState: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  subLoadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  warningContainer: {
      marginTop: 20,
      padding: 12,
      backgroundColor: '#FFF3E0',
      borderRadius: 8
  },
  warningText: {
      color: '#E65100',
      fontSize: 12,
      textAlign: 'center'
  },
  errorText: {
      color: '#D32F2F',
      marginBottom: 12,
      fontSize: 14
  },
  retryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#333',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 100,
      gap: 8
  },
  retryText: {
      color: '#FFF',
      fontWeight: '600'
  }
});
