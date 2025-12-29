import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/hooks/theme.hook";
import { useMyApplication } from "../../src/hooks/application.hook";

export default function AuthorStatusScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { data: application, isLoading, error } = useMyApplication();

  useEffect(() => {
    // Nếu không loading và không có application (null/undefined) -> Chuyển sang trang đăng ký
    if (!isLoading && !application) {
      router.replace("/author/register");
    }
  }, [application, isLoading, router]);

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          styles.center,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Nếu vẫn chưa có data (đang redirect) thì return null để tránh flash UI
  if (!application) return null;

  const isRejected = application.status === "rejected";
  const isPending = application.status === "pending";
  const isApproved = application.status === "approved";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Trạng thái hồ sơ
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {isPending && (
          <View style={styles.statusContainer}>
            <Ionicons name="time-outline" size={80} color="#FFA500" />
            <Text style={[styles.statusTitle, { color: theme.text }]}>
              Đang xét duyệt
            </Text>
            <Text style={[styles.statusDesc, { color: theme.textSecondary }]}>
              Hồ sơ của bạn đã được gửi và đang chờ Admin kiểm duyệt. Quá trình
              này thường mất từ 1-3 ngày làm việc.
            </Text>
            <View
              style={[
                styles.infoBox,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <Text style={{ color: theme.text }}>
                Ngày gửi:{" "}
                {new Date(application.submittedAt).toLocaleDateString()}
              </Text>
            </View>
          </View>
        )}

        {isRejected && (
          <View style={styles.statusContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={80}
              color={theme.error}
            />
            <Text style={[styles.statusTitle, { color: theme.text }]}>
              Hồ sơ bị từ chối
            </Text>
            <Text style={[styles.statusDesc, { color: theme.textSecondary }]}>
              Rất tiếc, hồ sơ của bạn chưa đạt yêu cầu.
            </Text>

            <View
              style={[
                styles.reasonBox,
                { backgroundColor: theme.error + "20" },
              ]}
            >
              <Text style={[styles.reasonLabel, { color: theme.error }]}>
                Lý do:
              </Text>
              <Text style={[styles.reasonText, { color: theme.text }]}>
                {application.rejectionReason || "Không có lý do cụ thể."}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => router.push("/author/register")}
            >
              <Text style={styles.actionButtonText}>Cập nhật & Gửi lại</Text>
            </TouchableOpacity>
          </View>
        )}

        {isApproved && (
          <View style={styles.statusContainer}>
            <Ionicons
              name="checkmark-circle-outline"
              size={80}
              color="#4CAF50"
            />
            <Text style={[styles.statusTitle, { color: theme.text }]}>
              Đã được duyệt!
            </Text>
            <Text style={[styles.statusDesc, { color: theme.textSecondary }]}>
              Chúc mừng! Bạn đã trở thành tác giả chính thức.
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
              onPress={() => router.replace("/author/dashboard")}
            >
              <Text style={styles.actionButtonText}>Vào Dashboard</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  statusContainer: { alignItems: 'center' },
  statusTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20, marginBottom: 10 },
  statusDesc: { fontSize: 16, textAlign: 'center', marginBottom: 30, lineHeight: 24 },
  infoBox: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      width: '100%',
      alignItems: 'center'
  },
  reasonBox: {
      padding: 16,
      borderRadius: 12,
      width: '100%',
      marginBottom: 30
  },
  reasonLabel: { fontWeight: 'bold', marginBottom: 4 },
  reasonText: { fontSize: 14, lineHeight: 20 },
  actionButton: {
      paddingVertical: 14,
      paddingHorizontal: 30,
      borderRadius: 30,
      width: '100%',
      alignItems: 'center'
  },
  actionButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
