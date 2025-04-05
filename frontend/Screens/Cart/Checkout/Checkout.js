import React, { useEffect, useState, useContext } from 'react'
import { Text, View, Button, SafeAreaView, StyleSheet, ActivityIndicator } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import AsyncStorage from '@react-native-async-storage/async-storage'

import FormContainer from '../../Shared/FormContainer'
import Input from '../../Shared/Input'
import { useSelector } from 'react-redux'
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AuthGlobal from '../../../context/Store/AuthGlobal';
import Toast from 'react-native-toast-message'  
import { Picker } from '@react-native-picker/picker'
import axios from 'axios'

const countries = require("../../../assets/data/countries.json");
const baseURL = 'http://10.0.2.2:4000/api' // Adjust if your server URL is different

const Checkout = (props) => {
    const [user, setUser] = useState('')
    const [orderItems, setOrderItems] = useState([])
    const [address, setAddress] = useState('')
    const [address2, setAddress2] = useState('')
    const [city, setCity] = useState('')
    const [zip, setZip] = useState('')
    const [country, setCountry] = useState('PH')
    const [phone, setPhone] = useState('')
    const [loading, setLoading] = useState(false)
    const [userProfile, setUserProfile] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    const navigation = useNavigation()
    const cartItems = useSelector(state => state.cartItems)
    const context = useContext(AuthGlobal);

    // Fetch user profile from API
    const fetchUserProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('jwt')
            
            if (!token) {
                console.log("No token found, user not authenticated")
                return null
            }
            
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
            
            const response = await axios.get(`${baseURL}/profile`, config)
            console.log("Profile response:", JSON.stringify(response.data))
            
            // Pre-fill phone if available from profile
            if (response.data && response.data.phone) {
                setPhone(response.data.phone)
            }
            
            return response.data
        } catch (error) {
            console.error("Error fetching profile:", error)
            return null
        }
    }

    // Check authentication directly rather than using context
    const checkAuthentication = async () => {
        try {
            const token = await AsyncStorage.getItem('jwt')
            return !!token // Convert to boolean
        } catch (error) {
            console.error("Error checking authentication:", error)
            return false
        }
    }

    // Use useFocusEffect to reload component data when screen gets focus
    useFocusEffect(
        React.useCallback(() => {
            const loadData = async () => {
                setLoading(true)
                
                // Check authentication
                const authenticated = await checkAuthentication()
                setIsAuthenticated(authenticated)
                
                // If authenticated, fetch profile
                if (authenticated) {
                    try {
                        const profile = await fetchUserProfile()
                        if (profile) {
                            setUserProfile(profile)
                            setUser(profile.id)
                            console.log("User authenticated, ID:", profile.id)
                        }
                    } catch (error) {
                        console.error("Error fetching profile:", error)
                    }
                }
                
                // Always load cart items
                if (cartItems && cartItems.length > 0) {
                    setOrderItems(cartItems)
                    console.log("Cart items loaded:", cartItems.length)
                } else {
                    console.log("Cart is empty")
                    Toast.show({
                        topOffset: 60,
                        type: "info",
                        text1: "Your cart is empty",
                        text2: "Please add items before checkout"
                    });
                    // Navigate back if cart is empty
                    navigation.navigate("Cart")
                }
                
                setLoading(false)
            }
            
            loadData()
            
            return () => {
                // Cleanup if needed
            }
        }, [cartItems])
    )

    // Form validation
    const validateForm = () => {
        if (!phone || !address || !city || !zip) {
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
        // Check if user is authenticated
        if (!isAuthenticated || !user) {
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
        
        // Create the order object with all required fields
        let order = {
            city,
            country,
            dateOrdered: Date.now(),
            orderItems,
            phone,
            shippingAddress1: address,
            shippingAddress2: address2,
            status: "3", // Assuming this is an order status code
            user,
            zip,
        }
        
        console.log("Shipping order:", order)
        
        // Ensure order object is valid before navigating
        if (order && order.orderItems && order.orderItems.length > 0) {
            navigation.navigate("Payment", { order: order })
        } else {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Error creating order",
                text2: "Please try again"
            });
        }
    }
    
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
                {userProfile && (
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>Hello, {userProfile.name}</Text>
                        <Text style={styles.profileEmail}>{userProfile.email}</Text>
                    </View>
                )}
                
                <Input
                    placeholder={"Phone *"}
                    name={"phone"}
                    value={phone}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setPhone(text)}
                />
                <Input
                    placeholder={"Shipping Address *"}
                    name={"ShippingAddress1"}
                    value={address}
                    onChangeText={(text) => setAddress(text)}
                />
                <Input
                    placeholder={"Enter other details(optional)"}
                    name={"ShippingAddress2"}
                    value={address2}
                    onChangeText={(text) => setAddress2(text)}
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