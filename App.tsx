// App.tsx
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import HomeScreen from "./src/screens/HomeScreen";
import { useEffect } from "react";
import { configure, scheduleDailyNotificationWithRecords, createChannel, sendTestNotification } from "./src/services/NotificationService";
import { Record } from "./src/types/Record";
import { parseExcelFile } from "./src/utils/excelParser";

function App() {
  const [records, setRecords] = useState<Record[]>([]);
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await parseExcelFile('data.xlsx');
        setRecords(data);
        configure();
        createChannel();
        scheduleDailyNotificationWithRecords(records);
      } catch (error) {
        console.error("Error loading records:", error);
      }
    };
    fetchRecords();
  }, []);
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
