import React, { useEffect, useReducer, useState } from "react";
import { jwtDecode } from "jwt-decode";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { syncCart } from '../../Redux/Actions/cartActions';

import authReducer from "../Reducers/Auth.reducer";
import { setCurrentUser } from "../Actions/Auth.actions";
import AuthGlobal from './AuthGlobal';

const Auth = props => {
    const [stateUser, dispatch] = useReducer(authReducer, {
        isAuthenticated: null,
        user: {}
    });
    const [showChild, setShowChild] = useState(false);
    
    // Redux dispatch for cart synchronization
    const reduxDispatch = useDispatch();

    useEffect(() => {
        const checkToken = async () => {
            setShowChild(true);
            try {
                const jwt = await AsyncStorage.getItem('jwt');
                const storedUserData = await AsyncStorage.getItem('userData');
                
                console.log("Stored JWT:", !!jwt);
                console.log("Stored User Data:", storedUserData);

                if (jwt) {
                    const decoded = jwtDecode(jwt);
                    
                    let userData = {};
                    if (storedUserData) {
                        try {
                            userData = JSON.parse(storedUserData);
                            console.log("Parsed User Data:", userData);
                        } catch (parseError) {
                            console.error("Error parsing stored user data:", parseError);
                        }
                    }

                    // Check if token is expired (if exp claim exists)
                    if (decoded.exp && decoded.exp < Date.now() / 1000) {
                        // Token is expired, remove it
                        await AsyncStorage.removeItem('jwt');
                        await AsyncStorage.removeItem('userData');
                        dispatch(setCurrentUser({}));
                    } else {
                        // Ensure admin status is set
                        userData.isAdmin = userData.isAdmin || decoded.isAdmin || false;
                        
                        console.log("Final User Data:", userData);
                        console.log("Decoded Token Admin Status:", decoded.isAdmin);
                        
                        // Dispatch current user
                        dispatch(setCurrentUser(userData));
                        
                        // Sync cart when user logs in
                        try {
                            await reduxDispatch(syncCart());
                        } catch (cartSyncError) {
                            console.error("Cart sync error:", cartSyncError);
                        }
                    }
                } else {
                    // No JWT found, dispatch empty user
                    dispatch(setCurrentUser({}));
                }
            } catch (error) {
                console.log("AsyncStorage error:", error);
                // In case of error, clear the state
                dispatch(setCurrentUser({}));
            }
        };
        
        checkToken();
        return () => setShowChild(false);
    }, []);

    if (!showChild) {
        return null;
    } else {
        return (
            <AuthGlobal.Provider
                value={{
                    stateUser,
                    dispatch
                }}
            >
                {props.children}
            </AuthGlobal.Provider>
        );
    }
};

export default Auth;