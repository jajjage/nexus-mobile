import { buildWebAuthnAssertion, buildWebAuthnAttestationResponse } from '@/lib/webauthn-mobile';
import React, { useState } from 'react';
import { Button, ScrollView, Text, View } from 'react-native';

export default function WebAuthnDebugScreen() {
  const [log, setLog] = useState<string[]>([]);

  const append = (s: string) => setLog((l) => [s, ...l].slice(0, 200));

  const runAttestationTest = async () => {
    try {
      append('Running attestation (dev)');
      const att = await buildWebAuthnAttestationResponse('test-challenge-dev', '', 'nexusdatasub.com');
      append(`Attestation (dev) id=${att.id} attestationObject.length=${att.response.attestationObject.length}`);
    } catch (e: any) {
      append('Attestation dev error: ' + e.message);
    }
  };

  const runAssertionTest = async () => {
    try {
      append('Running assertion (dev)');
      const asr = await buildWebAuthnAssertion('test-challenge-assert', 'nexusdatasub.com');
      append(`Assertion (dev) signature length=${asr.response.signature.length}`);
    } catch (e: any) {
      append('Assertion dev error: ' + e.message);
    }
  };

  return (
    <ScrollView style={{ padding: 16 }}>
      <View style={{ gap: 12 }}>
        <Button title="Run Attestation Test (dev)" onPress={runAttestationTest} />
        <Button title="Run Assertion Test (dev)" onPress={runAssertionTest} />
        <Text style={{ marginTop: 12, fontWeight: '600' }}>Logs</Text>
        {log.map((l, i) => (
          <Text key={i} selectable style={{ fontSize: 12, marginTop: 6 }}>{l}</Text>
        ))}
      </View>
    </ScrollView>
  );
}
