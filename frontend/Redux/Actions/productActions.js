import { 
  CREATE_PRODUCT_REQUEST,
  CREATE_PRODUCT_SUCCESS,
  CREATE_PRODUCT_FAILURE,
  
  UPDATE_PRODUCT_REQUEST,
  UPDATE_PRODUCT_SUCCESS,
  UPDATE_PRODUCT_FAILURE,
  
  FETCH_PRODUCTS_REQUEST,
  FETCH_PRODUCTS_SUCCESS,
  FETCH_PRODUCTS_FAILURE,
  
  SELECT_PRODUCT,
  CLEAR_SELECTED_PRODUCT,
  
  DELETE_PRODUCT_REQUEST,
  DELETE_PRODUCT_SUCCESS,
  DELETE_PRODUCT_FAILURE
} from '../constants';

import axios from 'axios';
import baseURL from '../../assets/common/baseurl';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to validate MongoDB ObjectId format
const isValidObjectId = (id) => {
  return id && /^[0-9a-fA-F]{24}$/.test(id);
};

// Fetch all products
export const fetchProducts = () => async (dispatch) => {
  try {
    dispatch({ type: FETCH_PRODUCTS_REQUEST });

    // Add error handling for the API URL
    if (!baseURL) {
      throw new Error("API base URL is not defined");
    }

    // Ensure the URL is properly formatted
    const url = `${baseURL}get/products`;
    console.log("Fetching products from:", url);
    
    const { data } = await axios.get(url);
    
    console.log("Products data received:", data);

    dispatch({
      type: FETCH_PRODUCTS_SUCCESS,
      payload: data.product || [], // Ensure we always have an array
    });
    
    return {
      success: true,
      products: data.product || []
    };
  } catch (error) {
    console.log("Fetch products error:", error);
    dispatch({
      type: FETCH_PRODUCTS_FAILURE,
      payload: error.response && error.response.data.message 
        ? error.response.data.message 
        : error.message,
    });
    
    return {
      success: false,
      message: error.response && error.response.data.message 
        ? error.response.data.message 
        : error.message
    };
  }
};

// Fetch single product (select product)
export const selectProduct = (product) => {
  return {
    type: SELECT_PRODUCT,
    payload: product
  };
};

// Clear selected product
export const clearSelectedProduct = () => {
  return {
    type: CLEAR_SELECTED_PRODUCT
  };
};

// Create a new product
export const createProduct = (productData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_PRODUCT_REQUEST });

    const token = await AsyncStorage.getItem('jwt');
    if (!token) {
      throw new Error("Authorization token is required");
    }
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    };

    // Ensure the URL is properly formatted
    const url = `${baseURL}create/products`;
    console.log("Creating product at:", url);
    
    const { data } = await axios.post(url, productData, config);

    dispatch({
      type: CREATE_PRODUCT_SUCCESS,
      payload: data.product,
    });
    
    return {
      success: true,
      product: data.product,
      message: data.message || "Product created successfully"
    };
  } catch (error) {
    console.error("Create product error:", error);
    dispatch({
      type: CREATE_PRODUCT_FAILURE,
      payload: error.response && error.response.data.message 
        ? error.response.data.message 
        : error.message,
    });
    
    return {
      success: false,
      message: error.response && error.response.data.message 
        ? error.response.data.message 
        : error.message
    };
  }
};

// Update a product
export const updateProduct = ({ productId, productData }) => async (dispatch) => {
  try {
    dispatch({ type: UPDATE_PRODUCT_REQUEST });

    // Validate product ID
    if (!isValidObjectId(productId)) {
      throw new Error("Invalid product ID format");
    }

    const token = await AsyncStorage.getItem('jwt');
    if (!token) {
      throw new Error("Authorization token is required");
    }
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    };

    // Make sure productId is a string
    const id = String(productId);
    console.log("Updating product with ID:", id);
    
    // Ensure the URL is properly formatted
    const url = `${baseURL}update/product/${id}`;
    console.log("Updating product at:", url);
    
    const { data } = await axios.put(url, productData, config);

    dispatch({
      type: UPDATE_PRODUCT_SUCCESS,
      payload: data.product,
    });
    
    return {
      success: true,
      product: data.product,
      message: data.message || "Product updated successfully"
    };
  } catch (error) {
    console.log("Update product error:", error);
    dispatch({
      type: UPDATE_PRODUCT_FAILURE,
      payload: error.response && error.response.data.message 
        ? error.response.data.message 
        : error.message,
    });
    
    return {
      success: false,
      message: error.response && error.response.data.message 
        ? error.response.data.message 
        : error.message
    };
  }
};

// Delete a product
export const deleteProduct = (id) => async (dispatch) => {
  try {
    dispatch({ type: DELETE_PRODUCT_REQUEST });

    // Validate product ID
    if (!isValidObjectId(id)) {
      throw new Error("Invalid product ID format");
    }

    const token = await AsyncStorage.getItem('jwt');
    if (!token) {
      throw new Error("Authorization token is required");
    }
    
    const config = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    // Ensure the URL is properly formatted
    const url = `${baseURL}delete/product/${id}`;
    console.log("Deleting product at:", url);
    
    const { data } = await axios.delete(url, config);

    dispatch({
      type: DELETE_PRODUCT_SUCCESS,
      payload: id,
    });
    
    return {
      success: true,
      message: data.message || "Product deleted successfully"
    };
  } catch (error) {
    console.log("Delete product error:", error);
    dispatch({
      type: DELETE_PRODUCT_FAILURE,
      payload: error.response && error.response.data.message 
        ? error.response.data.message 
        : error.message,
    });
    
    return {
      success: false,
      message: error.response && error.response.data.message 
        ? error.response.data.message 
        : error.message
    };
  }
};

// Clear errors
export const clearErrors = () => {
  return {
    type: 'CLEAR_ERRORS'
  };
};