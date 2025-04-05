import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import baseURL from '../../assets/common/baseurl';
import AsyncStorage from '@react-native-async-storage/async-storage';
import OrderCard from '../Shared/OrderCard';
import { resetNotificationCount } from '../../utils/notificationService';

const MyOrders = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('jwt');
      if (!token) {
        setError('You must be logged in to view orders');
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${baseURL}get/single/order`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.order) {
        setOrders(response.data.order);
      } else {
        setOrders([]);
      }
      
      setLoading(false);
      resetNotificationCount(); // Reset notification badge count
      
    } catch (err) {
      console.log('Error fetching orders:', err);
      setError('Failed to load orders');
      setLoading(false);
    }
  }, []);

  // Fetch orders when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders().then(() => setRefreshing(false));
  }, [fetchOrders]);

  const renderOrderItem = ({ item }) => {
    return <OrderCard item={item} navigation={navigation} />;
  };

  const renderEmptyList = () => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You have no orders yet</Text>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading orders...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#0000ff']}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    padding: 10,
    paddingBottom: 50,
    flexGrow: 1,
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
    marginBottom: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#777',
    textAlign: 'center',
  },
});

export default MyOrders;