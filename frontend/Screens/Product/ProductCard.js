import React, { useState, useContext } from "react";
import { StyleSheet, Button, View, Dimensions, ImageBackground, Text, Pressable, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
    
    // Get primary image or placeholder
    const imageUrl = images && images.length > 0 
        ? images[0] 
        : "https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png";
    
    const toggleFavorite = () => {
        setIsFavorite(!isFavorite);
    };
    
    // Updated handleAddToCart function for ProductCard.js
    const handleAddToCart = async () => {
        setLoading(true);
        
        try {
            // Create a clean product object with only the necessary properties
            const productToAdd = {
                _id: _id,
                name: name,
                price: price,
                images: images && Array.isArray(images) ? [...images] : [], // Ensure images is an array
                color: color,
                type: type,
                // We no longer need to add a unique cartItemId here since we're going to
                // merge identical products and track them by _id, color, and type
            };
            
            // Add to cart in Redux store
            await dispatch(addToCart(productToAdd));
            
            // Show success message
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
        <View style={[styles.container, { backgroundColor: isDarkMode ? "#1c1c1e" : "white" }]}>
            {/* Image as Background */}
            <ImageBackground
                style={styles.image}
                source={{ uri: imageUrl }}
                imageStyle={{ borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
            >
                {/* Favorite Button */}
                <Pressable onPress={toggleFavorite} style={styles.favoriteButton}>
                    <MaterialIcons
                        name={isFavorite ? "favorite" : "favorite-border"}
                        size={24}
                        color={isFavorite ? "red" : isDarkMode ? "white" : "black"}
                    />
                </Pressable>
            </ImageBackground>

            {/* Product Info */}
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: isDarkMode ? "white" : "#333" }]}>
                    {name && name.length > 15 ? name.substring(0, 12) + "..." : name}
                </Text>
                
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
                
                <Text style={styles.price}>${price}</Text>
                
                {loading ? (
                    <ActivityIndicator size="small" color="green" />
                ) : (
                    <Button 
                        title={'Add'} 
                        color={'green'}  
                        onPress={handleAddToCart}
                    /> 
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: width / 2 - 50,
        borderRadius: 10,
        margin: 10,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 6,
        marginLeft: 30,
    },
    image: {
        width: "100%",
        height: width / 2 - 50,
        justifyContent: "flex-end",
        alignItems: "flex-end",
        padding: 10,
    },
    favoriteButton: {
        position: "absolute",
        right: 10,
        top: 10,
    },
    textContainer: {
        padding: 10,
        alignItems: "flex-start",
    },
    title: {
        fontWeight: "bold",
        fontSize: 14,
    },
    detailsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 3,
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
    },
    price: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#ff7e5f",
        marginTop: 5,
        marginBottom: 5,
    },
});

export default ProductCard;