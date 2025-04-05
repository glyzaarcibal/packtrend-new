import {
    ADD_TO_CART,
    REMOVE_FROM_CART,
    CLEAR_CART,
    ADD_MULTIPLE_TO_CART,
    ADJUST_CART_ITEM_QTY
} from '../constants';

// Initial state as an array instead of an object
const initialState = [];

// Unique cart item ID generator
const generateCartItemId = () => {
    return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
};

// Helper function to check if items are the same
const isSameItem = (item1, item2) => {
    return (
        (item1._id && item2._id && item1._id === item2._id) ||
        (item1.id && item2.id && item1.id === item2.id)
    );
};

export default function cartReducer(state = initialState, action) {
    switch (action.type) {
        case ADD_TO_CART: {
            // Ensure the state is always an array
            const currentState = Array.isArray(state) ? state : [];

            // Check if item already exists
            const existingItemIndex = currentState.findIndex(item => 
                isSameItem(item, action.payload)
            );

            if (existingItemIndex !== -1) {
                // Update quantity of existing item
                const updatedCart = [...currentState];
                const existingItem = updatedCart[existingItemIndex];
                
                updatedCart[existingItemIndex] = {
                    ...existingItem,
                    quantity: (existingItem.quantity || 1) + (action.payload.quantity || 1)
                };
                
                return updatedCart;
            }

            // Add new item with unique identifier
            return [
                ...currentState, 
                {
                    ...action.payload,
                    cartItemId: generateCartItemId(),
                    quantity: action.payload.quantity || 1
                }
            ];
        }

        case ADD_MULTIPLE_TO_CART: {
            // Ensure the state is always an array
            const currentState = Array.isArray(state) ? state : [];
            const mergedCart = [...currentState];
            
            action.payload.forEach(newItem => {
                const existingIndex = mergedCart.findIndex(item => 
                    isSameItem(item, newItem)
                );

                if (existingIndex !== -1) {
                    // Update quantity of existing item
                    mergedCart[existingIndex] = {
                        ...mergedCart[existingIndex],
                        quantity: (mergedCart[existingIndex].quantity || 1) + (newItem.quantity || 1)
                    };
                } else {
                    // Add new item
                    mergedCart.push({
                        ...newItem,
                        cartItemId: generateCartItemId(),
                        quantity: newItem.quantity || 1
                    });
                }
            });
            
            return mergedCart;
        }

        case REMOVE_FROM_CART:
            // Ensure the state is always an array
            const currentState = Array.isArray(state) ? state : [];
            
            return currentState.filter(item => 
                item.cartItemId !== action.payload.cartItemId &&
                item._id !== action.payload._id &&
                item.id !== action.payload.id
            );

        case CLEAR_CART:
            return [];

        case ADJUST_CART_ITEM_QTY:
            // Ensure the state is always an array
            const currentStateAdjust = Array.isArray(state) ? state : [];
            
            return currentStateAdjust.map(item => {
                if (
                    (item.cartItemId === action.payload.item.cartItemId) ||
                    (item._id === action.payload.item._id) ||
                    (item.id === action.payload.item.id)
                ) {
                    return {
                        ...item,
                        quantity: action.payload.qty
                    };
                }
                return item;
            });

        default:
            return state;
    }
};