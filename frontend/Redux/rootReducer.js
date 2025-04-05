// Redux/rootReducer.js
import { combineReducers } from 'redux';
import cartItems from './Reducers/cartItems'; // Update this path to match your project structure

const rootReducer = combineReducers({
    cartItems: cartItems,
    // Add other reducers here if you have them
});

export default rootReducer;