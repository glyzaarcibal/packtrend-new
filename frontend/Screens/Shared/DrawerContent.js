import {useNavigation} from '@react-navigation/native';
import React, {useState, useEffect} from 'react';
import {Drawer} from 'react-native-paper';
import {useAuth} from '../../context/Store/Auth'; // Updated import path

const DrawerContent = () => {
  const [active, setActive] = useState('');
  const navigation = useNavigation();
  
  // Get auth state from the Auth context
  const {user, isAdmin} = useAuth();
  
  // Debug log to verify admin status in drawer
  useEffect(() => {
    console.log("Drawer - User admin status:", isAdmin);
    if (user) {
      console.log("Drawer - User's isAdmin property:", user.isAdmin);
    }
  }, [user, isAdmin]);

  const onClick = (screen) => {
    setActive(screen);
  };

  return (
    <Drawer.Section title="Drawer">
      <Drawer.Item
        label="My Profile"
        onPress={() => navigation.navigate('User', {screen: 'User Profile'})}
        icon="account"
      />
      <Drawer.Item
        label="My Orders"
        onPress={() => navigation.navigate('User', {screen: 'MyOrders'})}
        icon="cart-variant"
      />
      
      <Drawer.Item
        label="Notifications"
        active={active === 'Notifications'}
        onPress={() => onClick('Notifications')}
        icon="bell"
      />
      
      {isAdmin && (
        <Drawer.Item
          label="Admin Dashboard"
          active={active === 'AdminDashboard'}
          onPress={() => {
            setActive('AdminDashboard');
            navigation.navigate('Admin');
          }}
          icon="view-dashboard"
        />
      )}
      
    </Drawer.Section>
  );
};

export default DrawerContent;