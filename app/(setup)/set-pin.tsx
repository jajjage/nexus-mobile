import { useSetPin } from '@/hooks/usePin';
import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SetPinScreen() {
  const [pin, setPin] = useState('');
  const setPinMutation = useSetPin();

  const handleSetPin = async () => {
    if (pin.length !== 4) return;
    
    try {
      await setPinMutation.mutateAsync({ pin });
      // Redirect to setup index to determine next step
      router.replace('/(setup)');
    } catch (error) {
      // Error handled in hook toast
      console.log('Error setting PIN', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2E2E33', marginBottom: 12 }}>Set Transaction PIN</Text>
        <Text style={{ color: '#5E6D72', marginBottom: 32 }}>Create a 4-digit PIN to secure your transactions.</Text>
        
        <TextInput
          style={{ 
            backgroundColor: '#FFFFFF', 
            borderWidth: 1, 
            borderColor: '#D4DADC', 
            borderRadius: 12, 
            padding: 16, 
            fontSize: 24, 
            letterSpacing: 8, 
            textAlign: 'center',
            marginBottom: 32
          }}
          placeholder="0000"
          placeholderTextColor="#D4DADC"
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          value={pin}
          onChangeText={setPin}
          editable={!setPinMutation.isPending}
        />

        <TouchableOpacity
          onPress={handleSetPin}
          disabled={pin.length !== 4 || setPinMutation.isPending}
          style={{
            backgroundColor: pin.length === 4 ? '#E69E19' : '#D4DADC',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {setPinMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Set PIN</Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
