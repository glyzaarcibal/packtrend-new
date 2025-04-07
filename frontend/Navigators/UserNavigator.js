import React, { useEffect, useState } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import your screens
import Login from "../Screens/User/Login";
import Register from "../Screens/User/Register";
import UserProfile from "../Screens/User/UserProfile";
import OrderDetail from "../Screens/User/OrderDetail";
import MyOrders from "../Screens/User/MyOrders";
import ProductReviewsScreen from "../Screens/Review/ProductReviewsScreen";
import EditUserProfile from "../Screens/User/EditUserProfile";
import MyReviewsScreen from "../Screens/Review/MyReviewsScreen";
import EditReviewScreen from "../Screens/Review/EditReviewScreen";
import AdminNavigator from "../Navigators/AdminNavigator";



const Stack = createStackNavigator();

const UserNavigator = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const navigation = useNavigation();

    const checkUserLogin = async () => {
        try {
            const token = await AsyncStorage.getItem('jwt');
            const userDataString = await AsyncStorage.getItem('userData');
            
            console.log("JWT Token Found:", token ? "Yes" : "No");
            console.log("User Data Found:", userDataString || "null");

            if (token) {
                if (userDataString) {
                    setIsLoggedIn(true);
                    setUserData(JSON.parse(userDataString));
                } else {
                    console.log("WARNING: Token found but no user data");
                    // Still consider user logged in if they have a token
                    setIsLoggedIn(true);
                }
            } else {
                setIsLoggedIn(false);
                setUserData(null);
            }
        } catch (error) {
            console.log("Error checking login status:", error);
            setIsLoggedIn(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            checkUserLogin();
        }, [])
    );

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: '#f4f4f4' },
                headerTintColor: '#333',
                headerTitleStyle: { fontWeight: 'bold' }
            }}
        >
            {isLoggedIn ? (
                <>
                    <Stack.Screen 
                        name="UserProfile" 
                        component={UserProfile} 
                        options={{ 
                            title: "My Profile",
                            initialParams: { userData: userData }
                        }}
                    />
                    <Stack.Screen 
                        name="MyOrders" 
                        component={MyOrders} 
                        options={{ title: "My Orders" }}
                    />
                    <Stack.Screen 
                        name="OrderDetail" 
                        component={OrderDetail} 
                        options={({ route }) => ({ 
                            title: `Order #${route.params?.id || ''}` 
                        })}
                    />
                    <Stack.Screen
                        name="ProductReviews"
                        component={ProductReviewsScreen}
                        options={{
                            title: "Review Products"
                        }}
                    />
                    
                    <Stack.Screen 
                        name="EditUserProfile" 
                        component={EditUserProfile} 
                        options={{ 
                            headerTitle: 'EditUserProfile',
                            headerShown: true,
                        }} 
                    />
                    <Stack.Screen
                        name="MyReview"
                        component={MyReviewsScreen}
                        options={{
                            title: "My Review"
                        }}
                    />
                    <Stack.Screen
                        name="EditReviewScreen"
                        component={EditReviewScreen}
                        options={{
                            title: "My edit Review"
                        }}
                    />
                    <Stack.Screen
                        name="AdminDashboard"
                        component={AdminNavigator}
                        options={{
                            headerShown: false
                        }}
                    />
                </>
            ) : (
                <>
                    <Stack.Screen 
                        name="Login" 
                        component={Login} 
                        options={{ headerShown: false }}
                    />
                    <Stack.Screen 
                        name="Register" 
                        component={Register} 
                        options={{ headerShown: false }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
};

export default UserNavigator;