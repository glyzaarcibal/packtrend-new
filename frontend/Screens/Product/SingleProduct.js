import React, { useState, useEffect, useContext } from "react";
import { 
    Image, 
    View, 
    StyleSheet, 
    Text, 
    ScrollView, 
    Pressable,
    ActivityIndicator
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useSelector, useDispatch } from 'react-redux';
import { selectProduct, clearSelectedProduct } from "../../Redux/Actions/productActions";
import { addToCart } from "../../Redux/Actions/cartActions";
import Toast from 'react-native-toast-message';
import axios from 'axios';
import baseURL from '../../assets/common/baseurl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthGlobal from '../../context/Store/AuthGlobal';

const SingleProduct = (props) => {
    const { isDarkMode } = useTheme();
    const dispatch = useDispatch();
    const navigation = useNavigation();
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(false);
    const [addingToCart, setAddingToCart] = useState(false);
    const context = useContext(AuthGlobal);
    
    // Get the productId from route params and ensure it's a string
    const productId = props.route.params.productId ? String(props.route.params.productId) : null;
    
    // Get the selected product from Redux store
    const { selectedProduct, products, loading: productsLoading } = useSelector(state => state.products);
    const cartItems = useSelector(state => state.cartItems);
    
    // Set up local product state
    const [product, setProduct] = useState(null);
    
    // This effect runs only when the component mounts or productId changes
    useEffect(() => {
        // Check if we have a valid productId
        if (!productId) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Invalid product ID",
            });
            navigation.goBack();
            return;
        }
        
        // Look for the product in the already loaded products array
        const foundProduct = products.find(p => p._id === productId);
        
        if (foundProduct) {
            // If found in our loaded products, select it
            dispatch(selectProduct(foundProduct));
            setProduct(foundProduct); // Set local state directly
        } else {
            // Otherwise fetch it from the API
            fetchProductById(productId);
        }
        
        // Clean up on unmount
        return () => {
            dispatch(clearSelectedProduct());
        };
    }, [productId]); // Only depend on productId, not selectedProduct
    
    // Update local state when the selected product changes
    // Using a separate effect to avoid the circular dependency
    useEffect(() => {
        if (selectedProduct && selectedProduct._id === productId) {
            setProduct(selectedProduct);
        }
    }, [selectedProduct, productId]);
    
    // Fetch a single product by ID
    const fetchProductById = async (id) => {
        if (!id) return;
        
        setLoading(true);
        try {
            console.log("Fetching product with ID:", id);
            
            // Ensure the ID is a valid format and a string
            if (!/^[0-9a-fA-F]{24}$/.test(id)) {
                throw new Error("Invalid product ID format");
            }
            
            const { data } = await axios.get(`${baseURL}get/single/product/${id}`);
            console.log("API response:", data);
            
            if (data && data.success && data.product) {
                dispatch(selectProduct(data.product));
                setProduct(data.product); // Set local state directly to avoid dependency cycle
            } else {
                Toast.show({
                    topOffset: 60,
                    type: "error",
                    text1: "Product not found",
                });
            }
        } catch (error) {
            console.error('Error response:', error.response?.data);
            console.error('Error fetching product:', error);
            
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Failed to load product",
                text2: error.message || "An unknown error occurred"
            });
            
            // Navigate back if product cannot be loaded
            navigation.goBack();
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
    };
    
    const saveCartToStorage = async () => {
        try {
            if (context.stateUser.isAuthenticated) {
                const userId = context.stateUser.user.userId || context.stateUser.user.sub;
                await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify(cartItems));
                console.log("Cart saved for authenticated user:", userId);
            } else {
                // For guest users, save to a general cart
                await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
                console.log("Cart saved for guest user");
            }
        } catch (error) {
            console.error("Error saving cart to AsyncStorage:", error);
        }
    };
    
    const handleAddToCart = async () => {
        if (!product) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Product not found",
                text2: "Unable to add to cart"
            });
            return;
        }
        
        // Check if product is in stock
        if (product.stock <= 0 || product.countInStock <= 0) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Out of Stock",
                text2: "This product is currently unavailable"
            });
            return;
        }
        
        setAddingToCart(true);
        
        try {
            // Validate product has required properties
            if (!product._id || !product.name || typeof product.price !== 'number') {
                throw new Error("Invalid product data");
            }
            
            // Add to cart with quantity
            await dispatch(addToCart({ 
                ...product, 
                quantity: 1 
            }));
            
            // Save cart to AsyncStorage
            await saveCartToStorage();
            
            Toast.show({
                topOffset: 60,
                type: "success",
                text1: `${product.name} added to Cart`,
                text2: "Go to your cart to complete order"
            });
            
            // Navigate to Cart screen after adding product
            navigation.navigate("Cart");
        } catch (error) {
            console.error("Add to cart error:", error);
            
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Failed to add to cart",
                text2: error.message || "An unexpected error occurred"
            });
        } finally {
            setAddingToCart(false);
        }
    };

    const handleBuyNow = async () => {
        if (!product) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Product not found",
                text2: "Unable to process purchase"
            });
            return;
        }
        
        // Check if product is in stock
        if (product.stock <= 0 || product.countInStock <= 0) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Out of Stock",
                text2: "This product is currently unavailable"
            });
            return;
        }
        
        setAddingToCart(true);
        
        try {
            // Validate product data
            if (!product._id || !product.name || typeof product.price !== 'number') {
                throw new Error("Invalid product data");
            }
            
            // Add to cart with quantity
            await dispatch(addToCart({ 
                ...product, 
                quantity: 1 
            }));
            
            // Save cart to AsyncStorage
            await saveCartToStorage();
            
            // Check if user is authenticated
            if (context.stateUser.isAuthenticated) {
                // Navigate to checkout
                navigation.navigate("Checkout");
            } else {
                // User is not authenticated, redirect to login
                navigation.navigate("User", {
                    screen: 'Login',
                    params: {
                        returnTo: 'Checkout'
                    }
                });
                
                // Show toast notification to inform user
                Toast.show({
                    topOffset: 60,
                    type: "info",
                    text1: "Please login to continue",
                    text2: "You need to be logged in to checkout"
                });
            }
        } catch (error) {
            console.error("Buy now error:", error);
            
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Failed to process purchase",
                text2: error.message || "An unexpected error occurred"
            });
        } finally {
            setAddingToCart(false);
        }
    };

    // If loading or no product yet
    if (loading || productsLoading || !product) {
        return (
            <View style={[styles.loadingContainer, isDarkMode && styles.darkContainer]}>
                <ActivityIndicator size="large" color={isDarkMode ? "white" : "black"} />
                <Text style={[styles.loadingText, isDarkMode && styles.darkText]}>Loading product...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, isDarkMode && styles.darkContainer]}>
            {/* Back Button & Favorite */}
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()}>
                    <MaterialIcons name="arrow-back" size={24} color={isDarkMode ? "white" : "black"} />
                </Pressable>
                <Pressable onPress={toggleFavorite}>
                    <MaterialIcons 
                        name={isFavorite ? "favorite" : "favorite-border"} 
                        size={24} 
                        color={isFavorite ? "red" : isDarkMode ? "white" : "black"} 
                    />
                </Pressable>
            </View>

            {/* Product Image */}
            <Image 
                source={{ 
                    uri: product.images && product.images.length > 0 
                        ? product.images[0] 
                        : 'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png' 
                }}
                resizeMode="contain"
                style={styles.image}
            />
            
            {/* Product Info */}
            <View style={styles.contentContainer}>
                <Text style={[styles.productName, isDarkMode && styles.darkText]}>
                    {product.name}
                </Text>
                
                {/* Type and Color */}
                <View style={styles.typeColorContainer}>
                    {product.type && (
                        <View style={styles.typeContainer}>
                            <Text style={[styles.typeLabel, isDarkMode && styles.darkSubText]}>Type:</Text>
                            <Text style={[styles.typeValue, isDarkMode && styles.darkText]}>{product.type}</Text>
                        </View>
                    )}
                    
                    {product.color && (
                        <View style={styles.colorContainer}>
                            <Text style={[styles.colorLabel, isDarkMode && styles.darkSubText]}>Color:</Text>
                            <View style={styles.colorValueContainer}>
                                <Text style={[styles.colorValue, isDarkMode && styles.darkText]}>{product.color}</Text>
                                <View 
                                    style={[
                                        styles.colorSwatch, 
                                        { backgroundColor: product.color.toLowerCase() }
                                    ]} 
                                />
                            </View>
                        </View>
                    )}
                </View>
                
                {/* Brand */}
                {product.brand && (
                    <View style={styles.brandContainer}>
                        <Text style={[styles.brandLabel, isDarkMode && styles.darkSubText]}>Brand:</Text>
                        <Text style={[styles.brandValue, isDarkMode && styles.darkText]}>
                            {typeof product.brand === 'object' ? product.brand.name : product.brand}
                        </Text>
                    </View>
                )}
                
                <Text style={[styles.productStyle, isDarkMode && styles.darkSubText]}>
                    ID: {product._id}
                </Text>

                <Text style={styles.price}>${product.price}</Text>

                {/* Buttons */}
                <Pressable 
                    style={[
                        styles.buyButton, 
                        isDarkMode && styles.darkBuyButton,
                        (product.stock <= 0) && styles.disabledButton
                    ]}
                    onPress={handleBuyNow}
                    disabled={addingToCart || product.stock <= 0}
                >
                    {addingToCart ? (
                        <ActivityIndicator size="small" color={isDarkMode ? "#121212" : "white"} />
                    ) : (
                        <Text style={[styles.buyText, isDarkMode && styles.darkBuyText]}>
                            {product.stock > 0 ? "BUY NOW" : "OUT OF STOCK"}
                        </Text>
                    )}
                </Pressable>
                
                <Pressable 
                    style={[
                        styles.cartButton, 
                        isDarkMode && styles.darkCartButton,
                        (product.stock <= 0) && styles.disabledButton
                    ]}
                    onPress={handleAddToCart}
                    disabled={addingToCart || product.stock <= 0}
                >
                    {addingToCart ? (
                        <ActivityIndicator size="small" color={isDarkMode ? "white" : "#121212"} />
                    ) : (
                        <Text style={[styles.cartText, isDarkMode && styles.darkCartText]}>
                            {product.stock > 0 ? "ADD TO CART" : "OUT OF STOCK"}
                        </Text>
                    )}
                </Pressable>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 20,
        paddingTop: 40,
    },
    darkContainer: {
        backgroundColor: "#121212",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#fff",
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#121212",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    image: {
        width: "100%",
        height: 250,
        marginBottom: 20,
    },
    contentContainer: {
        alignItems: "center",
        width: '100%',
    },
    productName: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#121212",
        textAlign: "center",
    },
    darkText: {
        color: "white",
    },
    typeColorContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
        marginTop: 10,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 20,
    },
    typeLabel: {
        fontSize: 14,
        color: "#666666",
        marginRight: 5,
    },
    typeValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: "#333333",
    },
    colorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colorLabel: {
        fontSize: 14,
        color: "#666666",
        marginRight: 5,
    },
    colorValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    colorValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: "#333333",
        marginRight: 5,
    },
    colorSwatch: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
    },
    brandLabel: {
        fontSize: 14,
        color: "#666666",
        marginRight: 5,
    },
    brandValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: "#333333",
    },
    productSub: {
        fontSize: 16,
        color: "#666666",
        textAlign: "center",
    },
    darkSubText: {
        color: "#AAAAAA",
    },
    productStyle: {
        fontSize: 12,
        color: "#999999",
        marginTop: 5,
        marginBottom: 10,
        textAlign: "center",
    },
    price: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#ff7e5f",
        marginVertical: 10,
    },
    buyButton: {
        backgroundColor: "#000000",
        paddingVertical: 12,
        width: "100%",
        alignItems: "center",
        borderRadius: 5,
        marginVertical: 5,
    },
    darkBuyButton: {
        backgroundColor: "#ffffff",
    },
    buyText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "white",
    },
    darkBuyText: {
        color: "#121212",
    },
    cartButton: {
        backgroundColor: "#F5F5F5",
        paddingVertical: 12,
        width: "100%",
        alignItems: "center",
        borderRadius: 5,
        marginVertical: 5,
        borderWidth: 1,
        borderColor: "#000000",
    },
    darkCartButton: {
        backgroundColor: "#222222",
        borderColor: "white",
    },
    cartText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#121212",
    },
    darkCartText: {
        color: "white",
    },
    disabledButton: {
        opacity: 0.6,
    }
});

export default SingleProduct;