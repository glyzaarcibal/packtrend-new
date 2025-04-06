// Redux/Actions/orderActions.js
import axios from 'axios';
import baseURL from "../../assets/common/baseurl";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from "react-native-toast-message";
import TokenManager from '../../utils/tokenManager'; // Update path as needed
import { 
  ORDERS_LOADING,
  FETCH_ORDERS_SUCCESS,
  FETCH_ORDERS_FAIL,
  UPDATE_ORDER_LOADING,
  UPDATE_ORDER_SUCCESS,
  UPDATE_ORDER_FAIL,
  FETCH_USER_ORDERS_SUCCESS
} from '../constants';

// Fetch all orders - for admin
export const fetchOrders = () => {
  return async (dispatch) => {
    dispatch({ type: ORDERS_LOADING });
    try {
      // Get fresh token
      const token = await TokenManager.getToken();
      
      if (!token) {
        throw new Error('Authentication token not found or invalid');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const response = await axios.get(`${baseURL}all/orders`, config);
      dispatch({
        type: FETCH_ORDERS_SUCCESS,
        payload: response.data.order
      });
    } catch (error) {
      console.log('Error fetching orders:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        await TokenManager.removeToken();
        Toast.show({
          topOffset: 60,
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please log in again',
        });
      }
      
      dispatch({
        type: FETCH_ORDERS_FAIL,
        payload: error.response?.data?.message || 'Failed to fetch orders'
      });
    }
  };
};

// Fetch orders for specific user
export const fetchUserOrders = () => {
  return async (dispatch) => {
    dispatch({ type: ORDERS_LOADING });
    try {
      // Get fresh token
      const token = await TokenManager.getToken();
      
      if (!token) {
        throw new Error('Authentication token not found or invalid');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
      
      const response = await axios.get(`${baseURL}get/single/order`, config);
      dispatch({
        type: FETCH_USER_ORDERS_SUCCESS,
        payload: response.data.order
      });
    } catch (error) {
      console.log('Error fetching user orders:', error);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        await TokenManager.removeToken();
        Toast.show({
          topOffset: 60,
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please log in again',
        });
      }
      
      dispatch({
        type: FETCH_ORDERS_FAIL,
        payload: error.response?.data?.message || 'Failed to fetch orders'
      });
    }
  };
};

// Update order status
export const updateOrderStatus = (orderId, status) => {
  return async (dispatch) => {
    dispatch({ type: UPDATE_ORDER_LOADING });
    try {
      // Get fresh token
      const token = await TokenManager.getToken();
      
      if (!token) {
        throw new Error('Authentication token not found or invalid');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      console.log('Updating order with payload:', { orderId, status });

      // Send the update request
      const response = await axios.put(
        `${baseURL}orders/${orderId}`,
        { status },
        config
      );

      dispatch({
        type: UPDATE_ORDER_SUCCESS,
        payload: {
          id: orderId,
          status,
          updatedOrder: response.data.order
        }
      });

      Toast.show({
        topOffset: 60,
        type: 'success',
        text1: 'Order Updated Successfully',
        text2: '',
      });

      return response.data;
      
    } catch (error) {
      console.log('Error updating order:', error.response?.data || error.message);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        await TokenManager.removeToken();
        Toast.show({
          topOffset: 60,
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please log in again',
        });
      } else {
        Toast.show({
          topOffset: 60,
          type: 'error',
          text1: 'Update Failed',
          text2: 'Please try again',
        });
      }
      
      dispatch({
        type: UPDATE_ORDER_FAIL,
        payload: error.response?.data?.message || 'Failed to update order'
      });
      
      throw error;
    }
  };
};

// Place new order
export const placeOrder = (orderData) => {
  return async (dispatch) => {
    try {
      // Get fresh token
      const token = await TokenManager.getToken();
      
      if (!token) {
        Toast.show({
          topOffset: 60,
          type: 'error',
          text1: 'Authentication Failed',
          text2: 'Please log in again',
        });
        throw new Error('Authentication token not found or invalid');
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Make sure we're sending the initial status
      const dataToSend = {
        ...orderData,
        status: orderData.status || '3' // Default to pending
      };

      console.log("Placing order with data:", dataToSend);

      const response = await axios.post(
        `${baseURL}order`,
        dataToSend,
        config
      );

      Toast.show({
        topOffset: 60,
        type: 'success',
        text1: 'Order Placed Successfully',
        text2: '',
      });

      return response.data;
      
    } catch (error) {
      console.log('Error placing order:', error.response?.data || error.message);
      
      // Handle authentication errors
      if (error.response?.status === 401) {
        await TokenManager.removeToken();
        Toast.show({
          topOffset: 60,
          type: 'error',
          text1: 'Session Expired',
          text2: 'Please log in again',
        });
      } else {
        Toast.show({
          topOffset: 60,
          type: 'error',
          text1: 'Failed to Place Order',
          text2: error.response?.data?.message || 'Please try again',
        });
      }
      
      throw error;
    }
  };
};