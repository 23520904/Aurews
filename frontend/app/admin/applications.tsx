import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAdminApplications, useReviewApplication } from "../../src/hooks/application.hook";
import { useTheme, useAnimatedTheme } from "../../src/hooks/theme.hook";
import { FONTS, SHADOWS } from "../../src/constants/theme";
import type { AuthorApplication, User } from "../../src/types/type";

type StatusFilter = "pending" | "approved" | "rejected";

export default function AdminApplications() {
  const colors = useTheme();
  const { backgroundStyle, cardStyle } = useAnimatedTheme();
  const [status, setStatus] = useState<StatusFilter>("pending");
  const query = useAdminApplications({ status, limit: 20 });
  const review = useReviewApplication();

  const applications: AuthorApplication[] = useMemo(() => query.data?.applications ?? [], [query.data]);

  const onApprove = (id: string) => {
    review.mutate({ applicationId: id, body: { status: "approved" } });
  };
  const onReject = (id: string) => {
    review.mutate({ applicationId: id, body: { status: "rejected", rejectionReason: "Not approved" } });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.mode === "dark" ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Author Applications</Text>
        <View style={styles.filters}>
          {(["pending", "approved", "rejected"] as StatusFilter[]).map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.filterBtn,
                { borderColor: colors.border, backgroundColor: status === s ? colors.primaryLight : colors.card },
              ]}
              onPress={() => setStatus(s)}
            >
              <Text style={[styles.filterText, { color: colors.text }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={applications}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        renderItem={({ item }) => {
          const u = item.user as User;
          return (
            <Animated.View style={[styles.card, cardStyle, SHADOWS.small]}>
              <View style={styles.row}>
                <Ionicons name="person-circle" size={22} color={colors.icon} />
                <Text style={[styles.cardTitle, { color: colors.text }]}>{u?.fullName || String(item.user)}</Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Status: {item.status}</Text>
              <View style={styles.docsRow}>
                <Text style={{ color: colors.textSecondary }}>ID Front</Text>
                <Ionicons name="image" size={18} color={colors.icon} />
              </View>
              <View style={styles.actions}>
                {item.status === "pending" ? (
                  <>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={() => onApprove(item._id)}>
                      <Text style={[styles.actionText, { color: colors.white }]}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.error }]} onPress={() => onReject(item._id)}>
                      <Text style={[styles.actionText, { color: colors.white }]}>Reject</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <Text style={{ color: colors.textSecondary }}>{item.status}</Text>
                )}
              </View>
            </Animated.View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  header: { paddingVertical: 12, gap: 12 },
  title: { fontSize: 22, ...FONTS.bold },
  filters: { flexDirection: "row", gap: 8 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  filterText: { fontSize: 14, ...FONTS.medium, textTransform: "capitalize" },
  card: { borderRadius: 12, padding: 12, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, ...FONTS.bold },
  subtitle: { fontSize: 13, ...FONTS.medium },
  docsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  actions: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  actionText: { fontSize: 14, ...FONTS.bold },
});
