import jwt_decode from "jwt-decode";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import baseURL from "../../assets/common/baseurl";
import axios from "axios";

export const SET_CURRENT_USER = "SET_CURRENT_USER";

export const loginUser = (user, dispatch) => {
  // LOGIN REQUEST
  axios
    .post(`${baseURL}api/login`, user)
    .then((res) => {
      if (res.status === 200 || res.status === 201) {
        const token = res.data.token;
        const userId = res.data.userId.toString();
        
        // Store token and user ID
        AsyncStorage.setItem("jwt", token);
        AsyncStorage.setItem("userId", userId);
        
        // Decode token to get user data
        const decoded = jwt_decode(token);
        
        // Set current user in redux store
        dispatch({
          type: SET_CURRENT_USER,
          payload: user
      });
        
        Toast.show({
          topOffset: 60,
          type: "success",
          text1: "Login Successful",
          text2: "Welcome back!",
        });
      }
    })
    .catch((error) => {
      console.log("Login error:", error);
      Toast.show({
        topOffset: 60,
        type: "error",
        text1: "Login Failed",
        text2: error.response?.data?.error || "Please check your credentials",
      });
    });
};

export const getUserProfile = (id) => {
  axios
    .get(`${baseURL}api/profile`, {
      headers: { Authorization: `Bearer ${AsyncStorage.getItem("jwt")}` }
    })
    .then((res) => {
      if (res.status === 200) {
        return res.data;
      }
    })
    .catch((error) => {
      console.log("Get profile error:", error);
    });
};

export const logoutUser = (dispatch) => {
  // Get token from storage
  AsyncStorage.getItem("jwt").then(token => {
    // If token exists, call logout endpoint
    if (token) {
      axios
        .post(
          `${baseURL}api/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        .catch((error) => {
          console.log("Logout error:", error);
        });
    }
    
    // Clear storage and dispatch logout action
    AsyncStorage.removeItem("jwt");
    AsyncStorage.removeItem("userId");
    dispatch({
      type: SET_CURRENT_USER,
      payload: {}
  });
    
    Toast.show({
      topOffset: 60,
      type: "success",
      text1: "Logged Out",
      text2: "Come back soon!",
    });
  });
};

export const setCurrentUser = (decoded) => {
  return {
      type: SET_CURRENT_USER,
      payload: decoded
  };
};