import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Alert, Linking, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const WhatsAppFAB = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  const handlePress = async () => {
    // Example Nigerian/General number, this can be customized based on requirements
    const phoneNumber = process.env.EXPO_PUBLIC_WHATSAPP_NUMBER || '2347033776056'; 
    const userName = user?.fullName || 'User';
    const message = `Hello Nexus Data Support! 👋\n\nI am ${userName}, reaching out from your mobile app and I need some assistance with... `;
    const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "WhatsApp Not Found",
          "You don't have WhatsApp installed on your device.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Install", 
              onPress: () => {
                const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.whatsapp';
                const appStoreUrl = 'https://apps.apple.com/us/app/whatsapp-messenger/id310633997';
                Linking.openURL(Platform.OS === 'ios' ? appStoreUrl : playStoreUrl);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
    }
  };

  return (
    <View style={[styles.container, { bottom: insets.bottom + 85 }]} pointerEvents="box-none">
      <TouchableOpacity 
        style={styles.fab} 
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityLabel="Contact Support on WhatsApp"
        accessibilityRole="button"
      >
        <Ionicons name="logo-whatsapp" size={32} color="#FFF" style={styles.icon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    zIndex: 999,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  icon: {
    marginLeft: 2, // Slight visual adjustment for the play-like icon sometimes
  }
});
