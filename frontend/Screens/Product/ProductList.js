import React , { useState } from "react";
import { TouchableOpacity, View, Dimensions, Text, StyleSheet } from "react-native";
import ProductCard from "./ProductCard";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useDispatch } from "react-redux";
import { addMultipleToCart } from "../../Redux/Actions/cartActions";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

var { width } = Dimensions.get("window");

const ProductList = ({ item, selectMode = false, isSelected = false, onToggleSelection }) => {
    const navigation = useNavigation();
    const { isDarkMode } = useTheme();
    const dispatch = useDispatch();
    
    // Regular product press handler (when not in select mode)
    const handleProductPress = () => {
        // If in select mode, toggle selection instead of navigating
        if (selectMode) {
            if (onToggleSelection) {
                onToggleSelection();
            }
            return;
        }
        
        // Check if item is valid
        if (!item || !item._id) {
            console.error("Invalid product data in ProductList:", item);
            return;
        }
        
        // Navigate to product detail screen with the product ID
        navigation.navigate("Product Detail", { productId: item._id });
    };

    // If item is undefined or missing required properties, don't render
    if (!item || !item._id || !item.name) {
        return null;
    }

    return (
        <TouchableOpacity
            style={{ 
                width: "50%",
                opacity: selectMode && !isSelected ? 0.7 : 1
            }}
            onPress={handleProductPress}
        >
            <View
                style={[
                    {
                        width: width / 2,
                        backgroundColor: isDarkMode ? "#121212" : "#FFFFFF",
                    },
                    isSelected && styles.selectedProduct
                ]}
            >
                <ProductCard {...item} />
                
                {/* Selection indicator (visible when in select mode and product is selected) */}
                {selectMode && isSelected && (
                    <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark-circle" size={24} color="#4A68E0" />
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

// The ProductListControls component to be used along with ProductList
export const ProductListControls = ({ 
    products = [], 
    onSelectModeChange,
    selectedProducts = [],
    setSelectedProducts,
    onAddSelectedToCart
}) => {
    const dispatch = useDispatch();
    const { isDarkMode } = useTheme();
    const [selectMode, setSelectMode] = useState(false);
    
    // Toggle select mode
    const toggleSelectMode = () => {
        const newSelectMode = !selectMode;
        setSelectMode(newSelectMode);
        
        // Notify parent component of mode change if callback provided
        if (onSelectModeChange) {
            onSelectModeChange(newSelectMode);
        }
        
        if (!newSelectMode) {
            // Clear selections when exiting select mode
            if (setSelectedProducts) {
                setSelectedProducts([]);
            }
        }
    };
    
    // Select all products
    const selectAllProducts = () => {
        if (setSelectedProducts) {
            if (selectedProducts.length === products.length) {
                // If all are selected, deselect all
                setSelectedProducts([]);
            } else {
                // Otherwise, select all
                setSelectedProducts([...products]);
            }
        }
    };
    
    // ... existing imports remain the same

// Find the addSelectedToCart function and replace it with this improved version
const addSelectedToCart = () => {
    if (selectedProducts.length === 0) {
        Toast.show({
            type: "error",
            text1: "No products selected",
            text2: "Please select at least one product"
        });
        return;
    }
    
    try {
        // Validate stock before adding to cart
        const outOfStockProducts = selectedProducts.filter(product => 
            product.stock <= 0 || product.countInStock <= 0
        );
        
        if (outOfStockProducts.length > 0) {
            Toast.show({
                type: "error",
                text1: "Out of stock items",
                text2: `${outOfStockProducts.length} items cannot be added due to insufficient stock`
            });
            
            // If some products have stock, continue with those only
            if (outOfStockProducts.length < selectedProducts.length) {
                const inStockProducts = selectedProducts.filter(product => 
                    product.stock > 0 || product.countInStock > 0
                );
                setSelectedProducts(inStockProducts);
            } else {
                return; // All selected products are out of stock
            }
        }
        
        // Add quantity property to each selected product
        const productsWithQuantity = selectedProducts.map(product => ({
            ...product,
            quantity: 1 // Default quantity
        }));
        
        // Dispatch the multiple products action
        dispatch(addMultipleToCart(productsWithQuantity));
        
        // Show success message
        Toast.show({
            type: "success",
            text1: "Products Added",
            text2: `${selectedProducts.length} products added to cart`
        });
        
        // Reset selection state
        setSelectMode(false);
        setSelectedProducts([]);
        
        // Optional: Navigate to cart
        // navigation.navigate("Cart");
    } catch (error) {
        console.error("Error adding products to cart:", error);
        Toast.show({
            type: "error",
            text1: "Failed to add products",
            text2: error.message || "An unexpected error occurred"
        });
    }
};


    return (
        <View style={styles.controlsContainer}>
            <TouchableOpacity
                style={[
                    styles.controlButton,
                    isDarkMode && styles.controlButtonDark
                ]}
                onPress={toggleSelectMode}
            >
                <Text style={[
                    styles.buttonText,
                    isDarkMode && styles.buttonTextDark
                ]}>
                    {selectMode ? "Cancel" : "Select Products"}
                </Text>
            </TouchableOpacity>
            
            {selectMode && (
                <>
                    <TouchableOpacity
                        style={[
                            styles.controlButton,
                            isDarkMode && styles.controlButtonDark
                        ]}
                        onPress={selectAllProducts}
                    >
                        <Text style={[
                            styles.buttonText,
                            isDarkMode && styles.buttonTextDark
                        ]}>
                            {selectedProducts.length === products.length 
                                ? "Deselect All" 
                                : "Select All"}
                        </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[
                            styles.addSelectedButton,
                            selectedProducts.length === 0 && styles.disabledButton
                        ]}
                        onPress={handleAddSelectedToCart}
                        disabled={selectedProducts.length === 0}
                    >
                        <Text style={styles.addSelectedText}>
                            Add Selected ({selectedProducts.length})
                        </Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // Product item styles
    selectedProduct: {
        borderWidth: 2,
        borderColor: "#4A68E0",
        borderRadius: 8,
    },
    selectedIndicator: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "white",
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
    },
    
    // Controls styles
    controlsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        backgroundColor: "transparent",
    },
    controlButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#F0F2F5",
        borderRadius: 8,
        marginRight: 8,
    },
    controlButtonDark: {
        backgroundColor: "#333",
    },
    buttonText: {
        color: "#333",
        fontWeight: "500",
    },
    buttonTextDark: {
        color: "#FFF",
    },
    addSelectedButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: "#4A68E0",
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
    },
    disabledButton: {
        backgroundColor: "#CCCCCC",
    },
    addSelectedText: {
        color: "#FFFFFF",
        fontWeight: "500",
    },
});

export default ProductList;