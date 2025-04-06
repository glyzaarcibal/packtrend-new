import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from "../../Redux/Actions/orderActions";
import { sendOrderStatusNotification } from "../../utils/notificationService";

import TrafficLight from "./StyledComponents/TrafficLight";
import EasyButton from "./StyledComponents/EasyButton";
import { Picker } from "@react-native-picker/picker";
import Toast from "react-native-toast-message";

const codes = [
  { name: "pending", code: "3" },
  { name: "shipped", code: "2" },
  { name: "delivered", code: "1" },
];

const OrderCard = ({ item, update, navigation }) => {
  const [orderStatus, setOrderStatus] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [statusChange, setStatusChange] = useState('3'); // Default to pending
  const [cardColor, setCardColor] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  const dispatch = useDispatch();

  // Update the status display based on current status
  useEffect(() => {
    if (item) {
      // Make sure we use the status from the item, defaulting to "3" if not available
      const currentStatus = item.status || "3";
      updateStatusDisplay(currentStatus);
      setStatusChange(currentStatus);
      
      console.log("Order loaded with status:", currentStatus);
    }
  }, [item]);
  
  // Update the order when the user clicks the update button
  const handleUpdateOrder = () => {
    if (statusChange === item.status) {
      // No change was made, just return
      Toast.show({
        topOffset: 60,
        type: 'info',
        text1: 'No Changes Made',
        text2: 'Status remains the same',
      });
      return;
    }
    
    setIsUpdating(true);
    console.log(`Updating order ${item._id} from status ${item.status} to ${statusChange}`);
    
    dispatch(updateOrderStatus(item._id, statusChange))
      .then(() => {
        // Show success message
        Toast.show({
          topOffset: 60,
          type: 'success',
          text1: 'Order Updated Successfully',
          text2: '',
        });
        
        // Update local status display immediately
        updateStatusDisplay(statusChange);
        
        // Send a local notification about the status update
        sendOrderStatusNotification(item._id, statusChange)
          .catch(error => console.log("Error sending local notification:", error));
        
        // Navigate after successful update
        setTimeout(() => {
          setIsUpdating(false);
        }, 500);
      })
      .catch(error => {
        setIsUpdating(false);
        console.log("Update failed:", error);
        
        // Revert statusChange back to original status
        setStatusChange(item.status || "3");
        
        // Show error message
        Toast.show({
          topOffset: 60,
          type: 'error',
          text1: 'Update Failed',
          text2: 'Please try again',
        });
      });
  };
  
  // This function updates the visual indicators based on the status
  const updateStatusDisplay = (status) => {
    console.log("Updating status display to:", status);
    
    if (status === "3") {
      setOrderStatus(<TrafficLight unavailable></TrafficLight>);
      setStatusText("pending");
      setCardColor("#E74C3C");
    } else if (status === "2") {
      setOrderStatus(<TrafficLight limited></TrafficLight>);
      setStatusText("shipped");
      setCardColor("#F1C40F");
    } else if (status === "1") {
      setOrderStatus(<TrafficLight available></TrafficLight>);
      setStatusText("delivered");  
      setCardColor("#2ECC71");
    } else {
      // Handle unknown status
      console.log("Unknown status:", status);
      setOrderStatus(<TrafficLight unavailable></TrafficLight>);
      setStatusText("unknown");
      setCardColor("#95A5A6");
    }
  };

  const handleViewDetails = () => {
    if (navigation) {
      // Use _id instead of id to match MongoDB document identifier
      navigation.navigate("OrderDetail", { id: item._id });
    }
  };
  
  const handleReviewProducts = () => {
    if (navigation && item && item.orderItems && item.orderItems.length > 0) {
      // Navigate to a screen for reviewing products in this order
      navigation.navigate("ProductReviews", { 
        orderId: item._id,
        orderItems: item.orderItems
      });
    } else {
      Toast.show({
        topOffset: 60,
        type: 'error',
        text1: 'No Products',
        text2: 'This order has no products to review',
      });
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handleViewDetails}>
        <View style={[{ backgroundColor: cardColor }, styles.container]}>
          <View style={styles.headerContainer}>
            <Text style={styles.orderNumber}>Order Number: #{item._id}</Text>
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.statusText}>
              Status: {statusText} {orderStatus}
            </Text>
            <Text style={styles.addressText}>
              Address: {item.shippingAddress1} {item.shippingAddress2 ? item.shippingAddress2 : ''}
            </Text>
            <Text style={styles.infoText}>City: {item.city}</Text>
            <Text style={styles.infoText}>Country: {item.country}</Text>
            <Text style={styles.infoText}>
              Date Ordered: {item.dateOrdered ? item.dateOrdered.split("T")[0] : 'N/A'}
            </Text>
            
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>Price: </Text>
              <Text style={styles.price}>$ {item.totalPrice}</Text>
            </View>
            
            {update && (
              <View style={styles.updateContainer}>
                <Picker
                  selectedValue={statusChange}
                  onValueChange={(itemValue) => {
                    console.log("Status changed to:", itemValue);
                    setStatusChange(itemValue);
                    // Don't update display until button is clicked
                  }}
                  style={styles.picker}
                  enabled={!isUpdating}
                >
                  {codes.map((c) => (
                    <Picker.Item key={c.code} label={c.name} value={c.code} />
                  ))}
                </Picker>
                
                <EasyButton 
                  secondary 
                  large 
                  onPress={handleUpdateOrder}
                  disabled={isUpdating || statusChange === item.status}
                  style={[
                    styles.updateButton,
                    (isUpdating || statusChange === item.status) && styles.disabledButton
                  ]}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Update</Text>
                  )}
                </EasyButton>
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <EasyButton 
                primary 
                medium 
                onPress={handleViewDetails}
              >
                <Text style={styles.buttonText}>View Details</Text>
              </EasyButton>
              
              {/* Only show review button for delivered orders */}
              {statusText === "delivered" && (
                <EasyButton 
                  success
                  medium 
                  onPress={handleReviewProducts}
                >
                  <Text style={styles.buttonText}>Review Products</Text>
                </EasyButton>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    margin: 10,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  contentContainer: {
    paddingTop: 5,
  },
  statusText: {
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    marginBottom: 5,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
  },
  priceContainer: {
    marginTop: 15,
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 16,
  },
  price: {
    color: "white",
    fontWeight: "bold",
    fontSize: 18,
  },
  updateContainer: {
    marginTop: 15,
  },
  picker: {
    backgroundColor: "white",
    marginBottom: 15,
    borderRadius: 5,
    padding: 5,
  },
  updateButton: {
    marginTop: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonContainer: {
    marginTop: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  }
});

export default OrderCard;