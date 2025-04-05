import React from "react";
import { createStackNavigator } from "@react-navigation/stack";

import Orders from "../Screens/Admin/Orders";
import AdminDashboard from "../Screens/Admin/AdminDashboard";
import ProductForm from "../Screens/Admin/ProductForm";
import Brand from "../Screens/Admin/Brand";
import UserProfile from "../Screens/User/UserProfile";

const Stack = createStackNavigator();

const AdminNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="AdminDashboard" 
        component={AdminDashboard} 
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

export default AdminNavigator;