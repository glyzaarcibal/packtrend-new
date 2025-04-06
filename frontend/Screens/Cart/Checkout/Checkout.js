import React, { useEffect, useState, useContext } from 'react'
import { 
    Text, 
    View, 
    SafeAreaView, 
    StyleSheet, 
    ActivityIndicator, 
    TouchableOpacity,
    ScrollView,
    Image
} from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/MaterialIcons'
import Icon2 from 'react-native-vector-icons/FontAwesome'
import Icon3 from 'react-native-vector-icons/Entypo'
import Icon4 from 'react-native-vector-icons/MaterialCommunityIcons'

import FormContainer from '../../Shared/FormContainer'
import Input from '../../Shared/Input'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AuthGlobal from '../../../context/Store/AuthGlobal';
import Toast from 'react-native-toast-message'  
import { Picker } from '@react-native-picker/picker'
import axios from 'axios'

import baseURL from '../../../assets/common/baseurl';

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
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Loading your checkout details...</Text>
            </View>
        )
    }
    
    // Show login prompt if not authenticated
    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.authContainer}>
                    <Icon name="lock" size={50} color="#6200ee" style={styles.authIcon} />
                    <Text style={styles.authTitle}>Secure Checkout</Text>
                    <Text style={styles.authMessage}>
                        Please login or create an account to complete your purchase and save your shipping details for faster checkout next time.
                    </Text>
                    <TouchableOpacity style={styles.actionButton} onPress={handleLogin}>
                        <Text style={styles.actionButtonText}>Login or Sign Up</Text>
                        <Icon name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }
    
    // If authenticated but cart is empty
    if (orderItems.length === 0) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.authContainer}>
                    <Icon name="remove-shopping-cart" size={50} color="#6200ee" style={styles.authIcon} />
                    <Text style={styles.authTitle}>Your Cart is Empty</Text>
                    <Text style={styles.authMessage}>
                        Looks like you haven't added any items to your cart yet. Start shopping to find amazing products!
                    </Text>
                    <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Home")}>
                        <Text style={styles.actionButtonText}>Browse Products</Text>
                        <Icon name="shopping-basket" size={20} color="#fff" style={styles.buttonIcon} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        )
    }
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAwareScrollView
                viewIsInsideTabBar={true}
                extraHeight={200}
                enableOnAndroid={true}
                contentContainerStyle={styles.scrollContainer}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Icon name="arrow-back" size={24} color="#6200ee" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Checkout</Text>
                </View>

                <View style={styles.formContainer}>
                    <View style={styles.sectionHeader}>
                        <Icon2 name="user" size={20} color="#6200ee" />
                        <Text style={styles.sectionTitle}>Customer Information</Text>
                    </View>

                    {profileError ? (
                        <View style={styles.errorBox}>
                            <View style={styles.errorHeader}>
                                <Icon name="error" size={20} color="#ff6d00" />
                                <Text style={styles.errorTitle}>Profile Information Limited</Text>
                            </View>
                            <Text style={styles.errorText}>
                                We couldn't load your full profile details, but you can still complete your order. Please verify your shipping information below.
                            </Text>
                        </View>
                    ) : (
                        userProfile && (
                            <View style={styles.profileInfo}>
                                <View style={styles.profileHeader}>
                                    <Icon name="account-circle" size={24} color="#6200ee" />
                                    <Text style={styles.profileName}>{userProfile.name}</Text>
                                </View>
                                {userProfile.email && (
                                    <View style={styles.profileDetail}>
                                        <Icon name="email" size={16} color="#666" />
                                        <Text style={styles.profileEmail}>{userProfile.email}</Text>
                                    </View>
                                )}
                            </View>
                        )
                    )}

                    <View style={styles.sectionHeader}>
                        <Icon3 name="address" size={20} color="#6200ee" />
                        <Text style={styles.sectionTitle}>Shipping Address</Text>
                    </View>

                    <View style={styles.inputRow}>
                        <Icon name="phone" size={20} color="#6200ee" style={styles.inputIcon} />
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Phone Number *</Text>
                            <Input
                                placeholder={"09123456789"}
                                name={"phone"}
                                value={phone}
                                keyboardType={"phone-pad"}
                                onChangeText={(text) => setPhone(text)}
                                style={styles.input}
                            />
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <Icon name="home" size={20} color="#6200ee" style={styles.inputIcon} />
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>House/Building Number *</Text>
                            <Input
                                placeholder={"123"}
                                name={"houseNumber"}
                                value={houseNumber}
                                onChangeText={(text) => setHouseNumber(text)}
                                style={styles.input}
                            />
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <Icon4 name="road" size={20} color="#6200ee" style={styles.inputIcon} />
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Street *</Text>
                            <Input
                                placeholder={"Main Street"}
                                name={"street"}
                                value={street}
                                onChangeText={(text) => setStreet(text)}
                                style={styles.input}
                            />
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <Icon name="location-city" size={20} color="#6200ee" style={styles.inputIcon} />
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Barangay *</Text>
                            <Input
                                placeholder={"Barangay 1"}
                                name={"barangay"}
                                value={barangay}
                                onChangeText={(text) => setBarangay(text)}
                                style={styles.input}
                            />
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <Icon name="location-on" size={20} color="#6200ee" style={styles.inputIcon} />
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>City *</Text>
                            <Input
                                placeholder={"Manila"}
                                name={"city"}
                                value={city}
                                onChangeText={(text) => setCity(text)}
                                style={styles.input}
                            />
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <Icon name="markunread-mailbox" size={20} color="#6200ee" style={styles.inputIcon} />
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Zip Code *</Text>
                            <Input
                                placeholder={"1000"}
                                name={"zip"}
                                value={zip}
                                keyboardType={"numeric"}
                                onChangeText={(text) => setZip(text)}
                                style={styles.input}
                            />
                        </View>
                    </View>

                    <View style={styles.inputRow}>
                        <Icon name="public" size={20} color="#6200ee" style={styles.inputIcon} />
                        <View style={styles.inputWrapper}>
                            <Text style={styles.inputLabel}>Country</Text>
                            <View style={styles.pickerWrapper}>
                                <Picker
                                    style={styles.picker}
                                    selectedValue={country}
                                    onValueChange={(itemValue) => setCountry(itemValue)}
                                    dropdownIconColor="#6200ee"
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
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={styles.confirmButton} 
                        onPress={checkOut}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.confirmButtonText}>Proceed to Payment</Text>
                        <Icon name="payment" size={20} color="#fff" style={styles.buttonIcon} />
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8f9fa'
    },
    scrollContainer: {
        flexGrow: 1,
        paddingBottom: 30
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0'
    },
    backButton: {
        marginRight: 16
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333'
    },
    formContainer: {
        flex: 1,
        padding: 16,
        backgroundColor: '#fff',
        margin: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginLeft: 8,
        color: '#333'
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff'
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666'
    },
    authContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#fff'
    },
    authIcon: {
        marginBottom: 16
    },
    authTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#333',
        textAlign: 'center'
    },
    authMessage: {
        fontSize: 16,
        marginBottom: 32,
        textAlign: 'center',
        color: '#666',
        lineHeight: 24
    },
    profileInfo: {
        backgroundColor: '#f5f5ff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    profileName: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        color: '#333'
    },
    profileDetail: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4
    },
    profileEmail: {
        fontSize: 14,
        marginLeft: 8,
        color: '#666'
    },
    errorBox: {
        backgroundColor: '#fff3e0',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24
    },
    errorHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8
    },
    errorTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
        color: '#ff6d00'
    },
    errorText: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    inputIcon: {
        marginRight: 12,
        width: 24
    },
    inputWrapper: {
        flex: 1
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 6,
        color: '#555'
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 48,
        fontSize: 16
    },
    pickerWrapper: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        overflow: 'hidden'
    },
    picker: {
        height: 48,
        backgroundColor: '#fff'
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6200ee',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 8,
        elevation: 2
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    },
    buttonIcon: {
        marginLeft: 8
    },
    confirmButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#6200ee',
        paddingVertical: 16,
        borderRadius: 8,
        marginTop: 24,
        elevation: 3
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600'
    }
})

export default Checkout;
