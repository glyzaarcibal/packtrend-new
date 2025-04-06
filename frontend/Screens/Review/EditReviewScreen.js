import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image
} from "react-native";
import { AirbnbRating } from "react-native-ratings";
import { useSelector } from "react-redux";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EasyButton from "../Shared/StyledComponents/EasyButton";
import Icon from "react-native-vector-icons/FontAwesome";

const EditReviewScreen = (props) => {
  const { review } = props.route.params;
  const [product, setProduct] = useState(null);
  const [rating, setRating] = useState(review.ratings);
  const [comment, setComment] = useState(review.comment);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get auth state from Redux
  const authState = useSelector(state => state?.auth);

  useEffect(() => {
    const getAuthData = async () => {
      try {
        // Try to get token and user ID from Redux first
        const reduxToken = authState?.token;
        const reduxUserId = authState?.user?._id;

        console.log("Redux Auth State:", {
          token: !!reduxToken,
          userId: reduxUserId
        });

        if (reduxToken && reduxUserId) {
          setToken(reduxToken);
          setCurrentUserId(reduxUserId);
          return;
        }

        // Fallback to AsyncStorage
        const storedToken = await AsyncStorage.getItem('jwt');
        const storedUserId = await AsyncStorage.getItem('userId');
        
        console.log("Stored Auth Data:", {
          token: !!storedToken,
          userId: storedUserId
        });

        if (storedToken) {
          setToken(storedToken);
          
          if (storedUserId) {
            setCurrentUserId(storedUserId);
          } else {
            // If no stored user ID, try to fetch user profile
            try {
              const response = await axios.get(`${baseURL}profile`, {
                headers: { Authorization: `Bearer ${storedToken}` }
              });

              if (response.data.user?._id) {
                setCurrentUserId(response.data.user._id);
                await AsyncStorage.setItem('userId', response.data.user._id);
              }
            } catch (profileError) {
              console.error("Error fetching user profile:", profileError);
            }
          }
        } else {
          setError("Authentication required. Please log in to edit review.");
        }
      } catch (err) {
        console.log("Error retrieving auth data:", err);
        setError("Failed to retrieve authentication data.");
      } finally {
        setIsLoading(false);
      }
    };

    getAuthData();
  }, [authState]);
  
  // Fetch product details
  useEffect(() => {
    const getProductDetails = async () => {
      // Only fetch if token is available
      if (!token) return;

      try {
        setIsLoading(true);
        setError(null);
        
        // Ensure we have a valid product ID
        const productId = review.product?._id || review.product;
        
        if (!productId) {
          throw new Error("Invalid product ID");
        }

        console.log("Fetching product details for ID:", productId);
        
        const response = await axios.get(
          `${baseURL}get/single/product/${productId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        if (response.data.success) {
          setProduct(response.data.product);
        } else {
          setError("Failed to fetch product details");
        }
      } catch (error) {
        console.error("Detailed error fetching product:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          fullError: error
        });
        
        setError(
          error.response?.data?.message || 
          error.message ||
          "An error occurred while fetching product details"
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    getProductDetails();
  }, [review, token]);
  
  const handleSubmit = async () => {
    // Comprehensive user ID and review ownership check
    const reviewUserId = review.user?._id || review.user;

    console.log("Detailed User Comparison:", {
      currentUserId,
      reviewUserId
    });

    // Validate user ownership before submission
    if (!currentUserId || !reviewUserId || 
        currentUserId.toString() !== reviewUserId.toString()) {
      Alert.alert(
        "Authorization Error", 
        "You do not have permission to edit this review.",
        [
          {
            text: "OK",
            onPress: () => {
              console.error("Review Ownership Verification Failed", {
                currentUserId,
                reviewUserId
              });
              props.navigation.goBack();
            }
          }
        ]
      );
      return;
    }

    // Existing validation checks
    if (rating === 0) {
      Alert.alert("Error", "Please provide a rating");
      return;
    }
    
    if (!comment.trim()) {
      Alert.alert("Error", "Please provide a review comment");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await axios.put(
        `${baseURL}edit/review/${review._id}`,
        {
          ratings: rating,
          comment: comment.trim(),
          // Include user ID for additional server-side verification
          userId: currentUserId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Additional debugging headers
            'X-User-Id': currentUserId,
            'X-Review-User-Id': reviewUserId
          }
        }
      );
      
      if (response.data.success) {
        Alert.alert(
          "Success",
          "Your review has been updated successfully",
          [
            {
              text: "OK",
              onPress: () => props.navigation.goBack()
            }
          ]
        );
      } else {
        Alert.alert("Error", response.data.message || "Failed to update review");
      }
    } catch (error) {
      console.error("Review Update Error:", {
        status: error.response?.status,
        message: error.response?.data?.message,
        currentUserId,
        reviewUserId
      });

      Alert.alert(
        "Error",
        error.response?.data?.message || 
        "An error occurred while updating your review"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }
  
  if (error) {
    return (
      <View style={styles.centered}>
        <Icon name="exclamation-triangle" size={50} color="#E74C3C" />
        <Text style={styles.errorText}>{error}</Text>
        <EasyButton
          secondary
          medium
          onPress={() => props.navigation.goBack()}
        >
          <Text style={{ color: "white" }}>Go Back</Text>
        </EasyButton>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView style={styles.container}>
        <View style={styles.productCard}>
          {product && (
            <>
              <Text style={styles.productTitle}>{product.name}</Text>
              {product.images && product.images.length > 0 && (
                <Image 
                  source={{ uri: product.images[0] }} 
                  style={styles.productImage}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.productDescription} numberOfLines={2}>
                {product.description}
              </Text>
            </>
          )}
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Update Your Review</Text>
          
          <View style={styles.ratingContainer}>
            <Text style={styles.label}>Your Rating</Text>
            <AirbnbRating
              count={5}
              defaultRating={rating}
              size={30}
              showRating={true}
              onFinishRating={(value) => setRating(value)}
            />
          </View>
          
          <View style={styles.commentContainer}>
            <Text style={styles.label}>Your Review</Text>
            <TextInput
              style={styles.commentInput}
              placeholder="Share your thoughts about this product..."
              multiline={true}
              numberOfLines={5}
              value={comment}
              onChangeText={setComment}
            />
          </View>
          
          <View style={styles.buttonContainer}>
            <EasyButton
              secondary
              large
              onPress={() => props.navigation.goBack()}
              disabled={isSubmitting}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </EasyButton>
            
            <EasyButton
              primary
              large
              onPress={handleSubmit}
              disabled={isSubmitting || rating === 0 || !comment.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Update Review</Text>
              )}
            </EasyButton>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    marginVertical: 15,
    color: "#E74C3C",
    textAlign: "center",
    fontSize: 16,
  },
  productCard: {
    margin: 15,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  productTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  productImage: {
    width: "100%",
    height: 150,
    borderRadius: 5,
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 14,
    color: "#7F8C8D",
  },
  formContainer: {
    margin: 15,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 10,
  },
  ratingContainer: {
    marginBottom: 20,
  },
  commentContainer: {
    marginBottom: 20,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    minHeight: 120,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  }
});

export default EditReviewScreen;