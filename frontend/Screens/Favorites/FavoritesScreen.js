import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const FavoritesScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Your Favorites</Text>
            {/* Add your favorites list logic here */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f4f4f4'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold'
    }
});

export default FavoritesScreen;