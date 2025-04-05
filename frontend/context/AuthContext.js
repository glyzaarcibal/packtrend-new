import React, { createContext, useContext, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const defaultContextValue = {
    stateUser: {
        isAuthenticated: false,
        user: {
            isAdmin: false
        }
    },
    dispatch: () => {}
};

export const AuthContext = createContext(defaultContextValue);

export const useAuth = () => {
    const context = useContext(AuthContext);
    
    return useMemo(() => {
        if (!context) {
            console.warn('useAuth used outside of AuthProvider');
            return defaultContextValue;
        }

        // More robust authentication check
        const isAuthenticated = 
            context.stateUser?.isAuthenticated === true || 
            context.stateUser?.user?.isAdmin === true;

        const user = {
            ...context.stateUser?.user,
            isAdmin: context.stateUser?.user?.isAdmin === true,
            isAuthenticated
        };

        console.log("useAuth Context Debug:", {
            isAuthenticated,
            isAdmin: user.isAdmin
        });

        return {
            isAuthenticated,
            user,
            dispatch: context.dispatch || (() => {})
        };
    }, [context]);
};

// Export the existing Auth component as AuthProvider
export { default as AuthProvider } from './Store/Auth';