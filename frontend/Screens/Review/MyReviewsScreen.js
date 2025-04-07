import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AirbnbRating } from "react-native-ratings";
import EasyButton from "../Shared/StyledComponents/EasyButton";
import Icon from "react-native-vector-icons/FontAwesome";

const MyReviewsScreen = (props) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);

  // Try getting auth data from Redux, but don't rely on it exclusively
  const authState = useSelector(state => state?.auth);
  const reduxToken = authState?.token;

  useEffect(() => {
    const getAuthData = async () => {
      try {
        // Try to use Redux data first
        if (reduxToken) {
          setToken(reduxToken);
          return;
        }

        // Fallback to AsyncStorage
        const storedToken = await AsyncStorage.getItem('jwt');
        
        if (storedToken) {
          setToken(storedToken);
          console.log("Using token from AsyncStorage");
        } else {
          setError("Authentication required. Please log in to view reviews.");
        }
      } catch (err) {
        console.log("Error retrieving auth data:", err);
        setError("Failed to retrieve authentication data.");
      }
    };

    getAuthData();
  }, [reduxToken]);
  
  const getReviews = useCallback(async () => {
    // Only fetch reviews if token is available
    if (!token) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(
        `${baseURL}my-reviews`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setReviews(response.data.reviews || []);
      } else {
        setError(response.data.message || "Failed to fetch reviews");
      }
    } catch (error) {
      console.log("Error fetching reviews:", error);
      setError(
        error.response?.data?.message || 
        "An error occurred while fetching your reviews"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);
  
  useFocusEffect(
    useCallback(() => {
      getReviews();
    }, [getReviews])
  );
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    getReviews();
  }, [getReviews]);
  
  const handleEditReview = (review) => {
    props.navigation.navigate("EditReviewScreen", { review });
  };
  
  const confirmDeleteReview = (reviewId) => {
    Alert.alert(
      "Delete Review",
      "Are you sure you want to delete this review?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteReview(reviewId)
        }
      ],
      { cancelable: true }
    );
  };
  
  const deleteReview = async (reviewId) => {
    try {
      const response = await axios.delete(
        `${baseURL}delete/review/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Remove the deleted review from the state
        setReviews(reviews.filter(review => review._id !== reviewId));
        
        Alert.alert("Success", "Review deleted successfully");
      } else {
        Alert.alert("Error", response.data.message || "Failed to delete review");
      }
    } catch (error) {
      console.log("Error deleting review:", error);
      Alert.alert(
        "Error",
        error.response?.data?.message || "An error occurred while deleting the review"
      );
    }
  };
  
  const renderReviewItem = ({ item }) => {
    // Format date
    const reviewDate = new Date(item.createdAt).toLocaleDateString();
    
    return (
      <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
          <Text style={styles.productName}>
            {item.product?.name || "Product"}
          </Text>
          <Text style={styles.reviewDate}>{reviewDate}</Text>
        </View>
        
        <View style={styles.ratingContainer}>
          <AirbnbRating
            count={5}
            defaultRating={item.ratings}
            size={20}
            isDisabled={true}
            showRating={false}
          />
          <Text style={styles.ratingText}>{item.ratings.toFixed(1)}</Text>
        </View>
        
        <Text style={styles.commentText}>{item.comment}</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditReview(item)}
          >
            <Icon name="edit" size={18} color="#2E86DE" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => confirmDeleteReview(item._id)}
          >
            <Icon name="trash" size={18} color="#E74C3C" />
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  if (loading && !refreshing) {
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
    <View style={styles.container}>
      <FlatList
        data={reviews}
        renderItem={renderReviewItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2E86DE"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="comments-o" size={60} color="#95A5A6" />
            <Text style={styles.emptyText}>
              You haven't reviewed any products yet
            </Text>
            <Text style={styles.emptySubtext}>
              Once you review products, they will appear here
            </Text>
          </View>
        }
      />
    </View>
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
  listContainer: {
    padding: 10,
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  productName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  reviewDate: {
    fontSize: 12,
    color: "#95A5A6",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  ratingText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
    color: "#F1C40F",
  },
  commentText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 15,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#EAEAEA",
    paddingTop: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
    padding: 5,
  },
  editButtonText: {
    marginLeft: 5,
    color: "#2E86DE",
    fontSize: 14,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  deleteButtonText: {
    marginLeft: 5,
    color: "#E74C3C",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#34495E",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#7F8C8D",
    textAlign: "center",
  }
});

export default MyReviewsScreen;