import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Text, 
  View, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SwipeListView } from 'react-native-swipe-list-view';
import { 
  removeFromCart, 
  clearCart, 
  adjustItemQty, 
  syncCart 
} from '../../Redux/Actions/cartActions';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import AuthGlobal from '../../context/Store/AuthGlobal';

const { width, height } = Dimensions.get("window");

const Cart = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Get cart items from Redux store
  const cartItemsRaw = useSelector(state => state.cartItems);
  const context = useContext(AuthGlobal);
  
  // Track whether cart has been initially loaded and synced
  const [isCartLoaded, setIsCartLoaded] = useState(false);
  
  // Ensure cartItems is always an array with robust parsing
  const cartItems = useMemo(() => {
    // Handle different potential state formats
    if (Array.isArray(cartItemsRaw)) return cartItemsRaw;
    
    if (typeof cartItemsRaw === 'object') {
      return Object.keys(cartItemsRaw)
        .filter(key => key !== '_persist')
        .map(key => cartItemsRaw[key])
        .filter(item => item && typeof item === 'object');
    }
    
    return [];
  }, [cartItemsRaw]);

  // Calculate total price with comprehensive error handling
  const total = useMemo(() => {
    try {
      return cartItems.reduce((sum, item) => {
        // Validate item and price
        if (!item || typeof item.price !== 'number') {
          console.warn('Invalid cart item:', item);
          return sum;
        }
        
        // Use safe quantity calculation
        const quantity = Math.max(1, item.quantity || 1);
        return sum + (item.price * quantity);
      }, 0);
    } catch (error) {
      console.error('Error calculating cart total:', error);
      return 0;
    }
  }, [cartItems]);

  // Calculate total number of items
  const totalItems = useMemo(() => {
    try {
      return cartItems.reduce((count, item) => {
        return count + (Math.max(1, item.quantity || 1));
      }, 0);
    } catch (error) {
      console.error('Error calculating total items:', error);
      return 0;
    }
  }, [cartItems]);

  // Sync cart on component mount
  useEffect(() => {
    const initializeCart = async () => {
      try {
        // Sync cart across guest and authenticated states
        await dispatch(syncCart());
        setIsCartLoaded(true);
      } catch (error) {
        console.error("Cart sync error:", error);
        setIsCartLoaded(true);
        Toast.show({
          type: 'error',
          text1: 'Cart Sync Failed',
          text2: 'Unable to sync cart items'
        });
      }
    };

    if (!isCartLoaded) {
      initializeCart();
    }
  }, [dispatch, isCartLoaded]);

  // Handle quantity changes
  const handleQuantityChange = (item, change) => {
    try {
      const currentQty = item.quantity || 1;
      const newQty = Math.max(1, currentQty + change);
      
      dispatch(adjustItemQty(item, newQty));
    } catch (error) {
      console.error("Quantity change error:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Could not change quantity'
      });
    }
  };

  // Handle checkout process
  const handleCheckout = async () => {
    try {
      // Check authentication status
      if (context.stateUser.isAuthenticated) {
        navigation.navigate('Checkout');
      } else {
        // Redirect to login with return path
        navigation.navigate("User", {
          screen: 'Login',
          params: { returnTo: 'Checkout' }
        });
        
        Toast.show({
          type: "info",
          text1: "Login Required",
          text2: "Please log in to complete checkout"
        });
      }
    } catch (error) {
      console.error("Checkout process error:", error);
      Toast.show({
        type: "error",
        text1: "Checkout Error",
        text2: "Unable to proceed. Please try again."
      });
    }
  };

  // Render individual cart item
  const renderItem = ({ item }) => {
    const quantity = Math.max(1, item.quantity || 1);
    
    return (
      <View style={styles.cartItemContainer}>
        <View style={styles.cartItemContent}>
          <Image 
            source={{ 
              uri: item.image || 
                   (item.images && item.images.length > 0 ? item.images[0] : 
                   'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png')
            }} 
            style={styles.productImage} 
          />
          
          <View style={styles.productMiddle}>
            <View style={styles.attributeBadges}>
              {/* Type badge */}
              <View style={styles.attributeBadge}>
                <Text style={styles.attributeText}>
                  {item.type || "Type"}
                </Text>
              </View>
              
              {/* Color badge */}
              <View style={styles.attributeBadge}>
                <Text style={styles.attributeText}>
                  {item.color || "Color"}
                </Text>
              </View>
            </View>
            
            {/* Product name */}
            <Text style={styles.productName}>
              {item.name || "Product"}
            </Text>
            
            {/* Price */}
            <Text style={styles.productPrice}>
              ${item.price ? item.price.toFixed(2) : "0.00"}
            </Text>
          </View>
          
          {/* Quantity controls */}
          <View style={styles.quantityContainer}>
            <TouchableOpacity 
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item, -1)}
            >
              <Text style={styles.quantityButtonText}>-</Text>
            </TouchableOpacity>
            
            <Text style={styles.quantityText}>
              {quantity}
            </Text>
            
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item, 1)}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render hidden swipe actions
  const renderHiddenItem = ({ item }) => (
    <View style={styles.hiddenItemContainer}>
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => {
          try {
            dispatch(removeFromCart(item));
            Toast.show({
              type: 'success',
              text1: 'Item Removed',
              text2: 'Item has been removed from your cart'
            });
          } catch (error) {
            console.error("Remove item error:", error);
            Toast.show({
              type: 'error',
              text1: 'Error',
              text2: 'Could not remove item'
            });
          }
        }}
      >
        <MaterialIcons name="delete" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  // Render empty cart view
  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="cart-outline" size={60} color="#5069E6" />
      </View>
      
      <Text style={styles.emptyText}>Your cart is empty</Text>
      <Text style={styles.emptySubText}>
        Looks like you haven't added any items to your cart yet.
      </Text>
      
      <TouchableOpacity 
        style={styles.continueShoppingButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.continueShoppingText}>Continue Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#5069E6" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Cart</Text>

          <TouchableOpacity 
            style={styles.clearButton}
            onPress={() => {
              try {
                dispatch(clearCart());
                Toast.show({
                  type: 'success',
                  text1: 'Cart Cleared',
                  text2: 'All items have been removed'
                });
              } catch (error) {
                console.error("Clear cart error:", error);
                Toast.show({
                  type: 'error',
                  text1: 'Error',
                  text2: 'Could not clear cart'
                });
              }
            }}
          >
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </Text>
      </View>
      
      {/* Cart Items List */}
      {cartItems.length > 0 ? (
        <View style={styles.cartContent}>
          <SwipeListView
            data={cartItems}
            renderItem={renderItem}
            renderHiddenItem={renderHiddenItem}
            rightOpenValue={-60}
            disableRightSwipe
            showsVerticalScrollIndicator={false}
            keyExtractor={item => 
              item.cartItemId || 
              item._id?.toString() || 
              item.id?.toString() || 
              Math.random().toString()
            }
            contentContainerStyle={styles.listContent}
            ListFooterComponent={<View style={{ height: 180 }} />}
          />
        </View>
      ) : (
        renderEmptyCart()
      )}

      {/* Checkout Section */}
      {cartItems.length > 0 && (
        <View style={styles.checkoutContainer}>
          <View style={styles.orderSummary}>
            <View style={styles.simpleSummaryRow}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
              <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
            </View>
            
            <Text style={styles.shippingInfo}>
              Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'}) · Shipping: FREE
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.checkoutButton}
            onPress={handleCheckout}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
            <Ionicons name="arrow-forward" size={20} color="white" style={styles.checkoutIcon} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FB',
  },
  header: {
    backgroundColor: '#5069E6',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  clearButton: {
    padding: 5,
  },
  clearText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
  },
  cartContent: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
  cartItemContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    height: 120,
  },
  cartItemContent: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
    height: '100%',
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 5,
    backgroundColor: '#F5F7FB',
  },
  productMiddle: {
    flex: 1,
    marginLeft: 15,
  },
  attributeBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  attributeBadge: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  attributeText: {
    fontSize: 10,
    color: '#666',
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 5,
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5069E6',
    marginTop: 5,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FB',
    borderRadius: 25,
    padding: 5,
    marginLeft: 10,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 18,
    color: '#5069E6',
    fontWeight: '600',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '600',
    paddingHorizontal: 10,
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  hiddenItemContainer: {
    height: 100,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF4C58',
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  continueShoppingButton: {
    backgroundColor: '#5069E6',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  continueShoppingText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  checkoutContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  orderSummary: {
    marginBottom: 5,
  },
  simpleSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  shippingInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  totalAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5069E6',
  },
  checkoutButton: {
    backgroundColor: '#5069E6',
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#5069E6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  checkoutIcon: {
    marginLeft: 8,
  },
});

export default Cart;