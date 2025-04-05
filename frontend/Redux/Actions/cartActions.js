import {
    ADD_TO_CART,
    REMOVE_FROM_CART,
    CLEAR_CART
} from '../constants';

// Define new constants for quantity actions
export const UPDATE_CART_ITEM_QUANTITY = 'UPDATE_CART_ITEM_QUANTITY';

// Add to cart (now handled by the reducer to merge duplicates)
export const addToCart = (payload) => {
    return (dispatch, getState) => {
        try {
            dispatch({
                type: ADD_TO_CART,
                payload
            });
            return Promise.resolve();
        } catch (error) {
            console.error("Error in addToCart action:", error);
            return Promise.reject(error);
        }
    };
};

// Update quantity of an existing cart item
export const updateCartItemQuantity = (productId, color, type, newQuantity) => {
    return (dispatch, getState) => {
        try {
            dispatch({
                type: UPDATE_CART_ITEM_QUANTITY,
                payload: {
                    productId,
                    color,
                    type,
                    quantity: newQuantity
                }
            });
            return Promise.resolve();
        } catch (error) {
            console.error("Error in updateCartItemQuantity action:", error);
            return Promise.reject(error);
        }
    };
};

// Remove from cart
export const removeFromCart = (payload) => {
    return (dispatch) => {
        try {
            dispatch({
                type: REMOVE_FROM_CART,
                payload
            });
            return Promise.resolve();
        } catch (error) {
            console.error("Error in removeFromCart action:", error);
            return Promise.reject(error);
        }
    };
};

// Clear cart
export const clearCart = () => {
    return (dispatch) => {
        try {
            dispatch({
                type: CLEAR_CART
            });
            return Promise.resolve();
        } catch (error) {
            console.error("Error in clearCart action:", error);
            return Promise.reject(error);
        }
    };
};