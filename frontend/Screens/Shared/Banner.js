import React, { useState, useEffect } from "react";
import { Image, StyleSheet, Dimensions, View } from "react-native";
import Swiper from "react-native-swiper";

const { width } = Dimensions.get("window");

const Banner = () => {
  const [bannerData, setBannerData] = useState([]);

  useEffect(() => {
    setBannerData([
      "https://www.shutterstock.com/image-photo/woman-hand-perfect-coral-manicure-260nw-1397425193.jpg",
      "https://png.pngtree.com/template/20220330/ourmid/pngtree-pink-aesthetic-romantic-simple-background-women-s-bag-banner-taobao-image_905212.jpg",
      "https://static.vecteezy.com/system/resources/thumbnails/048/912/484/small/excited-brunette-girl-ordered-purse-in-online-store-holding-smartphone-showing-her-new-bag-and-smiling-amazed-standing-over-pink-background-photo.jpg",
    ]);
    return () => {
      setBannerData([]);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Swiper
        style={styles.swiper}
        autoplay={true}
        autoplayTimeout={3}
        dot={<View style={styles.dot} />}
        activeDot={<View style={styles.activeDot} />}
      >
        {bannerData.map((item, index) => (
          <View key={index} style={styles.slide}>
            <Image style={styles.imageBanner} source={{ uri: item }} />
          </View>
        ))}
      </Swiper>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  swiper: {
    height: width / 1.8,
  },
  slide: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageBanner: {
    width: width, // Full width without margins
    height: width / 1.8,
  },
  dot: {
    backgroundColor: "#ccc",
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: "#e91e63",
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});

export default Banner;
