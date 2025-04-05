import {
  FETCH_PRODUCTS_REQUEST,
  FETCH_PRODUCTS_SUCCESS,
  FETCH_PRODUCTS_FAILURE,
  
  CREATE_PRODUCT_REQUEST,
  CREATE_PRODUCT_SUCCESS,
  CREATE_PRODUCT_FAILURE,
  
  UPDATE_PRODUCT_REQUEST,
  UPDATE_PRODUCT_SUCCESS,
  UPDATE_PRODUCT_FAILURE,
  
  DELETE_PRODUCT_REQUEST,
  DELETE_PRODUCT_SUCCESS,
  DELETE_PRODUCT_FAILURE,
  
  SELECT_PRODUCT,
  CLEAR_SELECTED_PRODUCT
} from '../constants';

// Initial state
const initialState = {
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,
};

// Products reducer
export const productsReducer = (state = initialState, action) => {
  switch (action.type) {
    // Fetch products
    case FETCH_PRODUCTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case FETCH_PRODUCTS_SUCCESS:
      return {
        ...state,
        loading: false,
        products: action.payload,
        error: null
      };
    case FETCH_PRODUCTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // Create product
    case CREATE_PRODUCT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case CREATE_PRODUCT_SUCCESS:
      return {
        ...state,
        loading: false,
        products: [...state.products, action.payload],
        error: null
      };
    case CREATE_PRODUCT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // Update product
    case UPDATE_PRODUCT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case UPDATE_PRODUCT_SUCCESS:
      return {
        ...state,
        loading: false,
        products: state.products.map(product => 
          product._id === action.payload._id ? action.payload : product
        ),
        error: null
      };
    case UPDATE_PRODUCT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // Delete product
    case DELETE_PRODUCT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case DELETE_PRODUCT_SUCCESS:
      return {
        ...state,
        loading: false,
        products: state.products.filter(product => product._id !== action.payload),
        error: null
      };
    case DELETE_PRODUCT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // Select product
    case SELECT_PRODUCT:
      return {
        ...state,
        selectedProduct: action.payload
      };
    case CLEAR_SELECTED_PRODUCT:
      return {
        ...state,
        selectedProduct: null
      };
      
    // Clear errors
    case 'CLEAR_ERRORS':
      return {
        ...state,
        error: null
      };
      
    default:
      return state;
  }
};

export default productsReducer;