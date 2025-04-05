import {
    ADD_TO_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    ADJUST_ITEM_QTY,
    SYNC_CART
} from '../constants';

// Helper function to ensure state is always an array
const ensureArray = (state) => {
    if (!state) return [];
    if (Array.isArray(state)) return state;
    if (typeof state === 'object' && state !== null) {
        // Try to convert object to array if possible (for redux-persist edge cases)
        if (Object.keys(state).length === 0) return [];
        
        // Filter out _persist key if present (used by redux-persist)
        const keysToConvert = Object.keys(state).filter(key => key !== '_persist');
        
        if (keysToConvert.length > 0 && 
            keysToConvert.every(key => typeof state[key] === 'object')) {
            return keysToConvert.map(key => state[key]);
        }
    }
    // If all else fails, return empty array
    console.warn('Cart state was not an array, resetting to empty array');
    return [];
};

// Helper function to find item index by relevant properties
const findItemIndex = (state, item) => {
    return state.findIndex(stateItem => 
        stateItem._id === item._id && 
        stateItem.color === item.color &&
        stateItem.type === item.type
    );
};

const cartItems = (state = [], action) => {
    // Ensure state is always an array before operations
    const safeState = ensureArray(state);
    
    switch (action.type) {
        case ADD_TO_CART:
            try {
                const existingItemIndex = findItemIndex(safeState, action.payload);
                
                if (existingItemIndex >= 0) {
                    // Product already exists, update quantity instead of adding new item
                    const updatedState = [...safeState];
                    updatedState[existingItemIndex] = {
                        ...updatedState[existingItemIndex],
                        quantity: (updatedState[existingItemIndex].quantity || 1) + 1
                    };
                    return updatedState;
                } else {
                    // Product doesn't exist in cart, add it with quantity 1
                    return [...safeState, {
                        ...action.payload,
                        quantity: 1,
                        // Add a cartItemId if not present
                        cartItemId: action.payload.cartItemId || `${action.payload._id}-${Date.now()}`
                    }];
                }
            } catch (error) {
                console.error('Error adding to cart:', error);
                return safeState; // Return original state on error
            }
        
        case ADJUST_ITEM_QTY:
            try {
                const { item, quantity } = action.payload;
                const itemIndex = findItemIndex(safeState, item);
                
                if (itemIndex >= 0) {
                    // If quantity is 0 or less, remove the item
                    if (quantity <= 0) {
                        return safeState.filter((_, index) => index !== itemIndex);
                    }
                    
                    // Otherwise update the quantity
                    const updatedState = [...safeState];
                    updatedState[itemIndex] = {
                        ...updatedState[itemIndex],
                        quantity: quantity
                    };
                    return updatedState;
                }
                
                return safeState;
            } catch (error) {
                console.error('Error adjusting item quantity:', error);
                return safeState;
            }
            
        case REMOVE_FROM_CART:
            try {
                const itemToRemove = action.payload;
                
                // Try to find by cartItemId first
                if (itemToRemove.cartItemId) {
                    const filtered = safeState.filter(item => 
                        item.cartItemId !== itemToRemove.cartItemId
                    );
                    
                    if (filtered.length < safeState.length) {
                        return filtered;
                    }
                }
                
                // If cartItemId removal didn't work, try by product properties
                return safeState.filter(item => 
                    !(item._id === itemToRemove._id && 
                      item.color === itemToRemove.color &&
                      item.type === itemToRemove.type)
                );
            } catch (error) {
                console.error('Error removing from cart:', error);
                return safeState;
            }
            
        case CLEAR_CART:
            return [];
            
        case SYNC_CART:
            // For now, we just return the current state
            // In a real app, this might merge server cart with local cart
            return safeState;
            
        default:
            return safeState;
    }
};

export default cartItems;