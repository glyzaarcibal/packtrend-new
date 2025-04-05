import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Card, Divider } from 'react-native-paper';
import axios from 'axios';
import baseURL from '../../assets/common/baseurl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TrafficLight from '../Shared/StyledComponents/TrafficLight';
import EasyButton from '../Shared/StyledComponents/EasyButton';
import Toast from 'react-native-toast-message';
import { resetNotificationCount } from '../../utils/notificationService';

const OrderDetail = ({ route, navigation }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusText, setStatusText] = useState('');
  const [token, setToken] = useState('');
  
  const { id } = route.params;

  useEffect(() => {
    // Get JWT token
    AsyncStorage.getItem('jwt')
      .then((jwt) => {
        setToken(jwt);
        return jwt;
      })
      .then((jwt) => {
        // Reset notification badge count when viewing order details
        resetNotificationCount();
        fetchOrderDetails(jwt);
      })
      .catch((err) => {
        console.log('Error getting token:', err);
        setError('Authentication error');
        setLoading(false);
      });
  }, [id]);

  const fetchOrderDetails = async (jwt) => {
    try {
      setLoading(true);
      // Make sure baseURL ends with a slash, and add one if needed
      const url = `${baseURL.endsWith('/') ? baseURL : baseURL + '/'}orders/${id}`;
      console.log('Fetching order details from:', url);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      setOrder(response.data);
      updateStatusDisplay(response.data.status);
      setLoading(false);
    } catch (err) {
      console.log('Error fetching order details:', err);
      setError('Failed to load order details');
      setLoading(false);
      Toast.show({
        topOffset: 60,
        type: 'error',
        text1: 'Error loading order details',
        text2: 'Please try again later',
      });
    }
  };

  const updateStatusDisplay = (status) => {
    if (status === "3") {
      setStatusText("pending");
    } else if (status === "2") {
      setStatusText("shipped");
    } else if (status === "1") {
      setStatusText("delivered");
    } else {
      setStatusText("unknown");
    }
  };

  const renderStatusIcon = (status) => {
    if (status === "3") {
      return <TrafficLight unavailable />;
    } else if (status === "2") {
      return <TrafficLight limited />;
    } else if (status === "1") {
      return <TrafficLight available />;
    } else {
      return <TrafficLight unavailable />;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <EasyButton
          primary
          medium
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </EasyButton>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Order not found</Text>
        <EasyButton
          primary
          medium
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Go Back</Text>
        </EasyButton>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title 
          title={`Order #${order._id}`} 
          subtitle={`Placed on ${new Date(order.dateOrdered).toLocaleDateString()}`} 
        />
        <Card.Content>
          <View style={styles.statusContainer}>
            <Text style={styles.sectionTitle}>Status:</Text>
            <View style={styles.statusRow}>
              <Text style={styles.statusText}>{statusText}</Text>
              {renderStatusIcon(order.status)}
            </View>
          </View>

          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Shipping Information:</Text>
          <Text style={styles.infoText}>
            {order.shippingAddress1}
            {order.shippingAddress2 ? `, ${order.shippingAddress2}` : ''}
          </Text>
          <Text style={styles.infoText}>{order.city}, {order.zip}</Text>
          <Text style={styles.infoText}>{order.country}</Text>
          
          <Divider style={styles.divider} />
          
          <Text style={styles.sectionTitle}>Items:</Text>
          {order.orderItems.map((item) => (
            <View key={item._id || item.product} style={styles.itemContainer}>
              <View style={styles.itemRow}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                ${(item.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          
          <Divider style={styles.divider} />
          
          <View style={styles.paymentContainer}>
            <Text style={styles.sectionTitle}>Payment Details:</Text>
            <Text style={styles.infoText}>Method: {order.paymentMethod}</Text>
            
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>${order.totalPrice.toFixed(2)}</Text>
            </View>
          </View>
        </Card.Content>
      </Card>
      
      <View style={styles.buttonContainer}>
        <EasyButton
          secondary
          medium
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back to Orders</Text>
        </EasyButton>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    marginBottom: 20,
  },
  card: {
    margin: 10,
    elevation: 4,
  },
  divider: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusContainer: {
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    marginRight: 10,
    textTransform: 'capitalize',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 5,
  },
  itemContainer: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 14,
    alignSelf: 'flex-end',
  },
  paymentContainer: {
    marginTop: 5,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    padding: 10,
    backgroundColor: '#e6f7ff',
    borderRadius: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default OrderDetail;