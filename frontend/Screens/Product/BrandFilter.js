import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Text, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const BrandFilter = (props) => {
    const { isDarkMode } = useTheme();
    const [imageErrors, setImageErrors] = useState({});

    // Fallback image for "All" brand
    const allBrandImage = 'https://cdn0.onehowto.com/en/posts/9/5/1/all_the_different_types_of_bags_and_their_uses_7159_orig.jpg';
    // Default fallback image for brands
    const defaultImage = 'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png';

    // Handle image loading error
    const handleImageError = (id) => {
        setImageErrors(prev => ({
            ...prev,
            [id]: true
        }));
    };

    return (
        <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={[
                styles.scrollView,
                { backgroundColor: isDarkMode ? '#121212' : '#ffffff' }
            ]}
        >
            <View style={styles.container}>
                {/* "All" Brand */}
                <TouchableOpacity
                    key="all"
                    onPress={() => {
                        props.BrandFilter('all');
                        props.setActive(-1);
                    }}
                    style={[styles.BrandItem, props.active === -1 && styles.activeBrand]}
                >
                    <View style={styles.BrandImageFallback}>
                        <Text style={styles.BrandTextFallback}>All</Text>
                    </View>
                </TouchableOpacity>

                {/* Dynamic Brand with Fallback handling */}
                {Array.isArray(props.Brand) && props.Brand.map((item, index) => {
                    // Check if item and required properties exist
                    if (!item || !item._id) {
                        return null;
                    }
                    
                    // Use a branded color background with text as fallback
                    const useTextFallback = 
                        imageErrors[item._id] || 
                        !item.images || 
                        !item.images.length || 
                        typeof item.images[0] !== 'string';
                    
                    // Get brand name or fallback
                    const brandName = item.name || `Brand ${index + 1}`;
                    
                    // Get the first image from the brand's images array or use the default
                    const brandImage = !useTextFallback && item.images && item.images.length > 0 
                        ? item.images[0] 
                        : defaultImage;
                    
                    return (
                        <TouchableOpacity
                            key={item._id}
                            onPress={() => {
                                props.BrandFilter(item._id);
                                props.setActive(index);
                            }}
                            style={[styles.BrandItem, props.active === index && styles.activeBrand]}
                        >
                            {useTextFallback ? (
                                <View style={styles.BrandImageFallback}>
                                    <Text style={styles.BrandTextFallback}>
                                        {brandName.charAt(0).toUpperCase() + (brandName.charAt(1) || '')}
                                    </Text>
                                </View>
                            ) : (
                                <ImageBackground 
                                    source={{ uri: brandImage }} 
                                    style={styles.BrandImage}
                                    imageStyle={{ borderRadius: 10 }}
                                    onError={() => handleImageError(item._id)}
                                >
                                    <LinearGradient 
                                        colors={['transparent', 'rgba(0,0,0,0.7)']} 
                                        style={styles.overlay}
                                    >
                                        <Text style={[
                                            styles.BrandText, 
                                            props.active === index && styles.activeText
                                        ]}>
                                            {brandName}
                                        </Text>
                                    </LinearGradient>
                                </ImageBackground>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        paddingVertical: 10,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    BrandItem: {
        borderRadius: 10,
        overflow: 'hidden',
        marginHorizontal: 6,
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 4,
        backgroundColor: '#f0f0f0',
        width: 100,  // Adjust width
        height: 100, // Adjust height
    },
    BrandImage: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
    },
    BrandImageFallback: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3f51b5', // A nice blue color for fallback
        borderRadius: 10,
    },
    BrandTextFallback: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    overlay: {
        width: '100%',
        height: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        borderRadius: 10,
        paddingBottom: 5,
    },
    BrandText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 5,
    },
    activeBrand: {
        borderWidth: 2,
        borderColor: '#ff7e5f',
    },
    activeText: {
        color: '#fff',
    },
});

export default BrandFilter;