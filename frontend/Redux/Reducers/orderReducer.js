// Redux/Reducers/orderReducer.js
import { 
    ORDERS_LOADING,
    FETCH_ORDERS_SUCCESS,
    FETCH_ORDERS_FAIL,
    UPDATE_ORDER_LOADING,
    UPDATE_ORDER_SUCCESS,
    UPDATE_ORDER_FAIL,
    FETCH_USER_ORDERS_SUCCESS
  } from '../constants';
  
  const initialState = {
    orders: [],
    userOrders: [],
    loading: false,
    error: null,
    updateLoading: false,
    updateError: null
  };
  
  export default function orderReducer(state = initialState, action) {
    switch (action.type) {
      case ORDERS_LOADING:
        return {
          ...state,
          loading: true,
          error: null
        };
        
      case FETCH_ORDERS_SUCCESS:
        return {
          ...state,
          loading: false,
          orders: action.payload,
          error: null
        };
        
      case FETCH_USER_ORDERS_SUCCESS:
        return {
          ...state,
          loading: false,
          userOrders: action.payload,
          error: null
        };
        
      case FETCH_ORDERS_FAIL:
        return {
          ...state,
          loading: false,
          error: action.payload
        };
        
      case UPDATE_ORDER_LOADING:
        return {
          ...state,
          updateLoading: true,
          updateError: null
        };
        
      case UPDATE_ORDER_SUCCESS:
        // Update the order in both orders and userOrders arrays
        const { id, status, updatedOrder } = action.payload;
        
        // Update in orders array
        const updatedOrders = state.orders.map(order => 
          order._id === id ? { ...order, status, ...updatedOrder } : order
        );
        
        // Update in userOrders array
        const updatedUserOrders = state.userOrders.map(order => 
          order._id === id ? { ...order, status, ...updatedOrder } : order
        );
        
        return {
          ...state,
          orders: updatedOrders,
          userOrders: updatedUserOrders,
          updateLoading: false,
          updateError: null
        };
        
      case UPDATE_ORDER_FAIL:
        return {
          ...state,
          updateLoading: false,
          updateError: action.payload
        };
        
      default:
        return state;
    }
  }