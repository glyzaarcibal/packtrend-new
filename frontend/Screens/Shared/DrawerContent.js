import {useNavigation} from '@react-navigation/native';
import React, {useState} from 'react';
import {Drawer} from 'react-native-paper';

const DrawerContent = () => {
  const [active, setActive] = useState('');
  const navigation = useNavigation();

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
    </Drawer.Section>
  );
};

export default DrawerContent;