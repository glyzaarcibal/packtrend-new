// components/Login.js
import React, { useState, useEffect, useCallback } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    Button, 
    TouchableOpacity,
    ActivityIndicator,
    Platform
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from '@react-navigation/native';
import Toast from "react-native-toast-message";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import FormContainer from "../Shared/FormContainer";
import Input from "../Shared/Input";
import baseURL from "../../assets/common/baseurl";

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

const Login = (props) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const navigation = useNavigation();

    // Get device ID and check for existing token on component mount
    useEffect(() => {
        console.log("Current baseURL:", baseURL);
        
        const initializeApp = async () => {
            try {
                // Get device info for token storage
                const deviceInfo = await Device.getDeviceInfoAsync();
                const generatedDeviceId = `${Platform.OS}-${deviceInfo.deviceName}-${deviceInfo.modelName}`.replace(/\s+/g, '-').toLowerCase();
                setDeviceId(generatedDeviceId);
                await AsyncStorage.setItem('deviceId', generatedDeviceId);
                
                // Check if user is already logged in
                const token = await AsyncStorage.getItem('jwt');
                const userData = await AsyncStorage.getItem('userData');
                
                if (token) {
                    // Navigate to PackTrend and then to Home tab
                    navigation.navigate("PackTrend", { screen: "Home" });
                    
                    // If we have user data, store it for the profile display
                    if (userData) {
                        console.log("User already logged in:", JSON.parse(userData));
                    }
                }
            } catch (error) {
                console.log("Initialization error:", error);
            }
        };
        
        initializeApp();
    }, []);

    // Use useCallback to memoize the text change handlers
    const handleEmailChange = useCallback((text) => {
        // Ensure text is treated as a string
        if (typeof text === 'string') {
            setEmail(text.toLowerCase());
        }
    }, []);

    const handlePasswordChange = useCallback((text) => {
        // Ensure text is treated as a string
        if (typeof text === 'string') {
            setPassword(text);
        }
    }, []);

    // Function to get push notification token
    const getPushToken = async () => {
        let token;
        
        // Check if device is physical
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        // Only ask if permissions haven't been determined
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        
        // If still not granted, return null
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }
        
        // Get the token
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Push token:', token);
        
        // For Android, we need to set a channel
        if (Platform.OS === 'android') {
            Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }
        
        return token;
    };

    const handleSubmit = async () => {
        if (email === "" || password === "") {
            setError("Please fill in your credentials");
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Login Failed",
                text2: "Please provide email and password",
            });
            return;
        }
        
        setIsLoading(true);
        
        try {
            // Get push notification token before login
            const pushToken = await getPushToken();
            
            // Use correct endpoint for login based on backend API routes
            console.log("Attempting login to:", `${baseURL}login`);
            
            // Login with server, include deviceId
            const res = await axios.post(`${baseURL}login`, { 
                email, 
                password, 
                pushToken,
                deviceId 
            });
            
            console.log("Login response:", res.status);
            console.log("Login response data:", res.data);
            console.log("Token present:", !!res.data.token);
            
            if (res.data.token) {
                // Store JWT token
                const jwtToken = res.data.token;
                await AsyncStorage.setItem('jwt', jwtToken);
                
                // Store user data if available
                if (res.data.user) {
                    console.log("Storing user data:", res.data.user);
                    await AsyncStorage.setItem('userData', JSON.stringify(res.data.user));
                }
                
                // Store push token if available
                if (pushToken) {
                    await AsyncStorage.setItem('pushToken', pushToken);
                }
                
                Toast.show({
                    topOffset: 60,
                    type: "success",
                    text1: "Login Successful",
                    text2: "Welcome back!",
                });
                
                setTimeout(() => {
                    // Navigate to PackTrend and specifically to the Home tab
                    navigation.navigate("PackTrend", { screen: "Home" });
                }, 500);
            }
        } catch (error) {
            // Enhanced error logging
            console.log("Login error:", error.message);
            console.log("Status code:", error.response?.status);
            console.log("Error data:", error.response?.data);
            
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Login Failed",
                text2: error.response?.data?.message || "Please check your credentials",
            });
            setError(error.response?.data?.message || "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <KeyboardAwareScrollView
            viewIsInsideTabBar={true}
            extraHeight={200}
            enableOnAndroid={true}
        >
            <FormContainer title={"Login"}>
                <Input
                    placeholder={"Email"}
                    name={"email"}
                    id={"email"}
                    value={email}
                    onChangeText={handleEmailChange}
                />
                <Input
                    placeholder={"Password"}
                    name={"password"}
                    id={"password"}
                    secureTextEntry={true}
                    value={password}
                    onChangeText={handlePasswordChange}
                />
                
                <View style={styles.buttonGroup}>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                </View>
                
                <View style={styles.buttonContainer}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#0000ff" />
                    ) : (
                        <Button
                            title="Login"
                            onPress={() => handleSubmit()}
                        />
                    )}
                </View>
                
                <View style={styles.buttonContainer}>
                    <Text style={styles.middleText}>Don't have an account yet?</Text>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate("Register")}
                        style={styles.registerButton}
                    >
                        <Text style={styles.registerText}>Register</Text>
                    </TouchableOpacity>
                </View>
            </FormContainer>
        </KeyboardAwareScrollView>
    );
};

const styles = StyleSheet.create({
    buttonGroup: {
        width: "80%",
        margin: 10,
        alignItems: "center",
    },
    buttonContainer: {
        width: "80%",
        marginBottom: 20,
        marginTop: 10,
        alignItems: "center"
    },
    middleText: {
        marginBottom: 10,
        alignSelf: "center"
    },
    registerButton: {
        backgroundColor: "#E0E0E0",
        padding: 10,
        borderRadius: 5,
        width: "80%",
        alignItems: "center"
    },
    registerText: {
        color: "#000000",
        fontWeight: "bold"
    },
    error: {
        color: "red",
        marginBottom: 10,
    }
});

export default Login;