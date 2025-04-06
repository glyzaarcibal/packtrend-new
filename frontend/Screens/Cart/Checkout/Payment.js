import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { Surface, RadioButton, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const methods = [
  { 
    name: 'Cash on Delivery', 
    value: 1, 
    icon: 'cash',
    description: 'Pay with cash when your order arrives'
  },
  { 
    name: 'Bank Transfer', 
    value: 2, 
    icon: 'bank',
    description: 'Transfer money directly from your bank account'
  },
  { 
    name: 'Card Payment', 
    value: 3, 
    icon: 'credit-card',
    description: 'Pay securely with your credit or debit card'
  }
];

const paymentCards = [
  { name: 'Wallet', value: 1, icon: 'wallet' },
  { name: 'Visa', value: 2, icon: 'cc-visa' },
  { name: 'MasterCard', value: 3, icon: 'cc-mastercard' },
  { name: 'Other', value: 4, icon: 'credit-card' }
];

const Payment = ({ route }) => {
  const order = route.params;
  const [selected, setSelected] = useState('');
  const [card, setCard] = useState('');
  const navigation = useNavigation();

  const getCardIcon = (cardName) => {
    const selectedCard = paymentCards.find(c => c.name === cardName);
    return selectedCard ? selectedCard.icon : 'credit-card';
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Choose your payment method</Text>
        
        <Surface style={styles.paymentMethodsContainer}>
          <RadioButton.Group
            name="myRadioGroup"
            value={selected}
            onValueChange={(value) => setSelected(value)}
          >
            {methods.map((item, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.paymentMethod,
                  selected === item.value && styles.selectedMethod
                ]}
                onPress={() => setSelected(item.value)}
              >
                <View style={styles.paymentMethodContent}>
                  <View style={styles.methodIconContainer}>
                    <MaterialCommunityIcons name={item.icon} size={28} color={selected === item.value ? "#6979F8" : "#858585"} />
                  </View>
                  <View style={styles.methodTextContainer}>
                    <Text style={styles.methodName}>{item.name}</Text>
                    <Text style={styles.methodDescription}>{item.description}</Text>
                  </View>
                  <RadioButton
                    value={item.value}
                    color="#6979F8"
                    uncheckedColor="#CCCCCC"
                  />
                </View>
              </TouchableOpacity>
            ))}
          </RadioButton.Group>
        </Surface>

        {selected === 3 && (
          <Surface style={styles.cardPickerContainer}>
            <Text style={styles.cardPickerLabel}>Select Card Type</Text>
            
            <View style={styles.cardsGrid}>
              {paymentCards.map((c) => (
                <TouchableOpacity 
                  key={c.name}
                  style={[
                    styles.cardOption,
                    card === c.name && styles.selectedCardOption
                  ]}
                  onPress={() => setCard(c.name)}
                >
                  <FontAwesome5 name={c.icon} size={24} color={card === c.name ? "#6979F8" : "#858585"} />
                  <Text style={[
                    styles.cardName,
                    card === c.name && styles.selectedCardName
                  ]}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Surface>
        )}

        <TouchableOpacity
          style={[
            styles.confirmButton,
            !selected && styles.disabledButton,
            selected === 3 && !card && styles.disabledButton
          ]}
          disabled={!selected || (selected === 3 && !card)}
          onPress={() => navigation.navigate("Confirm", { order })}
        >
          <Text style={styles.confirmButtonText}>Confirm Payment</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fd',
    minHeight: Dimensions.get('window').height,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
    marginTop: 20,
  },
  paymentMethodsContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 4,
    backgroundColor: 'white',
  },
  paymentMethod: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'white',
  },
  selectedMethod: {
    backgroundColor: '#f0f4ff',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  methodIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodTextContainer: {
    flex: 1,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  methodDescription: {
    fontSize: 13,
    color: '#858585',
  },
  cardPickerContainer: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 4,
    backgroundColor: 'white',
  },
  cardPickerLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardOption: {
    width: '48%',
    backgroundColor: '#f8f9fd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  selectedCardOption: {
    borderColor: '#6979F8',
    backgroundColor: '#f0f4ff',
  },
  cardName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedCardName: {
    color: '#6979F8',
  },
  confirmButton: {
    backgroundColor: '#6979F8',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    elevation: 4,
    flexDirection: 'row',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  disabledButton: {
    backgroundColor: '#C5CAE9',
    elevation: 0,
  },
});

export default Payment;
