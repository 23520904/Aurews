import React from "react";
import { View, StyleSheet } from "react-native";
import { SignUp } from "@clerk/clerk-react";


export default function ClerkSignUp() {
  return (
    <View style={styles.container}>
      {/* Clerk-hosted SignUp UI */}
      <SignUp />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
});