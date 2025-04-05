import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, ScrollView, StyleSheet, Dimensions, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { Surface, Text, Searchbar } from "react-native-paper";
import Banner from "../Shared/Banner";
import BrandFilter from "./BrandFilter";
import ProductList from "./ProductList";
import SearchedProduct from "./SearchedProduct";
import { useTheme } from "../../context/ThemeContext";
import { useDispatch, useSelector } from 'react-redux';
import { fetchProducts } from '../../Redux/Actions/productActions';
import { fetchBrands } from '../../Redux/Actions/brandActions';
import Toast from 'react-native-toast-message';

const { height } = Dimensions.get("window");

const ProductContainer = ({ navigation }) => {
    const { isDarkMode } = useTheme();
    const dispatch = useDispatch();
    
    // Get products and brands from Redux store with safe fallbacks
    const productState = useSelector(state => state.products || {});
    const brandState = useSelector(state => state.brands || {});
    
    const products = useMemo(() => productState.products || [], [productState.products]);
    const productsLoading = productState.loading || false;
    const productsError = productState.error || null;
    
    const brands = useMemo(() => brandState.brands || [], [brandState.brands]);
    const brandsLoading = brandState.loading || false;
    const brandsError = brandState.error || null;
    
    const [productsFiltered, setProductsFiltered] = useState([]);
    const [focus, setFocus] = useState(false);
    const [active, setActive] = useState(-1);
    const [productsCtg, setProductsCtg] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [isRetrying, setIsRetrying] = useState(false);
    const [lastFetchTime, setLastFetchTime] = useState(0);

    // Fetch data with retry logic and debounce protection
    const fetchData = useCallback(async () => {
        try {
            const now = Date.now();
            // Prevent rapid re-fetching (at least 2 seconds between fetches)
            if (now - lastFetchTime < 2000 && lastFetchTime !== 0) {
                console.log("Throttling fetch requests");
                return;
            }
            
            setLastFetchTime(now);
            setIsRetrying(true);
            
            // Reset state variables
            setFocus(false);
            setActive(-1);
            setShowSearchResults(false);
            
            // Show loading toast
            Toast.show({
                type: "info",
                text1: "Loading",
                text2: "Fetching latest products and brands...",
                visibilityTime: 2000,
            });
            
            // Fetch products and brands from API with proper error handling
            const [productsResult, brandsResult] = await Promise.all([
                dispatch(fetchProducts()),
                dispatch(fetchBrands())
            ]);
            
            // Check if both requests were successful
            if (productsResult.success && brandsResult.success) {
                Toast.show({
                    type: "success",
                    text1: "Data Loaded",
                    text2: "Products and brands refreshed",
                    visibilityTime: 2000,
                });
            } else {
                // If products are available, still show them even if there's an error
                if (products.length > 0) {
                    Toast.show({
                        type: "info",
                        text1: "Partial Data",
                        text2: "Some data may be outdated",
                        visibilityTime: 2000,
                    });
                } else {
                    throw new Error(
                        productsResult.message || 
                        brandsResult.message || 
                        "Failed to fetch data"
                    );
                }
            }
        } catch (error) {
            console.error("Error in fetchData:", error);
            Toast.show({
                type: "error",
                text1: "Network Error",
                text2: error.message || "Please check your connection and try again.",
                visibilityTime: 3000,
            });
        } finally {
            setIsRetrying(false);
        }
    }, [dispatch, lastFetchTime, products]);

    // Initial data fetch
    useEffect(() => {
        fetchData();
    }, []);

    // Update filtered products when products change
    useEffect(() => {
        if (products && products.length > 0) {
            setProductsCtg(products);
            setProductsFiltered(products);
        }
    }, [products]);

    // Show error toast if there's any error
    useEffect(() => {
        const error = productsError || brandsError;
        if (error) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Error loading data",
                text2: typeof error === 'string' ? error : "An unexpected error occurred",
                visibilityTime: 3000,
            });
        }
    }, [productsError, brandsError]);

    // Handle search - using useCallback to memoize the function
    const handleSearch = useCallback((text) => {
        setKeyword(text);
        
        if (text === "") {
            setFocus(false);
            setShowSearchResults(false);
            setProductsFiltered(products);
        } else {
            setFocus(true);
            setShowSearchResults(true);
        }
    }, [products]);

    // Filter by brand - using useCallback
    const handleBrandFilter = useCallback((brandId) => {
        try {
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
        } catch (error) {
            console.error("Error filtering by brand:", error);
            Toast.show({
                type: "error",
                text1: "Filter Error",
                text2: "Could not filter products",
                visibilityTime: 2000,
            });
        }
    }, [products]);

    // Handle retry button click
    const handleRetry = useCallback(() => {
        fetchData();
    }, [fetchData]);

    // Show loading indicator if products or brands are loading
    const loading = productsLoading || brandsLoading || isRetrying;
    const error = productsError || brandsError;

    // Render error state with retry button
    const renderError = () => (
        <View style={[styles.center, { height: height / 2 }]}>
            <Text style={[styles.errorText, { color: isDarkMode ? "#fff" : "#000" }]}>
                Error loading data.
            </Text>
            <Text style={[styles.errorSubText, { color: isDarkMode ? "#fff" : "#000" }]}>
                Please check your connection and try again.
            </Text>
            <TouchableOpacity 
                style={styles.retryButton} 
                onPress={handleRetry}
                activeOpacity={0.7}
            >
                <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
        </View>
    );

    // Render loading state
    const renderLoading = () => (
        <View style={[styles.center, { height: height / 2 }]}>
            <ActivityIndicator 
                size="large" 
                color={isDarkMode ? "#fff" : "#000"} 
            />
            <Text style={{ color: isDarkMode ? "#fff" : "#000", marginTop: 10 }}>
                Loading data...
            </Text>
        </View>
    );

    // Render the main content (product listing)
    const renderProductListing = () => (
        <ScrollView 
            contentContainerStyle={styles.scrollViewContent}
            refreshControl={
                <RefreshControl
                    refreshing={loading}
                    onRefresh={fetchData}
                    colors={[isDarkMode ? "#fff" : "#000"]}
                    tintColor={isDarkMode ? "#fff" : "#000"}
                />
            }
        >
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

            {productsCtg && productsCtg.length > 0 ? (
                <View style={styles.listContainer}>
                    {productsCtg.map((item) => (
                        <ProductList 
                            key={item._id || `product-${Math.random().toString()}`} 
                            item={item}
                            navigation={navigation}
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
    );

    // Render search results
    const renderSearchResults = () => (
        <SearchedProduct 
            searchQuery={keyword} 
            products={products || []}
            brands={brands || []}
            navigation={navigation}
        />
    );

    // Main render logic for content area
    const renderContent = () => {
        // If we have products, show them even if there's an error
        if (products.length > 0) {
            if (showSearchResults) {
                return renderSearchResults();
            }
            return renderProductListing();
        }

        if (loading) {
            return renderLoading();
        }

        if (error) {
            return renderError();
        }

        return renderProductListing();
    };

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

            {renderContent()}
        </Surface>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollViewContent: {
        flexGrow: 1,
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
    retryButton: {
        backgroundColor: "#ff7e5f",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
    },
    retryButtonText: {
        color: "white",
        fontWeight: "bold",
        fontSize: 16,
    },
    errorText: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: 'center',
    },
    errorSubText: {
        marginBottom: 20,
        textAlign: 'center',
    },
});

export default ProductContainer;