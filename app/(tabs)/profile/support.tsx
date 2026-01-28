import { Box, Heading, HStack, Text, VStack } from "@/components/ui";
import { darkColors, lightColors } from "@/constants/palette";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { Linking, Pressable, ScrollView, TouchableOpacity, useColorScheme } from "react-native";

export default function SupportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === "dark" ? darkColors : lightColors;
  const WHATSAPP_NUMBER = "+2347033776056"; // Replace with your support WhatsApp number
  const WHATSAPP_MESSAGE = encodeURIComponent("Hello Nexus Support, I need help with my account.");

  const supportItems = [
    {
      icon: "envelope",
      title: "Email Support",
      description: "support@nexus.ng",
      action: () => Linking.openURL("mailto:nexuskano99@gmail.com"),
    },
    {
      icon: "phone",
      title: "Call Us",
      description: "+234 (0) 7033 377 6056",
      action: () => Linking.openURL("tel:+2347033776056"),
    },
    {
      icon: "comments",
      title: "Chat with Us",
      description: "WhatsApp Support 9AM - 6PM",
      action: () => Linking.openURL(`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`),
    },
    {
      icon: "book",
      title: "Help Center",
      description: "Browse FAQs and guides",
      action: () => Linking.openURL("https://help.nexusdatasub.com"),
    },
  ];

  const faqItems = [
    {
      question: "How do I reset my password?",
      answer: "Go to Settings > Security > Change Password. You'll need your current password and email verification.",
    },
    {
      question: "What should I do if I forgot my Transaction PIN?",
      answer: "Contact support with your verified email. We'll help you reset it after identity verification.",
    },
    {
      question: "How do I enable biometric authentication?",
      answer: "Go to Settings > Security > Biometric Devices and follow the setup wizard for your device.",
    },
    {
      question: "Is my data encrypted?",
      answer: "Yes! All sensitive data including tokens and biometric data are encrypted and stored securely.",
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Support & Help",
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
      <ScrollView className="flex-1 bg-background-0" showsVerticalScrollIndicator={false}>
      {/* Contact Methods */}
      <Box className="px-4 my-5">
        <Heading size="md" className="font-semibold mb-4">Get Help</Heading>
        <VStack space="md">
          {supportItems.map((item, index) => (
            <Pressable
              key={index}
              onPress={item.action}
              className="active:opacity-70"
            >
              <VStack space="md" className="items-center p-4 bg-background-0 border border-outline-200 rounded-lg">
                <Box className="w-12 h-12 rounded-full bg-info-50 justify-center items-center">
                  <FontAwesome
                    name={item.icon as any}
                    size={24}
                    color="#E69E19"
                  />
                </Box>
                <Heading size="sm" className="font-semibold text-center">{item.title}</Heading>
                <Text size="xs" className="text-center text-typography-500">{item.description}</Text>
              </VStack>
            </Pressable>
          ))}
        </VStack>
      </Box>

      {/* FAQ */}
      <Box className="px-4 my-5">
        <Heading size="md" className="font-semibold mb-4">Frequently Asked Questions</Heading>
        <Box className="bg-background-0 border border-outline-200 rounded-lg p-3">
          <VStack space="lg">
            {faqItems.map((item, index) => (
              <Box key={index} className={index !== faqItems.length - 1 ? "pb-3 border-b border-outline-200" : ""}>
                <HStack space="md" className="items-start mb-2">
                  <FontAwesome name="question-circle" size={16} color="#E69E19" />
                  <Heading size="xs" className="flex-1 font-semibold text-typography-700">{item.question}</Heading>
                </HStack>
                <Text size="xs" className="text-typography-600 ml-6">{item.answer}</Text>
              </Box>
            ))}
          </VStack>
        </Box>
      </Box>

      {/* Additional Info */}
      <Box className="flex-row items-start px-4 py-3 mx-4 mb-8 rounded-lg bg-info-50 border border-info-200 gap-3">
        <FontAwesome name="info-circle" size={16} color="#E69E19" />
        <Text size="xs" className="flex-1 text-typography-700">
          Our support team is available Monday to Friday, 9AM to 6PM WAT.
        </Text>
      </Box>
    </ScrollView>
    </>
  );
}
