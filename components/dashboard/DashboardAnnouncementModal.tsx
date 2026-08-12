import { useTheme } from "@/context/ThemeContext";
import { DashboardAnnouncement } from "@/types/announcement.types";
import { Megaphone } from "lucide-react-native";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DashboardAnnouncementModalProps {
  announcement: DashboardAnnouncement | null;
  visible: boolean;
  onDismiss: () => void;
}

export function DashboardAnnouncementModal({
  announcement,
  visible,
  onDismiss,
}: DashboardAnnouncementModalProps) {
  const { colors, isDark } = useTheme();

  console.log("[DEBUG-announcement] modal render", {
    visible,
    hasAnnouncement: !!announcement,
    announcementId: announcement?.id,
    title: announcement?.title,
  });

  if (!announcement) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay} collapsable={false}>
        <View
          collapsable={false}
          style={[
            styles.card,
            { backgroundColor: isDark ? colors.card : "#FFFFFF" },
          ]}
        >
          <View style={styles.header}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${colors.primary}18` },
              ]}
            >
              <Megaphone size={22} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {announcement.title}
            </Text>
          </View>

          <ScrollView
            style={styles.messageScroll}
            contentContainerStyle={styles.messageContent}
            showsVerticalScrollIndicator
          >
            <Text style={[styles.message, { color: colors.foreground }]}>
              {announcement.message}
            </Text>
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onDismiss}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "72%",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconWrap: {
    height: 42,
    width: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "800",
  },
  messageScroll: {
    maxHeight: 360,
  },
  messageContent: {
    paddingBottom: 8,
  },
  message: {
    fontSize: 16,
    lineHeight: 23,
  },
  button: {
    alignSelf: "flex-end",
    borderRadius: 12,
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
});
