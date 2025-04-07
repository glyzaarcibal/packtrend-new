import React, { useState, useContext } from "react";
import { StyleSheet, View, Dimensions, ImageBackground, Text, Pressable, ActivityIndicator, TouchableOpacity } from "react-native";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { addToCart } from '../../Redux/Actions/cartActions';
import { useSelector, useDispatch } from 'react-redux';
import Toast from 'react-native-toast-message';
import AuthGlobal from '../../context/Store/AuthGlobal';

var { width } = Dimensions.get("window");

const ProductCard = (props) => {
    const { _id, name, price, images, color, type } = props;
    const { isDarkMode } = useTheme();
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const context = useContext(AuthGlobal);
    
    const imageUrl = images && images.length > 0 
        ? images[0] 
        : "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";
    
    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
    };
    
    const handleAddToCart = async () => {
        setLoading(true);
        
        try {
            const productToAdd = {
                _id: _id,
                name: name,
                price: price,
                images: images && Array.isArray(images) ? [...images] : [],
                color: color,
                type: type,
            };
            
            await dispatch(addToCart(productToAdd));
            
            Toast.show({
                topOffset: 60,
                type: "success",
                text1: `${name} added to Cart`,
                text2: "Go to your cart to complete order"
            });
        } catch (error) {
            console.error("Error adding to cart:", error);
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Failed to add to cart",
                text2: error.message || "An unexpected error occurred"
            });
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <View style={[styles.container, { 
            backgroundColor: isDarkMode ? "#1c1c1e" : "white",
            transform: [{ perspective: 1000 }]
        }]}>
            {/* Header with Bagzz logo */}
            <View style={[styles.header, styles.headerShadow]}>
                <Text style={styles.logo}>Bagzz</Text>
            </View>
            
            {/* Product name as prominent text */}
            <View style={[styles.productNameContainer, styles.textShadow]}>
                <Text style={[styles.productName, { color: isDarkMode ? "white" : "#2c3e50" }]}>
                    {name && name.length > 15 ? name.substring(0, 12) + "..." : name}
                </Text>
            </View>
            
            {/* Image as Background */}
            <View style={styles.imageContainer}>
                <ImageBackground
                    style={styles.image}
                    source={{ uri: imageUrl }}
                    imageStyle={{ borderRadius: 0 }}
                >
                    {/* Favorite Button */}
                    <Pressable onPress={toggleFavorite} style={styles.favoriteButton}>
                        <MaterialIcons
                            name={isFavorite ? "favorite" : "favorite-border"}
                            size={24}
                            color={isFavorite ? "red" : isDarkMode ? "white" : "#7A87FF"}
                        />
                    </Pressable>
                </ImageBackground>
            </View>

            {/* Product Info */}
            <View style={styles.textContainer}>
                {/* Display product type and color */}
                <View style={styles.detailsRow}>
                    {type && (
                        <Text style={[styles.details, { color: isDarkMode ? "#ccc" : "#666" }]}>
                            {type}
                        </Text>
                    )}
                    {color && (
                        <View style={styles.colorContainer}>
                            <View 
                                style={[
                                    styles.colorDot, 
                                    { backgroundColor: color.toLowerCase() }
                                ]} 
                            />
                        </View>
                    )}
                </View>
                
                <Text style={[styles.price, { color: "#7A87FF" }]}>₱{price}</Text>
                
                {loading ? (
                    <ActivityIndicator size="small" color="#7A87FF" />
                ) : (
                    <TouchableOpacity 
                        style={styles.addToCartButton}
                        onPress={handleAddToCart}
                    >
                        <FontAwesome name="shopping-bag" size={16} color="white" />
                        <Text style={styles.addToCartText}>Add to Cart</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width / 2 - 30,
        borderRadius: 12,
        margin: 10,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { 
            width: 0, 
            height: 5 
        },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: 'white',
        transform: [{ perspective: 1000 }],
    },
    header: {
        backgroundColor: '#7A87FF',
        padding: 12,
        alignItems: 'center',
        zIndex: 1,
    },
    headerShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    logo: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        letterSpacing: 1,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    productNameContainer: {
        padding: 15,
        backgroundColor: '#f0f2ff',
        borderBottomWidth: 1,
        borderBottomColor: '#d6daf0',
    },
    textShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    productName: {
        fontWeight: "bold",
        fontSize: 16,
        textAlign: 'center',
    },
    imageContainer: {
        overflow: 'hidden',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    image: {
        width: "100%",
        height: width / 2 - 80,
        justifyContent: "flex-end",
        alignItems: "flex-end",
    },
    favoriteButton: {
        position: "absolute",
        right: 10,
        top: 10,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 12,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    textContainer: {
        padding: 15,
        alignItems: "center",
        backgroundColor: '#f8f9ff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 10,
    },
    details: {
        fontSize: 12,
    },
    colorContainer: {
        marginLeft: 5,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
        elevation: 1,
    },
    price: {
        fontSize: 18,
        fontWeight: "bold",
        marginVertical: 10,
        textShadowColor: 'rgba(0,0,0,0.1)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    addToCartButton: {
        flexDirection: 'row',
        backgroundColor: '#7A87FF',
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#6a76e5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 3,
        elevation: 5,
    },
    addToCartText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
    },
});

export default ProductCard;
