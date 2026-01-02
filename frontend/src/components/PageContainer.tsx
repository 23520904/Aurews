import React from "react";
import { ViewStyle, StatusBar, StyleSheet } from "react-native";
// [QUAN TRỌNG] Import SafeAreaView và Edge từ thư viện này
import { SafeAreaView, Edge } from "react-native-safe-area-context";
import { useTheme } from "../hooks/theme.hook";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  // [FIX] Thêm dòng này để component chấp nhận prop 'edges'
  edges?: Edge[];
}

export const PageContainer = ({
  children,
  style,
  backgroundColor,
  edges // [FIX] Nhận prop edges
}: Props) => {
  const theme = useTheme();

  return (
    <SafeAreaView
      // [FIX] Truyền edges vào đây. 
      // Nếu bên ngoài không truyền, mặc định sẽ safe cả 4 cạnh ['top', 'bottom', 'left', 'right']
      edges={edges || ['top', 'right', 'bottom', 'left']}
      style={[
        styles.container,
        {
          backgroundColor: backgroundColor || theme.background,
        },
        style,
      ]}
    >
      <StatusBar
        barStyle={theme.mode === "dark" ? "light-content" : "dark-content"}
      />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});