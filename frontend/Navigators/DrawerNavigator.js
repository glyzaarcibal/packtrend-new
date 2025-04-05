import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

import Main from "./Main";
import AdminNavigator from "./AdminNavigator";
import DrawerContent from "../Screens/Shared/DrawerContent";

const NativeDrawer = createDrawerNavigator();

const DrawerNavigator = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  
  

  return (
    <NativeDrawer.Navigator
      screenOptions={{
        drawerStyle: { backgroundColor: isDarkMode ? "#121212" : "#fff" },
        drawerLabelStyle: { color: isDarkMode ? "#fff" : "#000" },
      }}
      drawerContent={() => (
        <View style={styles.drawerContent}>
          <DrawerContent />
          <Pressable onPress={toggleTheme} style={{ alignSelf: "flex-end", padding: 10 }}>
            <Text>
              <MaterialIcons name="dark-mode" size={30} color={isDarkMode ? "#BB86FC" : "#000"} />
            </Text>
          </Pressable>
        </View>
      )}
    >
      <NativeDrawer.Screen name="PackTrend" component={Main} />
      
    </NativeDrawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContent: { flex: 1, paddingVertical: 20 },
});

export default DrawerNavigator;