import React, { useState, useCallback, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    RefreshControl,
    Alert,
} from "react-native";
import { useDispatch, useSelector } from 'react-redux';
import Icon from "react-native-vector-icons/FontAwesome";
import { useFocusEffect } from "@react-navigation/native";
import { Searchbar } from 'react-native-paper';
import ListItem from "./ListItem";
import { fetchProducts, deleteProduct } from '../../Redux/Actions/productActions';
import EasyButton from "../Shared/StyledComponents/EasyButton";
import { useNavigation } from "@react-navigation/native";

const { height, width } = Dimensions.get("window");

const AdminDashboard = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation();
    
    // Updated: Changed "items" to "products" to match the reducer state structure
    const { products: productList, loading } = useSelector(state => state.products);
    const [productFilter, setProductFilter] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch products when component mounts or refreshes
    useEffect(() => {
        dispatch(fetchProducts());
    }, [dispatch]);

    // Update product filter when product list changes
    useEffect(() => {
        setProductFilter(productList || []); // Added fallback empty array in case productList is undefined
    }, [productList]);

    const ListHeader = () => {
        return (
            <View
                elevation={1}
                style={styles.listHeader}
            >
                <View style={styles.headerItem}></View>
                <View style={styles.headerItem}>
                    <Text style={{ fontWeight: '600' }}>Brand</Text>
                </View>
                <View style={styles.headerItem}>
                    <Text style={{ fontWeight: '600' }}>Name</Text>
                </View>
                <View style={styles.headerItem}>
                    <Text style={{ fontWeight: '600' }}>Type</Text>
                </View>
                <View style={styles.headerItem}>
                    <Text style={{ fontWeight: '600' }}>Price</Text>
                </View>
                <View style={styles.headerItem}>
                    <Text style={{ fontWeight: '600' }}>Actions</Text>
                </View>
            </View>
        );
    };

    const searchProduct = (text) => {
        if (text === "") {
            setProductFilter(productList);
            return;
        }
        
        const filteredProducts = productList.filter((item) =>
            item.name.toLowerCase().includes(text.toLowerCase())
        );
        setProductFilter(filteredProducts);
    };

    const handleDeleteProduct = (id) => {
        dispatch(deleteProduct(id));
    };

    const editProduct = (item) => {
        // Ensure all necessary data is passed to the ProductForm
        const productToEdit = {
            _id: item._id,
            name: item.name,
            price: item.price,
            description: item.description || '',
            brand: item.brand && item.brand._id ? item.brand._id : item.brand, // Handle both object and ID formats
            color: item.color || '',
            type: item.type || '',
            stock: item.stock || 0,
            images: item.images || []
        };

        // Navigate to ProductForm with the complete product details
        navigation.navigate("ProductForm", { item: productToEdit });
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        dispatch(fetchProducts()).then(() => setRefreshing(false));
    }, [dispatch]);

    useFocusEffect(
        useCallback(() => {
            dispatch(fetchProducts());

            return () => {
                // Optional cleanup if needed
            };
        }, [dispatch])
    );

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.buttonContainer}>
                <EasyButton
                    secondary
                    medium
                    onPress={() => navigation.navigate("Orders")}
                >
                    <Icon name="shopping-bag" size={18} color="white" />
                    <Text style={styles.buttonText}>Orders</Text>
                </EasyButton>
                <EasyButton
                    secondary
                    medium
                    onPress={() => navigation.navigate("ProductForm")}
                >
                    <Icon name="plus" size={18} color="white" />
                    <Text style={styles.buttonText}>Add Product</Text>
                </EasyButton>
                <EasyButton
                    secondary
                    medium
                    onPress={() => navigation.navigate("Brand")}
                >
                    <Icon name="plus" size={18} color="white" />
                    <Text style={styles.buttonText}>Brand</Text>
                </EasyButton>
            </View>
            <Searchbar
                style={{ width: "80%", alignSelf: "center", marginBottom: 10 }}
                placeholder="Search"
                onChangeText={(text) => searchProduct(text)}
            />
            {loading ? (
                <View style={styles.spinner}>
                    <ActivityIndicator size="large" color="red" />
                </View>
            ) : productFilter.length === 0 ? (
                <View style={styles.spinner}>
                    <Text style={styles.noProductsText}>No products found</Text>
                    <EasyButton
                        primary
                        medium
                        onPress={onRefresh}
                    >
                        <Text style={styles.buttonText}>Try Again</Text>
                    </EasyButton>
                </View>
            ) : (
                <FlatList
                    refreshControl={
                        <RefreshControl 
                            refreshing={refreshing} 
                            onRefresh={onRefresh} 
                        />
                    }
                    ListHeaderComponent={ListHeader}
                    data={productFilter}
                    renderItem={({ item, index }) => (
                        <ListItem
                            item={item}
                            index={index}
                            deleteProduct={handleDeleteProduct}
                            editProduct={editProduct}
                        />
                    )}
                    keyExtractor={(item) => item._id}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    listHeader: {
        flexDirection: 'row',
        padding: 5,
        backgroundColor: 'gainsboro'
    },
    headerItem: {
        margin: 3,
        width: width / 7
    },
    spinner: {
        height: height / 2,
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonContainer: {
        margin: 20,
        alignSelf: 'center',
        flexDirection: 'row'
    },
    buttonText: {
        marginLeft: 4,
        color: 'white'
    },
    noProductsText: {
        fontSize: 16,
        marginBottom: 20
    }
});

export default AdminDashboard;