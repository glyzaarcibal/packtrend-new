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
    ActivityIndicator
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
        if (email === "" || name === "" || phone === "" || password === "") {
            setError("Please fill in the form correctly");
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Registration Failed",
                text2: "Please fill in the form correctly",
            });
            return;
        }
        
        setIsLoading(true);
        
        // For a simple registration without image
        const user = {
            name,
            email,
            password,
            phone,
            isAdmin: false
        };
        
        // Use correct endpoint for registration based on backend API routes
        console.log("Attempting to register with URL:", `${baseURL}register`);
        
        // Register with correct endpoint
        axios
            .post(`${baseURL}register`, user)
            .then((res) => {
                console.log("Registration response:", res.data);
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
                console.log("Registration error:", error);
                console.log("Full error response:", error.response);
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

    // To upload image when registration with profile picture is implemented
    const registerWithImage = () => {
        if (email === "" || name === "" || phone === "" || password === "") {
            setError("Please fill in the form correctly");
            return;
        }
        
        setIsLoading(true);

        let formData = new FormData();
        
        // Append form data
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("phone", phone);
        formData.append("isAdmin", false);
        
        // Append image if available
        if (image) {
            const newImageUri = "file:///" + image.split("file:/").join("");
            
            formData.append("image", {
                uri: newImageUri,
                type: mime.getType(newImageUri),
                name: newImageUri.split("/").pop()
            });
        }
        
        // Register with image upload
        axios
            .post(`${baseURL}register`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data"
                }
            })
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

    const getLocation = () => {
        if (location && location.coords) {
            const { coords } = location;
            const url = `geo:${coords.latitude},${coords.longitude}?z=5`;
            Linking.openURL(url);
        } else {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Location Unavailable",
                text2: "Please enable location services",
            });
        }
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
        >
            <FormContainer title={"Register"}>
                <View style={styles.imageContainer}>
                    <Image 
                        style={styles.image} 
                        source={
                            mainImage 
                                ? { uri: mainImage } 
                                : require('../../assets/icon.png')
                        } 
                    />
                    <TouchableOpacity
                        onPress={takePhoto}
                        style={styles.imagePicker}>
                        <Icon style={{ color: "white" }} name="camera" size={18} />
                    </TouchableOpacity>
                </View>
                
                <Input
                    placeholder={"Email"}
                    name={"email"}
                    id={"email"}
                    onChangeText={(text) => setEmail(text.toLowerCase())}
                />
                <Input
                    placeholder={"Name"}
                    name={"name"}
                    id={"name"}
                    onChangeText={(text) => setName(text)}
                />
                <Input
                    placeholder={"Phone Number"}
                    name={"phone"}
                    id={"phone"}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setPhone(text)}
                />
                <Input
                    placeholder={"Password"}
                    name={"password"}
                    id={"password"}
                    secureTextEntry={true}
                    onChangeText={(text) => setPassword(text)}
                />
                
                <View style={styles.buttonGroup}>
                    {error ? <Text style={styles.error}>{error}</Text> : null}
                </View>
                
                <View style={styles.buttonContainer}>
                    {isLoading ? (
                        <ActivityIndicator size="large" color="#0000ff" />
                    ) : (
                        <Button
                            title="Register"
                            onPress={() => register()}
                        />
                    )}
                </View>
                
                <View style={styles.buttonContainer}>
                    <Button
                        title="Back to Login"
                        onPress={() => navigation.navigate("Login")}
                    />

                    <View style={{ marginTop: 10 }}>
                        <Button 
                            title="Get Location"
                            onPress={getLocation}
                        />
                    </View>
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
    imageContainer: {
        width: 200,
        height: 200,
        borderStyle: "solid",
        borderWidth: 8,
        padding: 0,
        justifyContent: "center",
        borderRadius: 100,
        borderColor: "#E0E0E0",
        elevation: 10,
        marginBottom: 20
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: 100
    },
    imagePicker: {
        position: "absolute",
        right: 5,
        bottom: 5,
        backgroundColor: "grey",
        padding: 8,
        borderRadius: 100,
        elevation: 20
    },
    error: {
        color: "red",
        marginBottom: 10,
    }
});

export default Register;