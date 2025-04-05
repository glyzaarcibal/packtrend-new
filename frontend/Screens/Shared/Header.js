import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext'; // Use your custom ThemeContext

const Header = () => {
  const { isDarkMode, toggleTheme } = useTheme(); // Get theme state and toggle function

  return (
    <View className='flex-row  mx-4 mt-2 justify-between items-center py-8' style={styles.NavbarContainer}>
      {/* Left Section: Logo and Shopping Bag Icon */}
      <View className="">
        <Pressable>
          <Text className="dark:text-white">
            <FontAwesome name="shopping-bag" size={24} />
          </Text>
        </Pressable>
        <View>
        <Text className="font-bold text-2xl dark:text-white ">bagzz</Text>
        </View>
      </View>

      {/* Right Section: Dark Mode Toggle */}
      <Pressable onPress={toggleTheme}>
        <Text className="dark:text-stone-50">
          <MaterialIcons name="dark-mode" size={30} />
        </Text>
      </Pressable>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  NavbarContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
      marginHorizontal: 16,
      marginTop: 8,
  },
  iconText: {
      color: "black", // Default color, overridden by dark mode styles in className
  },
  brandText: {
      fontSize: 24,
      fontWeight: "bold",
      color: "black", // Default color, overridden by dark mode styles in className
  },
  darkModeIcon: {
      color: "black", // Default, will be overridden by Tailwind dark mode
  },

});