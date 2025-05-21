// App.tsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import HomeScreen from "./src/screens/HomeScreen";
import { useEffect } from "react";
import { loadRecordsFromFile } from "./src/utils/loadRecords";
import { configure, scheduleDailyNotificationWithRecords, createChannel, sendTestNotification } from "./src/services/NotificationService";
import { Record } from "./src/types/Record";
function App() {
  const [records, setRecords] = useState<Record[]>([]);
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await loadRecordsFromFile();
        setRecords(data);
      } catch (error) {
        console.error("Error loading records:", error);
      }
      configure();
      createChannel();
      scheduleDailyNotificationWithRecords(records);
      sendTestNotification();
    };
    fetchRecords();

  }, [])
  return (
    <View style={styles.container}>
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
  }
});

export default App;
