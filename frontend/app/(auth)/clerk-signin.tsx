import React from "react";
import { View, StyleSheet, Text } from "react-native";

export default function ClerkSignIn() {
  return (
    <View style={styles.container}>
      <Text>Clerk SignIn is not available on native. Use app login.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
