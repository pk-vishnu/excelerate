// App.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import HomeScreen from "./src/screens/HomeScreen";

function App() {
  return (
    <View style={styles.container}>
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",  // vertical center
    alignItems: "center",      // horizontal center
    backgroundColor: "#000000",
  }
});

export default App;
