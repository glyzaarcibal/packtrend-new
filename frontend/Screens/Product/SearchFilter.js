import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView,
  Dimensions
} from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from "../../context/ThemeContext";

const { width } = Dimensions.get('window');

const SearchFilter = ({ 
  onApplyFilters, 
  onClose, 
  categories = [], 
  initialFilters = {} 
}) => {
  const { isDarkMode } = useTheme();
  
  // Price range states
  const [minPrice, setMinPrice] = useState(
    initialFilters.priceRange?.min ? String(initialFilters.priceRange.min) : ''
  );
  const [maxPrice, setMaxPrice] = useState(
    initialFilters.priceRange?.max ? String(initialFilters.priceRange.max) : ''
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);

  // Category and rating states
  const [selectedCategories, setSelectedCategories] = useState(
    initialFilters.categories || []
  );
  const [selectedRating, setSelectedRating] = useState(
    initialFilters.rating || null
  );
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

  // Determine categories to display
  const displayCategories = categories.length > 0 ? categories : [];
  const visibleCategories = showAllCategories 
    ? displayCategories 
    : displayCategories.slice(0, 8);

  // Validate price inputs
  const validatePriceInput = (value) => {
    // Remove any non-numeric characters
    return value.replace(/[^0-9]/g, '');
  };

  // Handle category selection
  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Handle rating selection
  const selectRating = (rating) => {
    setSelectedRating(prev => prev === rating ? null : rating);
  };

  // Handle predefined price range selection
  const selectPriceRange = (range) => {
    if (selectedPriceRange === range.label) {
      // Deselect if already selected
      setSelectedPriceRange(null);
      setMinPrice('');
      setMaxPrice('');
    } else {
      // Select new range
      setSelectedPriceRange(range.label);
      setMinPrice(range.min);
      setMaxPrice(range.max);
    }
  };

  // Apply filters
  const applyFilters = () => {
    // Construct filters object with validated inputs
    const filters = {
      categories: selectedCategories,
      rating: selectedRating,
      priceRange: {
        min: minPrice ? parseInt(minPrice) : undefined,
        max: maxPrice ? parseInt(maxPrice) : undefined
      }
    };
    
    // Validate price range
    if (filters.priceRange.min && filters.priceRange.max && 
        filters.priceRange.min > filters.priceRange.max) {
      // Swap min and max if entered incorrectly
      [filters.priceRange.min, filters.priceRange.max] = 
        [filters.priceRange.max, filters.priceRange.min];
    }
    
    onApplyFilters(filters);
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedRating(null);
    setMinPrice('');
    setMaxPrice('');
    setSelectedPriceRange(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : '#f5f5f5' }]}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={onClose}
          color={isDarkMode ? '#fff' : '#000'}
        />
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
          Search Filter
        </Text>
      </View>

      <ScrollView>
        {/* Categories Section */}
        {displayCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#000' }]}>
              Categories
            </Text>
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
            
            {displayCategories.length > 8 && (
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
              placeholder="Min"
              placeholderTextColor="#999"
              value={minPrice}
              onChangeText={(text) => setMinPrice(validatePriceInput(text))}
              keyboardType="numeric"
            />
            
            <View style={styles.priceSeparator} />
            
            <TextInput
              style={styles.priceInput}
              placeholder="Max"
              placeholderTextColor="#999"
              value={maxPrice}
              onChangeText={(text) => setMaxPrice(validatePriceInput(text))}
              keyboardType="numeric"
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  headerTitle: {
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

export default SearchFilter;