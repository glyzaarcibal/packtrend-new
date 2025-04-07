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

export const createProduct = (productData) => async (dispatch) => {
  try {
    dispatch({ type: CREATE_PRODUCT_REQUEST });

    // Validate base URL
    if (!baseURL) {
      throw new Error("API base URL is not defined");
    }

    // Prepare form data for file upload
    const formData = new FormData();

    // Append all product data to formData
    Object.keys(productData).forEach(key => {
      if (key === 'images') {
        // Handle image files separately
        productData.images.forEach((file, index) => {
          formData.append('images', file);
        });
      } else {
        formData.append(key, productData[key]);
      }
    });

    // Construct URL for product creation
    const url = `${baseURL}create/products`;

    // Configure axios request
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    };

    // Make API call
    const { data } = await axios.post(url, formData, config);

    dispatch({
      type: CREATE_PRODUCT_SUCCESS,
      payload: data.product
    });

    return {
      success: true,
      product: data.product
    };
  } catch (error) {
    console.error("Create product error:", error);

    // Customize error message
    const errorMessage = error.response 
      ? error.response.data.message 
      : (error.message || "Failed to create product");

    dispatch({
      type: CREATE_PRODUCT_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      message: errorMessage
    };
  }
};

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


export const deleteProduct = (id) => async (dispatch) => {
  try {
    // Validate product ID
    if (!isValidObjectId(id)) {
      throw new Error("Invalid product ID format");
    }

    dispatch({ type: DELETE_PRODUCT_REQUEST });

    // Validate base URL
    if (!baseURL) {
      throw new Error("API base URL is not defined");
    }

    
const url = `${baseURL}delete/product/${id}`;
    
    // Make API call to delete the product
    const { data } = await axios.delete(url);

    dispatch({
      type: DELETE_PRODUCT_SUCCESS,
      payload: id
    });

    return {
      success: true,
      message: data.message || "Product deleted successfully"
    };
  } catch (error) {
    console.error("Delete product error:", error);

    // Customize error message
    const errorMessage = error.response 
      ? error.response.data.message 
      : (error.message || "Failed to delete product");

    dispatch({
      type: DELETE_PRODUCT_FAILURE,
      payload: errorMessage
    });

    return {
      success: false,
      message: errorMessage
    };
  }
};

// Clear errors
export const clearErrors = () => {
  return {
    type: 'CLEAR_ERRORS'
  };
};