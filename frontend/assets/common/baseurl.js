import { Platform } from "react-native";

let baseURL = 
Platform.OS === "android" 
  ? "http://192.168.100.54:8000/api/v1/"
  : "http://192.168.100.54:8000/api/v1/";

export default baseURL;