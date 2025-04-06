import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Text, StyleSheet } from "react-native";
import { Button } from "react-native-paper";
import { useAuth } from "../context/Store/Auth";

import Orders from "../Screens/Admin/Orders";
import AdminDashboard from "../Screens/Admin/AdminDashboard";
import ProductForm from "../Screens/Admin/ProductForm";
import Brand from "../Screens/Admin/Brand";

// Restricted Access Screen
const RestrictedAccessScreen = ({ navigation }) => {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Access Denied</Text>
      <Text style={styles.subtitle}>You do not have admin privileges</Text>
      <Button 
        mode="contained" 
        onPress={() => {
          logout();
          navigation.replace('Login');
        }}
      >
        Logout
      </Button>
    </View>
  );
};

const AdminNavigator = () => {
  const { isAdmin } = useAuth();

  // If not admin, return restricted access screen
  if (!isAdmin) {
    return <RestrictedAccessScreen />;
  }

  const Stack = createStackNavigator();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#f4f4f4' },
        headerTintColor: '#333',
        headerTitleStyle: { fontWeight: 'bold' }
      }}
    >
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboard} 
        options={{ title: "Admin Dashboard" }}
      />
      <Stack.Screen 
        name="ProductForm" 
        component={ProductForm} 
        options={{ title: "Add/Edit Product" }} 
      />
      <Stack.Screen 
        name="Brand" 
        component={Brand} 
        options={{ title: "Brand Management" }} 
      />
      <Stack.Screen 
        name="Orders" 
        component={Orders} 
        options={{ title: "Order Management" }} 
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f4f4f4'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#d9534f'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  }
});

export default AdminNavigator;