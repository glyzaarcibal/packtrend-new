import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import FavoritesScreen from '../Screens/Favorites/FavoritesScreen';

const Stack = createStackNavigator();

const FavoritesNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="FavoritesMain" 
                component={FavoritesScreen} 
                options={{ 
                    headerTitle: 'Favorites',
                    headerStyle: {
                        backgroundColor: '#f4f4f4'
                    }
                }} 
            />
        </Stack.Navigator>
    );
};

export default FavoritesNavigator;