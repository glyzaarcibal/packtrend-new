import React, { useEffect, useState, useContext } from 'react'
import { Text, View, Button, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import AsyncStorage from '@react-native-async-storage/async-storage'

import FormContainer from '../../Shared/FormContainer'
import Input from '../../Shared/Input'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AuthGlobal from '../../../context/Store/AuthGlobal';
import Toast from 'react-native-toast-message'  
import { Picker } from '@react-native-picker/picker'
import axios from 'axios'

import baseURL from '../../../assets/common/baseurl'; // Use the correct baseURL

const countries = require("../../../assets/data/countries.json");

const Checkout = (props) => {
    const [user, setUser] = useState('')
    const [orderItems, setOrderItems] = useState([])
    const [houseNumber, setHouseNumber] = useState('')
    const [street, setStreet] = useState('')
    const [barangay, setBarangay] = useState('')
    const [city, setCity] = useState('')
    const [zip, setZip] = useState('')
    const [country, setCountry] = useState('PH')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [userProfile, setUserProfile] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [profileError, setProfileError] = useState(null)

    const navigation = useNavigation()
    const dispatch = useDispatch()
    const cartItems = useSelector(state => state.cartItems)
    const context = useContext(AuthGlobal);

    // Fetch user profile from API with improved error handling
    const fetchUserProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('jwt')
            
            if (!token) {
                console.log("No token found, user not authenticated")
                return null
            }
            
            // Check for stored user data first (faster than API call)
            const storedUserData = await AsyncStorage.getItem('userData');
            if (storedUserData) {
                const parsedUserData = JSON.parse(storedUserData);
                console.log("Using stored user data:", parsedUserData);
                
                // Pre-fill user data from stored profile
                setUserFromProfile(parsedUserData);
                return parsedUserData;
            }
            
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                timeout: 8000
            }
            
            try {
                console.log("Fetching profile from:", `${baseURL}profile`);
                const response = await axios.get(`${baseURL}profile`, config);
                console.log("Profile API response:", JSON.stringify(response.data));
                
                // Process user data correctly based on API response structure
                let profileData;
                if (response.data && response.data.user) {
                    // If the API returns a nested user object
                    profileData = {
                        ...response.data.user,
                        isAdmin: response.data.user.isAdmin === true || response.data.user.is_admin === 1
                    };
                } else {
                    // If the API returns the user object directly
                    profileData = {
                        ...response.data,
                        isAdmin: response.data.isAdmin === true || response.data.is_admin === 1
                    };
                }
                
                // Save to AsyncStorage for future use
                await AsyncStorage.setItem('userData', JSON.stringify(profileData));
                
                // Pre-fill user data from API response
                setUserFromProfile(profileData);
                return profileData;
            } catch (error) {
                console.error("API error fetching profile:", error);
                setProfileError(error.message || "Network error");
                
                // Try to create a minimal user profile based on token
                try {
                    // Try to decode token to get user ID
                    const tokenParts = token.split('.');
                    if (tokenParts.length === 3) {
                        const payload = JSON.parse(atob(tokenParts[1]));
                        const userId = payload.userId || payload.id || payload._id || 'unknown';
                        
                        const minimalUser = {
                            _id: userId,
                            id: userId,
                            name: 'User',
                            email: 'Not available'
                        };
                        console.log("Created minimal user profile from token:", minimalUser);
                        return minimalUser;
                    }
                } catch (e) {
                    console.error("Error decoding token:", e);
                }
                
                // If all else fails, return a dummy user
                const dummyUser = { _id: 'token-user', id: 'token-user', name: 'User' };
                console.log("Using dummy user due to error:", dummyUser);
                return dummyUser;
            }
            
        } catch (error) {
            console.error("General error in profile fetch:", error);
            setProfileError(error.message || "Unknown error");
            return null;
        }
    }
    
    // Helper function to set user data from profile
    const setUserFromProfile = (profile) => {
        if (!profile) return;
        
        // Set user ID
        setUser(profile.id || profile._id);
        
        // Pre-fill all available user data
        if (profile.phone) {
            setPhone(profile.phone);
        }
        
        // Handle address parsing from shippingAddress1 if in combined format
        if (profile.shippingAddress1) {
            try {
                // Try to parse existing address format if it exists
                const addressParts = profile.shippingAddress1.split(',').map(part => part.trim());
                if (addressParts.length >= 3) {
                    // If previously stored in the format we expect
                    setHouseNumber(addressParts[0] || '');
                    setStreet(addressParts[1] || '');
                    setBarangay(addressParts[2] || '');
                } else {
                    // Just set the first field if we can't parse
                    setHouseNumber(profile.shippingAddress1);
                }
            } catch (e) {
                // If parsing fails, just set the house number
                setHouseNumber(profile.shippingAddress1);
            }
        }
        
        if (profile.shippingAddress2) {
            // Attempt to use shippingAddress2 for barangay if not already set
            if (!barangay) {
                setBarangay(profile.shippingAddress2);
            }
        }
        
        if (profile.city) {
            setCity(profile.city);
        }
        
        if (profile.zip) {
            setZip(profile.zip);
        }
        
        if (profile.country) {
            setCountry(profile.country);
        }
    }

    // Check authentication using token presence
    const checkAuthentication = async () => {
        try {
            const token = await AsyncStorage.getItem('jwt')
            console.log("JWT token exists:", !!token)
            
            // Always consider user authenticated if token exists
            if (token) {
                return true;
            }
            
            // Fallback to context check
            const contextAuthenticated = context?.stateUser?.isAuthenticated || false;
            console.log("Context auth state:", contextAuthenticated);
            
            return contextAuthenticated;
        } catch (error) {
            console.error("Error checking authentication:", error);
            return false;
        }
    }

    // Use useFocusEffect to reload component data when screen gets focus
    useFocusEffect(
        React.useCallback(() => {
            const loadData = async () => {
                setLoading(true);
                setProfileError(null);
                
                try {
                    // Check authentication first
                    const authenticated = await checkAuthentication();
                    console.log("Authentication check result:", authenticated);
                    setIsAuthenticated(authenticated);
                    
                    // If authenticated, fetch profile
                    if (authenticated) {
                        const profile = await fetchUserProfile();
                        if (profile) {
                            setUserProfile(profile);
                            console.log("User authenticated, ID:", profile.id || profile._id);
                        } else {
                            console.log("Profile fetch returned null despite authentication");
                        }
                    } else {
                        console.log("User not authenticated, skipping profile fetch");
                    }
                    
                    // Always load cart items
                    await loadCartItems();
                } catch (error) {
                    console.error("Error in loadData:", error);
                } finally {
                    setLoading(false);
                }
            };
            
            loadData();
            
            return () => {
                // Cleanup if needed
            };
        }, [])
    );
    
    // Separate function to load cart items
    const loadCartItems = async () => {
        try {
            if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
                setOrderItems(cartItems);
                console.log("Cart items loaded:", cartItems.length);
            } else if (typeof cartItems === 'object' && Object.keys(cartItems).length > 0) {
                // Handle case where cartItems might be an object instead of array
                const cartArray = Object.keys(cartItems)
                    .filter(key => key !== '_persist')
                    .map(key => cartItems[key]);
                    
                setOrderItems(cartArray);
                console.log("Cart items loaded (from object):", cartArray.length);
            } else {
                console.log("Cart is empty");
                Toast.show({
                    topOffset: 60,
                    type: "info",
                    text1: "Your cart is empty",
                    text2: "Please add items before checkout"
                });
                // Navigate back if cart is empty
                navigation.navigate("Cart");
            }
        } catch (error) {
            console.error("Error loading cart items:", error);
        }
    };

    // Form validation
    const validateForm = () => {
        if (!phone || !houseNumber || !street || !barangay || !city || !zip) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Please fill in all required fields",
                text2: ""
            });
            return false;
        }
        
        // Validate phone number format
        if (!/^\d{10,}$/.test(phone.replace(/\D/g, ''))) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Please enter a valid phone number",
                text2: ""
            });
            return false;
        }
        
        // Validate zip code
        if (!/^\d{4,}$/.test(zip.replace(/\D/g, ''))) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Please enter a valid zip code",
                text2: ""
            });
            return false;
        }
        
        return true;
    }

    const checkOut = () => {
        // Check if authenticated (based only on isAuthenticated state)
        if (!isAuthenticated) {
            console.log("Checkout authorization failed. isAuthenticated:", isAuthenticated);
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Please login to continue",
                text2: ""
            });
            
            navigation.navigate("User", { 
                screen: 'Login', 
                params: { 
                    returnTo: 'Checkout'
                }
            });
            return;
        }
        
        // Use a default user ID if none is available
        if (!user) {
            console.log("No user ID found, using fallback ID");
            const fallbackId = 'guest-' + Date.now();
            setUser(fallbackId);
        }

        // Check if cart has items
        if (!orderItems || orderItems.length === 0) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Your cart is empty",
                text2: ""
            });
            return;
        }

        if (!validateForm()) {
            return;
        }
        
        // Combine address parts into format expected by backend
        const formattedAddress1 = `${houseNumber}, ${street}, ${barangay}`;
        
        // Create the order object with all required fields
        let order = {
            city,
            country,
            dateOrdered: Date.now(),
            orderItems,
            phone,
            shippingAddress1: formattedAddress1,
            shippingAddress2: "", // No longer needed as we've restructured the address
            status: "3", // Assuming this is an order status code
            user: user || 'unknown-user', // This connects the order to the user
            zip,
        }
        
        console.log("Shipping order:", order);
        
        // Ensure order object is valid before navigating
        if (order && order.orderItems && order.orderItems.length > 0) {
            // Save shipping address to user profile if authenticated
            if (isAuthenticated) {
                saveShippingAddressToProfile({
                    phone,
                    shippingAddress1: formattedAddress1,
                    shippingAddress2: "",
                    city,
                    zip,
                    country
                });
            }
            
            navigation.navigate("Payment", { order: order });
        } else {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Error creating order",
                text2: "Please try again"
            });
        }
    }
    
    // Save shipping address to user profile for future use
    const saveShippingAddressToProfile = async (addressData) => {
        try {
            const token = await AsyncStorage.getItem('jwt');
            
            if (!token) {
                return;
            }
            
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            };
            
            // Update user profile with shipping details
            try {
                const response = await axios.put(
                    `${baseURL}users/profile`, 
                    addressData,
                    config
                );
                
                console.log("Saved address to profile:", response.data);
            } catch (error) {
                console.log("Error saving address to profile (non-critical):", error.message);
            }
        } catch (error) {
            console.error("Error preparing address save:", error);
        }
    };
    
    // Handle login button press
    const handleLogin = () => {
        navigation.navigate("User", { 
            screen: 'Login', 
            params: { 
                returnTo: 'Checkout'
            }
        });
    }
    
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#4A68E0" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        )
    }
    
    // Show login prompt if not authenticated
    if (!isAuthenticated) {
        return (
            <View style={styles.authContainer}>
                <Text style={styles.authTitle}>Please Login to Continue</Text>
                <Text style={styles.authMessage}>
                    You need to be logged in to complete your checkout.
                </Text>
                <Button 
                    title="Login" 
                    onPress={handleLogin} 
                    color="#4A68E0"
                />
            </View>
        )
    }
    
    // If authenticated but cart is empty
    if (orderItems.length === 0) {
        return (
            <View style={styles.authContainer}>
                <Text style={styles.authTitle}>Your Cart is Empty</Text>
                <Text style={styles.authMessage}>
                    Add some items to your cart before checkout.
                </Text>
                <Button 
                    title="Go Shopping" 
                    onPress={() => navigation.navigate("Home")} 
                    color="#4A68E0"
                />
            </View>
        )
    }
    
    return (
        <KeyboardAwareScrollView
            viewIsInsideTabBar={true}
            extraHeight={200}
            enableOnAndroid={true}
        >
            <FormContainer title={"Shipping Address"}>
                {profileError ? (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorTitle}>
                            Note: Using limited profile data
                        </Text>
                        <Text style={styles.errorText}>
                            You can still complete your order. Please fill in your shipping details.
                        </Text>
                    </View>
                ) : (
                    userProfile && (
                        <View style={styles.profileInfo}>
                            <Text style={styles.profileName}>Hello, {userProfile.name}</Text>
                            {userProfile.email && (
                                <Text style={styles.profileEmail}>{userProfile.email}</Text>
                            )}
                        </View>
                    )
                )}
                
                <Input
                    placeholder={"Phone *"}
                    name={"phone"}
                    value={phone}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setPhone(text)}
                />
                <Input
                    placeholder={"House/Building Number *"}
                    name={"houseNumber"}
                    value={houseNumber}
                    onChangeText={(text) => setHouseNumber(text)}
                />
                <Input
                    placeholder={"Street *"}
                    name={"street"}
                    value={street}
                    onChangeText={(text) => setStreet(text)}
                />
                <Input
                    placeholder={"Barangay *"}
                    name={"barangay"}
                    value={barangay}
                    onChangeText={(text) => setBarangay(text)}
                />
                <Input
                    placeholder={"City *"}
                    name={"city"}
                    value={city}
                    onChangeText={(text) => setCity(text)}
                />
                <Input
                    placeholder={"Zip Code *"}
                    name={"zip"}
                    value={zip}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setZip(text)}
                />
                <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Country:</Text>
                    <Picker
                        style={styles.picker}
                        selectedValue={country}
                        onValueChange={(itemValue) => setCountry(itemValue)}
                    >
                        {countries.map((c) => (
                            <Picker.Item
                                key={c.code}
                                label={c.name}
                                value={c.code}
                            />
                        ))}
                    </Picker>
                </View>

                <View style={styles.buttonContainer}>
                    <Button title="Confirm" onPress={() => checkOut()} color="#4A68E0" />
                </View>
            </FormContainer>
        </KeyboardAwareScrollView>
    )
}

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    loadingText: {
        marginTop: 10,
        color: '#666'
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    authTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333'
    },
    authMessage: {
        fontSize: 16,
        marginBottom: 30,
        textAlign: 'center',
        color: '#666'
    },
    profileInfo: {
        backgroundColor: '#f8f8f8',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5
    },
    profileEmail: {
        color: '#666'
    },
    errorBox: {
        backgroundColor: '#fff8e1',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ffe0b2'
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ff8f00',
        marginBottom: 5
    },
    errorText: {
        fontSize: 14,
        color: '#666'
    },
    pickerContainer: {
        marginBottom: 20
    },
    pickerLabel: {
        marginBottom: 5,
        fontSize: 16
    },
    picker: {
        height: 50,
        width: 300,
        backgroundColor: '#f9f9f9',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 5
    },
    buttonContainer: {
        width: '80%',
        alignItems: "center",
        marginTop: 20,
        marginBottom: 30
    }
})

export default Checkout;