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

    // Check if products exist in the response
    if (!data || !data.product || !Array.isArray(data.product)) {
      throw new Error("Invalid product data received");
    }

    dispatch({
      type: FETCH_PRODUCTS_SUCCESS,
      payload: data.product,
    });
    
    return {
      success: true,
      products: data.product
    };
  } catch (error) {
    console.error("Fetch products error:", error);
    
    // Customize error message
    const errorMessage = error.response 
      ? error.response.data.message 
      : (error.message || "Failed to fetch products");

    dispatch({
      type: FETCH_PRODUCTS_FAILURE,
      payload: errorMessage,
    });
    
    return {
      success: false,
      message: errorMessage
    };
  }
};

// Rest of the code remains the same as in the previous version
// (other action creators like selectProduct, createProduct, etc.)

export const selectProduct = (product) => {
  return {
    type: SELECT_PRODUCT,
    payload: product
  };
};

export const clearSelectedProduct = () => {
  return {
    type: CLEAR_SELECTED_PRODUCT
  };
};

// Clear errors
export const clearErrors = () => {
  return {
    type: 'CLEAR_ERRORS'
  };
};