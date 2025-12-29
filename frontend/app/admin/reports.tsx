import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAdminReports, useResolveReport } from "../../src/hooks/report.hook";
import { useTheme, useAnimatedTheme } from "../../src/hooks/theme.hook";
import { FONTS, SHADOWS } from "../../src/constants/theme";

type StatusFilter = "pending" | "resolved" | "rejected";

export default function AdminReports() {
  const colors = useTheme();
  const { cardStyle } = useAnimatedTheme();
  const [status, setStatus] = useState<StatusFilter>("pending");
  const query = useAdminReports({ status, limit: 20 });
  const resolve = useResolveReport();

  const reports = useMemo(() => query.data?.reports ?? [], [query.data]);

  const onResolve = (id: string) => {
    resolve.mutate({ reportId: id, body: { status: "resolved", adminNote: "Resolved" } });
  };
  const onReject = (id: string) => {
    resolve.mutate({ reportId: id, body: { status: "rejected", adminNote: "Rejected" } });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={colors.mode === "dark" ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Reports</Text>
        <View style={styles.filters}>
          {(["pending", "resolved", "rejected"] as StatusFilter[]).map((s) => (
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
        data={reports}
        keyExtractor={(item: any) => item._id}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }: any) => (
          <Animated.View style={[styles.card, cardStyle, SHADOWS.small]}>
            <View style={styles.row}>
              <Ionicons name="alert-circle" size={20} color={colors.icon} />
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.targetType}</Text>
            </View>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Reason: {item.reason}</Text>
            <View style={styles.actions}>
              {item.status === "pending" ? (
                <>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success }]} onPress={() => onResolve(item._id)}>
                    <Text style={[styles.actionText, { color: colors.white }]}>Resolve</Text>
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
        )}
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
  actions: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  actionText: { fontSize: 14, ...FONTS.bold },
});
