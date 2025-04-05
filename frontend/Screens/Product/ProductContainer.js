import React, { useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Dimensions, ActivityIndicator } from "react-native";
import { Surface, Text, Searchbar } from "react-native-paper";
import Banner from "../Shared/Banner";
import BrandFilter from "./BrandFilter";
import ProductList, { ProductListControls } from "./ProductList";
import SearchedProduct from "./SearchedProduct";
import { useTheme } from "../../context/ThemeContext";
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../Redux/Actions/productActions';
import { fetchBrands } from '../../Redux/Actions/brandActions';
import { addMultipleToCart } from '../../Redux/Actions/cartActions';
import Toast from 'react-native-toast-message';

var { height } = Dimensions.get("window");

const ProductContainer = ({ navigation }) => {
    const { isDarkMode } = useTheme();
    const dispatch = useDispatch();
    
    // Get products and brands from Redux store
    const { products, loading: productsLoading, error: productsError } = useSelector(state => state.products);
    const { brands, loading: brandsLoading, error: brandsError } = useSelector(state => state.brands);
    
    // New state for product selection mode
    const [selectMode, setSelectMode] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    
    const [productsFiltered, setProductsFiltered] = useState([]);
    const [focus, setFocus] = useState(false);
    const [active, setActive] = useState(-1);
    const [productsCtg, setProductsCtg] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [showSearchResults, setShowSearchResults] = useState(false);

    useEffect(() => {
        // Fetch products and brands from API
        dispatch(fetchProducts());
        dispatch(fetchBrands());

        // Reset state variables
        setFocus(false);
        setActive(-1);
        setShowSearchResults(false);
    }, [dispatch]);

    useEffect(() => {
        if (products) {
            setProductsCtg(products);
            setProductsFiltered(products);
        }
    }, [products]);

    // Handle search
    const handleSearch = (text) => {
        setKeyword(text);
        
        if (text === "") {
            setFocus(false);
            setShowSearchResults(false);
            setProductsFiltered(products);
        } else {
            setFocus(true);
            setShowSearchResults(true);
        }
    };

    // Filter by brand
    const handleBrandFilter = (brandId) => {
        if (brandId === 'all') {
            setProductsCtg(products);
        } else {
            const filtered = products.filter(
                product => product.brand && (
                    // Handle both autopopulated brands (objects) and non-autopopulated (IDs)
                    (typeof product.brand === 'object' && product.brand._id === brandId) || 
                    (typeof product.brand === 'string' && product.brand === brandId)
                )
            );
            setProductsCtg(filtered);
        }
    };
    
    // Handle product selection for cart
    const toggleProductSelection = (product) => {
        setSelectedProducts(prev => {
            // Check if product is already selected
            const isSelected = prev.some(p => p._id === product._id);
            
            if (isSelected) {
                // Remove from selection
                return prev.filter(p => p._id !== product._id);
            } else {
                // Add to selection
                return [...prev, product];
            }
        });
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
        
       
    } catch (error) {
        console.error("Error adding products to cart:", error);
        Toast.show({
            type: "error",
            text1: "Failed to add products",
            text2: error.message || "An unexpected error occurred"
        });
    }
};

    const handleSelectModeChange = (mode) => {
        setSelectMode(mode);
        if (!mode) {
            // Clear selections when exiting select mode
            setSelectedProducts([]);
        }
    };

    // Show error if there's any
    const error = productsError || brandsError;
    if (error) {
        Toast.show({
            topOffset: 60,
            type: "error",
            text1: "Error loading data",
            text2: error
        });
    }

    // Show loading indicator if products or brands are loading
    const loading = productsLoading || brandsLoading;

    return (
        <Surface
            style={[
                styles.container,
                { backgroundColor: isDarkMode ? "#121212" : "white" },
            ]}
        >
            <View style={styles.searchContainer}>
                <Searchbar
                    placeholder="Search products..."
                    onChangeText={handleSearch}
                    value={keyword}
                    onClearIconPress={() => {
                        setFocus(false);
                        setKeyword("");
                        setShowSearchResults(false);
                        setProductsFiltered(products);
                    }}
                    style={styles.searchBar}
                />
            </View>

            {error && (
                <View style={styles.center}>
                    <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>
                        Error loading data. Please try again.
                    </Text>
                </View>
            )}

            {loading ? (
                <View style={[styles.center, { height: height / 2 }]}>
                    <ActivityIndicator size="large" color={isDarkMode ? "#fff" : "#000"} />
                </View>
            ) : (
                <>
                    {showSearchResults ? (
                        <SearchedProduct 
                            searchQuery={keyword} 
                            products={products}
                            brands={brands}
                        />
                    ) : (
                        <ScrollView>
                            <Banner />
                            
                            {brands && brands.length > 0 && (
                                <View>
                                    <Text style={[styles.title, { color: isDarkMode ? "#fff" : "#000" }]}>
                                        Shop by Brand
                                    </Text>
                                    <BrandFilter 
                                        Brand={brands} 
                                        active={active} 
                                        setActive={setActive} 
                                        BrandFilter={handleBrandFilter} 
                                    />
                                </View>
                            )}
                            
                            <Text style={[styles.headerText, { color: isDarkMode ? "#fff" : "#000" }]}>
                                Products
                            </Text>
                            
                            {/* Add ProductListControls component */}
                            {productsCtg.length > 0 && (
                                <ProductListControls 
                                    products={productsCtg} 
                                    onSelectModeChange={handleSelectModeChange}
                                    selectedProducts={selectedProducts}
                                    setSelectedProducts={setSelectedProducts}
                                    onAddSelectedToCart={addSelectedToCart}
                                />
                            )}

                            {productsCtg.length > 0 ? (
                                <View style={styles.listContainer}>
                                    {productsCtg.map((item) => (
                                        <ProductList 
                                            key={item._id} 
                                            item={item} 
                                            selectMode={selectMode}
                                            isSelected={selectedProducts.some(p => p._id === item._id)}
                                            onToggleSelection={() => toggleProductSelection(item)}
                                        />
                                    ))}
                                </View>
                            ) : (
                                <View style={[styles.center, { height: height / 2 }]}>
                                    <Text style={{ color: isDarkMode ? "#fff" : "#000" }}>
                                        No products found
                                    </Text>
                                </View>
                            )}
                        </ScrollView>
                    )}
                </>
            )}
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    title: {
        fontSize: 20,
        fontWeight: "bold",
        textAlign: "center",
        marginVertical: 10,
    },
    headerText: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "left",
        marginVertical: 10,
        marginLeft: 10,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        width: "98%",
        marginVertical: 10,
        marginHorizontal: "1%",
    },
    searchBar: {
        flex: 1,
        borderRadius: 8,
        height: 40,
    },
    listContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: "gainsboro",
    },
    center: {
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
});

export default ProductContainer;