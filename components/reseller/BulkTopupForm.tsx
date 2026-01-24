// import { designTokens } from "@/constants/palette";
// import { useTheme } from "@/context/ThemeContext";
// import { parseCsvToBulkItems, validateBatchSize } from "@/hooks/useReseller";
// import { BulkTopupRequest } from "@/types/reseller.types";
// import * as DocumentPicker from "expo-document-picker";
// import * as FileSystem from "expo-file-system";
// import { AlertCircle, FileUp, Upload, X } from "lucide-react-native";
// import React, { useState } from "react";
// import {
//     ActivityIndicator,
//     Platform,
//     StyleSheet,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     View,
// } from "react-native";
// import { toast } from "sonner-native";

// interface BulkTopupFormProps {
//   onSubmit: (items: BulkTopupRequest["requests"]) => void;
//   isSubmitting: boolean;
// }

// export function BulkTopupForm({ onSubmit, isSubmitting }: BulkTopupFormProps) {
//   const { colors } = useTheme();
//   const [activeTab, setActiveTab] = useState<"text" | "file">("text");
//   const [textInput, setTextInput] = useState("");
//   const [validationError, setValidationError] = useState<string | null>(null);
//   const [parsedItems, setParsedItems] = useState<BulkTopupRequest["requests"]>(
//     []
//   );
  
//   // File state
//   const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

//   const handleTextChange = (text: string) => {
//     setTextInput(text);
//     setValidationError(null);
//     if (!text.trim()) {
//       setParsedItems([]);
//       return;
//     }

//     const { items, errors } = parseCsvToBulkItems(text);
//     if (errors.length > 0) {
//       // Show first error
//       setValidationError(`Row ${errors[0].row}: ${errors[0].message}`);
//     } else {
//         const batchError = validateBatchSize(items);
//         if (batchError) {
//             setValidationError(batchError);
//         } else {
//             setParsedItems(items);
//         }
//     }
//   };

//   const handleFilePick = async () => {
//     try {
//       const result = await DocumentPicker.getDocumentAsync({
//         type: ["text/csv", "text/plain", "application/vnd.ms-excel"],
//         copyToCacheDirectory: true,
//       });

//       if (result.canceled) return;

//       const file = result.assets[0];
//       setSelectedFile(file);
      
//       // Read file content
//       const content = await FileSystem.readAsStringAsync(file.uri);
//       handleTextChange(content); // Re-use text parsing logic
      
//     } catch (error) {
//       toast.error("Failed to read file");
//       console.error(error);
//     }
//   };

//   const handleSubmit = () => {
//     if (parsedItems.length === 0 || validationError) return;
//     onSubmit(parsedItems);
//   };

//   return (
//     <View style={styles.container}>
//       {/* Tabs */}
//       <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
//         <TouchableOpacity
//           style={[
//             styles.tab,
//             activeTab === "text" && {
//               backgroundColor: colors.card,
//               shadowColor: "#000",
//               shadowOpacity: 0.1,
//               shadowRadius: 2,
//               elevation: 2,
//             },
//           ]}
//           onPress={() => setActiveTab("text")}
//         >
//           <Text
//             style={[
//               styles.tabText,
//               {
//                 color:
//                   activeTab === "text"
//                     ? colors.foreground
//                     : colors.textSecondary,
//                 fontWeight: activeTab === "text" ? "600" : "400",
//               },
//             ]}
//           >
//             Paste CSV
//           </Text>
//         </TouchableOpacity>
//         <TouchableOpacity
//           style={[
//             styles.tab,
//             activeTab === "file" && {
//               backgroundColor: colors.card,
//               shadowColor: "#000",
//               shadowOpacity: 0.1,
//               shadowRadius: 2,
//               elevation: 2,
//             },
//           ]}
//           onPress={() => setActiveTab("file")}
//         >
//           <Text
//             style={[
//               styles.tabText,
//               {
//                 color:
//                   activeTab === "file"
//                     ? colors.foreground
//                     : colors.textSecondary,
//                 fontWeight: activeTab === "file" ? "600" : "400",
//               },
//             ]}
//           >
//             Upload File
//           </Text>
//         </TouchableOpacity>
//       </View>

//       {/* Content */}
//       <View style={styles.formContent}>
//         {activeTab === "text" ? (
//           <View>
//             <TextInput
//               style={[
//                 styles.input,
//                 {
//                   backgroundColor: colors.inputBackground,
//                   borderColor: validationError ? colors.destructive : colors.border,
//                   color: colors.foreground,
//                 },
//               ]}
//               multiline
//               placeholder="08012345678,500,MTN_VTU&#10;08098765432,1000,AIRTEL_VTU"
//               placeholderTextColor={colors.textSecondary}
//               value={textInput}
//               onChangeText={handleTextChange}
//               autoCapitalize="none"
//               autoCorrect={false}
//             />
//             <Text style={[styles.hint, { color: colors.textSecondary }]}>
//               Format: Phone, Amount, ProductCode
//             </Text>
//           </View>
//         ) : (
//           <View style={[styles.uploadArea, { borderColor: colors.border, backgroundColor: colors.card }]}>
//              {selectedFile ? (
//                  <View style={styles.fileInfo}>
//                      <View style={[styles.fileIcon, { backgroundColor: colors.primary + '20' }]}>
//                          <FileUp size={24} color={colors.primary} />
//                      </View>
//                      <View style={styles.fileDetails}>
//                          <Text style={[styles.fileName, { color: colors.foreground }]}>{selectedFile.name}</Text>
//                          <Text style={[styles.fileSize, { color: colors.textSecondary }]}>
//                             {selectedFile.size ? (selectedFile.size / 1024).toFixed(1) + ' KB' : 'Unknown size'}
//                          </Text>
//                      </View>
//                      <TouchableOpacity onPress={() => {
//                          setSelectedFile(null);
//                          setTextInput("");
//                          setParsedItems([]);
//                          setValidationError(null);
//                      }}>
//                          <X size={20} color={colors.textSecondary} />
//                      </TouchableOpacity>
//                  </View>
//              ) : (
//                 <TouchableOpacity style={styles.uploadPlaceholder} onPress={handleFilePick}>
//                     <Upload size={32} color={colors.primary} />
//                     <Text style={[styles.uploadText, { color: colors.foreground }]}>Tap to select file</Text>
//                     <Text style={[styles.uploadSubtext, { color: colors.textSecondary }]}>
//                         Supports .csv, .txt
//                     </Text>
//                 </TouchableOpacity>
//              )}
//           </View>
//         )}

//         {/* Validation Status */}
//         {validationError ? (
//             <View style={[styles.alert, { backgroundColor: colors.destructive + '15' }]}>
//                 <AlertCircle size={16} color={colors.destructive} />
//                 <Text style={[styles.alertText, { color: colors.destructive }]}>{validationError}</Text>
//             </View>
//         ) : parsedItems.length > 0 ? (
//             <View style={[styles.alert, { backgroundColor: colors.success + '15' }]}>
//                 <Text style={[styles.alertText, { color: colors.success }]}>
//                     Ready to process {parsedItems.length} items
//                 </Text>
//             </View>
//         ) : null}

//         {/* Action Button */}
//         <TouchableOpacity
//             style={[
//                 styles.submitButton,
//                 { 
//                     backgroundColor: colors.primary,
//                     opacity: parsedItems.length === 0 || !!validationError || isSubmitting ? 0.5 : 1
//                 }
//             ]}
//             onPress={handleSubmit}
//             disabled={parsedItems.length === 0 || !!validationError || isSubmitting}
//         >
//             {isSubmitting ? (
//                 <ActivityIndicator color={colors.primaryForeground} />
//             ) : (
//                 <Text style={[styles.submitText, { color: colors.primaryForeground }]}>
//                     Process Batch
//                 </Text>
//             )}
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     gap: designTokens.spacing.lg,
//   },
//   tabs: {
//     flexDirection: "row",
//     padding: 4,
//     borderRadius: designTokens.radius.lg,
//   },
//   tab: {
//     flex: 1,
//     paddingVertical: 8,
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: designTokens.radius.md,
//   },
//   tabText: {
//     fontSize: designTokens.fontSize.sm,
//   },
//   formContent: {
//     gap: designTokens.spacing.md,
//   },
//   input: {
//     borderWidth: 1,
//     borderRadius: designTokens.radius.lg,
//     padding: designTokens.spacing.md,
//     fontSize: designTokens.fontSize.sm,
//     fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
//     minHeight: 150,
//     textAlignVertical: 'top',
//   },
//   hint: {
//     fontSize: 10,
//     marginTop: 4,
//   },
//   uploadArea: {
//       borderWidth: 1,
//       borderStyle: 'dashed',
//       borderRadius: designTokens.radius.lg,
//       padding: designTokens.spacing.lg,
//       minHeight: 150,
//       justifyContent: 'center',
//   },
//   uploadPlaceholder: {
//       alignItems: 'center',
//       gap: designTokens.spacing.sm,
//   },
//   uploadText: {
//       fontSize: designTokens.fontSize.base,
//       fontWeight: '600',
//   },
//   uploadSubtext: {
//       fontSize: designTokens.fontSize.sm,
//   },
//   fileInfo: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       gap: designTokens.spacing.md,
//   },
//   fileIcon: {
//       width: 40,
//       height: 40,
//       borderRadius: 20,
//       alignItems: 'center',
//       justifyContent: 'center',
//   },
//   fileDetails: {
//       flex: 1,
//   },
//   fileName: {
//       fontSize: designTokens.fontSize.sm,
//       fontWeight: '600',
//   },
//   fileSize: {
//       fontSize: 10,
//   },
//   alert: {
//       flexDirection: 'row',
//       alignItems: 'center',
//       padding: designTokens.spacing.sm,
//       borderRadius: designTokens.radius.md,
//       gap: designTokens.spacing.sm,
//   },
//   alertText: {
//       fontSize: designTokens.fontSize.sm,
//       fontWeight: '500',
//   },
//   submitButton: {
//       height: 48,
//       borderRadius: designTokens.radius.lg,
//       alignItems: 'center',
//       justifyContent: 'center',
//       marginTop: designTokens.spacing.sm,
//   },
//   submitText: {
//       fontSize: designTokens.fontSize.base,
//       fontWeight: '600',
//   }
// });
