import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import baseURL from '../../assets/common/baseurl';
import * as types from '../constants';

// Fetch Brands Action
export const fetchBrands = () => {
  return async (dispatch) => {
    // Dispatch request action
    dispatch({ type: types.FETCH_BRANDS_REQUEST });

    try {
      // Get authentication token
      const token = await AsyncStorage.getItem("jwt");
      
      if (!token) {
        return dispatch({
          type: types.FETCH_BRANDS_FAILURE,
          payload: 'No authentication token found'
        });
      }

      // Construct URL
      const url = baseURL.endsWith('/') 
        ? `${baseURL}get/brand`
        : `${baseURL}/get/brand`;

      // Make API call
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Validate brands
      const brands = response.data?.brand || [];

      // Dispatch success action
      dispatch({
        type: types.FETCH_BRANDS_SUCCESS,
        payload: brands
      });
    } catch (error) {
      // Dispatch failure action
      dispatch({
        type: types.FETCH_BRANDS_FAILURE,
        payload: error.response?.data?.message || 'Failed to fetch brands'
      });
    }
  };
};

// Create Brand Action
export const createBrand = (brandData) => {
  return async (dispatch) => {
    // Dispatch request action
    dispatch({ type: types.CREATE_BRAND_REQUEST });

    try {
      // Get authentication token
      const token = await AsyncStorage.getItem("jwt");
      
      if (!token) {
        return dispatch({
          type: types.CREATE_BRAND_FAILURE,
          payload: 'No authentication token found'
        });
      }

      // Construct URL
      const url = baseURL.endsWith('/') 
        ? `${baseURL}create/brand`
        : `${baseURL}/create/brand`;

      // Configure headers for multipart form data
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        }
      };

      // Make API call
      const response = await axios.post(url, brandData, config);

      // Dispatch success action
      dispatch({
        type: types.CREATE_BRAND_SUCCESS,
        payload: response.data.brand
      });

      return response.data.brand;
    } catch (error) {
      // Dispatch failure action
      dispatch({
        type: types.CREATE_BRAND_FAILURE,
        payload: error.response?.data?.error || 'Failed to create brand'
      });

      throw error;
    }
  };
};

// Update Brand Action
export const updateBrand = (brandId, brandData) => {
  return async (dispatch) => {
    // Dispatch request action
    dispatch({ type: types.UPDATE_BRAND_REQUEST });

    try {
      // Get authentication token
      const token = await AsyncStorage.getItem("jwt");
      
      if (!token) {
        return dispatch({
          type: types.UPDATE_BRAND_FAILURE,
          payload: 'No authentication token found'
        });
      }

      // Construct URL
      const url = baseURL.endsWith('/') 
        ? `${baseURL}update/brand/${brandId}`
        : `${baseURL}/update/brand/${brandId}`;

      // Configure headers for multipart form data
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        }
      };

      // Make API call
      const response = await axios.put(url, brandData, config);

      // Dispatch success action
      dispatch({
        type: types.UPDATE_BRAND_SUCCESS,
        payload: response.data.brand
      });

      return response.data.brand;
    } catch (error) {
      // Dispatch failure action
      dispatch({
        type: types.UPDATE_BRAND_FAILURE,
        payload: error.response?.data?.error || 'Failed to update brand'
      });

      throw error;
    }
  };
};

// Delete Brand Action
export const deleteBrand = (brandId) => {
  return async (dispatch) => {
    // Dispatch request action
    dispatch({ type: types.DELETE_BRAND_REQUEST });

    try {
      // Get authentication token
      const token = await AsyncStorage.getItem("jwt");
      
      if (!token) {
        return dispatch({
          type: types.DELETE_BRAND_FAILURE,
          payload: 'No authentication token found'
        });
      }

      // Construct URL
      const url = baseURL.endsWith('/') 
        ? `${baseURL}delete/brand/${brandId}`
        : `${baseURL}/delete/brand/${brandId}`;

      // Make API call
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Dispatch success action
      dispatch({
        type: types.DELETE_BRAND_SUCCESS,
        payload: brandId
      });
    } catch (error) {
      // Dispatch failure action
      dispatch({
        type: types.DELETE_BRAND_FAILURE,
        payload: error.response?.data?.error || 'Failed to delete brand'
      });

      throw error;
    }
  };
};