import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View, useColorScheme, Text, ActivityIndicator } from "react-native";
import Icon from "@expo/vector-icons/FontAwesome";
import { useTheme } from "react-native-paper";
import CartIcon from "../Screens/Shared/CartIcon";

import HomeNavigator from "./HomeNavigator";
import CartNavigator from "./CartNavigator";
import UserNavigator from "./UserNavigator";
import FavoritesNavigator from "./FavoritesNavigator";
import AdminNavigator from "./AdminNavigator";
const Tab = createBottomTabNavigator();

const Main = () => {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? "#121212" : "#fff" }}>
      <Tab.Navigator 
        initialRouteName="Home"
        screenOptions={{
          tabBarLabel: () => null,  // Hide tab labels
          headerShown: false,       // Hide headers
        }}
      >
        <Tab.Screen name="Home" component={HomeNavigator} options={{
          tabBarIcon: ({ color }) => <Icon name="home" color={color} size={30} />,
        }} />
        <Tab.Screen name="Favorites" component={FavoritesNavigator} options={{
          tabBarIcon: ({ color }) => <Icon name="heart" color={color} size={30} />,
        }} />
        <Tab.Screen name="Cart" component={CartNavigator} options={{
          tabBarIcon: ({ color }) => (
            <>
              <Icon name="shopping-cart" color={color} size={30} />
              <CartIcon />
            </>
          ),
        }} />
        
        <Tab.Screen name="User" component={UserNavigator} options={{
          tabBarIcon: ({ color }) => <Icon name="user" color={color} size={30} />,
        }} />

        <Tab.Screen name="Admin" component={AdminNavigator} options={{
          tabBarIcon: ({ color }) => <Icon name="cog" color={color} size={30} />,
        }} />
      </Tab.Navigator>
    </View>
  );
};

export default Main;