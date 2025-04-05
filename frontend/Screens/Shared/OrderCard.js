import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";

import TrafficLight from "./StyledComponents/TrafficLight";
import EasyButton from "./StyledComponents/EasyButton";
import Toast from "react-native-toast-message";
import { Picker } from "@react-native-picker/picker";

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from "axios";
import baseURL from "../../assets/common/baseurl";
import { useNavigation } from '@react-navigation/native';

const codes = [
  { name: "pending", code: "3" },
  { name: "shipped", code: "2" },
  { name: "delivered", code: "1" },
];

const OrderCard = ({ item, update }) => {
  console.log(item);
  const [orderStatus, setOrderStatus] = useState('');
  const [statusText, setStatusText] = useState('');
  const [statusChange, setStatusChange] = useState(item.status);
  const [token, setToken] = useState('');
  const [cardColor, setCardColor] = useState('');

  const navigation = useNavigation();

  const updateOrder = () => {
    AsyncStorage.getItem("jwt")
      .then((res) => {
        if (res) {
          const config = {
            headers: {
              Authorization: `Bearer ${res}`,
            },
          };

          // Log what we're sending for debugging
          console.log("Sending update:", {
            item: item._id,
            orderStatus: statusChange
          });

          // Make the API call
          axios
            .put(`${baseURL}orders/${item._id}`, {
              status: statusChange
            }, config)
            .then((res) => {
              console.log("Update response:", res.data);
              if (res.status === 200 || res.status === 201) {
                Toast.show({
                  topOffset: 60,
                  type: "success",
                  text1: "Order Updated",
                  text2: "",
                });
                // Refresh the page or navigate as needed
                setTimeout(() => {
                  navigation.navigate("AdminDashboard");
                }, 500);
              }
            })
            .catch((error) => {
              console.log("Update error:", error.response?.data || error.message);
              Toast.show({
                topOffset: 60,
                type: "error",
                text1: "Something went wrong",
                text2: "Please try again",
              });
            });
        }
      })
      .catch((error) => console.log("JWT error:", error));
  };

  useEffect(() => {
    // Update the order status display based on the item's status
    if (item.status === "3") {
      setOrderStatus(<TrafficLight unavailable></TrafficLight>);
      setStatusText("pending");
      setCardColor("#E74C3C");
    } else if (item.status === "2") {
      setOrderStatus(<TrafficLight limited></TrafficLight>);
      setStatusText("shipped");
      setCardColor("#F1C40F");
    } else {
      setOrderStatus(<TrafficLight available></TrafficLight>);
      setStatusText("delivered");  
      setCardColor("#2ECC71");
    }
  }, [item.status]);

  return (
    <View style={[{ backgroundColor: cardColor }, styles.container]}>
      {/* ... */}
      {update ? (
        <View>
          <Picker
            selectedValue={statusChange}
            onValueChange={(itemValue) => setStatusChange(itemValue)}
          >
            {codes.map((c) => (
              <Picker.Item key={c.code} label={c.name} value={c.code} />
            ))}
          </Picker>
          <EasyButton secondary large onPress={updateOrder}>
            <Text style={{ color: "white" }}>Update</Text>
          </EasyButton>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    margin: 10,
    borderRadius: 10,
  },
  title: {
    backgroundColor: "#62B1F6",
    padding: 5,
  },
  priceContainer: {
    marginTop: 10,
    alignSelf: "flex-end",
    flexDirection: "row",
  },
  price: {
    color: "white",
    fontWeight: "bold",
  },
});

export default OrderCard;