import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import baseURL from '../../assets/common/baseurl';
import EasyButton from '../Shared/StyledComponents/EasyButton';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper function to extract ID from product reference
const extractProductId = (productRef) => {
  if (!productRef) return null;
  
  // If it's already just an ID string
  if (typeof productRef === 'string' && productRef.match(/^[0-9a-fA-F]{24}$/)) {
    return productRef;
  }
  
  // If it's an object with _id property
  if (productRef._id) {
    return productRef._id;
  }
  
  // If it's a URL, extract the ID portion
  if (typeof productRef === 'string' && productRef.includes('/')) {
    const parts = productRef.split('/');
    return parts[parts.length - 1];
  }
  
  // Return as is if nothing else matches
  return productRef;
};

// Simple star rating component
const StarRating = ({ rating, maxStars = 5, size = 20, onRatingChange }) => {
  const handlePress = (selectedRating) => {
    if (onRatingChange) {
      onRatingChange(selectedRating);
    }
  };

  return (
    <View style={{ flexDirection: 'row' }}>
      {[...Array(maxStars)].map((_, index) => {
        const starFilled = index < rating;
        return (
          <TouchableOpacity
            key={index}
            onPress={() => handlePress(index + 1)}
            disabled={!onRatingChange}
          >
            <Text style={{ 
              fontSize: size, 
              color: starFilled ? '#FFD700' : '#D3D3D3',
              marginHorizontal: 2
            }}>
              ★
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const ProductReviewsScreen = (props) => {
  const { orderItems = [] } = props.route?.params || {};
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingReviews, setExistingReviews] = useState({});
  const [token, setToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  // Try getting auth data from Redux, but don't rely on it exclusively
  const authState = useSelector(state => state?.auth);
  const reduxToken = authState?.token;
  const reduxUser = authState?.user;

  // Use AsyncStorage as a fallback for auth data
  useEffect(() => {
    const getAuthData = async () => {
      try {
        // Try to use Redux data first
        if (reduxToken && reduxUser) {
          setToken(reduxToken);
          setUserData(reduxUser);
          return;
        }

        // Fallback to AsyncStorage
        const storedToken = await AsyncStorage.getItem('jwt');
        const storedUserData = await AsyncStorage.getItem('userData');
        
        if (storedToken) {
          setToken(storedToken);
          console.log("Using token from AsyncStorage");
          
          if (storedUserData) {
            const parsedUserData = JSON.parse(storedUserData);
            setUserData(parsedUserData);
            console.log("Using user data from AsyncStorage");
          }
        } else {
          setError("Authentication required. Please log in to review products.");
        }
      } catch (err) {
        console.log("Error retrieving auth data:", err);
        setError("Failed to retrieve authentication data.");
      }
    };

    getAuthData();
  }, [reduxToken, reduxUser]);

  useEffect(() => {
    const getProductsDetails = async () => {
      try {
        setLoading(true);
        
        if (!orderItems || !orderItems.length) {
          setProducts([]);
          setLoading(false);
          return;
        }
        
        console.log("Processing order items:", orderItems);
        const productsData = [];
        
        // Process each order item to get full product details
        for (const item of orderItems) {
          try {
            const productId = extractProductId(item.product);
            
            if (!productId) {
              console.log("Could not extract product ID from:", item.product);
              continue;
            }
            
            console.log(`Fetching product details for ID: ${productId}`);
            
            // Get product details - FIXED URL PATH
            try {
              const productResponse = await axios.get(
                `${baseURL}products/get/single/product/${productId}`
              );
              
              if (productResponse.data.success) {
                // Add product to list with quantity from order
                productsData.push({
                  ...productResponse.data.product,
                  quantity: item.quantity
                });
                
                // Check if user has already reviewed this product
                if (token && userData) {
                  try {
                    // FIXED URL PATH for reviews - REMOVED "products/" prefix
                    const reviewsResponse = await axios.get(
                      `${baseURL}my-reviews/product/${productId}`,
                      {
                        headers: { Authorization: `Bearer ${token}` }
                      }
                    );
                    
                    if (reviewsResponse.data.success && reviewsResponse.data.reviews.length > 0) {
                      // User has already reviewed this product
                      setExistingReviews(prev => ({
                        ...prev,
                        [productId]: reviewsResponse.data.reviews[0]
                      }));
                    }
                  } catch (error) {
                    console.log(`Error fetching reviews for product ${productId}:`, error);
                  }
                }
              }
            } catch (error) {
              console.log(`Error fetching product ${productId}:`, error.response?.status, error.response?.data);
              // Use data from the order item as fallback
              productsData.push({
                _id: productId,
                name: item.name || "Product",
                quantity: item.quantity,
                price: item.price,
                image: item.image,
                description: `Product ID: ${productId}`
              });
            }
          } catch (error) {
            console.log("Error processing item:", error);
          }
        }
        
        console.log("Processed products data:", productsData.length, "items");
        setProducts(productsData);
      } catch (error) {
        console.log("Error processing order items:", error);
        setError("Failed to load product data.");
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch products if we have auth data
    if (token) {
      getProductsDetails();
    }
  }, [orderItems, token, userData]);

  const handleReviewProduct = (product) => {
    if (!token || !userData) {
      Toast.show({
        topOffset: 60,
        type: 'error',
        text1: 'Authentication Required',
        text2: 'Please log in to review products',
      });
      return;
    }
    
    setSelectedProduct(product);
    
    // Check if user already has a review for this product
    const existingReview = existingReviews[product._id];
    
    if (existingReview) {
      // Pre-fill existing review
      setRating(existingReview.ratings || 0);
      setComment(existingReview.comment || '');
    } else {
      // Reset form for new review
      setRating(0);
      setComment('');
    }
    
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    try {
      if (!token || !selectedProduct || rating === 0 || !comment.trim()) {
        Toast.show({
          topOffset: 60,
          type: 'error',
          text1: 'Review Incomplete',
          text2: 'Please provide both rating and comment',
        });
        return;
      }

      setIsSubmitting(true);
      
      const productId = selectedProduct._id;
      if (!productId) {
        Toast.show({
          topOffset: 60,
          type: 'error',
          text1: 'Error',
          text2: 'Invalid product data',
        });
        setIsSubmitting(false);
        return;
      }
      
      const reviewData = {
        ratings: rating,
        comment,
      };
      
      // Check if this is a new review or an update to existing review
      const existingReview = existingReviews[productId];
      let response;
      
      if (existingReview) {
        // Update existing review - REMOVED "products/" prefix
        response = await axios.put(
          `${baseURL}edit/review/${existingReview._id}`,
          reviewData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Create new review - REMOVED "products/" prefix
        response = await axios.post(
          `${baseURL}create/review/${productId}`,
          reviewData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
      
      if (response.data.success) {
        // Update the local state to reflect the new review
        setExistingReviews(prev => ({
          ...prev,
          [productId]: response.data.review
        }));
        
        Toast.show({
          topOffset: 60,
          type: 'success',
          text1: existingReview ? 'Review Updated' : 'Review Submitted',
          text2: 'Thank you for your feedback!',
        });
        
        setShowReviewModal(false);
      }
    } catch (error) {
      console.log("Error submitting review:", error);
      
      // More detailed error message
      const errorMessage = error.response?.data?.message || 
                          (error.response?.status === 404 ? 'API endpoint not found - check server routes' : 'Please try again');
      
      Toast.show({
        topOffset: 60,
        type: 'error',
        text1: 'Review Submission Failed',
        text2: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReviewModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showReviewModal}
      onRequestClose={() => setShowReviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {selectedProduct && existingReviews[selectedProduct._id] 
              ? 'Update Your Review' 
              : 'Rate & Review Product'}
          </Text>
          
          {selectedProduct && (
            <Text style={styles.productName}>
              {selectedProduct.name || 'Product'}
            </Text>
          )}
          
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Your Rating:</Text>
            <StarRating 
              rating={rating} 
              size={30} 
              onRatingChange={setRating} 
            />
          </View>
          
          <TextInput
            style={styles.commentInput}
            placeholder="Share your thoughts about this product..."
            multiline={true}
            numberOfLines={5}
            value={comment}
            onChangeText={(text) => setComment(text)}
          />
          
          <View style={styles.modalButtonsContainer}>
            <EasyButton 
              secondary 
              medium 
              onPress={() => setShowReviewModal(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </EasyButton>
            
            <EasyButton 
              primary 
              medium 
              onPress={handleSubmitReview}
              disabled={isSubmitting || rating === 0 || !comment.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>
                  {selectedProduct && existingReviews[selectedProduct._id] 
                    ? 'Update' 
                    : 'Submit'}
                </Text>
              )}
            </EasyButton>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderProductItem = ({ item }) => {
    const hasReviewed = !!existingReviews[item._id];
    
    return (
      <View style={styles.productCard}>
        <View style={styles.productHeader}>
          <Text style={styles.productName}>{item.name}</Text>
          <Text style={styles.productQuantity}>Qty: {item.quantity}</Text>
        </View>
        
        {item.image && (
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.image }} 
              style={styles.productImage}
              resizeMode="contain"
            />
          </View>
        )}
        
        {item.description && (
          <Text style={styles.productDescription} numberOfLines={2}>
            {item.description}
          </Text>
        )}
        
        <View style={styles.reviewSection}>
          {hasReviewed ? (
            <View style={styles.existingReview}>
              <Text style={styles.reviewLabel}>Your Review:</Text>
              <View style={styles.reviewDetails}>
                <StarRating rating={existingReviews[item._id].ratings} size={16} />
                <Text style={styles.reviewComment}>{existingReviews[item._id].comment}</Text>
              </View>
              <EasyButton 
                success
                small
                onPress={() => handleReviewProduct(item)}
              >
                <Text style={styles.reviewButtonText}>Edit Review</Text>
              </EasyButton>
            </View>
          ) : (
            <EasyButton 
              primary
              medium
              onPress={() => handleReviewProduct(item)}
            >
              <Text style={styles.reviewButtonText}>Write a Review</Text>
            </EasyButton>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <EasyButton
          secondary
          medium
          onPress={() => props.navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </EasyButton>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={item => item._id || Math.random().toString()}
        contentContainerStyle={styles.productsList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found for this order</Text>
          </View>
        }
      />
      
      {renderReviewModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 20,
  },
  productsList: {
    padding: 10,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  productQuantity: {
    fontSize: 14,
    color: '#777',
  },
  imageContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  productImage: {
    width: '80%',
    height: 120,
    borderRadius: 5,
  },
  productDescription: {
    fontSize: 14,
    color: '#555',
    marginBottom: 15,
  },
  reviewSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  existingReview: {
    marginBottom: 10,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  reviewDetails: {
    marginBottom: 10,
  },
  reviewComment: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
    fontStyle: 'italic',
  },
  reviewButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  ratingContainer: {
    marginVertical: 15,
    width: '100%',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  commentInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginTop: 10,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default ProductReviewsScreen;