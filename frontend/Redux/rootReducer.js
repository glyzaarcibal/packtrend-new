// Redux/Reducers/rootReducer.js
import { combineReducers } from 'redux';
import cartItems from './cartItems';
import productReducer from './productReducer';
import brandReducer from './brandReducer';
import orderReducer from './orderReducer';

// Update your rootReducer to include the order reducer
const rootReducer = combineReducers({
  cartItems: cartItems,
  products: productReducer,
  brands: brandReducer,
  orders: orderReducer,
  // Include any other reducers you have
});

export default rootReducer;