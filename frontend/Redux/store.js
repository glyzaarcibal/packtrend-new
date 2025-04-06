import { createStore, combineReducers, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { composeWithDevTools } from 'redux-devtools-extension';

// Import reducers
import productReducer from './Reducers/productReducer';
import brandReducer from './Reducers/brandReducer';
import cartReducer from './Reducers/cartItems';

// Persist configuration
const productPersistConfig = {
  key: 'products',
  storage: AsyncStorage,
  // Optional: blacklist loading and error states if they shouldn't persist
  blacklist: ['loading', 'error']
};

const brandPersistConfig = {
  key: 'brands',
  storage: AsyncStorage,
  blacklist: ['loading', 'error']
};

const cartPersistConfig = {
  key: 'cart',
  storage: AsyncStorage
};

// Create root reducer with persistance
const rootReducer = combineReducers({
  products: persistReducer(productPersistConfig, productReducer),
  brands: persistReducer(brandPersistConfig, brandReducer),
  cartItems: persistReducer(cartPersistConfig, cartReducer)
});

// Create store
const store = createStore(
  rootReducer,
  applyMiddleware(thunk)
);

// Create persistor
const persistor = persistStore(store);

export { store, persistor };