import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ADD_TO_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    ADD_MULTIPLE_TO_CART,
    ADJUST_CART_ITEM_QTY
} from '../constants';

// Helper function to get the current user ID
const getUserId = async () => {
    try {
        const token = await AsyncStorage.getItem('jwt');
        if (!token) return null;
        
        const userId = await AsyncStorage.getItem('userId');
        if (userId) return userId;
        
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
            const parsedData = JSON.parse(userData);
            return parsedData.userId || parsedData._id || parsedData.sub;
        }
        
        return null;
    } catch (error) {
        console.error("Error getting user ID:", error);
        return null;
    }
};

// Helper function to normalize cart items
const normalizeCartItems = (items) => {
    // Ensure items is an array
    if (!items) return [];
    
    // If items is an object, try to convert it to an array
    if (!Array.isArray(items)) {
        if (typeof items === 'object') {
            // Handle redux-persist state or other object formats
            return Object.keys(items)
                .filter(key => key !== '_persist')
                .map(key => items[key])
                .filter(item => item && typeof item === 'object');
        }
        
        // If not an array or convertible object, return empty array
        return [];
    }
    
    // Filter out any non-object items
    return items.filter(item => item && typeof item === 'object');
};

// Helper function to merge carts safely
const mergeCarts = (guestCart, userCart) => {
    // Normalize both carts
    const normalizedGuestCart = normalizeCartItems(guestCart);
    const normalizedUserCart = normalizeCartItems(userCart);
    
    // If no guest cart, return user cart
    if (normalizedGuestCart.length === 0) return normalizedUserCart;
    
    // If no user cart, return guest cart
    if (normalizedUserCart.length === 0) return normalizedGuestCart;
    
    // Merge logic
    const mergedCart = [...normalizedUserCart];
    
    normalizedGuestCart.forEach(guestItem => {
        const existingItemIndex = mergedCart.findIndex(userItem => 
            (userItem._id && userItem._id === guestItem._id) || 
            (userItem.id && userItem.id === guestItem.id)
        );
        
        if (existingItemIndex !== -1) {
            // Merge quantities if item exists
            mergedCart[existingItemIndex] = {
                ...mergedCart[existingItemIndex],
                quantity: (mergedCart[existingItemIndex].quantity || 1) + 
                          (guestItem.quantity || 1)
            };
        } else {
            // Add new item if not existing
            mergedCart.push(guestItem);
        }
    });
    
    return mergedCart;
};

export const syncCart = () => {
    return async (dispatch, getState) => {
        try {
            const userId = await getUserId();
            
            // Get current cart from Redux store first
            const currentReduxCart = getState().cartItems;
            const normalizedReduxCart = normalizeCartItems(currentReduxCart);
            
            // Safely get guest cart
            const guestCartJson = await AsyncStorage.getItem('cart');
            const guestCart = guestCartJson ? JSON.parse(guestCartJson) : [];
            
            if (userId) {
                // For authenticated user
                const userCartJson = await AsyncStorage.getItem(`cart_${userId}`);
                const userCart = userCartJson ? JSON.parse(userCartJson) : [];
                
                // Merge all three carts: Redux store, local storage guest cart, and user storage cart
                // Use Redux store as base first, then merge with others
                let mergedCart = [...normalizedReduxCart];
                
                // Only merge with guest/user carts if Redux cart is empty
                // This prevents wiping out the current session cart
                if (mergedCart.length === 0) {
                    mergedCart = mergeCarts(guestCart, userCart);
                    
                    // Only perform update if we have items to add
                    if (mergedCart.length > 0) {
                        // Update Redux store with merged cart
                        dispatch({
                            type: ADD_MULTIPLE_TO_CART,
                            payload: mergedCart
                        });
                    }
                }
                
                // Remove guest cart
                await AsyncStorage.removeItem('cart');
                
                // Save merged cart for user
                await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify(mergedCart));
            } else if (normalizedReduxCart.length === 0 && guestCart.length > 0) {
                // For guest user, only update if Redux cart is empty and guest cart has items
                dispatch({
                    type: ADD_MULTIPLE_TO_CART,
                    payload: guestCart
                });
            } else if (normalizedReduxCart.length > 0) {
                // Update guest storage with Redux cart
                await AsyncStorage.setItem('cart', JSON.stringify(normalizedReduxCart));
            }
            
            return Promise.resolve();
        } catch (error) {
            console.error("Error syncing cart:", error);
            return Promise.reject(error);
        }
    };
};

// Rest of the existing actions remain the same
export const addToCart = (payload, forceNewItem = false) => {
    return async (dispatch, getState) => {
        try {
            // If forceNewItem is true, add a unique identifier to ensure it's treated as a new item
            const itemToAdd = forceNewItem ? 
                { ...payload, uniqueCartIdentifier: Date.now().toString() } : 
                payload;
                
            dispatch({
                type: ADD_TO_CART,
                payload: itemToAdd
            });
            
            const cartItems = getState().cartItems;
            const userId = await getUserId();
            
            if (userId) {
                await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify(cartItems));
            } else {
                await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
            }
            
            return Promise.resolve();
        } catch (error) {
            console.error("Error in addToCart action:", error);
            return Promise.reject(error);
        }
    };
};

// ... (rest of the existing actions remain the same)

export const addMultipleToCart = (items) => {
    return async (dispatch, getState) => {
        try {
            // Ensure items is an array and not a non-iterable object
            const safeItems = Array.isArray(items) ? items : [items];

            dispatch({
                type: ADD_MULTIPLE_TO_CART,
                payload: safeItems
            });
            
            const cartItems = getState().cartItems;
            const userId = await getUserId();
            
            if (userId) {
                await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify(cartItems));
            } else {
                await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
            }
            
            return Promise.resolve();
        } catch (error) {
            console.error("Error in addMultipleToCart action:", error);
            return Promise.reject(error);
        }
    };
};

export const removeFromCart = (payload) => {
    return async (dispatch, getState) => {
        try {
            dispatch({
                type: REMOVE_FROM_CART,
                payload
            });
            
            const cartItems = getState().cartItems;
            const userId = await getUserId();
            
            if (userId) {
                await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify(cartItems));
            } else {
                await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
            }
            
            return Promise.resolve();
        } catch (error) {
            console.error("Error in removeFromCart action:", error);
            return Promise.reject(error);
        }
    };
};

export const clearCart = () => {
    return async (dispatch, getState) => {
        try {
            dispatch({
                type: CLEAR_CART
            });
            
            const userId = await getUserId();
            
            if (userId) {
                await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify([]));
            } else {
                await AsyncStorage.setItem('cart', JSON.stringify([]));
            }
            
            return Promise.resolve();
        } catch (error) {
            console.error("Error in clearCart action:", error);
            return Promise.reject(error);
        }
    };
};

export const adjustItemQty = (item, qty) => {
    return async (dispatch, getState) => {
        try {
            dispatch({
                type: ADJUST_CART_ITEM_QTY,
                payload: { 
                    item,
                    qty
                }
            });
            
            const cartItems = getState().cartItems;
            const userId = await getUserId();
            
            if (userId) {
                await AsyncStorage.setItem(`cart_${userId}`, JSON.stringify(cartItems));
            } else {
                await AsyncStorage.setItem('cart', JSON.stringify(cartItems));
            }
            
            return Promise.resolve();
        } catch (error) {
            console.error("Error in adjustItemQty action:", error);
            return Promise.reject(error);
        }
    };
};

export const loadCartFromStorage = () => {
    return async (dispatch) => {
        try {
            const userId = await getUserId();
            
            let cartItems = [];
            
            if (userId) {
                const userCartJson = await AsyncStorage.getItem(`cart_${userId}`);
                if (userCartJson) {
                    cartItems = JSON.parse(userCartJson);
                }
            } else {
                const guestCartJson = await AsyncStorage.getItem('cart');
                if (guestCartJson) {
                    cartItems = JSON.parse(guestCartJson);
                }
            }
            
            dispatch(clearCart());
            
            if (cartItems && cartItems.length > 0) {
                dispatch(addMultipleToCart(cartItems));
            }
            
            return Promise.resolve();
        } catch (error) {
            console.error("Error loading cart from storage:", error);
            return Promise.reject(error);
        }
    };
};