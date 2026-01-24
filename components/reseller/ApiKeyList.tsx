// import { designTokens } from "@/constants/palette";
// import { useTheme } from "@/context/ThemeContext";
// import { useApiKeys, useRevokeApiKey } from "@/hooks/useReseller";
// import { ApiApiKey } from "@/types/reseller.types";
// import * as Clipboard from "expo-clipboard";
// import { Key, MoreVertical, Trash2 } from "lucide-react-native";
// import React, { useState } from "react";
// import {
//     ActivityIndicator,
//     Alert,
//     FlatList,
//     Modal,
//     Pressable,
//     StyleSheet,
//     Text,
//     TouchableOpacity,
//     View,
// } from "react-native";
// import { toast } from "sonner-native";

// export function ApiKeyList() {
//   const { colors } = useTheme();
//   const { data, isLoading, refetch } = useApiKeys();
//   const { mutate: revokeKey, isPending: isRevoking } = useRevokeApiKey();
//   const [selectedKey, setSelectedKey] = useState<ApiApiKey | null>(null);

//   const keys = data?.data || [];

//   const handleCopy = async (text: string) => {
//     await Clipboard.setStringAsync(text);
//     toast.success("Copied to clipboard");
//   };

//   const handleRevoke = (key: ApiApiKey) => {
//     Alert.alert(
//       "Revoke API Key",
//       `Are you sure you want to revoke "${key.name}"? This action cannot be undone and any applications using this key will stop working immediately.`,
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Revoke",
//           style: "destructive",
//           onPress: () => {
//             revokeKey(key.id);
//             setSelectedKey(null);
//           },
//         },
//       ]
//     );
//   };

//   const renderItem = ({ item }: { item: ApiApiKey }) => (
//     <View
//       style={[
//         styles.card,
//         { backgroundColor: colors.card, borderColor: colors.border },
//       ]}
//     >
//       <View style={styles.cardHeader}>
//         <View style={styles.keyIcon}>
//           <Key size={16} color={colors.primary} />
//         </View>
//         <View style={styles.cardInfo}>
//           <Text style={[styles.keyName, { color: colors.foreground }]}>
//             {item.name}
//           </Text>
//           <View style={styles.metaRow}>
//             <View
//               style={[
//                 styles.badge,
//                 {
//                   backgroundColor:
//                     item.environment === "live"
//                       ? colors.destructive + "20"
//                       : colors.success + "20",
//                 },
//               ]}
//             >
//               <Text
//                 style={[
//                   styles.badgeText,
//                   {
//                     color:
//                       item.environment === "live"
//                         ? colors.destructive
//                         : colors.success,
//                   },
//                 ]}
//               >
//                 {item.environment.toUpperCase()}
//               </Text>
//             </View>
//             <Text style={[styles.dateText, { color: colors.textSecondary }]}>
//               Created {new Date(item.createdAt).toLocaleDateString()}
//             </Text>
//           </View>
//         </View>
//         <TouchableOpacity
//           style={styles.moreButton}
//           onPress={() => setSelectedKey(item)}
//         >
//           <MoreVertical size={20} color={colors.textSecondary} />
//         </TouchableOpacity>
//       </View>

//       <View
//         style={[
//           styles.keyDisplay,
//           { backgroundColor: colors.background, borderColor: colors.border },
//         ]}
//       >
//         <Text
//           style={[styles.keyPrefix, { color: colors.textSecondary }]}
//           numberOfLines={1}
//           ellipsizeMode="middle"
//         >
//           {item.prefix}...
//         </Text>
//       </View>
//     </View>
//   );

//   return (
//     <View style={styles.container}>
//       {isLoading ? (
//         <View style={styles.loader}>
//           <ActivityIndicator color={colors.primary} />
//         </View>
//       ) : keys.length === 0 ? (
//         <View style={styles.emptyState}>
//           <Key size={48} color={colors.textDisabled} />
//           <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
//             No API keys found
//           </Text>
//         </View>
//       ) : (
//         <FlatList
//           data={keys}
//           renderItem={renderItem}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.listContent}
//           showsVerticalScrollIndicator={false}
//         />
//       )}

//       {/* Options Modal */}
//       <Modal
//         visible={!!selectedKey}
//         transparent
//         animationType="fade"
//         onRequestClose={() => setSelectedKey(null)}
//       >
//         <Pressable
//           style={styles.modalOverlay}
//           onPress={() => setSelectedKey(null)}
//         >
//           <View
//             style={[
//               styles.optionsSheet,
//               { backgroundColor: colors.card, borderColor: colors.border },
//             ]}
//           >
//             <Text style={[styles.sheetTitle, { color: colors.foreground }]}>
//               {selectedKey?.name}
//             </Text>
            
//             <TouchableOpacity
//               style={styles.optionItem}
//               onPress={() => {
//                 if (selectedKey) handleRevoke(selectedKey);
//               }}
//             >
//               <View style={[styles.optionIcon, { backgroundColor: colors.destructive + '15' }]}>
//                 <Trash2 size={20} color={colors.destructive} />
//               </View>
//               <Text style={[styles.optionText, { color: colors.destructive }]}>
//                 Revoke Key
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </Pressable>
//       </Modal>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   loader: {
//     padding: designTokens.spacing.xl,
//     alignItems: "center",
//   },
//   listContent: {
//     padding: designTokens.spacing.md,
//     gap: designTokens.spacing.md,
//   },
//   card: {
//     borderRadius: designTokens.radius.lg,
//     borderWidth: 1,
//     padding: designTokens.spacing.md,
//   },
//   cardHeader: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//     marginBottom: designTokens.spacing.md,
//   },
//   keyIcon: {
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "#FFF8E1", // Gold/Primary light
//     alignItems: "center",
//     justifyContent: "center",
//     marginRight: designTokens.spacing.md,
//   },
//   cardInfo: {
//     flex: 1,
//   },
//   keyName: {
//     fontSize: designTokens.fontSize.base,
//     fontWeight: "600",
//     marginBottom: 4,
//   },
//   metaRow: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: designTokens.spacing.sm,
//   },
//   badge: {
//     paddingHorizontal: 6,
//     paddingVertical: 2,
//     borderRadius: 4,
//   },
//   badgeText: {
//     fontSize: 10,
//     fontWeight: "700",
//   },
//   dateText: {
//     fontSize: designTokens.fontSize.xs,
//   },
//   moreButton: {
//     padding: 4,
//     marginLeft: 4,
//   },
//   keyDisplay: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     padding: designTokens.spacing.sm,
//     borderRadius: designTokens.radius.md,
//     borderWidth: 1,
//     borderStyle: "dashed",
//   },
//   keyPrefix: {
//     fontSize: designTokens.fontSize.sm,
//     fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
//     flex: 1,
//   },
//   emptyState: {
//     alignItems: "center",
//     justifyContent: "center",
//     padding: designTokens.spacing.xl,
//     gap: designTokens.spacing.md,
//   },
//   emptyText: {
//     fontSize: designTokens.fontSize.base,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.5)",
//     justifyContent: "flex-end",
//     padding: designTokens.spacing.md,
//   },
//   optionsSheet: {
//     borderRadius: designTokens.radius.xl,
//     padding: designTokens.spacing.lg,
//     borderWidth: 1,
//   },
//   sheetTitle: {
//     fontSize: designTokens.fontSize.lg,
//     fontWeight: "700",
//     marginBottom: designTokens.spacing.lg,
//     textAlign: 'center',
//   },
//   optionItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: designTokens.spacing.md,
//   },
//   optionIcon: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginRight: designTokens.spacing.md,
//   },
//   optionText: {
//     fontSize: designTokens.fontSize.base,
//     fontWeight: '600',
//   }
// });
