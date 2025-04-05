import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator
} from "react-native";
import { useDispatch, useSelector } from 'react-redux';
import { Picker } from "@react-native-picker/picker";
import FormContainer from "../Shared/FormContainer";
import Input from "../Shared/Input";
import EasyButton from "../Shared/StyledComponents/EasyButton";
import Icon from "react-native-vector-icons/FontAwesome";
import Toast from "react-native-toast-message";
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from "../../assets/common/baseurl";
import Error from "../Shared/Error";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import mime from "mime";

// Redux Actions
import { createProduct, updateProduct } from '../../Redux/Actions/productActions';
import { fetchBrands } from '../../Redux/Actions/brandActions';

const ProductForm = (props) => {
    const dispatch = useDispatch();
    const navigation = useNavigation();

    // Get brands from Redux store
    const { items: brands } = useSelector(state => state.brands);

    const [pickerValue, setPickerValue] = useState('');
    const [brand, setBrand] = useState('');
    const [name, setName] = useState('');
    const [price, setPrice] = useState('0');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const [mainImage, setMainImage] = useState('https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [stock, setStock] = useState('0');
    const [color, setColor] = useState('');
    const [type, setType] = useState('');
    
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(false);

    // Bag types based on the product model's enum
    const bagTypes = ["Tote", "Shoulder", "Crossbody", "Backpack", "Clutch", "Handbag", "Wallet"];

    useEffect(() => {
        // Fetch brands when component mounts
        dispatch(fetchBrands());

        // Check if editing an existing product
        if (props.route?.params?.item) {
            console.log("Editing product:", props.route.params.item);
            const productItem = props.route.params.item;
            setItem(productItem);
            setBrand(productItem.brand?._id || '');
            setName(productItem.name || '');
            setPrice(productItem.price ? productItem.price.toString() : '0');
            setDescription(productItem.description || '');
            setColor(productItem.color || '');
            setType(productItem.type || '');
            setStock(productItem.stock ? productItem.stock.toString() : '0');
            
            if (productItem.images && productItem.images.length > 0) {
                setMainImage(productItem.images[0]);
                setImage(productItem.images[0]);
            }
            
            setPickerValue(productItem.brand?._id || '');
        }

        // Get token for authentication
        AsyncStorage.getItem("jwt")
            .then((res) => {
                setToken(res);
            })
            .catch((error) => console.log(error));

        // Request camera permissions
        (async () => {
            if (Platform.OS !== "web") {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
                
                if (status !== "granted" || cameraStatus.status !== "granted") {
                    Alert.alert("Permission Required", "Sorry, we need camera and library permissions to make this work!");
                }
            }
        })();
    }, [dispatch, props.route?.params]);

    // Pick image from gallery
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setMainImage(result.assets[0].uri);
            setImage(result.assets[0].uri);
        }
    };

    // Take photo with camera
    const takePhoto = async () => {
        let result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled) {
            setMainImage(result.assets[0].uri);
            setImage(result.assets[0].uri);
        }
    };

    // Show image selection options
    const showImageOptions = () => {
        Alert.alert(
            "Select Image",
            "Choose an option",
            [
                { text: "Take Photo", onPress: takePhoto },
                { text: "Choose from Gallery", onPress: pickImage },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    // Add or update product
    const handleSubmit = async () => {
        // Validation
        if (
            name === "" ||
            brand === "" ||
            price === "" ||
            description === "" ||
            color === "" ||
            type === "" ||
            stock === ""
        ) {
            setError("Please fill in the form correctly");
            return;
        }

        setLoading(true);
        setError("");

        // Prepare form data
        let formData = new FormData();
        
        // Prepare image if it's a URI (not a URL)
        if (image && !image.startsWith('http')) {
            const newImageUri = Platform.OS === 'ios' 
                ? image.replace('file://', '')
                : image;
            
            formData.append("images", {
                uri: newImageUri,
                type: mime.getType(newImageUri),
                name: newImageUri.split("/").pop()
            });
        }

        // Add other form fields
        formData.append("name", name);
        formData.append("price", price);
        formData.append("description", description);
        formData.append("brand", brand);
        formData.append("color", color);
        formData.append("type", type);
        formData.append("stock", stock);
        
        try {
            let response;
            
            // Dispatch create or update action
            if (item) {
                // Make sure we pass productId as a string
                const productId = String(item._id);
                console.log("Updating product with ID:", productId);
                
                // Update existing product
                response = await dispatch(updateProduct({ 
                    productId, 
                    productData: formData 
                }));
            } else {
                // Create new product
                response = await dispatch(createProduct(formData));
            }
            
            // Always set loading to false
            setLoading(false);
            
            console.log("API Response:", response);
            
            if (response.success) {
                Toast.show({
                    type: "success",
                    text1: item ? "Product successfully updated" : "New Product added",
                    topOffset: 60
                });
                navigation.navigate("AdminDashboard");
            } else {
                Toast.show({
                    type: "error",
                    text1: item ? "Update failed" : "Creation failed",
                    text2: response.message || "Something went wrong",
                    topOffset: 60
                });
            }
        } catch (error) {
            setLoading(false);
            console.error("Submit error:", error);
            Toast.show({
                type: "error",
                text1: "An error occurred",
                text2: error?.message || "Please try again",
                topOffset: 60
            });
        }
    };

    return (
        <ScrollView>
            <FormContainer title={item ? "Edit Product" : "Add Product"}>
                <View style={styles.imageContainer}>
                    <Image 
                        style={styles.image} 
                        source={{ uri: mainImage }}
                        resizeMode="contain"
                    />
                    <TouchableOpacity
                        onPress={showImageOptions}
                        style={styles.imagePicker}>
                        <Icon style={{ color: "white" }} name="camera" size={18} />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.label}>
                    <Text style={styles.labelText}>Name</Text>
                </View>
                <Input
                    placeholder="Name"
                    name="name"
                    id="name"
                    value={name}
                    onChangeText={(text) => setName(text)}
                />
                
                <View style={styles.label}>
                    <Text style={styles.labelText}>Price</Text>
                </View>
                <Input
                    placeholder="Price"
                    name="price"
                    id="price"
                    value={price}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setPrice(text)}
                />
                
                <View style={styles.label}>
                    <Text style={styles.labelText}>Stock</Text>
                </View>
                <Input
                    placeholder="Stock"
                    name="stock"
                    id="stock"
                    value={stock}
                    keyboardType={"numeric"}
                    onChangeText={(text) => setStock(text)}
                />
                
                <View style={styles.label}>
                    <Text style={styles.labelText}>Color</Text>
                </View>
                <Input
                    placeholder="Color"
                    name="color"
                    id="color"
                    value={color}
                    onChangeText={(text) => setColor(text)}
                />
                
                <View style={styles.label}>
                    <Text style={styles.labelText}>Description</Text>
                </View>
                <Input
                    placeholder="Description"
                    name="description"
                    id="description"
                    value={description}
                    onChangeText={(text) => setDescription(text)}
                    multiline={true}
                    numberOfLines={4}
                />
            
                <View style={styles.label}>
                    <Text style={styles.labelText}>Brand</Text>
                </View>
                <View style={styles.pickerContainer}>
                    <Picker
                        style={styles.picker}
                        selectedValue={pickerValue}
                        onValueChange={(e) => [setPickerValue(e), setBrand(e)]}
                    >
                        <Picker.Item label="Select a Brand..." value="" />
                        {brands && brands.map((c) => (
                            <Picker.Item
                                key={c._id}
                                label={c.name}
                                value={c._id}
                            />
                        ))}
                    </Picker>
                </View>
                
                <View style={styles.label}>
                    <Text style={styles.labelText}>Bag Type</Text>
                </View>
                <View style={styles.pickerContainer}>
                    <Picker
                        style={styles.picker}
                        selectedValue={type}
                        onValueChange={(e) => setType(e)}
                    >
                        <Picker.Item label="Select a Type..." value="" />
                        {bagTypes.map((bagType) => (
                            <Picker.Item
                                key={bagType}
                                label={bagType}
                                value={bagType}
                            />
                        ))}
                    </Picker>
                </View>
                
                {error ? <Error message={error} /> : null}
                
                <View style={styles.buttonContainer}>
                    <EasyButton
                        large
                        primary
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <Text style={styles.buttonText}>
                                {item ? "Update" : "Add Product"}
                            </Text>
                        )}
                    </EasyButton>
                </View>
            </FormContainer>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    label: {
        width: "80%",
        marginTop: 10
    },
    labelText: {
        textDecorationLine: "underline",
        fontSize: 16
    },
    buttonContainer: {
        width: "80%",
        marginBottom: 80,
        marginTop: 20,
        alignItems: "center"
    },
    buttonText: {
        color: "white"
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
        elevation: 10
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
    pickerContainer: {
        width: "80%",
        height: 50,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 5,
        justifyContent: "center"
    },
    picker: {
        width: "100%",
        height: 50
    }
});

export default ProductForm;