import { Box, Card, Heading, HStack, Text, VStack } from "@/components/ui";
import { darkColors, lightColors } from "@/constants/palette";
import { useAuth } from "@/hooks/useAuth";
import { useDeleteAccount } from "@/hooks/useUser";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, useColorScheme, View } from "react-native";

export default function SecurityHubScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const { user } = useAuth();
  
  const deleteAccountMutation = useDeleteAccount();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [password, setPassword] = useState("");

  const handleDeletePress = () => {
    setDeleteModalVisible(true);
    setDeleteStep(1);
    setPassword("");
  };

  const handleConfirmDelete = async () => {
    if (!password) {
      Alert.alert("Error", "Please enter your password");
      return;
    }
    
    try {
      await deleteAccountMutation.mutateAsync(password);
      // Success handled in hook
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to delete account");
    }
  };

  const securityItems = [
    {
      icon: "lock",
      label: "Password",
      description: "Change your login password",
      route: "profile/security/password",
      badge: null,
    },
    {
      icon: "hashtag",
      label: "Transaction PIN",
      description: "Set or update 4-digit PIN",
      route: "profile/security/pin",
      badge: user?.hasPin ? "✓ Set" : "Not Set",
    },
    {
      icon: "mobile",
      label: "App Passcode",
      description: "Set 6-digit app lock code",
      route: "profile/security/passcode",
      badge: user?.hasPasscode ? "✓ Set" : "Not Set",
    },
    {
      icon: "fingerprint",
      label: "Biometric Devices",
      description: "Manage fingerprint & face recognition",
      route: "profile/security/biometric",
      badge: null,
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Security Settings",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginLeft: 8 }}
            >
              <ArrowLeft size={24} color={colors.foreground} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView 
        className="flex-1 bg-background-0"
        showsVerticalScrollIndicator={false}
      >
      {/* Security Info Banner */}
      <Box className="flex-row items-center p-4 mx-4 my-4 bg-info-50 rounded-lg border-l-4 border-l-primary-600 gap-3">
        <FontAwesome name="shield" size={20} color="#E69E19" />
        <Text className="flex-1 text-sm text-typography-700">
          Secure your account with strong passwords and biometric authentication.
        </Text>
      </Box>

      {/* Security Items */}
      <Box className="px-4 pb-5">
        <VStack space="md">
          {securityItems.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => router.push(item.route as any)}
              className="active:opacity-70"
            >
              <Card className="rounded-lg border border-outline-200 p-4 bg-background-0">
                <HStack className="flex-row items-center justify-between">
                  <HStack space="md" className="flex-1 items-center">
                    <Box className="w-10 h-10 rounded-lg bg-info-50 justify-center items-center">
                      <FontAwesome
                        name={item.icon as any}
                        size={20}
                        color="#E69E19"
                      />
                    </Box>
                    <VStack className="flex-1">
                      <Heading size="sm" className="font-semibold">{item.label}</Heading>
                      <Text size="xs" className="text-typography-500">{item.description}</Text>
                    </VStack>
                  </HStack>
                  <HStack space="md" className="items-center">
                    {item.badge && (
                      <Text
                        size="xs"
                        className={`font-semibold ${
                          item.badge === "✓ Set"
                            ? "text-success-600"
                            : "text-typography-500"
                        }`}
                      >
                        {item.badge}
                      </Text>
                    )}
                    <FontAwesome
                      name="chevron-right"
                      size={14}
                      color="#999999"
                    />
                  </HStack>
                </HStack>
              </Card>
            </Pressable>
          ))}

          {/* Danger Zone: Delete Account */}
          <Pressable
            onPress={handleDeletePress}
            className="active:opacity-70 mt-6"
          >
            <Card className="rounded-lg border border-red-200 p-4 bg-red-50">
              <HStack className="flex-row items-center justify-between">
                <HStack space="md" className="flex-1 items-center">
                  <Box className="w-10 h-10 rounded-lg bg-red-100 justify-center items-center">
                    <Trash2 size={20} color="#DC2626" />
                  </Box>
                  <VStack className="flex-1">
                    <Heading size="sm" className="font-semibold text-red-700">Delete Account</Heading>
                    <Text size="xs" className="text-red-500">Permanently remove your account and data</Text>
                  </VStack>
                </HStack>
                <FontAwesome name="chevron-right" size={14} color="#DC2626" />
              </HStack>
            </Card>
          </Pressable>
        </VStack>
      </Box>
    </ScrollView>

    {/* Delete Account Modal */}
    <Modal
      visible={deleteModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setDeleteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
          <Heading size="md" className="mb-4 text-center">
            {deleteStep === 1 ? "Delete Account?" : "Confirm Deletion"}
          </Heading>
          
          {deleteStep === 1 ? (
            <>
              <View style={[styles.warningIconBg, { backgroundColor: '#FEE2E2' }]}>
                <Trash2 size={32} color="#DC2626" />
              </View>
              <Text style={{ color: colors.foreground, textAlign: 'center', marginBottom: 20, marginTop: 16 }}>
                Are you sure you want to delete your account? This action is <Text style={{fontWeight: 'bold', color: '#DC2626'}}>irreversible</Text>. All your data, wallet balance, and transaction history will be permanently erased.
              </Text>
              
              <HStack space="md" style={{ width: '100%' }}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.secondary }]}
                  onPress={() => setDeleteModalVisible(false)}
                >
                  <Text style={{ color: colors.foreground, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#DC2626' }]}
                  onPress={() => setDeleteStep(2)}
                >
                  <Text style={{ color: 'white', fontWeight: '600' }}>Continue</Text>
                </TouchableOpacity>
              </HStack>
            </>
          ) : (
            <>
              <Text style={{ color: colors.foreground, marginBottom: 16 }}>
                Please enter your password to confirm account deletion.
              </Text>
              
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                placeholder="Enter password"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
              />
              
              <HStack space="md" style={{ width: '100%', marginTop: 24 }}>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: colors.secondary }]}
                  onPress={() => setDeleteModalVisible(false)}
                  disabled={deleteAccountMutation.isPending}
                >
                  <Text style={{ color: colors.foreground, fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, { backgroundColor: '#DC2626', opacity: deleteAccountMutation.isPending ? 0.7 : 1 }]}
                  onPress={handleConfirmDelete}
                  disabled={deleteAccountMutation.isPending}
                >
                  {deleteAccountMutation.isPending ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={{ color: 'white', fontWeight: '600' }}>Delete Forever</Text>
                  )}
                </TouchableOpacity>
              </HStack>
            </>
          )}
        </View>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  warningIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 16,
  }
});
