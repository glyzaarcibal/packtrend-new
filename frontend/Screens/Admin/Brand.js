import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    FlatList,
    Dimensions,
    TextInput,
    StyleSheet,
    Alert,
    Image,
    TouchableOpacity,
    ScrollView
} from "react-native";
import EasyButton from "../Shared/StyledComponents/EasyButton";
import baseURL from "../../assets/common/baseurl";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import mime from 'mime';

var { width } = Dimensions.get("window");

const Item = (props) => {
    return (
        <View style={styles.item}>
            <View style={styles.itemContent}>
                {props.item.images && props.item.images.length > 0 ? (
                    <Image 
                        source={{ uri: props.item.images[0].startsWith('http') 
                            ? props.item.images[0] 
                            : `${baseURL}${props.item.images[0]}` 
                        }} 
                        style={styles.thumbnail}
                    />
                ) : (
                    <View style={styles.noImagePlaceholder}>
                        <Text style={styles.noImageText}>No Image</Text>
                    </View>
                )}
                <Text style={styles.brandName}>{props.item.name}</Text>
            </View>
            <EasyButton
                danger
                medium
                onPress={() => props.delete(props.item._id)}
            >
                <Text style={{ color: "white", fontWeight: "bold" }}>Delete</Text>
            </EasyButton>
        </View>
    );
};

const Brand = (props) => {
    const [brands, setBrands] = useState([]);
    const [brandName, setBrandName] = useState('');
    const [brandDescription, setBrandDescription] = useState('');
    const [token, setToken] = useState(null);
    const [images, setImages] = useState([]);

    useEffect(() => {
        const fetchBrands = async () => {
            try {
                // Request camera and media library permissions
                const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
                const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                
                if (!cameraPermission.granted || !mediaLibraryPermission.granted) {
                    Alert.alert("Permissions Required", "Camera and media library permissions are needed for image upload");
                }

                // Retrieve the token from AsyncStorage
                const storedToken = await AsyncStorage.getItem("jwt");
                
                if (!storedToken) {
                    Alert.alert("Authentication Error", "No authentication token found. Please log in again.");
                    return;
                }

                // Create axios instance with the token
                const axiosInstance = axios.create({
                    baseURL: baseURL,
                    headers: {
                        Authorization: `Bearer ${storedToken}`
                    }
                });

                // Fetch brands
                const response = await axiosInstance.get("get/brand");
                
                // Ensure we're accessing the right property from the response
                if (response.data && response.data.brand) {
                    setBrands(response.data.brand);
                } else {
                    console.warn("Unexpected response format:", response.data);
                    setBrands([]);
                }
                
                setToken(storedToken);
            } catch (error) {
                console.error("Full error details:", error);
                
                if (error.response) {
                    console.error("Error response data:", error.response.data);
                    console.error("Error response status:", error.response.status);
                    
                    if (error.response.status === 401) {
                        Alert.alert(
                            "Authentication Failed", 
                            "Your session has expired. Please log in again.",
                            [{ text: "OK" }]
                        );
                    } else {
                        Alert.alert("Error", `Failed to load brands: ${error.response.data.error || 'Unknown error'}`);
                    }
                } else if (error.request) {
                    console.error("No response received:", error.request);
                    Alert.alert("Network Error", "No response from server. Check your connection.");
                } else {
                    console.error("Error setting up request:", error.message);
                    Alert.alert("Error", "An unexpected error occurred.");
                }
            }
        };

        fetchBrands();
    }, []);

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });
            
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const newImage = result.assets[0];
                setImages([...images, newImage.uri]);
            }
        } catch (error) {
            console.error("Error picking image:", error);
            Alert.alert("Error", "Failed to pick image");
        }
    };

    const removeImage = (index) => {
        const updatedImages = images.filter((_, i) => i !== index);
        setImages(updatedImages);
    };

    const addBrand = async () => {
        if (!brandName.trim()) {
            Alert.alert("Invalid Input", "Brand name cannot be empty");
            return;
        }

        // Use a default description if none provided
        const description = brandDescription.trim() || `${brandName.trim()} brand`;

        try {
            const formData = new FormData();
            formData.append("name", brandName.trim());
            formData.append("description", description);

            // Append all selected images to the formData
            if (images.length > 0) {
                images.forEach((image, index) => {
                    const imageName = image.split('/').pop();
                    const mimeType = mime.getType(image) || 'image/jpeg';
                    
                    formData.append('images', {
                        uri: image,
                        name: imageName,
                        type: mimeType
                    });
                });
            }

            const response = await axios.post(
                `${baseURL}create/brand`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (response.data && response.data.brand) {
                setBrands(prevBrands => [...prevBrands, response.data.brand]);
                setBrandName('');
                setBrandDescription('');
                setImages([]);
                Alert.alert("Success", "Brand added successfully");
            } else {
                console.warn("Unexpected response format:", response.data);
                Alert.alert("Success", "Brand added, but there was an issue with the response");
            }
        } catch (error) {
            console.error("Error adding brand:", error);
            
            if (error.response) {
                Alert.alert("Error", error.response.data.message || "Failed to add brand");
            } else {
                Alert.alert("Error", "An unexpected error occurred while adding brand");
            }
        }
    };

    const deleteBrand = async (id) => {
        try {
            const axiosInstance = axios.create({
                baseURL: baseURL,
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            await axiosInstance.delete(`delete/brand/${id}`);
            
            setBrands(prevBrands => 
                prevBrands.filter((item) => item._id !== id)
            );
            
            Alert.alert("Success", "Brand deleted successfully");
        } catch (error) {
            console.error("Error deleting brand:", error);
            
            if (error.response) {
                Alert.alert("Error", error.response.data.message || "Failed to delete brand");
            } else {
                Alert.alert("Error", "An unexpected error occurred while deleting brand");
            }
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.listContainer}>
                <FlatList
                    data={brands}
                    renderItem={({ item }) => (
                        <Item item={item} delete={deleteBrand} />
                    )}
                    keyExtractor={(item) => item._id.toString()}
                />
            </View>
            <View style={styles.bottomBar}>
                <ScrollView contentContainerStyle={styles.formContainer}>
                    <View style={styles.formHeader}>
                        <Text style={styles.formTitle}>Add New Brand</Text>
                    </View>
                    
                    <TextInput
                        value={brandName}
                        style={styles.input}
                        placeholder="Brand Name"
                        onChangeText={(text) => setBrandName(text)}
                    />
                    
                    <TextInput
                        value={brandDescription}
                        style={[styles.input, styles.textArea]}
                        placeholder="Description (optional)"
                        onChangeText={(text) => setBrandDescription(text)}
                        multiline={true}
                        numberOfLines={3}
                    />
                    
                    <View style={styles.imageSection}>
                        <Text style={styles.sectionTitle}>Brand Images</Text>
                        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                            <Text style={styles.imagePickerButtonText}>Select Image</Text>
                        </TouchableOpacity>
                        
                        {images.length > 0 && (
                            <View style={styles.imagePreviewContainer}>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {images.map((image, index) => (
                                        <View key={index} style={styles.imagePreview}>
                                            <Image source={{ uri: image }} style={styles.previewImage} />
                                            <TouchableOpacity 
                                                style={styles.removeImageButton}
                                                onPress={() => removeImage(index)}
                                            >
                                                <Text style={styles.removeImageButtonText}>✕</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>
                    
                    <EasyButton
                        large
                        primary
                        style={styles.submitButton}
                        onPress={addBrand}
                    >
                        <Text style={styles.submitButtonText}>Add Brand</Text>
                    </EasyButton>
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
    },
    listContainer: {
        flex: 1,
        marginBottom: 250, // Increased to accommodate expanded form
    },
    bottomBar: {
        backgroundColor: "white",
        width: width,
        height: 250, // Increased height for the form
        padding: 10,
        position: "absolute",
        bottom: 0,
        left: 0,
        borderTopWidth: 1,
        borderTopColor: "#e0e0e0",
        elevation: 5,
    },
    formContainer: {
        padding: 5,
    },
    formHeader: {
        marginBottom: 10,
        alignItems: "center",
    },
    formTitle: {
        fontSize: 16,
        fontWeight: "bold",
    },
    input: {
        height: 40,
        borderColor: "#ddd",
        borderWidth: 1,
        paddingHorizontal: 10,
        borderRadius: 5,
        marginBottom: 10,
        backgroundColor: "#f9f9f9",
    },
    textArea: {
        height: 60,
    },
    imageSection: {
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 5,
    },
    imagePickerButton: {
        backgroundColor: "#4682B4",
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginBottom: 10,
    },
    imagePickerButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    imagePreviewContainer: {
        flexDirection: "row",
        marginBottom: 10,
    },
    imagePreview: {
        width: 70,
        height: 70,
        marginRight: 10,
        position: "relative",
    },
    previewImage: {
        width: "100%",
        height: "100%",
        borderRadius: 5,
    },
    removeImageButton: {
        position: "absolute",
        top: -5,
        right: -5,
        backgroundColor: "red",
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    removeImageButtonText: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
    },
    submitButton: {
        alignSelf: "stretch",
    },
    submitButtonText: {
        color: "white",
        fontWeight: "bold",
    },
    item: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 1,
        padding: 10,
        margin: 5,
        backgroundColor: "white",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 5,
    },
    itemContent: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    thumbnail: {
        width: 40,
        height: 40,
        borderRadius: 4,
        marginRight: 10,
    },
    noImagePlaceholder: {
        width: 40,
        height: 40,
        backgroundColor: "#e0e0e0",
        borderRadius: 4,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    noImageText: {
        fontSize: 10,
        color: "#888",
    },
    brandName: {
        fontSize: 16,
        fontWeight: "500",
    },
});

export default Brand;