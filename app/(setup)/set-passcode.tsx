import { useSetPasscode } from '@/hooks/usePasscode';
import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SetPasscodeScreen() {
  const [passcode, setPasscode] = useState('');
  const setPasscodeMutation = useSetPasscode();

  const handleSetPasscode = async () => {
    if (passcode.length !== 6) return;
    
    try {
      await setPasscodeMutation.mutateAsync({ passcode });
      // Redirect to setup index to determine next step
      router.replace('/(setup)');
    } catch (error) {
       console.log('Error setting passcode', error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#2E2E33', marginBottom: 12 }}>Set App Lock Code</Text>
        <Text style={{ color: '#5E6D72', marginBottom: 32 }}>Create a 6-digit code to unlock the app securely.</Text>
        
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
          placeholder="000000"
          placeholderTextColor="#D4DADC"
          keyboardType="number-pad"
          maxLength={6}
          secureTextEntry
          value={passcode}
          onChangeText={setPasscode}
          editable={!setPasscodeMutation.isPending}
        />

        <TouchableOpacity
          onPress={handleSetPasscode}
          disabled={passcode.length !== 6 || setPasscodeMutation.isPending}
          style={{
            backgroundColor: passcode.length === 6 ? '#E69E19' : '#D4DADC',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8
          }}
        >
          {setPasscodeMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 }}>Set Passcode</Text>
              <ShieldCheck size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
