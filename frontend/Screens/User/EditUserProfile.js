import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput,
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView, 
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import baseURL from "../../assets/common/baseurl";
import Icon from 'react-native-vector-icons/MaterialIcons';
import mime from "mime";

const EditUserProfile = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.auth?.user || null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState('');
  const [imageUri, setImageUri] = useState(null);
  
  useFocusEffect(
    useCallback(() => {
      const loadUserData = async () => {
        try {
          // Get token
          const userToken = await AsyncStorage.getItem('jwt') || 
                          await AsyncStorage.getItem('token');
          setToken(userToken);
          
          // Load user data
          let userData = user;
          if (!userData) {
            const storedUserData = await AsyncStorage.getItem('userData') || 
                                  await AsyncStorage.getItem('user');
            if (storedUserData) {
              userData = JSON.parse(storedUserData);
            }
          }
          
          if (userData) {
            setName(userData.name || '');
            setEmail(userData.email || '');
            setPhone(userData.phone || '');
            
            // Set image URI
            if (userData.image) {
              const imagePath = userData.image.startsWith('http') 
                ? userData.image 
                : `${baseURL}${userData.image.replace(/^\//, '')}`;
              setImageUri(imagePath);
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          Alert.alert('Error', 'Failed to load user data');
        }
      };
      
      loadUserData();
    }, [user])
  );
  
  useEffect(() => {
    // Request permission for image picker
    (async () => {
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Sorry, we need camera roll permissions to upload an image!');
        }
      }
    })();
  }, []);
  
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled) {
        setImage(result.assets[0]);
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick an image');
    }
  };
  
  const handleUpdate = async () => {
    if (name.trim() === '') {
      return Alert.alert('Validation Error', 'Name is required');
    }
    
    if (email.trim() === '') {
      return Alert.alert('Validation Error', 'Email is required');
    }
    
    try {
      setLoading(true);
      
      // Prepare form data for multipart/form-data
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      
      if (phone) {
        formData.append('phone', phone);
      }
      
      // Add image if selected
      if (image) {
        const newImageUri = Platform.OS === 'ios' ? image.uri.replace('file://', '') : image.uri;
        const imageType = mime.getType(newImageUri);
        
        formData.append('image', {
          uri: newImageUri,
          type: imageType,
          name: newImageUri.split('/').pop()
        });
      }
      
      // Update user profile
      const response = await axios.put(
        `${baseURL}users/update/user/profile`, 
        formData, 
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      if (response.status === 200) {
        // Update local storage with updated user data
        const updatedUser = response.data.user;
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update Redux state if needed
        if (dispatch) {
          try {
            dispatch({
              type: 'SET_CURRENT_USER',
              payload: {
                decoded: updatedUser,
                user: updatedUser
              }
            });
          } catch (reduxError) {
            console.warn('Redux update error:', reduxError);
          }
        }
        
        Alert.alert('Success', 'Profile updated successfully');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Update error:', error);
      console.error('Error response:', error.response?.data);
      Alert.alert('Update Failed', error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.contentHeader}>
          <Text style={styles.contentHeaderTitle}>Edit Profile</Text>
        </View>
        
        <View style={styles.imageSection}>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={pickImage}
          >
            <Image 
              source={{ 
                uri: imageUri || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
              }}
              style={styles.profileImage}
              defaultSource={{ uri: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
            />
            <View style={styles.cameraIcon}>
              <Icon name="camera-alt" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.tapToChangeText}>Tap to change profile picture</Text>
        </View>
        
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="Enter your email"
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="Enter your phone number"
            />
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>CANCEL</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleUpdate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.saveButtonText}>SAVE</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF0FF'
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40
  },
  contentHeader: {
    alignItems: 'center',
    marginBottom: 20
  },
  contentHeaderTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  imageSection: {
    alignItems: 'center',
    marginVertical: 20
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E0E0E0',
    borderWidth: 4,
    borderColor: 'white'
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6979F8',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white'
  },
  tapToChangeText: {
    marginTop: 10,
    color: '#6979F8',
    fontSize: 14
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    overflow: 'hidden',
    padding: 16
  },
  inputContainer: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8
  },
  input: {
    backgroundColor: '#F7F8FC',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E5FF'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 20
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E5FF'
  },
  cancelButtonText: {
    color: '#6979F8',
    fontWeight: '600',
    fontSize: 16
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6979F8',
    borderRadius: 25,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#6979F8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5
  },
  disabledButton: {
    backgroundColor: '#A0A8D0',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  }
});

export default EditUserProfile;