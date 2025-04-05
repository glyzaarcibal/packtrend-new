import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Dimensions, ScrollView, Button, Text } from "react-native";
import { Surface, Avatar, Divider } from 'react-native-paper';

import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux'
import AsyncStorage from "@react-native-async-storage/async-storage"
import { clearCart } from '../../../Redux/Actions/cartActions';
import axios from 'axios';
import baseURL from '../../../assets/common/baseurl';
import Toast from 'react-native-toast-message';
var { width, height } = Dimensions.get("window");

const Confirm = (props) => {
    const [token, setToken] = useState();
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const finalOrder = props.route.params;
    const dispatch = useDispatch()
    let navigation = useNavigation()

    useEffect(() => {
        // Get token when component mounts
        AsyncStorage.getItem("jwt")
            .then((res) => {
                setToken(res)
            })
            .catch((error) => console.log(error))
    }, []);

    const confirmOrder = () => {
        // Check if finalOrder structure exists
        if (!finalOrder) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "No order data found",
                text2: "Please try again",
            });
            return;
        }
        
        if (!finalOrder.order) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Invalid order structure",
                text2: "Missing order object",
            });
            return;
        }
        
        if (!finalOrder.order.order) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Invalid order structure",
                text2: "Missing order details",
            });
            return;
        }

        const order = finalOrder.order.order;
        
        // Debug: Log order data structure
        console.log("Order data being sent:", JSON.stringify(order, null, 2));
        
        // Check for missing fields one by one with specific error messages
        const missingFields = [];
        
        if (!order.orderItems) {
            missingFields.push("Order items");
        } else if (!Array.isArray(order.orderItems) || order.orderItems.length === 0) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "No items in order",
                text2: "Your cart appears to be empty",
            });
            return;
        }
        
        // Calculate totalPrice if missing or ensure it's a valid number
        let calculatedTotal = 0;
        let hasValidPrice = true;

        try {
            // Verify each item has a valid price
            calculatedTotal = order.orderItems.reduce((total, item, index) => {
                if (typeof item.price !== 'number' || isNaN(item.price)) {
                    console.error(`Invalid price for item at index ${index}:`, item);
                    hasValidPrice = false;
                    return total;
                }
                
                const quantity = item.quantity || 1;
                return total + (item.price * quantity);
            }, 0);
            
            // Ensure we have a valid total
            if (!hasValidPrice) {
                throw new Error("Some items have invalid prices");
            }
            
            // Ensure total price is a valid number
            order.totalPrice = calculatedTotal;
            if (typeof order.totalPrice !== 'number' || isNaN(order.totalPrice) || order.totalPrice <= 0) {
                console.error("Invalid total price:", order.totalPrice);
                throw new Error("Total price must be a positive number");
            }
            
            // Log the calculated total
            console.log("Calculated total price:", order.totalPrice);
        } catch (error) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Invalid price information",
                text2: error.message || "Please check your cart items",
            });
            return;
        }
        
        if (!order.shippingAddress1) {
            missingFields.push("Shipping address");
        }
        
        if (!order.city) {
            missingFields.push("City");
        }
        
        if (!order.zip) {
            missingFields.push("Zip/postal code");
        }
        
        if (!order.country) {
            missingFields.push("Country");
        }
        
        if (missingFields.length > 0) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Missing information",
                text2: `Please provide: ${missingFields.join(", ")}`,
            });
            return;
        }
        
        // Validate orderItems structure
        const invalidItems = [];
        order.orderItems.forEach((item, index) => {
            const itemIssues = [];
            
            if (!item.product && !item.id && !item._id) {
                itemIssues.push("product ID");
            }
            
            if (!item.price) {
                itemIssues.push("price");
            }
            
            if (!item.name) {
                itemIssues.push("name");
            }
            
            if (itemIssues.length > 0) {
                invalidItems.push(`Item #${index + 1}: missing ${itemIssues.join(", ")}`);
            }
        });
        
        if (invalidItems.length > 0) {
            console.error("Invalid order items:", invalidItems);
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Invalid items in cart",
                text2: "Some items are missing required information",
            });
            return;
        }

        // Validate token
        if (!token) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Authentication required",
                text2: "Please login again",
            });
            return;
        }

        // Format the order data to match server expectations
        const serverOrder = {
            orderItems: order.orderItems.map(item => ({
                product: item._id?.$oid || item._id || item.id || 0,
                quantity: item.quantity || 1,
                price: item.price,
                name: item.name,
                image: item.image || null
            })),
            shippingAddress1: order.shippingAddress1,
            shippingAddress2: order.shippingAddress2 || '',
            city: order.city,
            zip: order.zip,
            country: order.country,
            totalPrice: order.totalPrice
        };

        // Right before the axios call - add comprehensive logging
        console.log("Final order data check:");
        console.log("totalPrice:", serverOrder.totalPrice, typeof serverOrder.totalPrice);
        console.log("orderItems check:", serverOrder.orderItems.map(item => ({
            name: item.name,
            price: item.price,
            type: typeof item.price,
            quantity: item.quantity
        })));

        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        // Ensure URL is correctly formed
        const url = `${baseURL}orders`;
        console.log("Sending request to:", url);
        console.log("Formatted order data:", JSON.stringify(serverOrder, null, 2));

        // Make the request
        axios
            .post(url, serverOrder, config)
            .then((res) => {
                if (res.status == 200 || res.status == 201) {
                    // Store order ID if returned by server
                    if (res.data && res.data.orderId) {
                        setOrderId(res.data.orderId);
                    }
                    
                    // Set order success flag
                    setOrderSuccess(true);
                    
                    Toast.show({
                        topOffset: 60,
                        type: "success",
                        text1: "Order Completed",
                        text2: res.data.message || "Your order has been placed successfully",
                    });

                    // Store order ID in AsyncStorage for reference
                    if (res.data && res.data.orderId) {
                        AsyncStorage.setItem("lastOrderId", res.data.orderId.toString())
                            .catch(err => console.error("Failed to save order ID:", err));
                    }

                    setTimeout(() => {
                        dispatch(clearCart())
                        navigation.navigate("Cart");
                    }, 500);
                }
            })
            .catch((error) => {
                console.error("Order submission error:", error);
                setOrderSuccess(false);
                
                // Log detailed error info
                if (error.response) {
                    // The server responded with a status code outside the 2xx range
                    console.error("Server error data:", error.response.data);
                    console.error("Server error status:", error.response.status);
                    console.error("Server error headers:", error.response.headers);
                    
                    Toast.show({
                        topOffset: 60,
                        type: "error",
                        text1: `Server error (${error.response.status})`,
                        text2: error.response.data.error || "Please try again",
                    });
                } else if (error.request) {
                    // The request was made but no response was received
                    console.error("No response received:", error.request);
                    
                    Toast.show({
                        topOffset: 60,
                        type: "error",
                        text1: "No response from server",
                        text2: "Check your internet connection",
                    });
                } else {
                    // Something happened in setting up the request
                    console.error("Request setup error:", error.message);
                    
                    Toast.show({
                        topOffset: 60,
                        type: "error",
                        text1: "Request failed",
                        text2: error.message,
                    });
                }
            });
    }

    // Function to check order status
    const checkOrderStatus = async () => {
        if (!orderId) {
            Toast.show({
                topOffset: 60,
                type: "info",
                text1: "No order to check",
                text2: "Please place an order first",
            });
            return;
        }
        
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };
            
            const response = await axios.get(`${baseURL}orders/${orderId}`, config);
            
            Toast.show({
                topOffset: 60,
                type: "info",
                text1: "Order Status",
                text2: `Status: ${response.data.status || "Processing"}`,
            });
        } catch (error) {
            console.error("Failed to check order status:", error);
            
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Failed to check order",
                text2: "Please try again later",
            });
        }
    }
    
    return (
        <Surface>
            <ScrollView contentContainerStyle={styles.container} width="90%">
                <View style={styles.titleContainer}>
                    <Text style={{ fontSize: 20, fontWeight: "bold" }}>Confirm Order</Text>
                    {orderSuccess && (
                        <View style={styles.successContainer}>
                            <Text style={styles.successText}>Order Placed Successfully!</Text>
                            {orderId && <Text>Order ID: {orderId}</Text>}
                        </View>
                    )}
                    {props.route.params ? (
                        <View style={{ borderWidth: 1, borderColor: "orange" }} width="90%">
                            <Text style={styles.title}>Shipping to:</Text>
                            <View style={{ padding: 8 }}>
                                <Text>Address: {finalOrder.order.order.shippingAddress1}</Text>
                                <Text>Address2: {finalOrder.order.order.shippingAddress2}</Text>
                                <Text>City: {finalOrder.order.order.city}</Text>
                                <Text>Zip Code: {finalOrder.order.order.zip}</Text>
                                <Text>Country: {finalOrder.order.order.country}</Text>
                            </View>
                            <Text style={styles.title}>items</Text>

                            {finalOrder.order.order.orderItems.map((item, index) => {
                                return (
                                  <Surface 
                                    style={styles.itemContainer}
                                    key={item.id ? item.id.toString() : item._id ? item._id.toString() : `item-${index}`}
                                  >
                                    <View style={styles.body}>
                                        <Avatar.Image 
                                            size={48} 
                                            source={{
                                                uri: item.image
                                                    ? item.image 
                                                    : 'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png'
                                            }} 
                                        />
                                        
                                        <View style={styles.itemDetails}>
                                            <Text style={styles.itemName}>
                                                {item.name}
                                            </Text>
                                            
                                            <Divider />
                                            
                                            <Text style={styles.itemPrice}>
                                                $ {item.price}
                                            </Text>
                                        </View>
                                    </View>
                                  </Surface>
                                )
                            })}
                        </View>
                    ) : null}
                    <View style={{ alignItems: "center", margin: 20 }}>
                        {orderSuccess ? (
                            <View style={styles.buttonContainer}>
                                <Button
                                    title={"Check Order Status"}
                                    onPress={checkOrderStatus}
                                />
                            </View>
                        ) : (
                            <Button
                                title={"Place order"}
                                onPress={confirmOrder}
                            />
                        )}
                    </View>
                </View>
            </ScrollView>
        </Surface>
    )
}

const styles = StyleSheet.create({
    container: {
        height: height,
        padding: 8,
        alignContent: "center",
        backgroundColor: "white",
    },
    titleContainer: {
        justifyContent: "center",
        alignItems: "center",
        margin: 8,
    },
    title: {
        alignSelf: "center",
        margin: 8,
        fontSize: 16,
        fontWeight: "bold",
    },
    itemContainer: {
        backgroundColor: "white",
        marginVertical: 5,
        padding: 10,
        borderRadius: 5,
    },
    body: {
        alignItems: "center",
        flexDirection: "row",
    },
    itemDetails: {
        marginLeft: 10,
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        marginBottom: 5,
    },
    itemPrice: {
        fontSize: 14,
        color: "#555",
        marginTop: 5,
    },
    successContainer: {
        backgroundColor: "#E8F5E9",
        padding: 15,
        borderRadius: 5,
        marginVertical: 10,
        alignItems: "center",
        width: "90%",
        borderWidth: 1,
        borderColor: "#81C784",
    },
    successText: {
        color: "#2E7D32",
        fontSize: 16,
        fontWeight: "bold",
    },
    buttonContainer: {
        marginTop: 10,
    }
});

export default Confirm;