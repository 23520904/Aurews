import { SignIn } from "@clerk/clerk-react";
import React from "react";
import { View, StyleSheet } from "react-native";

export default function ClerkSignIn() {
  return (
    <View style={styles.container}>
      {/* Clerk-hosted SignIn UI handles social providers and email */}
      <SignIn />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});