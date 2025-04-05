import * as types from '../constants';

// Initial state
const initialState = {
  brands: [],
  loading: false,
  error: null,
  selectedBrand: null
};

// Brand reducer
export const brandReducer = (state = initialState, action) => {
  switch (action.type) {
    // Fetch brands
    case types.FETCH_BRANDS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case types.FETCH_BRANDS_SUCCESS:
      return {
        ...state,
        loading: false,
        brands: action.payload,
        error: null
      };
    case types.FETCH_BRANDS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // Create brand
    case types.CREATE_BRAND_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case types.CREATE_BRAND_SUCCESS:
      return {
        ...state,
        loading: false,
        brands: [...state.brands, action.payload],
        error: null
      };
    case types.CREATE_BRAND_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // Update brand
    case types.UPDATE_BRAND_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case types.UPDATE_BRAND_SUCCESS:
      return {
        ...state,
        loading: false,
        brands: state.brands.map(brand => 
          brand._id === action.payload._id ? action.payload : brand
        ),
        error: null
      };
    case types.UPDATE_BRAND_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // Delete brand
    case types.DELETE_BRAND_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    case types.DELETE_BRAND_SUCCESS:
      return {
        ...state,
        loading: false,
        brands: state.brands.filter(brand => brand._id !== action.payload),
        error: null
      };
    case types.DELETE_BRAND_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
      
    // Select brand
    case types.SELECT_BRAND:
      return {
        ...state,
        selectedBrand: action.payload
      };
    case types.CLEAR_SELECTED_BRAND:
      return {
        ...state,
        selectedBrand: null
      };
      
    // Clear errors
    case 'CLEAR_BRAND_ERRORS':
      return {
        ...state,
        error: null
      };
      
    default:
      return state;
  }
};

export default brandReducer;