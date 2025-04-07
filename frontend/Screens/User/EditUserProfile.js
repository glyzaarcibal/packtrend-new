import React, { useState, useCallback, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import baseURL from "../../assets/common/baseurl";
import Toast from 'react-native-toast-message';

const EditUserProfile = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.auth?.user || null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [image, setImage] = useState(null);
  const [imageURI, setImageURI] = useState(null);
  const [token, setToken] = useState('');
  
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let profileData = user;
      let tokenString = '';
      
      // Try to get token
      tokenString = await AsyncStorage.getItem('jwt') || 
                   await AsyncStorage.getItem('token');
      
      if (!tokenString) {
        Alert.alert('Error', 'Authentication token not found');
        navigation.goBack();
        return;
      }
      
      setToken(tokenString);

      // If no profile data from Redux, try AsyncStorage
      if (!profileData) {
        const storedUserData = await AsyncStorage.getItem('userData') || 
                              await AsyncStorage.getItem('user');
        if (storedUserData) {
          profileData = JSON.parse(storedUserData);
        }
      }

      if (!profileData) {
        Alert.alert('Error', 'Could not load profile data');
        navigation.goBack();
        return;
      }

      // Set form values from profile data
      setName(profileData.name || '');
      setEmail(profileData.email || '');
      setPhone(profileData.phone || '');
      
      // Handle profile image
      if (profileData.image) {
        const imageUrl = profileData.image.startsWith('http') 
          ? profileData.image 
          : `${baseURL}${profileData.image.replace(/^\//, '')}`;
        setImageURI(imageUrl);
      }
    } catch (error) {
      console.error('Profile load error:', error);
      Alert.alert('Error', 'Failed to load profile information');
    } finally {
      setIsLoading(false);
    }
  }, [user, navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      return () => {};
    }, [fetchProfile])
  );

  const pickImage = async () => {
    try {
      // Request permission first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload an image');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        // Store both the file URI for display and the file object for upload
        setImageURI(result.assets[0].uri);
        
        // Create a file object from the selected image
        const uri = result.assets[0].uri;
        const name = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(name);
        const type = match ? `image/${match[1]}` : 'image';
        
        setImage({
          uri,
          name,
          type
        });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return false;
    }
    
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Log the URL and token for debugging
      const updateUrl = `${baseURL}profile/update`;
      console.log('Update URL:', updateUrl);
      console.log('Token available:', !!token);
      
      // Create form data for multipart request
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      
      if (phone) {
        formData.append('phone', phone);
      }
      
      // Append image if one was selected
      if (image) {
        formData.append('image', image);
        console.log('Image being uploaded:', image.name);
      }
      
      // Set headers for multipart request with token
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Send the update request
      console.log('Sending update request...');
      const response = await axios.put(
        updateUrl,
        formData,
        config
      );
      
      console.log('Update response:', response.status, response.data);
      
      if (response.status === 200) {
        // Update local storage with new user data
        const updatedUser = response.data.user;
        
        // Store in both possible storage locations
        await AsyncStorage.setItem('userData', JSON.stringify(updatedUser));
        await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Try to update Redux state if possible
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
          // Continue even if Redux update fails
        }
        
        Toast.show({
          topOffset: 60,
          type: 'success',
          text1: 'Profile Updated',
          text2: 'Your profile has been successfully updated'
        });
        
        // Navigate back to profile
        navigation.goBack();
      }
    } catch (error) {
      console.error('Update error:', error);
      
      // Log more detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log('Error data:', error.response.data);
        console.log('Error status:', error.response.status);
        console.log('Error headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.log('Error request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.log('Error message:', error.message);
      }
      
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      
      Toast.show({
        topOffset: 60,
        type: 'error',
        text1: 'Update Failed',
        text2: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6979F8" />
        <Text style={styles.loadingText}>
          {imageURI ? 'Updating profile...' : 'Loading profile...'}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
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
                uri: imageURI || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
              }}
              style={styles.profileImage}
            />
            <View style={styles.editImageButton}>
              <Icon name="photo-camera" size={20} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={styles.imageHelperText}>Tap image to change</Text>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#A0A8D0"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#A0A8D0"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter your phone number"
              placeholderTextColor="#A0A8D0"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]} 
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.saveButton]} 
            onPress={handleUpdate}
          >
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF0FF'
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#EEF0FF'
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#6979F8'
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
  editImageButton: {
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
  imageHelperText: {
    marginTop: 10,
    color: '#6979F8',
    fontSize: 14
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  inputContainer: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500'
  },
  input: {
    backgroundColor: '#F5F7FF',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E5FF'
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  button: {
    borderRadius: 25,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5
  },
  cancelButton: {
    backgroundColor: '#F0F2FF',
    borderWidth: 1,
    borderColor: '#6979F8'
  },
  saveButton: {
    backgroundColor: '#6979F8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cancelButtonText: {
    color: '#6979F8',
    fontWeight: '600',
    fontSize: 16
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16
  }
});

export default EditUserProfile;