import React, { useState, useEffect } from "react";
import { 
    View, 
    Text, 
    StyleSheet, 
    Image, 
    TouchableOpacity, 
    Dimensions, 
    Linking, 
    Button,
    ActivityIndicator,
    TextInput
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from "expo-image-picker";
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import Icon from "react-native-vector-icons/FontAwesome";
import Toast from "react-native-toast-message";
import mime from "mime";
import axios from "axios";

import FormContainer from "../Shared/FormContainer";
import Input from "../Shared/Input";
import baseURL from "../../assets/common/baseurl";

var { height, width } = Dimensions.get("window");

const Register = (props) => {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [launchCam, setLaunchCam] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState(null);
    const [camera, setCamera] = useState(null);
    const [image, setImage] = useState("");
    const [mainImage, setMainImage] = useState('');
    const [location, setLocation] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigation = useNavigation();
   
    const takePhoto = async () => {
        setLaunchCam(true);
        const c = await ImagePicker.requestCameraPermissionsAsync();

        if (c.status === "granted") {
            let result = await ImagePicker.launchCameraAsync({
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled) {
                setMainImage(result.assets[0].uri);
                setImage(result.assets[0].uri);
            }
        }
    };

    const register = () => {
        if (email === "" || name === "" || password === "" || confirmPassword === "") {
            setError("Please fill in the required fields");
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Registration Failed",
                text2: "Please fill in the required fields",
            });
            return;
        }
        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Registration Failed",
                text2: "Passwords do not match",
            });
            return;
        }
        
        setIsLoading(true);
        
        const user = {
            name,
            email,
            password,
            phone,
            isAdmin: false
        };
        
        axios
            .post(`${baseURL}register`, user)
            .then((res) => {
                if (res.status === 201) {
                    Toast.show({
                        topOffset: 60,
                        type: "success",
                        text1: "Registration Succeeded",
                        text2: "Please check your email for verification instructions",
                    });
                    setTimeout(() => {
                        navigation.navigate("Login");
                    }, 500);
                }
            })
            .catch((error) => {
                Toast.show({
                    topOffset: 60,
                    type: "error",
                    text1: "Registration Failed",
                    text2: error.response?.data?.message || "Please try again",
                });
                setError(error.response?.data?.message || "Registration failed");
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });
    
        if (!result.canceled) {
            setImage(result.assets[0].uri);
            setMainImage(result.assets[0].uri);
        }
    };

    useEffect(() => {
        (async () => {
            const cameraStatus = await Camera.requestCameraPermissionsAsync();
            setHasCameraPermission(cameraStatus.status === 'granted');

            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })();
    }, []);

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
                        <Text style={styles.header}>Create Account</Text>
                        <View style={styles.headerUnderline} />
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Name</Text>
                        <TextInput
                            placeholder="Enter your name"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={name}
                            onChangeText={(text) => setName(text)}
                        />
                        <Icon name="user" size={20} color="#6c5ce7" style={styles.inputIcon} />
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Email</Text>
                        <TextInput
                            placeholder="Enter your email"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={email}
                            onChangeText={(text) => setEmail(text.toLowerCase())}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Icon name="envelope" size={18} color="#6c5ce7" style={styles.inputIcon} />
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Phone Number <Text style={styles.optional}>(Optional)</Text></Text>
                        <TextInput
                            placeholder="Enter your phone number"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={phone}
                            onChangeText={(text) => setPhone(text)}
                            keyboardType="phone-pad"
                        />
                        <Icon name="phone" size={20} color="#6c5ce7" style={styles.inputIcon} />
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Password</Text>
                        <TextInput
                            placeholder="Enter your password"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={password}
                            onChangeText={(text) => setPassword(text)}
                            secureTextEntry
                        />
                        <Icon name="lock" size={22} color="#6c5ce7" style={styles.inputIcon} />
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Confirm Password</Text>
                        <TextInput
                            placeholder="Confirm your password"
                            placeholderTextColor="#999"
                            style={styles.input}
                            value={confirmPassword}
                            onChangeText={(text) => setConfirmPassword(text)}
                            secureTextEntry
                        />
                        <Icon name="lock" size={22} color="#6c5ce7" style={styles.inputIcon} />
                    </View>
                    
                    {error ? (
                        <View style={styles.errorContainer}>
                            <Icon name="exclamation-circle" size={16} color="#e74c3c" />
                            <Text style={styles.error}>{error}</Text>
                        </View>
                    ) : null}
                    
                    <TouchableOpacity 
                        style={[styles.signUpButton, isLoading && styles.disabledButton]} 
                        onPress={register}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={styles.signUpButtonText}>SIGN UP</Text>
                        )}
                    </TouchableOpacity>
                    
                    <View style={styles.dividerContainer}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>or</Text>
                        <View style={styles.dividerLine} />
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.loginLink} 
                        onPress={() => navigation.navigate("Login")}
                    >
                        <Text style={styles.loginText}>Already have an account? <Text style={styles.loginHighlight}>Login</Text></Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAwareScrollView>
    );
};

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
    headerUnderline: {
        height: 4,
        width: 50,
        backgroundColor: '#6c5ce7',
        borderRadius: 2,
    },
    inputContainer: {
        marginBottom: 20,
        position: 'relative',
    },
    label: {
        fontSize: 14,
        color: '#2d3436',
        marginBottom: 8,
        fontWeight: '500',
    },
    optional: {
        fontSize: 12,
        color: '#999',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#dfe6e9',
        borderRadius: 10,
        paddingHorizontal: 45,
        paddingRight: 15,
        fontSize: 16,
        backgroundColor: '#f8f9fa',
        color: '#2d3436',
    },
    inputIcon: {
        position: 'absolute',
        left: 15,
        top: 40,
    },
    signUpButton: {
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
    signUpButtonText: {
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
    dividerContainer: {
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
    loginLink: {
        alignItems: 'center',
    },
    loginText: {
        color: '#636e72',
        fontSize: 14,
    },
    loginHighlight: {
        color: '#6c5ce7',
        fontWeight: 'bold',
    },
});

export default Register;
