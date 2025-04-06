import React, { useState, useEffect, useCallback } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    TextInput
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from '@react-navigation/native';
import Toast from "react-native-toast-message";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Icon from "react-native-vector-icons/FontAwesome";

import baseURL from "../../assets/common/baseurl";

// Configure notification handler (keep original)
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

const Login = (props) => {
    // Original state declarations
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [deviceId, setDeviceId] = useState(null);
    const navigation = useNavigation();

    // Original useEffect (unchanged)
    useEffect(() => {
        console.log("Current baseURL:", baseURL);
        
        const initializeApp = async () => {
            try {
                const deviceInfo = await Device.getDeviceInfoAsync();
                const generatedDeviceId = `${Platform.OS}-${deviceInfo.deviceName}-${deviceInfo.modelName}`.replace(/\s+/g, '-').toLowerCase();
                setDeviceId(generatedDeviceId);
                await AsyncStorage.setItem('deviceId', generatedDeviceId);
                
                const token = await AsyncStorage.getItem('jwt');
                const userData = await AsyncStorage.getItem('userData');
                
                if (token) {
                    navigation.navigate("PackTrend", { screen: "Home" });
                    
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

    // Original handlers (unchanged)
    const handleEmailChange = useCallback((text) => {
        if (typeof text === 'string') {
            setEmail(text.toLowerCase());
        }
    }, []);

    const handlePasswordChange = useCallback((text) => {
        if (typeof text === 'string') {
            setPassword(text);
        }
    }, []);

    // Original getPushToken (unchanged)
    const getPushToken = async () => {
        let token;
        
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return null;
        }
        
        token = (await Notifications.getExpoPushTokenAsync()).data;
        console.log('Push token:', token);
        
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

    // Original handleSubmit (unchanged)
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
            const pushToken = await getPushToken();
            
            console.log("Attempting login to:", `${baseURL}login`);
            console.log("Login payload:", { email, password, pushToken, deviceId });
            
            const res = await axios.post(`${baseURL}login`, { 
                email, 
                password, 
                pushToken,
                deviceId 
            });
            
            console.log("Login response:", res.status);
            console.log("Login response data:", res.data);
            
            if (res.data.token) {
                const jwtToken = res.data.token;
                await AsyncStorage.setItem('jwt', jwtToken);
                
                if (res.data.user) {
                    console.log("Storing user data:", res.data.user);
                    await AsyncStorage.setItem('userData', JSON.stringify(res.data.user));
                }
                
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
                    navigation.navigate("PackTrend", { screen: "Home" });
                }, 500);
            }
        } catch (error) {
            console.log("Login error:", error);
            console.log("Error response:", error.response);
            
            const errorMessage = error.response?.data?.message || "Please check your credentials";
            setError(errorMessage);
            
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Login Failed",
                text2: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    
    // Updated UI with original functionality
    return (
        <KeyboardAwareScrollView
            viewIsInsideTabBar={true}
            extraHeight={200}
            enableOnAndroid={true}
            contentContainerStyle={styles.container}
        >
            <View style={styles.background}>
                <View style={styles.formContainer}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.header}>Welcome Back</Text>
                        <View style={styles.headerUnderline} />
                        <Text style={styles.subHeader}>Login to your account</Text>
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <View style={styles.inputWrapper}>
                            <Icon name="envelope" size={18} color="#6c5ce7" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Enter your email"
                                placeholderTextColor="#999"
                                style={styles.input}
                                value={email}
                                onChangeText={handleEmailChange}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Icon name="lock" size={20} color="#6c5ce7" style={styles.inputIcon} />
                            <TextInput
                                placeholder="Enter your password"
                                placeholderTextColor="#999"
                                style={styles.input}
                                value={password}
                                onChangeText={handlePasswordChange}
                                secureTextEntry
                            />
                        </View>
                    </View>
                    
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Icon name="exclamation-circle" size={16} color="#e74c3c" />
                            <Text style={styles.error}>{error}</Text>
                        </View>
                    ) : null}
                    
                    <TouchableOpacity 
                        style={[styles.loginButton, isLoading && styles.disabledButton]} 
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>LOGIN</Text>
                        )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                    
                    <View style={styles.divider}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>
                    
                    <View style={styles.registerContainer}>
                        <Text style={styles.registerText}>Don't have an account?</Text>
                        <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                            <Text style={styles.registerLink}>Register</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAwareScrollView>
    );
};

// New styles matching register screen
const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
    },
    background: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    formContainer: {
        paddingHorizontal: 30,
        paddingVertical: 40,
        margin: 20,
        borderRadius: 15,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    headerContainer: {
        marginBottom: 30,
        alignItems: 'center',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2d3436',
        marginBottom: 5,
    },
    subHeader: {
        fontSize: 16,
        color: '#636e72',
        marginTop: 5,
    },
    headerUnderline: {
        height: 4,
        width: 50,
        backgroundColor: '#6c5ce7',
        borderRadius: 2,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        color: '#2d3436',
        marginBottom: 8,
        fontWeight: '500',
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#dfe6e9',
        height: 50,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#2d3436',
        paddingHorizontal: 10,
    },
    inputIcon: {
        marginLeft: 15,
    },
    loginButton: {
        backgroundColor: '#6c5ce7',
        padding: 16,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#6c5ce7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 5,
    },
    disabledButton: {
        backgroundColor: '#a29bfe',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#fdecea',
        borderRadius: 8,
    },
    error: {
        color: '#e74c3c',
        marginLeft: 8,
        fontSize: 14,
    },
    forgotPassword: {
        alignSelf: 'flex-end',
        marginTop: 10,
    },
    forgotPasswordText: {
        color: '#6c5ce7',
        fontSize: 14,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#dfe6e9',
    },
    dividerText: {
        marginHorizontal: 10,
        color: '#999',
        fontSize: 14,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
    },
    registerText: {
        color: '#636e72',
        fontSize: 14,
    },
    registerLink: {
        color: '#6c5ce7',
        fontWeight: 'bold',
        fontSize: 14,
    },
});

export default Login;
