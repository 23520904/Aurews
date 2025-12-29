import React from "react";
import { View, StyleSheet, Text } from "react-native";


export default function ClerkSignUp() {
  return (
    <View style={styles.container}>
      <Text>Clerk SignUp is not available on native. Use app register.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});
