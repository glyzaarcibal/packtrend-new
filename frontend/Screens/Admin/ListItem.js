import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import Icon from "react-native-vector-icons/FontAwesome";

const { width } = Dimensions.get("window");

const ListItem = ({ item, index, deleteProduct, editProduct }) => {
  if (!item) {
    return (
      <View style={styles.container}>
        <Text>No product data available</Text>
      </View>
    );
  }

  // Safely extract nested properties
  const safeGet = (obj, path, defaultValue = 'N/A') => {
    return path.split('.').reduce((acc, part) => 
      acc && acc[part] !== undefined ? acc[part] : defaultValue, obj);
  };

  // Confirmation before delete
  const confirmDelete = () => {
    Alert.alert(
      "Delete Product", 
      "Are you sure you want to delete this product?",
      [
        { 
          text: "Cancel", 
          style: "cancel" 
        },
        { 
          text: "Delete", 
          onPress: () => deleteProduct(item._id),
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <View style={[
      styles.container, 
      { backgroundColor: index % 2 === 0 ? 'white' : 'gainsboro' }
    ]}>
      <Image
        source={{ 
          uri: safeGet(item, 'images.0', 'https://via.placeholder.com/80') 
        }}
        style={styles.image}
        resizeMode="contain"
      />
      <View style={styles.item}>
        <Text numberOfLines={1}>
          {safeGet(item, 'brand.name', 'Unknown Brand')}
        </Text>
      </View>
      <View style={styles.item}>
        <Text numberOfLines={1}>
          {safeGet(item, 'name', 'Unnamed Product')}
        </Text>
      </View>
      <View style={styles.item}>
        <Text numberOfLines={1}>
          {safeGet(item, 'type', 'N/A')}
        </Text>
      </View>
      <View style={styles.item}>
        <Text numberOfLines={1}>
          ₱{safeGet(item, 'price', '0.00')}
        </Text>
      </View>
      <View style={styles.actionContainer}>
        <TouchableOpacity
          onPress={() => editProduct(item)}
          style={styles.actionButton}
        >
          <Icon name="edit" size={20} color="blue" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={confirmDelete}
          style={styles.actionButton}
        >
          <Icon name="trash" size={20} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 5,
  },
  item: {
    flex: 1,
    marginHorizontal: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  actionButton: {
    marginHorizontal: 5,
    padding: 5,
  }
});

export default ListItem;