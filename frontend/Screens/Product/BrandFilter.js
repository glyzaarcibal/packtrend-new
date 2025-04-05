import React from 'react';
import { StyleSheet, TouchableOpacity, ScrollView, View, Text, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';

const BrandFilter = (props) => {
    const { isDarkMode } = useTheme();

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
                    <ImageBackground 
                        source={{ uri: 'https://cdn0.onehowto.com/en/posts/9/5/1/all_the_different_types_of_bags_and_their_uses_7159_orig.jpg' }} 
                        style={styles.BrandImage} 
                        imageStyle={{ borderRadius: 10 }} 
                    >
                        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.overlay}>
                            <Text style={[styles.BrandText, props.active === -1 && styles.activeText]}>All</Text>
                        </LinearGradient>
                    </ImageBackground>
                </TouchableOpacity>

                {/* Dynamic Brand with Full-Size Images */}
                {props.Brand && props.Brand.map((item, index) => {
                    // Get the first image from the brand's images array or use a placeholder
                    const brandImage = item.images && item.images.length > 0 
                        ? item.images[0] 
                        : 'https://cdn.pixabay.com/photo/2012/04/01/17/29/box-23649_960_720.png';
                    
                    // Use the proper ID from your brand model
                    const brandId = item._id;
                    
                    return (
                        <TouchableOpacity
                            key={brandId || index}
                            onPress={() => {
                                props.BrandFilter(brandId);
                                props.setActive(index);
                            }}
                            style={[styles.BrandItem, props.active === index && styles.activeBrand]}
                        >
                            <ImageBackground 
                                source={{ uri: brandImage }} 
                                style={styles.BrandImage} 
                                imageStyle={{ borderRadius: 10 }}
                            >
                                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.overlay}>
                                    <Text style={[styles.BrandText, props.active === index && styles.activeText]}>
                                        {item.name}
                                    </Text>
                                </LinearGradient>
                            </ImageBackground>
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