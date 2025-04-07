import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  Dimensions, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  TextInput,
  Image,
  ScrollView,
  Modal
} from 'react-native';
import { Text, Button, IconButton, Surface } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import debounce from 'lodash.debounce';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from "../../context/ThemeContext";
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get("window");

// Helper to validate MongoDB ObjectId format
const isValidObjectId = (id) => {
  return id && /^[0-9a-fA-F]{24}$/.test(id);
};

const SearchedProduct = ({ searchQuery, products = [], brands = [] }) => {
    const { isDarkMode } = useTheme();
    const navigation = useNavigation();
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
    
    // Filter states
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [selectedPriceRange, setSelectedPriceRange] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedRating, setSelectedRating] = useState(null);
    const [showAllCategories, setShowAllCategories] = useState(false);

    // Predefined price ranges
    const priceRanges = [
      { label: '0-200', min: '0', max: '200' },
      { label: '200-400', min: '200', max: '400' },
      { label: '400-600', min: '400', max: '600' }
    ];

    // Predefined rating options
    const ratingOptions = [
      { label: '5 Stars', value: 5 },
      { label: '4 Stars & Up', value: 4 },
      { label: '3 Stars & Up', value: 3 },
      { label: '2 Stars & Up', value: 2 },
      { label: '1 Star & Up', value: 1 }
    ];

    // Extract all product types for category filtering
    const productCategories = [...new Set(products.map(product => product.type))].filter(Boolean);
    const visibleCategories = showAllCategories ? productCategories : productCategories.slice(0, 8);

    useEffect(() => {
        // Initial filtering based on search query
        filterProducts();
    }, [searchQuery, products]);

    const filterProducts = () => {
        setLoading(true);
        
        if (!products || products.length === 0) {
            setFilteredProducts([]);
            setLoading(false);
            return;
        }

        let filtered = [...products];

        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(product =>
                product.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Filter by price range
        if (minPrice !== '' || maxPrice !== '') {
            filtered = filtered.filter(product => {
                const price = parseFloat(product.price);
                
                // If both min and max are specified
                if (minPrice !== '' && maxPrice !== '') {
                    const min = parseFloat(minPrice);
                    const max = parseFloat(maxPrice);
                    return price >= min && price <= max;
                }
                
                // If only min is specified
                if (minPrice !== '') {
                    const min = parseFloat(minPrice);
                    return price >= min;
                }
                
                // If only max is specified
                if (maxPrice !== '') {
                    const max = parseFloat(maxPrice);
                    return price <= max;
                }
                
                return true;
            });
        }

        // Filter by categories
        if (selectedCategories.length > 0) {
            filtered = filtered.filter(product => 
                selectedCategories.includes(product.type)
            );
        }

        // Filter by rating
        if (selectedRating) {
            filtered = filtered.filter(product => {
                // Calculate average rating from product reviews
                const reviews = product.reviews || [];
                if (reviews.length === 0) return false;
                
                const totalRating = reviews.reduce((sum, review) => sum + (review.ratings || 0), 0);
                const avgRating = totalRating / reviews.length;
                
                return avgRating >= selectedRating;
            });
        }

        setFilteredProducts(filtered);
        setLoading(false);
    };

    const debouncedFilterProducts = useCallback(
        debounce(() => {
            filterProducts();
        }, 300),
        [searchQuery, minPrice, maxPrice, selectedCategories, selectedRating, products]
    );

    // Update filters when any filter criteria changes
    useEffect(() => {
        debouncedFilterProducts();
    }, [minPrice, maxPrice, selectedCategories, selectedRating]);

    // Handle category selection
    const toggleCategory = (category) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter(c => c !== category));
        } else {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    // Handle rating selection
    const selectRating = (rating) => {
        setSelectedRating(rating === selectedRating ? null : rating);
    };

    // Handle predefined price range selection
    const selectPriceRange = (range) => {
        if (selectedPriceRange === range.label) {
            setSelectedPriceRange(null);
            setMinPrice('');
            setMaxPrice('');
        } else {
            setSelectedPriceRange(range.label);
            setMinPrice(range.min);
            setMaxPrice(range.max);
        }
    };

    // Reset all filters
    const resetFilters = () => {
        setSelectedCategories([]);
        setSelectedRating(null);
        setMinPrice('');
        setMaxPrice('');
        setSelectedPriceRange(null);
    };

    // Apply filters and close modal
    const applyFilters = () => {
        filterProducts();
        setShowFilterModal(false);
    };

    const handleProductPress = (item) => {
        // Validate the product ID before navigation
        if (!item || !item._id) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Invalid product",
                text2: "Cannot view this product"
            });
            return;
        }

        // Check if it's a valid MongoDB ObjectId
        if (!isValidObjectId(item._id)) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Invalid product ID format",
                text2: `ID: ${item._id} is not valid`
            });
            return;
        }

        // Navigate to product detail with validated ID
        navigation.navigate("Product Detail", { productId: item._id });
    };

    const renderItem = ({ item }) => {
        return (
            <View style={styles.productCard}>
                <TouchableOpacity
                    onPress={() => handleProductPress(item)}
                >
                    <View style={styles.imageContainer}>
                        <View style={styles.image}>
                            {item.images && item.images.length > 0 ? (
                                <Image 
                                    style={styles.productImage} 
                                    source={{ uri: item.images[0] }} 
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.placeholderImage} />
                            )}
                        </View>
                        <TouchableOpacity style={styles.heartIcon}>
                            <Icon name="favorite-border" size={24} color={isDarkMode ? "#fff" : "#000"} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.productInfo}>
                        <Text style={[styles.productName, { color: isDarkMode ? "#fff" : "#000" }]}>
                            {item.name}
                        </Text>
                        <View style={styles.typeContainer}>
                            <Text style={styles.productType}>{item.type}</Text>
                            <View style={[
                                styles.colorDot, 
                                { backgroundColor: item.color || '#000' }
                            ]} />
                        </View>
                        <Text style={styles.productPrice}>${item.price}</Text>
                        <Button 
                            mode="contained"
                            style={styles.addButton}
                            labelStyle={styles.addButtonLabel}
                            uppercase={false}
                            onPress={() => {
                                // Handle add to cart here
                                console.log("Add to cart:", item._id);
                            }}
                        >
                            ADD
                        </Button>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? "#121212" : "#fff" }]}>
            <View style={styles.filterToggleContainer}>
                <Button 
                    mode="outlined"
                    onPress={() => setShowFilterModal(true)}
                    style={styles.filterToggleButton}
                    icon="filter-variant"
                >
                    Filter
                </Button>
            </View>

            <Text style={[styles.searchResultsTitle, { color: isDarkMode ? "#fff" : "#000" }]}>
                Search Results
            </Text>

            {loading ? (
                <ActivityIndicator size="large" color="#FF5722" style={styles.center} />
            ) : filteredProducts.length > 0 ? (
                <FlatList 
                    data={filteredProducts}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id?.toString() || Math.random().toString()}
                    numColumns={2}
                    contentContainerStyle={styles.productsList}
                />
            ) : (
                <View style={styles.center}>
                    <Text style={[styles.noResultsText, { color: isDarkMode ? "#ddd" : "#666" }]}>
                        No products match the selected criteria
                    </Text>
                </View>
            )}

            {/* Filter Modal */}
            <Modal
                visible={showFilterModal}
                animationType="slide"
                onRequestClose={() => setShowFilterModal(false)}
            >
                <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? "#121212" : "#f5f5f5" }]}>
                    <View style={styles.modalHeader}>
                        <IconButton
                            icon="arrow-left"
                            size={24}
                            onPress={() => setShowFilterModal(false)}
                            color={isDarkMode ? '#fff' : '#000'}
                        />
                        <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                            Search Filter
                        </Text>
                    </View>

                    <ScrollView>
                        {/* Categories Section */}
                        {productCategories.length > 0 && (
                            <View style={styles.section}>
                                <View style={styles.categoryGrid}>
                                    {visibleCategories.map((category, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[
                                                styles.categoryButton,
                                                selectedCategories.includes(category) && styles.selectedCategoryButton
                                            ]}
                                            onPress={() => toggleCategory(category)}
                                        >
                                            <Text 
                                                style={[
                                                    styles.categoryText,
                                                    selectedCategories.includes(category) && styles.selectedCategoryText
                                                ]}
                                            >
                                                {category}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                                
                                {productCategories.length > 8 && (
                                    <TouchableOpacity 
                                        style={styles.showMoreButton}
                                        onPress={() => setShowAllCategories(!showAllCategories)}
                                    >
                                        <Text style={styles.showMoreText}>
                                            {showAllCategories ? 'Show Less' : 'Show More'}
                                        </Text>
                                        <Icon 
                                            name={showAllCategories ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
                                            size={24} 
                                            color="#777"
                                        />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        <View style={styles.divider} />

                        {/* Rating Section */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                                Rating
                            </Text>
                            
                            <View style={styles.ratingGrid}>
                                {ratingOptions.map((option, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.ratingButton,
                                            selectedRating === option.value && styles.selectedRatingButton
                                        ]}
                                        onPress={() => selectRating(option.value)}
                                    >
                                        <Text 
                                            style={[
                                                styles.ratingText,
                                                selectedRating === option.value && styles.selectedRatingText
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        <View style={styles.divider} />

                        {/* Price Range Section */}
                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
                                Price Range (₱)
                            </Text>
                            
                            <View style={styles.priceInputContainer}>
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="200"
                                    placeholderTextColor="#999"
                                    value={minPrice}
                                    onChangeText={setMinPrice}
                                    keyboardType="number-pad"
                                />
                                
                                <View style={styles.priceSeparator} />
                                
                                <TextInput
                                    style={styles.priceInput}
                                    placeholder="400"
                                    placeholderTextColor="#999"
                                    value={maxPrice}
                                    onChangeText={setMaxPrice}
                                    keyboardType="number-pad"
                                />
                            </View>
                            
                            <View style={styles.priceRangeGrid}>
                                {priceRanges.map((range, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.priceRangeButton,
                                            selectedPriceRange === range.label && styles.selectedPriceRangeButton
                                        ]}
                                        onPress={() => selectPriceRange(range)}
                                    >
                                        <Text 
                                            style={[
                                                styles.priceRangeText,
                                                selectedPriceRange === range.label && styles.selectedPriceRangeText
                                            ]}
                                        >
                                            {range.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <TouchableOpacity 
                            style={styles.resetButton} 
                            onPress={resetFilters}
                        >
                            <Text style={styles.resetText}>Reset</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.applyButton} 
                            onPress={applyFilters}
                        >
                            <Text style={styles.applyText}>Apply</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        height: 200,
    },
    filterToggleContainer: {
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    filterToggleButton: {
        alignSelf: 'flex-start',
    },
    searchResultsTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        padding: 15,
    },
    productsList: {
        paddingHorizontal: 10,
    },
    // Product Card Styles
    productCard: {
        flex: 1,
        margin: 5,
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    imageContainer: {
        position: 'relative',
    },
    image: {
        height: 180,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#e0e0e0',
    },
    heartIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'transparent',
    },
    productInfo: {
        padding: 10,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    typeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    productType: {
        fontSize: 14,
        color: '#666',
    },
    colorDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    productPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF5722',
        marginBottom: 10,
    },
    addButton: {
        backgroundColor: '#4CAF50',
        paddingVertical: 2,
    },
    addButtonLabel: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    noResultsText: {
        fontSize: 16,
    },
    
    // Modal Styles
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ddd'
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10
    },
    section: {
        padding: 15
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginHorizontal: 15
    },
    // Category styles
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    categoryButton: {
        width: (width - 45) / 2,
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        marginBottom: 10,
        alignItems: 'center'
    },
    selectedCategoryButton: {
        backgroundColor: '#fff0ee',
        borderWidth: 1,
        borderColor: '#ff5722'
    },
    categoryText: {
        fontSize: 16,
        color: '#333'
    },
    selectedCategoryText: {
        color: '#ff5722',
        fontWeight: 'bold'
    },
    showMoreButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        marginTop: 5
    },
    showMoreText: {
        fontSize: 16,
        color: '#777',
        marginRight: 5
    },
    // Rating styles
    ratingGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between'
    },
    ratingButton: {
        width: (width - 45) / 2,
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        marginBottom: 10,
        alignItems: 'center'
    },
    selectedRatingButton: {
        backgroundColor: '#fff0ee',
        borderWidth: 1,
        borderColor: '#ff5722'
    },
    ratingText: {
        fontSize: 16,
        color: '#333'
    },
    selectedRatingText: {
        color: '#ff5722',
        fontWeight: 'bold'
    },
    // Price range styles
    priceInputContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
    },
    priceInput: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        paddingHorizontal: 15,
        fontSize: 16,
        backgroundColor: '#fff',
        textAlign: 'center'
    },
    priceSeparator: {
        width: 30,
        height: 1,
        backgroundColor: '#ddd',
        marginHorizontal: 10
    },
    priceRangeGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    priceRangeButton: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        marginHorizontal: 3,
        alignItems: 'center'
    },
    selectedPriceRangeButton: {
        backgroundColor: '#fff0ee',
        borderWidth: 1,
        borderColor: '#ff5722'
    },
    priceRangeText: {
        fontSize: 16,
        color: '#333'
    },
    selectedPriceRangeText: {
        color: '#ff5722',
        fontWeight: 'bold'
    },
    // Action buttons
    actionButtons: {
        flexDirection: 'row',
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#ddd'
    },
    resetButton: {
        flex: 1,
        padding: 15,
        borderWidth: 1,
        borderColor: '#ff5722',
        borderRadius: 5,
        marginRight: 10,
        alignItems: 'center'
    },
    resetText: {
        fontSize: 18,
        color: '#ff5722',
        fontWeight: 'bold'
    },
    applyButton: {
        flex: 1,
        padding: 15,
        backgroundColor: '#ff5722',
        borderRadius: 5,
        marginLeft: 10,
        alignItems: 'center'
    },
    applyText: {
        fontSize: 18,
        color: '#fff',
        fontWeight: 'bold'
    }
});

export default SearchedProduct;