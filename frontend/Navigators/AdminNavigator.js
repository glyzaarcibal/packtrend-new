import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Text, StyleSheet } from "react-native";

import Orders from "../Screens/Admin/Orders";
import AdminDashboard from "../Screens/Admin/AdminDashboard";
import ProductForm from "../Screens/Admin/ProductForm";
import Brand from "../Screens/Admin/Brand";



const AdminNavigator = () => {
  
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