import React, { useState, useEffect } from 'react'
import { View, StyleSheet, Dimensions, ScrollView, Image, Text } from "react-native";
import { Surface, Divider, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux'
import AsyncStorage from "@react-native-async-storage/async-storage"
import { clearCart } from '../../../Redux/Actions/cartActions';
import axios from 'axios';
import baseURL from '../../../assets/common/baseurl';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';

var { width, height } = Dimensions.get("window");

const Confirm = (props) => {
    const [token, setToken] = useState();
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const finalOrder = props.route.params;
    const dispatch = useDispatch()
    let navigation = useNavigation()

    useEffect(() => {
        AsyncStorage.getItem("jwt")
            .then((res) => {
                setToken(res)
            })
            .catch((error) => console.log(error))
    }, []);

    const confirmOrder = () => {
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
        console.log("Order data being sent:", JSON.stringify(order, null, 2));
        
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
        
        let calculatedTotal = 0;
        let hasValidPrice = true;
    
        try {
            calculatedTotal = order.orderItems.reduce((total, item, index) => {
                if (typeof item.price !== 'number' || isNaN(item.price)) {
                    console.error(`Invalid price for item at index ${index}:`, item);
                    hasValidPrice = false;
                    return total;
                }
                
                const quantity = item.quantity || 1;
                return total + (item.price * quantity);
            }, 0);
            
            if (!hasValidPrice) {
                throw new Error("Some items have invalid prices");
            }
            
            if (typeof calculatedTotal !== 'number' || isNaN(calculatedTotal) || calculatedTotal <= 0) {
                console.error("Invalid calculated total price:", calculatedTotal);
                throw new Error("Total price must be a positive number");
            }
            
            console.log("Calculated total price:", calculatedTotal);
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
        
        const invalidItems = [];
        order.orderItems.forEach((item, index) => {
            const itemIssues = [];
            
            if (!item.product && !item._id && !item.id) {
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
    
        if (!token) {
            Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Authentication required",
                text2: "Please login again",
            });
            return;
        }

        const serverOrder = {
            cartItems: order.orderItems.map(item => ({
                _id: item._id || item.id || item.product,
                name: item.name,
                quantity: item.quantity || 1,
                price: item.price,
                images: item.images || [item.image] || []
            })),
            totalPrice: calculatedTotal,
            shippingAddress: {
                address1: order.shippingAddress1,
                address2: order.shippingAddress2 || '',
                city: order.city,
                zip: order.zip,
                country: order.country
            },
            paymentMethod: order.paymentMethod || 'Cash'
        };
    
        console.log("Final order data check:");
        console.log("totalPrice:", serverOrder.totalPrice, typeof serverOrder.totalPrice);
        console.log("cartItems check:", serverOrder.cartItems.map(item => ({
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
    
        const url = `${baseURL}order`;
        console.log("Sending request to:", url);
        console.log("Formatted order data:", JSON.stringify(serverOrder, null, 2));
    
        axios
            .post(url, serverOrder, config)
            .then((res) => {
                if (res.status == 200 || res.status == 201) {
                    if (res.data && res.data._id) {
                        setOrderId(res.data._id);
                    }
                    
                    setOrderSuccess(true);
                    
                    Toast.show({
                        topOffset: 60,
                        type: "success",
                        text1: "Order Completed",
                        text2: res.data.message || "Your order has been placed successfully",
                    });
    
                    if (res.data && res.data._id) {
                        AsyncStorage.setItem("lastOrderId", res.data._id.toString())
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
                
                if (error.response) {
                    console.error("Server error data:", error.response.data);
                    console.error("Server error status:", error.response.status);
                    console.error("Server error headers:", error.response.headers);
                    
                    Toast.show({
                        topOffset: 60,
                        type: "error",
                        text1: `Server error (${error.response.status})`,
                        text2: error.response.data.message || "Please try again",
                    });
                } else if (error.request) {
                    console.error("No response received:", error.request);
                    
                    Toast.show({
                        topOffset: 60,
                        type: "error",
                        text1: "No response from server",
                        text2: "Check your internet connection",
                    });
                } else {
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
            
            const response = await axios.get(`${baseURL}get/single/order`, config);
            const orderDetails = response.data.order.find(o => o._id === orderId);
            
            if (orderDetails) {
                Toast.show({
                    topOffset: 60,
                    type: "info",
                    text1: "Order Status",
                    text2: `Status: ${orderDetails.orderStatus || "Processing"}`,
                });
            } else {
                Toast.show({
                    topOffset: 60,
                    type: "info",
                    text1: "Order Status",
                    text2: "Order found but no status available",
                });
            }
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
        <Surface style={styles.surface}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={styles.titleContainer}>
                    <Text style={styles.headerText}>Confirm Order</Text>
                    {orderSuccess && (
                        <View style={styles.successContainer}>
                            <Icon name="check-circle" size={24} color="#4CAF50" />
                            <Text style={styles.successText}>Order Placed Successfully!</Text>
                            {orderId && <Text style={styles.orderIdText}>Order ID: {orderId}</Text>}
                        </View>
                    )}
                    {props.route.params ? (
                        <View style={styles.orderSummaryContainer}>
                            <View style={styles.sectionHeader}>
                                <Icon name="local-shipping" size={20} color="#555" />
                                <Text style={styles.sectionTitle}>Shipping to:</Text>
                            </View>
                            <View style={styles.shippingDetails}>
                                <View style={styles.detailRow}>
                                    <Icon name="location-on" size={16} color="#777" />
                                    <Text style={styles.detailText}>Address: {finalOrder.order.order.shippingAddress1}</Text>
                                </View>
                                {finalOrder.order.order.shippingAddress2 && (
                                    <View style={styles.detailRow}>
                                        <Icon name="location-on" size={16} color="#777" />
                                        <Text style={styles.detailText}>Address 2: {finalOrder.order.order.shippingAddress2}</Text>
                                    </View>
                                )}
                                <View style={styles.detailRow}>
                                    <Icon name="location-city" size={16} color="#777" />
                                    <Text style={styles.detailText}>City: {finalOrder.order.order.city}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Icon name="markunread-mailbox" size={16} color="#777" />
                                    <Text style={styles.detailText}>Zip Code: {finalOrder.order.order.zip}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Icon name="public" size={16} color="#777" />
                                    <Text style={styles.detailText}>Country: {finalOrder.order.order.country}</Text>
                                </View>
                            </View>

                            <View style={styles.sectionHeader}>
                                <Icon name="shopping-cart" size={20} color="#555" />
                                <Text style={styles.sectionTitle}>Order Items</Text>
                            </View>

                            {finalOrder.order.order.orderItems.map((item, index) => {
                                const imageUri = item.image 
                                    ? item.image 
                                    : item.images && item.images.length > 0
                                    ? item.images[0]
                                    : 'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png';
                                
                                return (
                                  <Surface 
                                    style={styles.itemContainer}
                                    elevation={2}
                                    key={item.id ? item.id.toString() : item._id ? item._id.toString() : `item-${index}`}
                                  >
                                    <View style={styles.body}>
                                        <View style={styles.imageContainer}>
                                            <Image 
                                                source={{ uri: imageUri }}
                                                style={styles.productImage}
                                                resizeMode="contain"
                                            />
                                        </View>
                                        
                                        <View style={styles.itemDetails}>
                                            <Text style={styles.itemName} numberOfLines={2}>
                                                {item.name}
                                            </Text>
                                            
                                            <Divider style={styles.divider} />
                                            
                                            <Text style={styles.itemPrice}>
                                               ₱  {item.price}
                                            </Text>
                                        </View>
                                    </View>
                                  </Surface>
                                )
                            })}
                        </View>
                    ) : null}
                    <View style={styles.buttonWrapper}>
                        {orderSuccess ? (
                            <Button 
                                mode="contained" 
                                onPress={checkOrderStatus}
                                style={styles.actionButton}
                                labelStyle={styles.buttonLabel}
                                icon="refresh"
                            >
                                Check Order Status
                            </Button>
                        ) : (
                            <Button 
                                mode="contained" 
                                onPress={confirmOrder}
                                style={styles.actionButton}
                                labelStyle={styles.buttonLabel}
                                icon="check"
                            >
                                Place Order
                            </Button>
                        )}
                    </View>
                </View>
            </ScrollView>
        </Surface>
    )
}

const styles = StyleSheet.create({
    surface: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    container: {
        padding: 16,
        paddingBottom: 32,
    },
    titleContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    headerText: {
        fontSize: 24,
        fontWeight: "bold",
        color: '#333',
        marginBottom: 16,
    },
    orderSummaryContainer: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 16,
        marginVertical: 8,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "bold",
        color: '#333',
        marginLeft: 8,
    },
    shippingDetails: {
        marginBottom: 16,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    detailText: {
        fontSize: 14,
        color: '#555',
        marginLeft: 8,
    },
    itemContainer: {
        backgroundColor: "white",
        marginVertical: 8,
        padding: 12,
        borderRadius: 8,
    },
    body: {
        alignItems: "center",
        flexDirection: "row",
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eee',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    itemDetails: {
        marginLeft: 16,
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
        marginBottom: 8,
    },
    divider: {
        backgroundColor: '#e0e0e0',
        marginVertical: 8,
    },
    priceContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    quantityText: {
        fontSize: 14,
        color: '#777',
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2E7D32',
    },
    successContainer: {
        backgroundColor: "#E8F5E9",
        padding: 16,
        borderRadius: 8,
        marginVertical: 16,
        alignItems: "center",
        width: "100%",
        borderWidth: 1,
        borderColor: "#81C784",
        flexDirection: 'row',
    },
    successText: {
        color: "#2E7D32",
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 8,
    },
    orderIdText: {
        color: "#555",
        fontSize: 14,
        marginTop: 4,
    },
    buttonWrapper: {
        width: '100%',
        marginTop: 24,
        paddingHorizontal: 16,
    },
    actionButton: {
        borderRadius: 8,
        paddingVertical: 6,
        backgroundColor: '#3f51b5',
    },
    buttonLabel: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default Confirm;
